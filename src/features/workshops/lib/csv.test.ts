import { test } from "node:test";
import assert from "node:assert/strict";
import { toCsv } from "./csv";

test("header and plain rows, CRLF separated", () => {
  assert.equal(toCsv(["a", "b"], [["1", "2"]]), "a,b\r\n1,2");
});

test("quotes cells containing comma, quote or newline", () => {
  assert.equal(toCsv(["x"], [["a,b"], ['say "hi"'], ["l1\nl2"]]), 'x\r\n"a,b"\r\n"say ""hi"""\r\n"l1\nl2"');
});

test("null, undefined and booleans", () => {
  assert.equal(toCsv(["a", "b", "c"], [[null, undefined, true]]), "a,b,c\r\n,,نعم");
});

test("numbers pass through untouched, including negatives", () => {
  assert.equal(toCsv(["n"], [[5], [-3]]), "n\r\n5\r\n-3");
});

test("property: no string cell is emitted starting with a formula trigger", () => {
  const triggers = ["=", "+", "-", "@", "\t", "\r"];
  for (const trigger of triggers) {
    for (let i = 0; i < 20; i++) {
      const payload = `${trigger}${Math.random().toString(36).slice(2)}`;
      const line = toCsv(["x"], [[payload]]).split("\r\n")[1]!;
      const cell = line.startsWith('"') ? line.slice(1) : line;
      assert.ok(!triggers.includes(cell[0]!), `formula trigger leaked: ${JSON.stringify(line)}`);
    }
  }
});
