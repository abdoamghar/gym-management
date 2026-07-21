"use client";

import { useRouter } from "@/i18n/routing";

export function PrintBillButton({
  memberId,
  periodId,
}: {
  memberId: string;
  periodId?: string;
}) {
  const router = useRouter();

  function onClick() {
    const qs = periodId ? `?period=${encodeURIComponent(periodId)}` : "";
    router.push(`/members/${memberId}/receipt${qs}`);
  }

  return (
    <button
      type="button"
      className="btn btn-secondary inline-flex items-center gap-1"
      onClick={onClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 12H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      Print bill
    </button>
  );
}

export function PrintButton() {
  return (
    <button
      type="button"
      className="btn btn-secondary inline-flex items-center gap-1"
      onClick={() => window.print()}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 12H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      Print
    </button>
  );
}