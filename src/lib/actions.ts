"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import { auth } from "@/lib/auth";
import {
  computeRenewalDates,
  frozenDayCount,
  formatDateFr,
  formatMad,
  getLatestPeriod,
} from "@/lib/membership";
import { addDays, startOfDay } from "date-fns";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { TemplateKey } from "@prisma/client";
import { welcomeWhatsApp } from "./messages";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function updateGymSettings(formData: FormData) {
  await requireSession();
  const gym = await getCurrentGym();

  await prisma.gym.update({
    where: { id: gym.id },
    data: {
      name: String(formData.get("name") || gym.name),
      phone: String(formData.get("phone") || "") || null,
      address: String(formData.get("address") || "") || null,
      monthlyPrice: Number(formData.get("monthlyPrice") || gym.monthlyPrice),
      membershipDays: Number(formData.get("membershipDays") || gym.membershipDays),
      graceDays: Number(formData.get("graceDays") || gym.graceDays),
      reminderDays: Number(formData.get("reminderDays") || gym.reminderDays),
      defaultLocale: String(formData.get("defaultLocale") || "fr"),
    },
  });

  revalidatePath("/");
  return { ok: true };
}

export async function updateTemplates(formData: FormData) {
  await requireSession();
  const gym = await getCurrentGym();
  const keys: TemplateKey[] = ["welcome", "payment_reminder", "closure"];

  for (const key of keys) {
    const bodyFr = String(formData.get(`${key}_fr`) || "");
    const bodyAr = String(formData.get(`${key}_ar`) || "");
    await prisma.messageTemplate.upsert({
      where: { gymId_key: { gymId: gym.id, key } },
      create: { gymId: gym.id, key, bodyFr, bodyAr },
      update: { bodyFr, bodyAr },
    });
  }

  revalidatePath("/");
  return { ok: true };
}

async function savePhoto(file: File | null, memberId: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const filename = `${memberId}.${ext}`;
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function createMember(formData: FormData) {
  await requireSession();
  const gym = await getCurrentGym();

  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const cin = String(formData.get("cin") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;
  const preferredLocale = String(formData.get("preferredLocale") || "fr");
  const amountPaid = Number(formData.get("amountPaid") || gym.monthlyPrice);

  if (!firstName || !lastName || !phone) {
    return { ok: false, error: "Missing required fields" };
  }

  const today = startOfDay(new Date());
  const endDate = addDays(today, gym.membershipDays - 1);

  const member = await prisma.member.create({
    data: {
      gymId: gym.id,
      firstName,
      lastName,
      phone,
      cin,
      notes,
      preferredLocale,
      status: "ACTIVE",
      periods: {
        create: {
          gymId: gym.id,
          startDate: today,
          endDate,
          amountPaid,
          paidAt: new Date(),
        },
      },
    },
  });

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const photoUrl = await savePhoto(photo, member.id);
    if (photoUrl) {
      await prisma.member.update({
        where: { id: member.id },
        data: { photoUrl },
      });
    }
  }

  const gymFull = await getCurrentGym();
  const wa = welcomeWhatsApp(
    gymFull,
    gymFull.messageTemplates,
    { ...member, preferredLocale },
    endDate,
    amountPaid
  );

  revalidatePath("/");
  return {
    ok: true,
    memberId: member.id,
    endDate: formatDateFr(endDate),
    amountPaid: formatMad(amountPaid),
    whatsappUrl: wa.url,
  };
}

export async function updateMember(memberId: string, formData: FormData) {
  await requireSession();

  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const cin = String(formData.get("cin") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;
  const preferredLocale = String(formData.get("preferredLocale") || "fr");
  const status = String(formData.get("status") || "ACTIVE") as
    | "ACTIVE"
    | "FROZEN"
    | "EXPIRED"
    | "CANCELLED";

  const data: {
    firstName: string;
    lastName: string;
    phone: string;
    cin: string | null;
    notes: string | null;
    preferredLocale: string;
    status: "ACTIVE" | "FROZEN" | "EXPIRED" | "CANCELLED";
    photoUrl?: string;
  } = { firstName, lastName, phone, cin, notes, preferredLocale, status };

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const photoUrl = await savePhoto(photo, memberId);
    if (photoUrl) data.photoUrl = photoUrl;
  }

  await prisma.member.update({ where: { id: memberId }, data });
  revalidatePath("/");
  return { ok: true };
}

export async function renewMember(memberId: string, amountPaid?: number) {
  await requireSession();
  const gym = await getCurrentGym();

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { periods: true },
  });
  if (!member) return { ok: false, error: "Not found" };

  const latest = getLatestPeriod(member.periods);
  const { startDate, endDate } = computeRenewalDates(
    latest ? new Date(latest.endDate) : null,
    gym.membershipDays
  );

  await prisma.membershipPeriod.create({
    data: {
      gymId: gym.id,
      memberId,
      startDate,
      endDate,
      amountPaid: amountPaid ?? gym.monthlyPrice,
      paidAt: new Date(),
    },
  });

  await prisma.member.update({
    where: { id: memberId },
    data: { status: "ACTIVE" },
  });

  revalidatePath("/");
  return {
    ok: true,
    endDate: formatDateFr(endDate),
    amountPaid: formatMad(amountPaid ?? gym.monthlyPrice),
  };
}

