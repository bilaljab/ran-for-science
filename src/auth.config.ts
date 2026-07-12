import type { NextAuthConfig } from "next-auth";

const isProduction = process.env.NODE_ENV === "production";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours — admin sessions shouldn't outlive a workday
    updateAge: 60 * 60, // refresh the cookie at most once per hour of activity
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
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.passwordChangedAt = token.passwordChangedAt as number | undefined;
        session.user.sessionVersion = token.sessionVersion as number | undefined;
      }
      return session;
    },
  },
};
