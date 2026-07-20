import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentGym } from "@/lib/gym";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("settings");
  const gym = await getCurrentGym();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">{t("title")}</h1>
      <SettingsForm
        gym={{
          name: gym.name,
          phone: gym.phone,
          address: gym.address,
          monthlyPrice: gym.monthlyPrice,
          membershipDays: gym.membershipDays,
          graceDays: gym.graceDays,
          reminderDays: gym.reminderDays,
          defaultLocale: gym.defaultLocale,
        }}
      />
    </div>
  );
}
