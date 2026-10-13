import { test } from "node:test";
import assert from "node:assert/strict";
import { attachmentDisposition } from "./content-disposition";

test("Arabic name gets an ASCII fallback plus a UTF-8 filename*", () => {
  const h = attachmentDisposition("سيرة ذاتية.pdf");
  assert.match(h, /^attachment; filename="[\x20-\x7e]+"; filename\*=UTF-8''%D8%B3/);
  assert.ok(h.endsWith(".pdf"));
});

test("quotes, CRLF and RFC 5987 reserved chars cannot break the header", () => {
  const h = attachmentDisposition('a"b\r\nc\'(d)*.pdf');
  assert.doesNotMatch(h, /[\r\n]/);
  assert.equal(h, "attachment; filename=\"a_b__c'(d)*.pdf\"; filename*=UTF-8''a%22b%0D%0Ac%27%28d%29%2A.pdf");
});
