import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    passwordChangedAt?: number;
  }

  interface Session {
    user: {
      id: string;
      passwordChangedAt?: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    passwordChangedAt?: number;
  }
}
