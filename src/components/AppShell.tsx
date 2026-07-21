"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { signOut } from "next-auth/react";
import { useState } from "react";

const links = [
  { href: "/", key: "dashboard" as const },
  { href: "/members", key: "members" as const },
  { href: "/renewals", key: "renewals" as const },
  { href: "/holidays", key: "holidays" as const },
  { href: "/broadcast", key: "broadcast" as const },
  { href: "/templates", key: "templates" as const },
  { href: "/settings", key: "settings" as const },
  { href: "/export", key: "export" as const },
];

export function AppShell({
  children,
  gymName,
}: {
  children: React.ReactNode;
  gymName: string;
}) {
  const t = useTranslations("nav");
  const tApp = useTranslations("app");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const locales = ["fr", "ar", "en"] as const;
  const currentIndex = locales.indexOf(locale as (typeof locales)[number]);
  const nextLocale = locales[(currentIndex + 1) % locales.length];

  return (
    <div className="app-shell min-h-screen flex flex-col md:flex-row">
      <aside
        className={`fixed inset-y-0 z-40 w-72 bg-[var(--bg-elevated)] border-e border-[var(--line)] p-5 transition-transform duration-200 md:static ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="mb-8">
          <p className="font-display text-2xl text-[var(--accent)]">{tApp("name")}</p>
          <p className="text-sm text-[var(--muted)] mt-1">{gymName}</p>
        </div>
        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--muted)] hover:bg-[#f3efe7] hover:text-[var(--ink)]"
                }`}
              >
                {t(link.key)}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 flex flex-col gap-2">
          <Link
            href={pathname}
            locale={nextLocale}
            className="btn btn-secondary w-full"
          >
            {nextLocale === "ar" ? tCommon("ar") : nextLocale === "en" ? tCommon("en") : tCommon("fr")}
          </Link>
          <button
            type="button"
            className="btn btn-secondary w-full"
            onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
          >
            {t("logout")}
          </button>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_90%,white)] backdrop-blur px-4 py-3 md:hidden">
          <button
            type="button"
            className="btn btn-secondary !min-h-10 !px-3"
            onClick={() => setOpen(true)}
          >
            ☰
          </button>
          <span className="font-display text-lg">{gymName}</span>
        </header>
        <main className="flex-1 p-4 md:p-8 w-full min-w-0">{children}</main>
      </div>
    </div>
  );
}
