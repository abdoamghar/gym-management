import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentGym } from "@/lib/gym";
import { formatDateFr } from "@/lib/membership";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gym = await getCurrentGym();
  const periods = await prisma.membershipPeriod.findMany({
    where: { gymId: gym.id },
    include: { member: true },
    orderBy: { paidAt: "desc" },
  });

  const rows = periods.map((p) => ({
    Prénom: p.member.firstName,
    Nom: p.member.lastName,
    Téléphone: p.member.phone,
    Début: formatDateFr(p.startDate),
    Fin: formatDateFr(p.endDate),
    Montant: p.amountPaid,
    "Date paiement": formatDateFr(p.paidAt),
    Note: p.note || "",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Paiements");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="paiements.xlsx"',
    },
  });
}
