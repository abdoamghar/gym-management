import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/fr/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isApiAuth = pathname.startsWith("/api/auth");
      if (isApiAuth) return true;

      const localeMatch = pathname.match(/^\/(fr|ar)(\/|$)/);
      const pathWithoutLocale = localeMatch
        ? pathname.slice((localeMatch[1]?.length ?? 2) + 1) || "/"
        : pathname;

      const isLogin = pathWithoutLocale === "/login" || pathWithoutLocale.startsWith("/login/");
      if (isLogin) return true;

      if (pathname.startsWith("/api/")) {
        return !!auth;
      }

      return !!auth;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role?: string }).role;
        token.gymId = (user as { gymId?: string }).gymId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.gymId = token.gymId as string;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
