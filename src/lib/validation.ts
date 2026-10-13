import { z } from "zod";

// Prisma's cuid()/cuid2 ids are lowercase alphanumeric with no separators.
// This isn't an exact-format check (the shape has changed across Prisma
// versions and shouldn't be relied on precisely) — it's just enough to
// reject obviously-malformed input (empty strings, path fragments, huge
// payloads, SQL/NoSQL-operator-looking strings) before it reaches the
// database, instead of letting Prisma throw an uncaught error for a
// not-found id.
export const idSchema = z.string().trim().min(1).max(64).regex(/^[a-z0-9]+$/i, "Invalid id");

// Postgres text columns can't store U+0000: the insert throws "invalid byte
// sequence for encoding UTF8: 0x00" (an unhandled 500). Zod's string checks
// accept it, so every free-text field in a public schema chains
// `.refine(noNul, NO_NUL_MESSAGE)`.
export const noNul = (value: string) => !value.includes("\u0000");
export const NO_NUL_MESSAGE = "Invalid characters";
