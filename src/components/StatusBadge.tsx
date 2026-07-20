import type { PaymentStatus } from "@/lib/membership";

const map: Record<PaymentStatus | string, string> = {
  ok: "badge-ok",
  due_soon: "badge-due",
  grace: "badge-grace",
  overdue: "badge-overdue",
  frozen: "badge-frozen",
  none: "badge-frozen",
  ACTIVE: "badge-ok",
  FROZEN: "badge-frozen",
  EXPIRED: "badge-overdue",
  CANCELLED: "badge-frozen",
};

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return <span className={`badge ${map[status] || "badge-frozen"}`}>{label}</span>;
}
