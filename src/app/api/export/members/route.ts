import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import { formatDateFr, getPaymentStatus } from "@/lib/membership";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gym = await getCurrentGym();
  const members = await prisma.member.findMany({
    where: { gymId: gym.id, deletedAt: null, status: { not: "CANCELLED" } },
    include: { periods: true },
    orderBy: { lastName: "asc" },
  });

  const rows = members.map((m) => {
    const pay = getPaymentStatus(m, gym.graceDays, gym.reminderDays);
    return {
      Prénom: m.firstName,
      Nom: m.lastName,
      Téléphone: m.phone,
      CIN: m.cin || "",
      Statut: m.status,
      Paiement: pay.status,
      "Fin abonnement": pay.endDate ? formatDateFr(pay.endDate) : "",
      Langue: m.preferredLocale,
      Notes: m.notes || "",
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Membres");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="membres.xlsx"',
    },
  });
}
