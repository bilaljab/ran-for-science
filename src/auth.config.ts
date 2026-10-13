import type { NextAuthConfig } from "next-auth";

const isProduction = process.env.NODE_ENV === "production";

/** Absolute admin session lifetime (seconds), measured from sign-in. */
export const ADMIN_SESSION_MAX_AGE_S = 8 * 60 * 60;

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    // Sliding window only: @auth/core's JWT branch re-signs the cookie with a
    // fresh expiry on EVERY session read and ignores updateAge (that throttle
    // is database-strategy only). The hard 8h cap is `authTime`, checked in
    // require-admin.ts.
    maxAge: ADMIN_SESSION_MAX_AGE_S,
  },
  // Explicit rather than relying on NextAuth's implicit defaults.
  cookies: {
    sessionToken: {
      name: isProduction ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },
  providers: [],
  callbacks: {
    // No `authorized` callback here: it only applies to NextAuth's own
    // middleware wrapper, and src/proxy.ts deliberately never calls
    // NextAuth's `auth()` at all (see the comment there — a second NextAuth
    // instance in middleware raced against this one's JWT rotation and
    // could clear a valid session cookie mid-request). The real /admin/*
    // gate is a cheap cookie-presence check in proxy.ts; the actual
    // cryptographically-verified check happens in every page/action via
    // getValidAdminSession()/requireAdmin(), which use this config's `auth`
    // export from auth.ts.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.passwordChangedAt = user.passwordChangedAt;
        token.sessionVersion = user.sessionVersion;
        token.authTime = Date.now(); // sign-in only, never refreshed (see require-admin.ts)
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.passwordChangedAt = token.passwordChangedAt as number | undefined;
        session.user.sessionVersion = token.sessionVersion as number | undefined;
        session.user.authTime = token.authTime as number | undefined;
      }
      return session;
    },
  },
};
