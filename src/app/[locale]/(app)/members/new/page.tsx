import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentGym } from "@/lib/gym";
import { NewMemberForm } from "@/components/NewMemberForm";

export default async function NewMemberPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("members");
  const gym = await getCurrentGym();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">{t("add")}</h1>
      <NewMemberForm monthlyPrice={gym.monthlyPrice} />
    </div>
  );
}
