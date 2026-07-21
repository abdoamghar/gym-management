import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import { getPaymentStatus } from "@/lib/membership";
import { paymentReminderWhatsApp, closureWhatsApp } from "@/lib/messages";
import { BroadcastClient } from "@/components/BroadcastClient";

export default async function BroadcastPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ audience?: string; template?: string }>;
}) {
  const { locale } = await params;
  const { audience = "due", template = "payment_reminder" } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("broadcast");

  const gym = await getCurrentGym();

  // Fetch members, excluding soft-deleted
  const allMembers = await prisma.member.findMany({
    where: {
      gymId: gym.id,
      status: { not: "CANCELLED" },
      deletedAt: null,
    },
    include: { periods: true },
  });

  // Filter by audience
  let filtered = allMembers;
  if (audience === "due") {
    filtered = allMembers.filter((m) => {
      const { status } = getPaymentStatus(m, gym.graceDays, gym.reminderDays);
      return ["due_soon", "grace", "overdue"].includes(status);
    });
  } else if (audience === "expired") {
    filtered = allMembers.filter((m) => m.status === "EXPIRED");
  } else {
    filtered = allMembers.filter((m) => m.status === "ACTIVE");
  }

  const members = filtered.map((m) => {
    const wa =
      template === "closure"
        ? closureWhatsApp(gym, gym.messageTemplates, m, {
            id: "broadcast",
            title: "",
            startDate: new Date(),
            endDate: new Date(),
            messageSentAt: null,
            createdAt: new Date(),
            gymId: gym.id,
          })
        : paymentReminderWhatsApp(gym, gym.messageTemplates, m);

    return {
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      phone: m.phone,
      payStatus: getPaymentStatus(m, gym.graceDays, gym.reminderDays).status,
      url: wa.url,
      text: wa.text,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">{t("title")}</h1>
      <BroadcastClient
        members={members}
        audience={audience}
        template={template}
      />
    </div>
  );
}