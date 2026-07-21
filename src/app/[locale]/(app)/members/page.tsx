import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import { getPaymentStatus, formatDateFr } from "@/lib/membership";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { MembersSearch } from "@/components/MembersSearch";
import { Link } from "@/i18n/routing";
import { MemberStatus } from "@prisma/client";
import { Suspense } from "react";

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { locale } = await params;
  const { q, status } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("members");
  const tStatus = await getTranslations("status");

  const gym = await getCurrentGym();
  const where: {
    gymId: string;
    status?: MemberStatus | { not: MemberStatus };
    OR?: Array<
      | { firstName: { contains: string } }
      | { lastName: { contains: string } }
      | { phone: { contains: string } }
      | { cin: { contains: string } }
    >;
    deletedAt?: null;
  } = { gymId: gym.id, deletedAt: null };

  if (status === "CANCELLED") {
    where.status = "CANCELLED";
  } else if (status && status !== "ALL") {
    where.status = status as MemberStatus;
  } else {
    where.status = { not: "CANCELLED" };
  }
  if (q?.trim()) {
    const term = q.trim();
    where.OR = [
      { firstName: { contains: term } },
      { lastName: { contains: term } },
      { phone: { contains: term } },
      { cin: { contains: term } },
    ];
  }

  const members = await prisma.member.findMany({
    where,
    include: { periods: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-display text-3xl">{t("title")}</h1>
        <Link href="/members/new" className="btn btn-primary">
          {t("add")}
        </Link>
      </div>

      <Suspense fallback={null}>
        <MembersSearch initialQuery={q ?? ""} initialStatus={status ?? "ALL"} />
      </Suspense>

      {members.length === 0 ? (
        <EmptyState
          icon="👤"
          title={q || (status && status !== "ALL") ? t("empty") : t("noMembersAtAll")}
          hint={q || (status && status !== "ALL") ? t("emptyHint") : t("noMembersAtAllHint")}
        />
      ) : (
        <div className="card table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t("lastName")}</th>
                <th>{t("phone")}</th>
                <th>{t("cin")}</th>
                <th>{t("status")}</th>
                <th>{t("endDate")}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const pay = getPaymentStatus(m, gym.graceDays, gym.reminderDays);
                const initials = `${m.firstName.slice(0, 1)}${m.lastName.slice(0, 1)}`.toUpperCase();
                return (
                  <tr key={m.id} className="row-hover">
                    <td>
                      <Link
                        href={`/members/${m.id}`}
                        className="font-semibold hover:text-[var(--accent)] inline-flex items-center gap-2"
                      >
                        <span className="avatar avatar-sm" aria-hidden>
                          {initials}
                        </span>
                        {m.firstName} {m.lastName}
                      </Link>
                    </td>
                    <td>{m.phone}</td>
                    <td>{m.cin || "—"}</td>
                    <td>
                      <StatusBadge
                        status={pay.status === "ok" ? m.status : pay.status}
                        label={
                          pay.status === "ok"
                            ? tStatus(m.status)
                            : tStatus(pay.status)
                        }
                      />
                    </td>
                    <td>{pay.endDate ? formatDateFr(pay.endDate) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
