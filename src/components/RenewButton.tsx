"use client";

import { renewMember } from "@/lib/actions";
import { useState } from "react";
import { Spinner } from "@/components/ui";

export function RenewButton({
  memberId,
  label,
  amount,
  onRenewed,
}: {
  memberId: string;
  label: string;
  amount?: number;
  onRenewed?: (periodId: string, endDate: string, amountPaid: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    const res = await renewMember(memberId, amount);
    setLoading(false);
    if (res.ok && res.memberId && res.periodId) {
      onRenewed?.(res.periodId, res.endDate, res.amountPaid);
    }
  }

  return (
    <button
      type="button"
      className="btn btn-primary inline-flex items-center gap-2"
      disabled={loading}
      onClick={onClick}
    >
      {loading ? <Spinner /> : label}
    </button>
  );
}
