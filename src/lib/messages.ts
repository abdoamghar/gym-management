import type { Gym, Member, MessageTemplate, Holiday } from "@prisma/client";
import { formatDateFr, formatMad, getLatestPeriod } from "./membership";
import { buildWhatsAppUrl, renderTemplate } from "./whatsapp";
import type { MembershipPeriod } from "@prisma/client";

type GymLite = Pick<
  Gym,
  "name" | "phone" | "address" | "monthlyPrice" | "defaultLocale"
>;

export function pickTemplateBody(
  templates: MessageTemplate[],
  key: string,
  locale: string
): string {
  const t = templates.find((x) => x.key === key);
  if (!t) return "";
  return locale === "ar" ? t.bodyAr : t.bodyFr;
}

export function welcomeWhatsApp(
  gym: GymLite,
  templates: MessageTemplate[],
  member: Member,
  endDate: Date | string,
  amount?: number
) {
  const locale = member.preferredLocale || gym.defaultLocale;
  const body = pickTemplateBody(templates, "welcome", locale);
  const text = renderTemplate(body, {
    name: `${member.firstName} ${member.lastName}`,
    gymName: gym.name,
    endDate: formatDateFr(endDate),
    price: formatMad(amount ?? gym.monthlyPrice),
    address: gym.address || "",
    gymPhone: gym.phone || "",
  });
  return { text, url: buildWhatsAppUrl(member.phone, text) };
}

export function paymentReminderWhatsApp(
  gym: GymLite,
  templates: MessageTemplate[],
  member: Member & { periods: MembershipPeriod[] }
) {
  const locale = member.preferredLocale || gym.defaultLocale;
  const body = pickTemplateBody(templates, "payment_reminder", locale);
  const latest = getLatestPeriod(member.periods);
  const text = renderTemplate(body, {
    name: `${member.firstName} ${member.lastName}`,
    gymName: gym.name,
    endDate: latest ? formatDateFr(latest.endDate) : "",
    price: formatMad(gym.monthlyPrice),
    address: gym.address || "",
    gymPhone: gym.phone || "",
  });
  return { text, url: buildWhatsAppUrl(member.phone, text) };
}

export function closureWhatsApp(
  gym: GymLite,
  templates: MessageTemplate[],
  member: Member,
  holiday: Holiday
) {
  const locale = member.preferredLocale || gym.defaultLocale;
  const body = pickTemplateBody(templates, "closure", locale);
  const text = renderTemplate(body, {
    name: `${member.firstName} ${member.lastName}`,
    gymName: gym.name,
    title: holiday.title,
    startDate: formatDateFr(holiday.startDate),
    endDate: formatDateFr(holiday.endDate),
    address: gym.address || "",
    gymPhone: gym.phone || "",
  });
  return { text, url: buildWhatsAppUrl(member.phone, text) };
}