export async function freezeMember(memberId: string, formData: FormData) {
  await requireSession();
  const freezeStart = new Date(String(formData.get("freezeStart")));
  const freezeEndRaw = String(formData.get("freezeEnd") || "");
  const freezeEnd = freezeEndRaw ? new Date(freezeEndRaw) : null;

  await prisma.member.update({
    where: { id: memberId },
    data: {
      status: "FROZEN",
      freezeStart: startOfDay(freezeStart),
      freezeEnd: freezeEnd ? startOfDay(freezeEnd) : null,
    },
  });

  revalidatePath("/");
  return { ok: true };
}

export async function cancelMembership(memberId: string) {
  await requireSession();

  await prisma.member.update({
    where: { id: memberId },
    data: {
      status: "CANCELLED",
      freezeStart: null,
      freezeEnd: null,
    },
  });

  revalidatePath("/");
  return { ok: true };
}

export async function unfreezeMember(memberId: string) {
  await requireSession();

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { periods: true },
  });
  if (!member || !member.freezeStart) return { ok: false, error: "Not frozen" };

  const freezeEnd = member.freezeEnd
    ? startOfDay(new Date(member.freezeEnd))
    : startOfDay(new Date());
  const days = frozenDayCount(new Date(member.freezeStart), freezeEnd);
  const latest = getLatestPeriod(member.periods);

  if (latest && days > 0) {
    await prisma.membershipPeriod.update({
      where: { id: latest.id },
      data: { endDate: addDays(new Date(latest.endDate), days) },
    });
  }

  await prisma.member.update({
    where: { id: memberId },
    data: {
      status: "ACTIVE",
      freezeStart: null,
      freezeEnd: null,
    },
  });

  revalidatePath("/");
  return { ok: true };
}

export async function createCheckIn(memberId: string) {
  const session = await requireSession();
  const gym = await getCurrentGym();

  await prisma.checkIn.create({
    data: {
      gymId: gym.id,
      memberId,
      createdById: session.user.id,
    },
  });

  revalidatePath("/");
  return { ok: true };
}

export async function createHoliday(formData: FormData) {
  await requireSession();
  const gym = await getCurrentGym();

  const title = String(formData.get("title") || "").trim();
  const startDate = new Date(String(formData.get("startDate")));
  const endDate = new Date(String(formData.get("endDate")));

  const holiday = await prisma.holiday.create({
    data: {
      gymId: gym.id,
      title,
      startDate: startOfDay(startDate),
      endDate: startOfDay(endDate),
    },
  });

  revalidatePath("/");
  return { ok: true, holidayId: holiday.id };
}

export async function deleteHoliday(holidayId: string) {
  await requireSession();
  await prisma.holiday.delete({ where: { id: holidayId } });
  revalidatePath("/");
  return { ok: true };
}

export async function markHolidayNotified(holidayId: string) {
  await requireSession();
  await prisma.holiday.update({
    where: { id: holidayId },
    data: { messageSentAt: new Date() },
  });
  revalidatePath("/");
  return { ok: true };
}

export async function logNotification(memberId: string, template: string) {
  await requireSession();
  const gym = await getCurrentGym();
  await prisma.notificationLog.create({
    data: {
      gymId: gym.id,
      memberId,
      template,
      channel: "whatsapp",
    },
  });
  return { ok: true };
}
