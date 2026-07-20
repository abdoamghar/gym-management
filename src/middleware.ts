import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { authConfig } from "./lib/auth.config";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const localeMatch = pathname.match(/^\/(fr|ar)(\/|$)/);
  const locale = localeMatch?.[1] ?? "fr";
  const pathWithoutLocale = localeMatch
    ? pathname.slice(locale.length + 1) || "/"
    : pathname;

  const isLogin =
    pathWithoutLocale === "/login" || pathWithoutLocale.startsWith("/login/");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isApi = pathname.startsWith("/api/");

  if (isApiAuth) {
    return NextResponse.next();
  }

  if (isApi) {
    if (!req.auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!req.auth && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  if (req.auth && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req as unknown as NextRequest);
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
