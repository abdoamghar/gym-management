import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function ExportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("export");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">{t("title")}</h1>
      <p className="text-[var(--muted)]">{t("hint")}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <a href="/api/export/members" className="btn btn-primary" download>
          {t("members")}
        </a>
        <a href="/api/export/payments" className="btn btn-secondary" download>
          {t("payments")}
        </a>
      </div>
    </div>
  );
}
