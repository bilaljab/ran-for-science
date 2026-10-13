import assert from "node:assert/strict";
import { test } from "node:test";
import { lockMsFor } from "./lockout-tiers";

test("lockMsFor", () => {
  const MIN = 60 * 1000;
  const counts = [4, 5, 8, 12, 20, 500];
  // Uncapped (email+ip, bare ip): escalates through every tier.
  assert.deepEqual(counts.map((n) => lockMsFor(n)), [0, MIN, 5 * MIN, 30 * MIN, 60 * MIN, 60 * MIN]);
  // Capped (account-wide email key): still triggers at 5, never exceeds 60s.
  assert.deepEqual(counts.map((n) => lockMsFor(n, MIN)), [0, MIN, MIN, MIN, MIN, MIN]);
});
