"use client";

import { updateTemplates } from "@/lib/actions";
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import { SubmitButton } from "@/components/ui";

const KEYS = ["welcome", "payment_reminder", "closure"] as const;

export function TemplatesForm({
  templates,
}: {
  templates: { key: string; bodyFr: string; bodyAr: string }[];
}) {
  const t = useTranslations("templates");
  const tCommon = useTranslations("common");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const byKey = Object.fromEntries(templates.map((x) => [x.key, x]));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await updateTemplates(new FormData(e.currentTarget));
    setLoading(false);
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <p className="text-sm text-[var(--muted)]">
        {t("vars")}: {"{{name}}"}, {"{{gymName}}"}, {"{{endDate}}"}, {"{{price}}"},{" "}
        {"{{address}}"}, {"{{gymPhone}}"}, {"{{title}}"}, {"{{startDate}}"}
      </p>
      {KEYS.map((key) => (
        <div key={key} className="card p-5 space-y-3">
          <h2 className="font-display text-xl">{t(key)}</h2>
          <div>
            <label className="label">{t("bodyFr")}</label>
            <textarea
              name={`${key}_fr`}
              className="textarea"
              defaultValue={byKey[key]?.bodyFr || ""}
              required
            />
          </div>
          <div>
            <label className="label">{t("bodyAr")}</label>
            <textarea
              name={`${key}_ar`}
              className="textarea"
              dir="rtl"
              defaultValue={byKey[key]?.bodyAr || ""}
              required
            />
          </div>
        </div>
      ))}
      <SubmitButton loading={loading}>{tCommon("save")}</SubmitButton>
      {saved && <p className="text-[var(--ok)]">{t("saved")}</p>}
    </form>
  );
}
