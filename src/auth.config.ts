import type { NextAuthConfig } from "next-auth";

// Edge-безопасная часть конфига (без bcrypt/prisma) — используется в middleware.
export const authConfig = {
  session: { strategy: "jwt" },
  trustHost: true, // за обратным прокси (Caddy)
  pages: { signIn: "/login" },
  providers: [], // реальный провайдер добавляется в auth.ts (Node-рантайм)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const loggedIn = !!auth?.user;
      if (nextUrl.pathname === "/login") {
        // залогиненного уводим с логина на дашборд
        return loggedIn ? Response.redirect(new URL("/", nextUrl)) : true;
      }
      return loggedIn; // всё остальное — только после входа
    },
  },
} satisfies NextAuthConfig;
