import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { noNul, NO_NUL_MESSAGE } from "./validation";

test("noNul rejects NUL bytes, keeps Arabic and optional chains working", () => {
  const schema = z.string().trim().max(10).refine(noNul, NO_NUL_MESSAGE).optional().or(z.literal(""));
  assert.equal(schema.safeParse("a\u0000b").success, false);
  assert.equal(schema.safeParse("سلام").success, true);
  assert.equal(schema.safeParse("").success, true);
});
