"use client";

import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { FormEvent, useState } from "react";
import { Link } from "@/i18n/routing";
import { Spinner } from "@/components/ui";

export default function LoginPage() {
  const t = useTranslations("login");
  const tCommon = useTranslations("common");
  const tApp = useTranslations("app");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(true);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  const locales = ["fr", "ar", "en"] as const;
  const currentIndex = locales.indexOf(locale as (typeof locales)[number]);
  const nextLocale = locales[(currentIndex + 1) % locales.length];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="font-display text-3xl text-[var(--accent)]">{tApp("name")}</h1>
            <p className="text-[var(--muted)] mt-1">{tApp("tagline")}</p>
          </div>
          <Link href="/login" locale={nextLocale} className="btn btn-secondary !min-h-9 !px-3 text-sm">
            {nextLocale === "ar" ? tCommon("ar") : nextLocale === "en" ? tCommon("en") : tCommon("fr")}
          </Link>
        </div>
        <h2 className="text-xl font-semibold mb-4">{t("title")}</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="email">
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input"
              defaultValue="admin@gym.ma"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              {t("password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input"
              defaultValue="admin123"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-[var(--danger)] text-sm">{t("error")}</p>}
          <button type="submit" className="btn btn-primary inline-flex items-center justify-center gap-2" disabled={loading}>
            {loading ? <Spinner /> : t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
