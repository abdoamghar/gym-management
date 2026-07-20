"use client";

import {
  updateMember,
  freezeMember,
  unfreezeMember,
  cancelMembership,
  logNotification,
} from "@/lib/actions";
import { RenewButton } from "@/components/RenewButton";
import { WhatsAppButton, CopyMessageButton } from "@/components/WhatsAppButton";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { FormEvent, useState } from "react";
import { Spinner, SubmitButton } from "@/components/ui";

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
          <RenewButton memberId={member.id} label={t("renew")} amount={monthlyPrice} />
          <WhatsAppButton
            url={remindUrl}
            label={t("remindWa")}
            onOpened={() => logNotification(member.id, "payment_reminder")}
          />
          <WhatsAppButton url={welcomeUrl} label={t("welcomeWa")} />
        </div>
      </div>

      <div className="grid md:grid-cols-[200px_1fr] gap-4">
        <div className="card p-3 flex items-center justify-center min-h-[180px]">
          {member.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.photoUrl}
              alt=""
              className="w-full h-48 object-cover rounded-lg"
            />
          ) : (
            <div className="text-[var(--muted)] text-sm">{t("photo")}</div>
          )}
        </div>
        <div className="card p-5 space-y-3 min-w-0">
          <div className="flex flex-wrap gap-2 items-center">
            <span className={`badge badge-${paymentStatus === "ok" ? "ok" : paymentStatus === "due_soon" ? "due" : paymentStatus === "grace" ? "grace" : paymentStatus === "overdue" ? "overdue" : "frozen"}`}>
              {paymentLabel}
            </span>
            <span className="text-sm text-[var(--muted)]">
              {t("endDate")}: {endDateLabel}
            </span>
          </div>
          <p>
            <strong>{t("phone")}:</strong> {member.phone}
          </p>
          <p>
            <strong>{t("cin")}:</strong> {member.cin || "—"}
          </p>
          {member.notes && (
            <p>
              <strong>{t("notes")}:</strong> {member.notes}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
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
              <th>Début</th>
              <th>Fin</th>
              <th>{t("paidAmount")}</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.id}>
                <td>{p.startDate}</td>
                <td>{p.endDate}</td>
                <td>{p.amountPaid} MAD</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
