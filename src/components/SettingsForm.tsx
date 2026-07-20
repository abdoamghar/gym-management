"use client";

import { updateGymSettings } from "@/lib/actions";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { FormEvent, useState } from "react";
import { SubmitButton } from "@/components/ui";

export function SettingsForm({
  gym,
}: {
  gym: {
    name: string;
    phone: string | null;
    address: string | null;
    monthlyPrice: number;
    membershipDays: number;
    graceDays: number;
    reminderDays: number;
    defaultLocale: string;
  };
}) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await updateGymSettings(new FormData(e.currentTarget));
    setLoading(false);
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 md:p-6 space-y-4 max-w-xl">
      <div>
        <label className="label">{t("gymName")}</label>
        <input name="name" defaultValue={gym.name} required className="input" />
      </div>
      <div>
        <label className="label">{t("phone")}</label>
        <input name="phone" defaultValue={gym.phone || ""} className="input" />
      </div>
      <div>
        <label className="label">{t("address")}</label>
        <input name="address" defaultValue={gym.address || ""} className="input" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">{t("monthlyPrice")}</label>
          <input
            name="monthlyPrice"
            type="number"
            defaultValue={gym.monthlyPrice}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">{t("membershipDays")}</label>
          <input
            name="membershipDays"
            type="number"
            defaultValue={gym.membershipDays}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">{t("graceDays")}</label>
          <input
            name="graceDays"
            type="number"
            defaultValue={gym.graceDays}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">{t("reminderDays")}</label>
          <input
            name="reminderDays"
            type="number"
            defaultValue={gym.reminderDays}
            className="input"
            required
          />
        </div>
      </div>
      <div>
        <label className="label">{t("defaultLocale")}</label>
        <select name="defaultLocale" defaultValue={gym.defaultLocale} className="select">
          <option value="fr">Français</option>
          <option value="ar">العربية</option>
        </select>
      </div>
      <SubmitButton loading={loading}>{tCommon("save")}</SubmitButton>
      {saved && <p className="text-[var(--ok)]">{t("saved")}</p>}
    </form>
  );
}
