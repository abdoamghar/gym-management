import { getTranslations, setRequestLocale } from "next-intl/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import { getPaymentStatus } from "@/lib/membership";
import { expireOverdueMembers } from "@/lib/actions";
import { paymentReminderWhatsApp } from "@/lib/messages";
import { StatusBadge } from "@/components/StatusBadge";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Link } from "@/i18n/routing";
import { subMonths, format, startOfMonth, isSameMonth } from "date-fns";
import { RenewButton } from "@/components/RenewButton";
import { BarChart } from "@/components/BarChart";
import { ExpireButton } from "@/components/ExpireButton";
import { formatDateFr } from "@/lib/membership";
import type { Gym, Member, MembershipPeriod, MessageTemplate } from "@prisma/client";

// Module-level timestamp so expireOverdueMembers() runs at most once per 60s.
// Mutated only inside after(), never during render.
const expireCache = { lastRun: 0 };

type Row = {
  member: Member & { periods: MembershipPeriod[] };
  endDate: Date | null;
  payStatus: ReturnType<typeof getPaymentStatus>["status"];
};

function Section({
  title,
  items,
  gym,
  templates,
  noItemsLabel,
  quickRenewLabel,
  remindLabel,
  statusLabel,
}: {
  title: string;
  items: Row[];
  gym: Pick<Gym, "name" | "phone" | "address" | "monthlyPrice" | "defaultLocale" | "graceDays" | "reminderDays">;
  templates: MessageTemplate[];
  noItemsLabel: string;
  quickRenewLabel: string;
  remindLabel: string;
  statusLabel: (s: Row["payStatus"]) => string;
}) {
  return (
    <section className="card p-4 md:p-5">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="font-display text-xl">{title}</h2>
        <span className="text-sm text-[var(--muted)]">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-[var(--muted)] text-sm">{noItemsLabel}</p>
      ) : (
        <ul className="flex flex-col">
          {items.slice(0, 8).map(({ member, endDate, payStatus }) => {
            const wa = paymentReminderWhatsApp(gym, templates, member);
            const initials = `${member.firstName.slice(0, 1)}${member.lastName.slice(0, 1)}`;
            return (
              <li
                key={member.id}
                className="row-hover flex flex-col sm:flex-row sm:items-center gap-3 justify-between border-b border-[var(--line)] py-3 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="avatar avatar-sm" aria-hidden>
                    {initials.toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/members/${member.id}`}
                      className="font-semibold hover:text-[var(--accent)] truncate block"
                    >
                      {member.firstName} {member.lastName}
                    </Link>
                    <div className="flex flex-wrap gap-2 mt-1 items-center">
                      <StatusBadge status={payStatus} label={statusLabel(payStatus)} />
                      {endDate && (
                        <span className="text-xs text-[var(--muted)]">
                          {formatDateFr(endDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <RenewButton memberId={member.id} label={quickRenewLabel} />
                  <WhatsAppButton url={wa.url} label={remindLabel} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const tStatus = await getTranslations("status");

  const gym = await getCurrentGym();

  // Auto-expire overdue members as a post-response background task.
  // Rate-limit to once per 60s per server instance via a module-level timestamp.
  /* eslint-disable react-hooks/purity, react-hooks/immutability -- after() runs post-response, not during render */
  after(async () => {
    const now = Date.now();
    if (!expireCache.lastRun || now - expireCache.lastRun > 60_000) {
      expireCache.lastRun = now;
      try {
        await expireOverdueMembers();
      } catch {
        // best-effort: ignore background failures
      }
    }
  });
  /* eslint-enable react-hooks/purity, react-hooks/immutability */

  const members = await prisma.member.findMany({
    where: { gymId: gym.id, status: { in: ["ACTIVE", "FROZEN", "EXPIRED"] }, deletedAt: null },
    include: { periods: true },
    orderBy: { lastName: "asc" },
  });

  const activeCount = members.filter((m) => m.status === "ACTIVE").length;
  const frozenCount = members.filter((m) => m.status === "FROZEN").length;

  // Chart data: last 6 months revenue + new memberships
  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
  const periodsForCharts = await prisma.membershipPeriod.findMany({
    where: { gymId: gym.id, paidAt: { gte: sixMonthsAgo } },
    select: { amountPaid: true, paidAt: true, createdAt: true },
  });

  const monthLabels: string[] = [];
  for (let i = 5; i >= 0; i--) {
    monthLabels.push(format(subMonths(new Date(), i), "MMM"));
  }

  const revenueByMonth = new Array(6).fill(0);
  const membershipsByMonth = new Array(6).fill(0);
  for (const p of periodsForCharts) {
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      if (isSameMonth(monthStart, p.paidAt)) revenueByMonth[i] += p.amountPaid;
      if (isSameMonth(monthStart, p.createdAt)) membershipsByMonth[i] += 1;
    }
  }

  const dueSoon: Row[] = [];
  const grace: Row[] = [];
  const overdue: Row[] = [];

  for (const m of members) {
    const { status, endDate } = getPaymentStatus(m, gym.graceDays, gym.reminderDays);
    const row: Row = { member: m, endDate, payStatus: status };
    if (status === "due_soon") dueSoon.push(row);
    else if (status === "grace") grace.push(row);
    else if (status === "overdue") overdue.push(row);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-display text-3xl md:text-4xl">{t("title")}</h1>
        <ExpireButton />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card stat stat-card">
          <span className="stat-icon" aria-hidden>⏰</span>
          <div className="stat-value text-[var(--warn)]">{dueSoon.length}</div>
          <div className="stat-label">{t("dueSoon")}</div>
        </div>
        <div className="card stat stat-card">
          <span className="stat-icon" aria-hidden>⏳</span>
          <div className="stat-value text-[#c2410c]">{grace.length}</div>
          <div className="stat-label">{t("grace")}</div>
        </div>
        <div className="card stat stat-card">
          <span className="stat-icon" aria-hidden>⚠️</span>
          <div className="stat-value text-[var(--danger)]">{overdue.length}</div>
          <div className="stat-label">{t("overdue")}</div>
        </div>
        <div className="card stat stat-card">
          <span className="stat-icon" aria-hidden>✅</span>
          <div className="stat-value text-[var(--accent)]">{activeCount}</div>
          <div className="stat-label">{t("activeMembers")}</div>
        </div>
      </div>
      <p className="text-[var(--muted)]">
        {t("frozenMembers")}: <strong>{frozenCount}</strong>
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <BarChart
          labels={monthLabels}
          values={revenueByMonth}
          color="var(--accent)"
          unit=" MAD"
        >
          {t("chartRevenue")}
        </BarChart>
        <BarChart
          labels={monthLabels}
          values={membershipsByMonth}
          color="#0e7368"
        >
          {t("chartMemberships")}
        </BarChart>
      </div>
      <div className="grid md:grid-cols-1 gap-4">
        <Section
          title={t("overdue")}
          items={overdue}
          gym={gym}
          templates={gym.messageTemplates}
          noItemsLabel={t("noItems")}
          quickRenewLabel={t("quickRenew")}
          remindLabel={t("remind")}
          statusLabel={(s) => tStatus(s)}
        />
        <Section
          title={t("grace")}
          items={grace}
          gym={gym}
          templates={gym.messageTemplates}
          noItemsLabel={t("noItems")}
          quickRenewLabel={t("quickRenew")}
          remindLabel={t("remind")}
          statusLabel={(s) => tStatus(s)}
        />
        <Section
          title={t("dueSoon")}
          items={dueSoon}
          gym={gym}
          templates={gym.messageTemplates}
          noItemsLabel={t("noItems")}
          quickRenewLabel={t("quickRenew")}
          remindLabel={t("remind")}
          statusLabel={(s) => tStatus(s)}
        />
      </div>
      <Link href="/renewals" className="btn btn-secondary">
        {t("viewAll")}
      </Link>
    </div>
  );
}
