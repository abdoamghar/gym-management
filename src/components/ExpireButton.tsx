"use client";

import { expireOverdueMembers } from "@/lib/actions";
import { useRouter } from "@/i18n/routing";
import { useState } from "react";
import { Spinner } from "@/components/ui";

export function ExpireButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setMsg(null);
    const res = await expireOverdueMembers();
    setLoading(false);
    if (res.ok && res.expiredCount > 0) {
      setMsg(`Expired ${res.expiredCount} members`);
    } else if (res.ok) {
      setMsg("No overdue members to expire");
    }
    router.refresh();
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className="btn btn-secondary inline-flex items-center gap-2"
        disabled={loading}
        onClick={onClick}
      >
        {loading ? <Spinner /> : "Expire overdue now"}
      </button>
      {msg && (
        <span className="text-sm text-[var(--muted)]">{msg}</span>
      )}
    </div>
  );
}