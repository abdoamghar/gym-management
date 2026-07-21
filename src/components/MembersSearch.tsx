"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export function MembersSearch({
  initialQuery,
  initialStatus,
}: {
  initialQuery: string;
  initialStatus: string;
}) {
  const t = useTranslations("members");
  const tStatus = useTranslations("status");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);

  // Restore focus after navigation (server component re-renders this client
  // component fresh, so we need to refocus the input).
  useEffect(() => {
    inputRef.current?.focus();
    const len = inputRef.current?.value.length ?? 0;
    inputRef.current?.setSelectionRange(len, len);
  }, []);

  // Debounced query -> URL update
  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set("q", query.trim());
      } else {
        params.delete("q");
      }
      if (status && status !== "ALL") {
        params.set("status", status);
      } else {
        params.delete("status");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status]);

  return (
    <form
      className="card p-4 grid gap-3"
      style={{ gridTemplateColumns: "1fr auto" }}
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("search")}
        className="input"
        style={{ width: "100%", minWidth: 0 }}
        aria-label={t("search")}
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="select"
        style={{ width: "auto", minWidth: "8rem" }}
        aria-label={t("allStatuses")}
      >
        <option value="ALL">{t("allStatuses")}</option>
        <option value="ACTIVE">{tStatus("ACTIVE")}</option>
        <option value="FROZEN">{tStatus("FROZEN")}</option>
        <option value="EXPIRED">{tStatus("EXPIRED")}</option>
        <option value="CANCELLED">{tStatus("CANCELLED")}</option>
      </select>
    </form>
  );
}
