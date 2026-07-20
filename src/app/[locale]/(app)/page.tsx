import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import { getPaymentStatus, formatDateFr } from "@/lib/membership";
import { paymentReminderWhatsApp } from "@/lib/messages";
import { StatusBadge } from "@/components/StatusBadge";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Link } from "@/i18n/routing";
import { startOfDay } from "date-fns";
import { RenewButton } from "@/components/RenewButton";
import type { Gym, Member, MembershipPeriod, MessageTemplate } from "@prisma/client";

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
        <ul className="flex flex-col gap-3">
          {items.slice(0, 8).map(({ member, endDate, payStatus }) => {
            const wa = paymentReminderWhatsApp(gym, templates, member);
            return (
              <li
                key={member.id}
                className="flex flex-col sm:flex-row sm:items-start gap-2 justify-between border-b border-[var(--line)] pb-3 last:border-0"
              >
                <div>
                  <Link
                    href={`/members/${member.id}`}
                    className="font-semibold hover:text-[var(--accent)]"
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
  const members = await prisma.member.findMany({
    where: { gymId: gym.id, status: { in: ["ACTIVE", "FROZEN", "EXPIRED"] } },
    include: { periods: true },
    orderBy: { lastName: "asc" },
  });

  const todayStart = startOfDay(new Date());
  const checkInsToday = await prisma.checkIn.count({
    where: {
      gymId: gym.id,
      checkedInAt: { gte: todayStart },
    },
  });

  const activeCount = members.filter((m) => m.status === "ACTIVE").length;

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
      <h1 className="font-display text-3xl md:text-4xl">{t("title")}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card stat">
          <div className="stat-value text-[var(--warn)]">{dueSoon.length}</div>
          <div className="stat-label">{t("dueSoon")}</div>
        </div>
        <div className="card stat">
          <div className="stat-value text-[#c2410c]">{grace.length}</div>
          <div className="stat-label">{t("grace")}</div>
        </div>
        <div className="card stat">
          <div className="stat-value text-[var(--danger)]">{overdue.length}</div>
          <div className="stat-label">{t("overdue")}</div>
        </div>
        <div className="card stat">
          <div className="stat-value text-[var(--accent)]">{checkInsToday}</div>
          <div className="stat-label">{t("checkInsToday")}</div>
        </div>
      </div>
      <p className="text-[var(--muted)]">
        {t("activeMembers")}: <strong>{activeCount}</strong>
      </p>
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
