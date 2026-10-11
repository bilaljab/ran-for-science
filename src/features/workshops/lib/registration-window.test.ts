import { test } from "node:test";
import assert from "node:assert/strict";
import { getRegistrationState, SUBMIT_GRACE_MS } from "./registration-window";

const t = (iso: string) => new Date(iso);
const window = { opensAt: t("2026-01-01T10:00:00Z"), closesAt: t("2026-01-01T10:10:00Z") };

test("never opened: both dates null", () => {
  assert.equal(getRegistrationState({ opensAt: null, closesAt: null }, t("2026-01-01T10:05:00Z")), "not_opened");
});

test("only one date set is treated as not opened", () => {
  assert.equal(getRegistrationState({ opensAt: window.opensAt, closesAt: null }, t("2026-01-01T10:05:00Z")), "not_opened");
});

test("before opensAt", () => {
  assert.equal(getRegistrationState(window, t("2026-01-01T09:59:59Z")), "not_opened");
});

test("boundaries are inclusive", () => {
  assert.equal(getRegistrationState(window, t("2026-01-01T10:00:00Z")), "open");
  assert.equal(getRegistrationState(window, t("2026-01-01T10:10:00Z")), "open");
});

test("after closesAt without grace", () => {
  assert.equal(getRegistrationState(window, t("2026-01-01T10:10:01Z")), "closed");
});

test("grace extends the close boundary only", () => {
  const justInside = new Date(window.closesAt.getTime() + SUBMIT_GRACE_MS);
  const justOutside = new Date(window.closesAt.getTime() + SUBMIT_GRACE_MS + 1);
  assert.equal(getRegistrationState(window, justInside, SUBMIT_GRACE_MS), "open");
  assert.equal(getRegistrationState(window, justOutside, SUBMIT_GRACE_MS), "closed");
  assert.equal(getRegistrationState(window, t("2026-01-01T09:59:59Z"), SUBMIT_GRACE_MS), "not_opened");
});

test("property: open <=> opensAt <= now <= closesAt + grace", () => {
  const start = window.opensAt.getTime();
  for (let i = 0; i < 500; i++) {
    const now = new Date(start + Math.floor((Math.random() - 0.3) * 20 * 60_000));
    const grace = Math.random() < 0.5 ? 0 : SUBMIT_GRACE_MS;
    const expectOpen = now >= window.opensAt && now.getTime() <= window.closesAt.getTime() + grace;
    assert.equal(getRegistrationState(window, now, grace) === "open", expectOpen);
  }
});
