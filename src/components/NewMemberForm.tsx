"use client";

import { createMember } from "@/lib/actions";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { FormEvent, useState } from "react";
import { SubmitButton } from "@/components/ui";
import { PrintBillButton } from "@/components/PrintBillButton";

export function NewMemberForm({ monthlyPrice }: { monthlyPrice: number }) {
  const t = useTranslations("members");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdMemberId, setCreatedMemberId] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await createMember(fd);
    setLoading(false);
    if (!result.ok || !result.memberId) return;

    setCreatedMemberId(result.memberId);

    if (result.whatsappUrl) {
      window.open(result.whatsappUrl, "_blank");
    }
  }

  if (createdMemberId) {
    return (
      <div className="card p-6 md:p-8 space-y-5 max-w-xl text-center">
        <div className="flex flex-col items-center gap-2">
          <span aria-hidden className="text-4xl">✅</span>
          <p className="font-display text-2xl text-[var(--ok)]">{t("created")}</p>
          <p className="text-sm text-[var(--muted)]">
            This member is now active. Print the receipt below.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <PrintBillButton memberId={createdMemberId} />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => router.push(`/members/${createdMemberId}`)}
          >
            {t("detail")}
          </button>
          <Link href="/members" className="btn btn-secondary">
            {t("title")}
          </Link>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => { setCreatedMemberId(null); }}
        >
          + {t("add")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 md:p-6 space-y-4 max-w-xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">{t("firstName")}</label>
          <input name="firstName" required className="input" />
        </div>
        <div>
          <label className="label">{t("lastName")}</label>
          <input name="lastName" required className="input" />
        </div>
      </div>
      <div>
        <label className="label">{t("phone")}</label>
        <input name="phone" required className="input" placeholder="06XXXXXXXX" />
      </div>
      <div>
        <label className="label">{t("cin")}</label>
        <input name="cin" className="input" />
      </div>
      <div>
        <label className="label">{t("paidAmount")}</label>
        <input
          name="amountPaid"
          type="number"
          step="1"
          defaultValue={monthlyPrice}
          className="input"
        />
      </div>
      <div>
        <label className="label">{t("locale")}</label>
        <select name="preferredLocale" className="select" defaultValue="fr">
          <option value="fr">Français</option>
          <option value="ar">العربية</option>
        </select>
      </div>
      <div>
        <label className="label">{t("photo")}</label>
        <input name="photo" type="file" accept="image/*" className="input" />
      </div>
      <div>
        <label className="label">{t("notes")}</label>
        <textarea name="notes" className="textarea" />
      </div>
      <div className="flex flex-wrap gap-2">
        <SubmitButton loading={loading}>{t("save")}</SubmitButton>
        <Link href="/members" className="btn btn-secondary">
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
