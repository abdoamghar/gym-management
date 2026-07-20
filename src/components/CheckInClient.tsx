"use client";

import { createCheckIn } from "@/lib/actions";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Spinner } from "@/components/ui";

type MemberRow = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  cin: string | null;
  photoUrl: string | null;
  payStatus: string;
  payLabel: string;
  endDateLabel: string;
};

export function CheckInClient({
  members,
  todayCheckIns,
}: {
  members: MemberRow[];
  todayCheckIns: { id: string; name: string; time: string }[];
}) {
  const t = useTranslations("checkIn");
  const router = useRouter();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<MemberRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return members
      .filter(
        (m) =>
          m.firstName.toLowerCase().includes(term) ||
          m.lastName.toLowerCase().includes(term) ||
          m.phone.includes(term) ||
          (m.cin && m.cin.toLowerCase().includes(term))
      )
      .slice(0, 12);
  }, [q, members]);

  async function confirm() {
    if (!selected) return;
    setLoading(true);
    await createCheckIn(selected.id);
    setLoading(false);
    setMessage(t("success"));
    setSelected(null);
    setQ("");
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">{t("title")}</h1>

      <div className="card p-5 space-y-4 max-w-xl">
        <input
          className="input"
          placeholder={t("search")}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSelected(null);
            setMessage("");
          }}
          autoFocus
        />

        {q && results.length === 0 && (
          <p className="text-[var(--muted)] text-sm">{t("noResults")}</p>
        )}

        <ul className="flex flex-col gap-2">
          {results.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className={`w-full text-start rounded-xl border p-3 transition ${
                  selected?.id === m.id
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--line)] hover:bg-[#f7f3ec]"
                }`}
                onClick={() => setSelected(m)}
              >
                <div className="font-semibold">
                  {m.firstName} {m.lastName}
                </div>
                <div className="text-sm text-[var(--muted)] flex flex-wrap gap-2 mt-1">
                  <span>{m.phone}</span>
                  <StatusBadge status={m.payStatus} label={m.payLabel} />
                  <span>{m.endDateLabel}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>

        {selected && (
          <div className="space-y-3 border-t border-[var(--line)] pt-4">
            {selected.payStatus === "overdue" && (
              <p className="text-[var(--danger)] font-semibold">{t("warningOverdue")}</p>
            )}
            {selected.payStatus === "grace" && (
              <p className="text-[#c2410c] font-semibold">{t("warningGrace")}</p>
            )}
            {selected.payStatus === "ok" && (
              <p className="text-[var(--ok)] font-semibold">{t("valid")}</p>
            )}
            <button
              type="button"
              className="btn btn-primary w-full inline-flex items-center justify-center gap-2"
              disabled={loading}
              onClick={confirm}
            >
              {loading ? <Spinner /> : t("confirm")}
            </button>
          </div>
        )}

        {message && <p className="text-[var(--ok)] font-semibold">{message}</p>}
      </div>

      <div className="card p-5">
        <h2 className="font-display text-xl mb-3">{t("today")}</h2>
        {todayCheckIns.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">—</p>
        ) : (
          <ul className="space-y-2">
            {todayCheckIns.map((c) => (
              <li key={c.id} className="flex justify-between text-sm border-b border-[var(--line)] pb-2">
                <span className="font-semibold">{c.name}</span>
                <span className="text-[var(--muted)]">{c.time}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
