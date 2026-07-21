"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { WhatsAppButton, CopyMessageButton } from "@/components/WhatsAppButton";
import { Spinner } from "@/components/ui";
import { useState } from "react";
import { logNotification } from "@/lib/actions";

type MemberRow = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  payStatus: string;
  payLabel: string;
  url: string;
  text: string;
};

export function BroadcastClient({
  members,
  audience,
  template,
}: {
  members: MemberRow[];
  audience: string;
  template: string;
}) {
  const t = useTranslations("broadcast");
  const router = useRouter();
  const [queue] = useState<MemberRow[]>(() => members);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const current = queue[index];

  async function next() {
    if (current) {
      setLoading(true);
      await logNotification(current.id, template === "payment_reminder" ? "payment_reminder" : "closure");
      setLoading(false);
    }
    if (index + 1 >= queue.length) {
      setDone(true);
      return;
    }
    setIndex(index + 1);
  }

  const audiences = [
    { value: "due", label: t("audienceDue") },
    { value: "expired", label: t("audienceExpired") },
    { value: "all", label: t("audienceAll") },
  ];

  const templates = [
    { value: "payment_reminder", label: t("templatePayment") },
    { value: "closure", label: t("templateClosure") },
  ];

  if (done) {
    return (
      <div className="card p-8 text-center space-y-4">
        <p className="text-4xl" aria-hidden>✅</p>
        <h2 className="font-display text-xl">{t("done")}</h2>
        <p className="text-[var(--muted)]">
          {t("sentCount", { count: queue.length })}
        </p>
      </div>
    );
  }

  if (!queue.length) {
    return (
      <div className="card p-8 text-center space-y-4">
        <p className="text-4xl" aria-hidden>👥</p>
        <h2 className="font-display text-xl">{t("empty")}</h2>
        <p className="text-[var(--muted)]">{t("emptyHint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Picker */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div>
          <label className="label">{t("audience")}</label>
          <select
            className="select"
            style={{ width: "auto" }}
            defaultValue={audience}
            onChange={(e) => {
              const a = e.target.value;
              router.push(`/broadcast?audience=${a}&template=${template}`);
            }}
          >
            {audiences.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t("template")}</label>
          <select
            className="select"
            style={{ width: "auto" }}
            defaultValue={template}
            onChange={(e) => {
              const tpl = e.target.value;
              router.push(`/broadcast?audience=${audience}&template=${tpl}`);
            }}
          >
            {templates.map((tpl) => (
              <option key={tpl.value} value={tpl.value}>{tpl.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Queue card */}
      <div className="card p-5 space-y-4 border-2 border-[var(--accent)]">
        <h2 className="font-display text-xl">{t("queueTitle")}</h2>
        <p className="text-[var(--muted)]">
          {t("progress", { current: index + 1, total: queue.length })} — {current.firstName} {current.lastName}
        </p>
        <div className="flex flex-wrap gap-2">
          <WhatsAppButton url={current.url} label={t("openWa")} />
          <CopyMessageButton text={current.text} />
          <button
            type="button"
            className="btn btn-primary inline-flex items-center gap-2"
            disabled={loading}
            onClick={next}
          >
            {loading ? <Spinner /> : index + 1 >= queue.length ? t("done") : t("next")}
          </button>
        </div>
      </div>
    </div>
  );
}