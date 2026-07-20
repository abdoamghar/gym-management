"use client";

import { createMember } from "@/lib/actions";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { FormEvent, useState } from "react";
import { SubmitButton } from "@/components/ui";

export function NewMemberForm({ monthlyPrice }: { monthlyPrice: number }) {
  const t = useTranslations("members");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await createMember(fd);
    setLoading(false);
    if (!result.ok || !result.memberId) return;

    if (result.whatsappUrl) {
      window.open(result.whatsappUrl, "_blank");
    }
    router.push(`/members/${result.memberId}`);
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
