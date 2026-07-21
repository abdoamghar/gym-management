"use client";

import {
  updateMember,
  freezeMember,
  unfreezeMember,
  cancelMembership,
  logNotification,
  softDeleteMember,
} from "@/lib/actions";
import { RenewButton } from "@/components/RenewButton";
import { WhatsAppButton, CopyMessageButton } from "@/components/WhatsAppButton";
import { PrintBillButton } from "@/components/PrintBillButton";
import { StatusBadge } from "@/components/StatusBadge";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { FormEvent, useState } from "react";
import { Spinner } from "@/components/ui";

type Period = {
  id: string;
  startDate: string;
  endDate: string;
  amountPaid: number;
  paidAt: string;
};

export function MemberDetailClient({
  member,
  periods,
  paymentLabel,
  paymentStatus,
  endDateLabel,
  remindUrl,
  remindText,
  welcomeUrl,
  monthlyPrice,
}: {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    cin: string | null;
    notes: string | null;
    photoUrl: string | null;
    preferredLocale: string;
    status: string;
    freezeStart: string | null;
    freezeEnd: string | null;
  };
  periods: Period[];
  paymentLabel: string;
  paymentStatus: string;
  endDateLabel: string;
  remindUrl: string;
  remindText: string;
  welcomeUrl: string;
  monthlyPrice: number;
}) {
  const t = useTranslations("members");
  const tStatus = useTranslations("status");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [renewalToast, setRenewalToast] = useState<{
    periodId: string;
    endDate: string;
    amountPaid: string;
  } | null>(null);

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await updateMember(member.id, new FormData(e.currentTarget));
    setLoading(false);
    setEditing(false);
  }

  async function onFreeze(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await freezeMember(member.id, new FormData(e.currentTarget));
    setLoading(false);
  }

  async function onUnfreeze() {
    setLoading(true);
    await unfreezeMember(member.id);
    setLoading(false);
  }

  async function onCancelMembership() {
    setLoading(true);
    await cancelMembership(member.id);
    setLoading(false);
  }

  async function onDelete() {
    if (!window.confirm(t("deleteConfirm"))) return;
    setLoading(true);
    await softDeleteMember(member.id);
    setLoading(false);
    router.push("/members");
  }

  const initials = `${member.firstName.slice(0, 1)}${member.lastName.slice(0, 1)}`.toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-3 justify-between">
        <div>
          <Link href="/members" className="text-sm text-[var(--muted)] inline-flex items-center gap-1">
            <span aria-hidden className="rtl:rotate-180">←</span> {t("title")}
          </Link>
          <h1 className="font-display text-3xl mt-1">
            {member.firstName} {member.lastName}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <RenewButton
            memberId={member.id}
            label={t("renew")}
            amount={monthlyPrice}
            onRenewed={(periodId, endDate, amountPaid) =>
              setRenewalToast({ periodId, endDate, amountPaid })
            }
          />
          <WhatsAppButton
            url={remindUrl}
            label={t("remindWa")}
            onOpened={() => logNotification(member.id, "payment_reminder")}
          />
          <WhatsAppButton url={welcomeUrl} label={t("welcomeWa")} />
        </div>
      </div>

      {renewalToast && (
        <div className="card p-4 border-2 border-[var(--accent)] bg-[var(--accent-soft)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-[var(--ink)]">
              ✓ Renewed until {renewalToast.endDate} — {renewalToast.amountPaid}
            </p>
            <p className="text-xs text-[var(--muted)]">
              Membership has been extended.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrintBillButton
              memberId={member.id}
              periodId={renewalToast.periodId}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setRenewalToast(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-[200px_1fr] gap-4">
        <div className="card p-3 flex items-center justify-center min-h-[200px] overflow-hidden">
          {member.photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- user-uploaded local photos with images.unoptimized */
            <img
              src={member.photoUrl}
              alt={member.firstName + " " + member.lastName}
              className="w-full h-52 object-cover rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[var(--muted)] text-sm">
              <span className="avatar" style={{ width: "5rem", height: "5rem", fontSize: "1.5rem" }} aria-hidden>
                {initials}
              </span>
              <span>{t("photo")}</span>
            </div>
          )}
        </div>
        <div className="card p-5 space-y-4 min-w-0">
          <div className="flex flex-wrap gap-2 items-center">
            <StatusBadge status={paymentStatus} label={paymentLabel} />
            <span className="text-sm text-[var(--muted)]">
              {t("endDate")}: <strong className="text-[var(--ink)]">{endDateLabel}</strong>
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <p className="text-sm">
              <span className="block text-xs uppercase tracking-wide text-[var(--muted)] font-semibold mb-0.5">{t("phone")}</span>
              <strong className="text-[var(--ink)]">{member.phone}</strong>
            </p>
            <p className="text-sm">
              <span className="block text-xs uppercase tracking-wide text-[var(--muted)] font-semibold mb-0.5">{t("cin")}</span>
              <strong className="text-[var(--ink)]">{member.cin || "—"}</strong>
            </p>
          </div>
          {member.notes && (
            <p className="text-sm">
              <span className="block text-xs uppercase tracking-wide text-[var(--muted)] font-semibold mb-0.5">{t("notes")}</span>
              <span className="text-[var(--ink)]">{member.notes}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-[var(--line)]">
            <CopyMessageButton text={remindText} />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditing((v) => !v)}
            >
              {t("edit")}
            </button>
            {member.status !== "CANCELLED" && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={onCancelMembership}
                disabled={loading}
              >
                {loading ? <Spinner /> : t("cancelMembership")}
              </button>
            )}
            <button
              type="button"
              className="btn btn-danger"
              onClick={onDelete}
              disabled={loading}
            >
              {loading ? <Spinner /> : t("delete")}
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <form onSubmit={onSave} className="card p-5 space-y-3 max-w-xl">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t("firstName")}</label>
              <input name="firstName" defaultValue={member.firstName} className="input" required />
            </div>
            <div>
              <label className="label">{t("lastName")}</label>
              <input name="lastName" defaultValue={member.lastName} className="input" required />
            </div>
          </div>
          <div>
            <label className="label">{t("phone")}</label>
            <input name="phone" defaultValue={member.phone} className="input" required />
          </div>
          <div>
            <label className="label">{t("cin")}</label>
            <input name="cin" defaultValue={member.cin || ""} className="input" />
          </div>
          <div>
            <label className="label">{t("locale")}</label>
            <select name="preferredLocale" defaultValue={member.preferredLocale} className="select">
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
          </div>
          <div>
            <label className="label">{t("status")}</label>
            <select name="status" defaultValue={member.status} className="select">
              <option value="ACTIVE">{tStatus("ACTIVE")}</option>
              <option value="FROZEN">{tStatus("FROZEN")}</option>
              <option value="EXPIRED">{tStatus("EXPIRED")}</option>
              <option value="CANCELLED">{tStatus("CANCELLED")}</option>
            </select>
          </div>
          <div>
            <label className="label">{t("photo")}</label>
            <input name="photo" type="file" accept="image/*" className="input" />
          </div>
          <div>
            <label className="label">{t("notes")}</label>
            <textarea name="notes" defaultValue={member.notes || ""} className="textarea" />
          </div>
          <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={loading}>
            {loading ? <Spinner /> : t("save")}
          </button>
        </form>
      )}

      <div className="card p-5 space-y-3">
        <h2 className="font-display text-xl">
          {member.status === "FROZEN" ? t("unfreeze") : t("freeze")}
        </h2>
        {member.status === "FROZEN" ? (
          <button type="button" className="btn btn-primary inline-flex items-center gap-2" onClick={onUnfreeze} disabled={loading}>
            {loading ? <Spinner /> : t("unfreeze")}
          </button>
        ) : (
          <form onSubmit={onFreeze} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div>
              <label className="label">{t("freezeStart")}</label>
              <input
                name="freezeStart"
                type="date"
                required
                className="input"
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div>
              <label className="label">{t("freezeEnd")}</label>
              <input name="freezeEnd" type="date" className="input" />
            </div>
            <button type="submit" className="btn btn-secondary inline-flex items-center gap-2" disabled={loading}>
              {loading ? <Spinner /> : t("freeze")}
            </button>
          </form>
        )}
      </div>

      <div className="card table-wrap">
        <h2 className="font-display text-xl p-4 pb-0">{t("history")}</h2>
        <table className="data">
          <thead>
            <tr>
              <th>{t("historyStart")}</th>
              <th>{t("historyEnd")}</th>
              <th>{t("paidAmount")}</th>
              <th>{t("historyPaidAt")}</th>
            </tr>
          </thead>
          <tbody>
            {periods.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-[var(--muted)] text-sm py-6">
                  {t("noPeriods")}<br/>
                  <span className="text-xs">{t("noPeriodsHint")}</span>
                </td>
              </tr>
            ) : (
              periods.map((p) => (
                <tr key={p.id} className="row-hover">
                  <td>{p.startDate}</td>
                  <td>{p.endDate}</td>
                  <td><strong>{p.amountPaid} MAD</strong></td>
                  <td>{p.paidAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
