import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import { getPaymentStatus, formatDateFr } from "@/lib/membership";
import { CheckInClient } from "@/components/CheckInClient";
import { startOfDay, format } from "date-fns";

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tStatus = await getTranslations("status");

  const gym = await getCurrentGym();
  const members = await prisma.member.findMany({
    where: { gymId: gym.id, status: { not: "CANCELLED" } },
    include: { periods: true },
  });

  const todayStart = startOfDay(new Date());
  const checkIns = await prisma.checkIn.findMany({
    where: { gymId: gym.id, checkedInAt: { gte: todayStart } },
    include: { member: true },
    orderBy: { checkedInAt: "desc" },
  });

  return (
    <CheckInClient
      members={members.map((m) => {
        const pay = getPaymentStatus(m, gym.graceDays, gym.reminderDays);
        return {
          id: m.id,
          firstName: m.firstName,
          lastName: m.lastName,
          phone: m.phone,
          cin: m.cin,
          photoUrl: m.photoUrl,
          payStatus: pay.status,
          payLabel: tStatus(pay.status),
          endDateLabel: pay.endDate ? formatDateFr(pay.endDate) : "—",
        };
      })}
      todayCheckIns={checkIns.map((c) => ({
        id: c.id,
        name: `${c.member.firstName} ${c.member.lastName}`,
        time: format(c.checkedInAt, "HH:mm"),
      }))}
    />
  );
}
