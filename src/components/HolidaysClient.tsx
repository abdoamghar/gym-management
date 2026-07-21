"use client";

import { createHoliday, deleteHoliday, markHolidayNotified, logNotification } from "@/lib/actions";
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import { WhatsAppButton, CopyMessageButton } from "@/components/WhatsAppButton";
import { Spinner } from "@/components/ui";
import { EmptyState } from "@/components/EmptyState";

type HolidayRow = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  messageSentAt: string | null;
};

type QueueItem = {
  memberId: string;
  name: string;
  url: string;
  text: string;
};

export function HolidaysClient({
  holidays,
  buildQueue,
}: {
  holidays: HolidayRow[];
  buildQueue: Record<string, QueueItem[]>;
}) {
  const t = useTranslations("holidays");
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [activeHolidayId, setActiveHolidayId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await createHoliday(new FormData(e.currentTarget));
    setLoading(false);
    e.currentTarget.reset();
  }

  function startNotify(holidayId: string) {
    const items = buildQueue[holidayId] || [];
    setQueue(items);
    setIndex(0);
    setActiveHolidayId(holidayId);
  }

  async function next() {
    if (!queue) return;
    const current = queue[index];
    if (current) {
      await logNotification(current.memberId, "closure");
    }
    if (index + 1 >= queue.length) {
      if (activeHolidayId) await markHolidayNotified(activeHolidayId);
      setQueue(null);
      setIndex(0);
      setActiveHolidayId(null);
      return;
    }
    setIndex(index + 1);
  }

  const current = queue?.[index];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">{t("title")}</h1>

      <form onSubmit={onCreate} className="card p-5 grid sm:grid-cols-2 gap-3 max-w-2xl">
        <div className="sm:col-span-2">
          <label className="label">{t("holidayTitle")}</label>
          <input name="title" required className="input" />
        </div>
        <div>
          <label className="label">{t("startDate")}</label>
          <input name="startDate" type="date" required className="input" />
        </div>
        <div>
          <label className="label">{t("endDate")}</label>
          <input name="endDate" type="date" required className="input" />
        </div>
        <button type="submit" className="btn btn-primary sm:col-span-2 inline-flex items-center gap-2" disabled={loading}>
          {loading ? <Spinner /> : t("add")}
        </button>
      </form>

      {queue && current ? (
        <div className="card p-5 space-y-4 border-2 border-[var(--accent)]">
          <h2 className="font-display text-xl">{t("notifyQueue")}</h2>
          <p className="text-[var(--muted)]">
            {t("progress", { current: index + 1, total: queue.length })} — {current.name}
          </p>
          <div className="flex flex-wrap gap-2">
            <WhatsAppButton url={current.url} label={t("openWa")} />
            <CopyMessageButton text={current.text} />
            <button type="button" className="btn btn-primary inline-flex items-center gap-2" onClick={next}>
              {index + 1 >= queue.length ? t("done") : t("next")}
            </button>
          </div>
        </div>
      ) : null}

      {holidays.length === 0 ? (
        <EmptyState icon="📅" title={t("noHolidays")} hint={t("emptyHolidaysHint")} />
      ) : (
        <ul className="space-y-3">
          {holidays.map((h) => (
            <li key={h.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-lg">{h.title}</p>
                <p className="text-sm text-[var(--muted)]">
                  {h.startDate} <span aria-hidden className="mx-1">→</span> {h.endDate}
                  {h.messageSentAt ? <span className="ms-2 badge badge-ok">✓ {h.messageSentAt}</span> : null}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-wa"
                  onClick={() => startNotify(h.id)}
                >
                  {t("notify")}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={async () => {
                    await deleteHoliday(h.id);
                  }}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
