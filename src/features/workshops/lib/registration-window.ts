// Submissions are accepted slightly after `closesAt` so a student who loaded
// the form just before the window ended isn't rejected mid-typing.
export const SUBMIT_GRACE_MS = 30_000;

export type RegistrationState = "not_opened" | "open" | "closed";

interface RegistrationWindow {
  opensAt: Date | null;
  closesAt: Date | null;
}

export function getRegistrationState(
  { opensAt, closesAt }: RegistrationWindow,
  now: Date,
  graceMs = 0
): RegistrationState {
  if (!opensAt || !closesAt || now < opensAt) return "not_opened";
  return now.getTime() <= closesAt.getTime() + graceMs ? "open" : "closed";
}
