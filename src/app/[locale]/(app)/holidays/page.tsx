import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import { formatDateFr } from "@/lib/membership";
import { closureWhatsApp } from "@/lib/messages";
import { HolidaysClient } from "@/components/HolidaysClient";

export default async function HolidaysPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const gym = await getCurrentGym();
  const holidays = await prisma.holiday.findMany({
    where: { gymId: gym.id },
    orderBy: { startDate: "desc" },
  });
  const activeMembers = await prisma.member.findMany({
    where: { gymId: gym.id, status: "ACTIVE", deletedAt: null },
  });

  const buildQueue: Record<
    string,
    { memberId: string; name: string; url: string; text: string }[]
  > = {};

  for (const h of holidays) {
    buildQueue[h.id] = activeMembers.map((m) => {
      const wa = closureWhatsApp(gym, gym.messageTemplates, m, h);
      return {
        memberId: m.id,
        name: `${m.firstName} ${m.lastName}`,
        url: wa.url,
        text: wa.text,
      };
    });
  }

  return (
    <HolidaysClient
      holidays={holidays.map((h) => ({
        id: h.id,
        title: h.title,
        startDate: formatDateFr(h.startDate),
        endDate: formatDateFr(h.endDate),
        messageSentAt: h.messageSentAt ? formatDateFr(h.messageSentAt) : null,
      }))}
      buildQueue={buildQueue}
    />
  );
}
