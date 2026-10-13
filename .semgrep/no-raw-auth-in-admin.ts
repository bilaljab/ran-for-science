import { auth, signOut } from "@/auth";
import { auth as nextAuth } from "@/auth";
import { requireAdmin, getValidAdminSession } from "@/lib/require-admin";

export async function rawAuthInAction() {
  // ruleid: no-raw-auth-in-admin
  const session = await auth();
  return session;
}

export async function rawAuthInCondition() {
  // ruleid: no-raw-auth-in-admin
  if (!(await auth())?.user) {
    throw new Error("Unauthorized");
  }
}

export const rawAuthInArrow = async () => {
  // ruleid: no-raw-auth-in-admin
  return auth();
};

export async function validatedSession() {
  // ok: no-raw-auth-in-admin
  const session = await getValidAdminSession();
  return session;
}

export async function validatedRequire() {
  // ok: no-raw-auth-in-admin
  await requireAdmin();
}

export async function logout() {
  // ok: no-raw-auth-in-admin
  await signOut({ redirectTo: "/admin/login" });
}

export function unrelatedAuthLookalike(helper: { auth: () => string }) {
  // ok: no-raw-auth-in-admin
  return helper.auth();
}

export async function aliasedRawAuth() {
  // ruleid: no-raw-auth-in-admin
  return nextAuth();
}
