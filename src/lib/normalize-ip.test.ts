import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeIp } from "./normalize-ip";

test("normalizeIp", () => {
  assert.equal(normalizeIp("203.0.113.9"), "203.0.113.9");
  assert.equal(normalizeIp("::1"), "0:0:0:0::");
  assert.equal(normalizeIp("2001:db8:1:2:3:4:5:6"), "2001:db8:1:2::");
  assert.equal(normalizeIp("2001:0DB8:0001:0002:aaaa:bbbb:cccc:dddd"), "2001:db8:1:2::");
  assert.equal(normalizeIp("2001:db8::5"), "2001:db8:0:0::");
  assert.equal(normalizeIp("2001:db8:1::"), "2001:db8:1:0::");
  assert.equal(normalizeIp("::ffff:192.0.2.128"), "192.0.2.128");
  assert.equal(normalizeIp("::ffff:c000:0280"), "192.0.2.128");
  assert.equal(normalizeIp("0:0:0:0:0:ffff:1.2.3.4"), "1.2.3.4");
  // A dotted-quad tail is two groups, not one.
  assert.equal(normalizeIp("1:2::5:6:7:1.2.3.4"), "1:2:0:5::");
  assert.equal(normalizeIp("::ffff:0:1.2.3.4"), "0:0:0:0::"); // SIIT, not IPv4-mapped
  // Two addresses in one /64 share a bucket; a different /64 does not.
  assert.equal(normalizeIp("2001:db8:1:2::1"), normalizeIp("2001:db8:1:2:ffff::9"));
  assert.notEqual(normalizeIp("2001:db8:1:2::1"), normalizeIp("2001:db8:1:3::1"));
});
