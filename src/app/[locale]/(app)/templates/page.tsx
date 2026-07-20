import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentGym } from "@/lib/gym";
import { TemplatesForm } from "@/components/TemplatesForm";

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("templates");
  const gym = await getCurrentGym();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">{t("title")}</h1>
      <TemplatesForm
        templates={gym.messageTemplates.map((x) => ({
          key: x.key,
          bodyFr: x.bodyFr,
          bodyAr: x.bodyAr,
        }))}
      />
    </div>
  );
}
