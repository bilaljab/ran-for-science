import bcrypt from "bcryptjs";

// OWASP currently recommends a bcrypt cost factor of at least 12.
const BCRYPT_COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// A precomputed hash of an arbitrary fixed string (cost 12, matching real
// hashes). Used only so that a login attempt against a *non-existent* email
// still runs a real bcrypt compare, taking roughly the same time as one
// against a real account. Without this, "unknown email" would return
// instantly while "known email, wrong password" takes ~100ms+, letting an
// attacker enumerate valid admin emails purely from response timing.
export const DUMMY_PASSWORD_HASH = "$2b$12$P4AyEi9eLmYRR7LGJn0druYxyYkd4aQRlGIAy09E4dqss3Pw5u6J.";
