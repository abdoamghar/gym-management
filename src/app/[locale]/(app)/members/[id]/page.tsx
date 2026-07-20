import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import { getPaymentStatus, formatDateFr } from "@/lib/membership";
import { paymentReminderWhatsApp, welcomeWhatsApp } from "@/lib/messages";
import { MemberDetailClient } from "@/components/MemberDetailClient";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const tStatus = await getTranslations("status");

  const gym = await getCurrentGym();
  const member = await prisma.member.findFirst({
    where: { id, gymId: gym.id },
    include: { periods: { orderBy: { endDate: "desc" } } },
  });
  if (!member) notFound();

  const pay = getPaymentStatus(member, gym.graceDays, gym.reminderDays);
  const remind = paymentReminderWhatsApp(gym, gym.messageTemplates, member);
  const welcome = welcomeWhatsApp(
    gym,
    gym.messageTemplates,
    member,
    pay.endDate || new Date(),
    gym.monthlyPrice
  );

  return (
    <MemberDetailClient
      member={{
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        phone: member.phone,
        cin: member.cin,
        notes: member.notes,
        photoUrl: member.photoUrl,
        preferredLocale: member.preferredLocale,
        status: member.status,
        freezeStart: member.freezeStart?.toISOString() ?? null,
        freezeEnd: member.freezeEnd?.toISOString() ?? null,
      }}
      periods={member.periods.map((p) => ({
        id: p.id,
        startDate: formatDateFr(p.startDate),
        endDate: formatDateFr(p.endDate),
        amountPaid: p.amountPaid,
        paidAt: formatDateFr(p.paidAt),
      }))}
      paymentLabel={tStatus(pay.status)}
      paymentStatus={pay.status}
      endDateLabel={pay.endDate ? formatDateFr(pay.endDate) : "—"}
      remindUrl={remind.url}
      remindText={remind.text}
      welcomeUrl={welcome.url}
      monthlyPrice={gym.monthlyPrice}
    />
  );
}
