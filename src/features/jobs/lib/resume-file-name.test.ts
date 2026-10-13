import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeResumeFileName } from "./resume-file-name";

test("forces extension to detected type", () => {
  assert.equal(sanitizeResumeFileName("cv.exe", ".pdf"), "cv.pdf");
  assert.equal(sanitizeResumeFileName("cv", ".docx"), "cv.docx");
  assert.equal(sanitizeResumeFileName("J.Smith resume", ".pdf"), "J.Smith resume.pdf");
});

test("strips separators, control and bidi chars", () => {
  assert.equal(sanitizeResumeFileName("..\\..\\a/b\r\n‮fdp.exe", ".pdf"), "abfdp.pdf");
});

test("strips zero-width, ALM and line-separator chars; truncates by code point", () => {
  assert.equal(sanitizeResumeFileName("a\u061Cb\u200Bc\u200Fd\u2028e\u2029f\uFEFFg", ".pdf"), "abcdefg.pdf");
  assert.equal(sanitizeResumeFileName("\u{1F600}".repeat(250), ".pdf"), "\u{1F600}".repeat(200) + ".pdf");
});

test("falls back and keeps Arabic names", () => {
  assert.equal(sanitizeResumeFileName("...", ".pdf"), "resume.pdf");
  assert.equal(sanitizeResumeFileName("سيرة ذاتية.doc", ".pdf"), "سيرة ذاتية.pdf");
});
