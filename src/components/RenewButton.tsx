"use client";

import { renewMember } from "@/lib/actions";
import { useRouter } from "@/i18n/routing";
import { useState } from "react";
import { Spinner } from "@/components/ui";

export function RenewButton({
  memberId,
  label,
  amount,
}: {
  memberId: string;
  label: string;
  amount?: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      className="btn btn-primary inline-flex items-center gap-2"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await renewMember(memberId, amount);
        setLoading(false);
      }}
    >
      {loading ? <Spinner /> : label}
    </button>
  );
}
