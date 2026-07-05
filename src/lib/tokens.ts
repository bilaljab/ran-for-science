import { randomBytes, createHash } from "crypto";

/**
 * Single-use token pattern: the raw token is given to the user (in an email
 * link) and never stored; only its SHA-256 hash is persisted. A leaked
 * database alone is not enough to use a token — the attacker would also need
 * the raw value that only ever existed in the delivered email.
 */
export function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
