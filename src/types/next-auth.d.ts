import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    passwordChangedAt?: number;
    sessionVersion?: number;
  }

  interface Session {
    user: {
      id: string;
      passwordChangedAt?: number;
      sessionVersion?: number;
      authTime?: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    passwordChangedAt?: number;
    sessionVersion?: number;
    authTime?: number;
  }
}
