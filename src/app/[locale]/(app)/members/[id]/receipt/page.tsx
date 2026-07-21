import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import { formatDateFr, formatMad } from "@/lib/membership";
import { ReceiptActions } from "@/components/ReceiptActions";

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { locale, id } = await params;
  const { period: periodParam } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("receipt");

  const gym = await getCurrentGym();
  const member = await prisma.member.findFirst({
    where: { id, gymId: gym.id, deletedAt: null },
    include: { periods: { orderBy: { endDate: "desc" } } },
  });
  if (!member) notFound();

  const period = periodParam
    ? member.periods.find((p) => p.id === periodParam)
    : member.periods[0];

  if (!period) notFound();

  const receiptId = `RCP-${period.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="receipt-wrapper">
      {/* Print button – hidden when printing */}
      <ReceiptActions
        memberId={member.id}
        renewLabel={t("renewPrint")}
        monthlyPrice={gym.monthlyPrice}
      />

      {/* Receipt content */}
      <div id="receipt" className="receipt">
        {/* Header */}
        <div className="receipt-header">
          <div className="receipt-logo" aria-hidden>
            💪
          </div>
          <h1 className="receipt-title">{gym.name}</h1>
          {gym.address && <p className="receipt-info">{gym.address}</p>}
          {gym.phone && <p className="receipt-info">{gym.phone}</p>}
        </div>

        <div className="receipt-divider" />

        {/* Receipt meta */}
        <div className="receipt-meta">
          <span className="receipt-badge">{t("paid")}</span>
          <p className="receipt-ref">{receiptId}</p>
        </div>

        <div className="receipt-divider" />

        {/* Member info */}
        <table className="receipt-table">
          <tbody>
            <tr>
              <td className="receipt-label">{t("member")}</td>
              <td className="receipt-value">
                {member.firstName} {member.lastName}
              </td>
            </tr>
            <tr>
              <td className="receipt-label">{t("phone")}</td>
              <td className="receipt-value">{member.phone}</td>
            </tr>
            {member.cin && (
              <tr>
                <td className="receipt-label">{t("cin")}</td>
                <td className="receipt-value">{member.cin}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="receipt-divider" />

        {/* Period details */}
        <table className="receipt-table">
          <tbody>
            <tr>
              <td className="receipt-label">{t("startDate")}</td>
              <td className="receipt-value">
                {formatDateFr(period.startDate)}
              </td>
            </tr>
            <tr>
              <td className="receipt-label">{t("endDate")}</td>
              <td className="receipt-value">
                {formatDateFr(period.endDate)}
              </td>
            </tr>
            <tr>
              <td className="receipt-label">{t("paidOn")}</td>
              <td className="receipt-value">
                {formatDateFr(period.paidAt)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="receipt-divider" />

        {/* Total */}
        <div className="receipt-total-row">
          <span className="receipt-total-label">{t("total")}</span>
          <span className="receipt-total-amount">
            {formatMad(period.amountPaid)}
          </span>
        </div>

        <div className="receipt-divider" />

        {/* Footer */}
        <div className="receipt-footer">
          <p className="receipt-powered">
            {t("poweredBy")} &middot; {gym.name}
          </p>
        </div>
      </div>

      <style>{`
        .receipt-wrapper {
          max-width: 420px;
          margin: 0 auto;
        }
        .receipt {
          background: #fff;
          border: 1px solid #d5d0c6;
          border-radius: 12px;
          padding: 2rem 1.5rem;
          font-family: system-ui, sans-serif;
        }
        .receipt-header {
          text-align: center;
        }
        .receipt-logo {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          display: inline-block;
          width: 3.5rem;
          height: 3.5rem;
          line-height: 3.5rem;
          border-radius: 999px;
          background: var(--accent-soft);
        }
        .receipt-title {
          font-size: 1.35rem;
          font-weight: 700;
          margin: 0 0 0.25rem;
          font-family: var(--font-display), Georgia, serif;
        }
        .receipt-info {
          margin: 0.1rem 0;
          font-size: 0.85rem;
          color: #5c675f;
        }
        .receipt-divider {
          border-top: 1px dashed #d5d0c6;
          margin: 1rem 0;
        }
        .receipt-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .receipt-badge {
          display: inline-block;
          background: #dcfce7;
          color: #15803d;
          font-weight: 700;
          font-size: 0.75rem;
          padding: 0.2rem 0.7rem;
          border-radius: 999px;
          letter-spacing: 0.05em;
        }
        .receipt-ref {
          font-size: 0.8rem;
          color: #5c675f;
          font-family: monospace;
          margin: 0;
        }
        .receipt-table {
          width: 100%;
          border-collapse: collapse;
        }
        .receipt-table td {
          padding: 0.4rem 0;
          font-size: 0.9rem;
        }
        .receipt-label {
          color: #5c675f;
          white-space: nowrap;
          padding-right: 1rem;
          vertical-align: top;
        }
        .receipt-value {
          text-align: right;
          font-weight: 600;
        }
        .receipt-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .receipt-total-label {
          font-weight: 700;
          font-size: 1rem;
        }
        .receipt-total-amount {
          font-weight: 800;
          font-size: 1.25rem;
          color: #0d6e4f;
        }
        .receipt-footer {
          text-align: center;
        }
        .receipt-powered {
          font-size: 0.75rem;
          color: #5c675f;
          margin: 0;
        }

        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
            margin: 0;
            padding: 1.5rem;
          }
          nav, header, aside, footer, [class*="AppShell"],
          .app-shell, .sidebar {
            display: none !important;
          }
          .receipt {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          .receipt-wrapper {
            max-width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}