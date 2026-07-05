"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import type { ActionState } from "@/lib/actions/types";

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    // Rate limiting is enforced inside auth.ts's authorize() callback, which is
    // the single chokepoint shared by both this Server Action and the raw
    // /api/auth/callback/credentials endpoint.
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      fp: formData.get("fp"),
      fpBot: formData.get("fpBot"),
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, message: "بيانات الدخول غير صحيحة" };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
