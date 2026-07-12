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
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    passwordChangedAt?: number;
    sessionVersion?: number;
  }
}
