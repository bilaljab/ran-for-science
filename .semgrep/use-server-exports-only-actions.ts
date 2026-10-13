"use server";

import { requireAdmin } from "@/lib/require-admin";

export type ActionResult = { success: boolean };

export interface ActionInput {
  id: string;
}

const PRIVATE_LIMIT = 10;

function privateHelper(n: number) {
  return n + PRIVATE_LIMIT;
}

// ruleid: use-server-exports-only-actions
export function syncExport(n: number) {
  return privateHelper(n);
}

// ruleid: use-server-exports-only-actions
export const LIMIT = 10;

// ruleid: use-server-exports-only-actions
export const initialState: ActionResult = { success: false };

// ruleid: use-server-exports-only-actions
export const syncArrow = (n: number) => n + 1;

// ruleid: use-server-exports-only-actions
export let counter = 0;

// ruleid: use-server-exports-only-actions
export class Helper {
  run() {
    return 1;
  }
}

// ok: use-server-exports-only-actions
export async function doThing(_input: ActionInput): Promise<ActionResult> {
  await requireAdmin();
  return { success: true };
}

// ok: use-server-exports-only-actions
export const doArrow = async (_input: ActionInput): Promise<ActionResult> => {
  await requireAdmin();
  return { success: true };
};

// ok: use-server-exports-only-actions
export const doFunctionExpression = async function (): Promise<ActionResult> {
  await requireAdmin();
  return { success: true };
};
