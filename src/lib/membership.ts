import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import type { Member, MembershipPeriod } from "@prisma/client";

export type MemberWithPeriods = Member & { periods: MembershipPeriod[] };

export function getLatestPeriod(periods: MembershipPeriod[]): MembershipPeriod | null {
  if (!periods.length) return null;
  return [...periods].sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  )[0];
}

export function getEffectiveEndDate(member: MemberWithPeriods): Date | null {
  const latest = getLatestPeriod(member.periods);
  return latest ? startOfDay(new Date(latest.endDate)) : null;
}

export type PaymentStatus = "ok" | "due_soon" | "grace" | "overdue" | "frozen" | "none";

export function getPaymentStatus(
  member: MemberWithPeriods,
  graceDays: number,
  reminderDays: number,
  today = startOfDay(new Date())
): { status: PaymentStatus; endDate: Date | null; daysUntilEnd: number | null } {
  if (member.status === "FROZEN") {
    return { status: "frozen", endDate: getEffectiveEndDate(member), daysUntilEnd: null };
  }
  if (member.status === "CANCELLED") {
    return { status: "none", endDate: null, daysUntilEnd: null };
  }

  const endDate = getEffectiveEndDate(member);
  if (!endDate) return { status: "none", endDate: null, daysUntilEnd: null };

  const daysUntilEnd = differenceInCalendarDays(endDate, today);

  if (daysUntilEnd < -graceDays) {
    return { status: "overdue", endDate, daysUntilEnd };
  }
  if (daysUntilEnd < 0) {
    return { status: "grace", endDate, daysUntilEnd };
  }
  if (daysUntilEnd <= reminderDays) {
    return { status: "due_soon", endDate, daysUntilEnd };
  }
  return { status: "ok", endDate, daysUntilEnd };
}

export function computeRenewalDates(
  latestEnd: Date | null,
  membershipDays: number,
  today = startOfDay(new Date())
): { startDate: Date; endDate: Date } {
  const start =
    latestEnd && startOfDay(latestEnd) >= today ? addDays(startOfDay(latestEnd), 1) : today;
  return { startDate: start, endDate: addDays(start, membershipDays - 1) };
}

export function frozenDayCount(freezeStart: Date, freezeEnd: Date): number {
  return Math.max(0, differenceInCalendarDays(startOfDay(freezeEnd), startOfDay(freezeStart)) + 1);
}

export function formatDateFr(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatMad(amount: number): string {
  return `${amount.toFixed(0)} MAD`;
}
