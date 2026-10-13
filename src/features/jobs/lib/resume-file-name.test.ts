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

test("falls back and keeps Arabic names", () => {
  assert.equal(sanitizeResumeFileName("...", ".pdf"), "resume.pdf");
  assert.equal(sanitizeResumeFileName("سيرة ذاتية.doc", ".pdf"), "سيرة ذاتية.pdf");
});
