import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import { getPaymentStatus, formatDateFr } from "@/lib/membership";
import { paymentReminderWhatsApp } from "@/lib/messages";
import { StatusBadge } from "@/components/StatusBadge";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { RenewButton } from "@/components/RenewButton";
import { EmptyState } from "@/components/EmptyState";
import { Link } from "@/i18n/routing";

export default async function RenewalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("renewals");
  const tStatus = await getTranslations("status");

  const gym = await getCurrentGym();
  const members = await prisma.member.findMany({
    where: { gymId: gym.id, status: { not: "CANCELLED" } },
    include: { periods: true },
    orderBy: { lastName: "asc" },
  });

  const rows = members
    .map((m) => {
      const pay = getPaymentStatus(m, gym.graceDays, gym.reminderDays);
      return { member: m, pay };
    })
    .filter((r) =>
      ["due_soon", "grace", "overdue"].includes(r.pay.status)
    )
    .sort((a, b) => (a.pay.daysUntilEnd ?? 0) - (b.pay.daysUntilEnd ?? 0));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">{t("title")}</h1>
      {rows.length === 0 ? (
        <EmptyState icon="✓" title={t("empty")} hint={t("emptyHint")} />
      ) : (
        <div className="card table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Membre</th>
                <th>Statut</th>
                <th>Fin</th>
                <th>{t("amount")}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ member, pay }) => {
                const wa = paymentReminderWhatsApp(gym, gym.messageTemplates, member);
                return (
                  <tr key={member.id}>
                    <td>
                      <Link
                        href={`/members/${member.id}`}
                        className="font-semibold hover:text-[var(--accent)]"
                      >
                        {member.firstName} {member.lastName}
                      </Link>
                    </td>
                    <td>
                      <StatusBadge status={pay.status} label={tStatus(pay.status)} />
                    </td>
                    <td>{pay.endDate ? formatDateFr(pay.endDate) : "—"}</td>
                    <td>{gym.monthlyPrice} MAD</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <RenewButton
                          memberId={member.id}
                          label={t("confirm")}
                          amount={gym.monthlyPrice}
                        />
                        <WhatsAppButton url={wa.url} label={t("remind")} />
                      </div>
                    </td>
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
