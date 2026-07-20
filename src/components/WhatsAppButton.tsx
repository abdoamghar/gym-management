"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function WhatsAppButton({
  url,
  label,
  onOpened,
}: {
  url: string;
  label?: string;
  onOpened?: () => void;
}) {
  const t = useTranslations("dashboard");
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-wa"
      onClick={() => onOpened?.()}
    >
      {label || t("remind")}
    </a>
  );
}

export function CopyMessageButton({ text }: { text: string }) {
  const t = useTranslations("holidays");
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "✓" : t("copy")}
    </button>
  );
}
