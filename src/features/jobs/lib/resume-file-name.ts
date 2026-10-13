// Display name stored with an application. The base name is the user's, but
// the extension is forced to the DETECTED file type so a client can't label a
// .docx as ".exe" (or anything else) in the admin's download dialog.
export function sanitizeResumeFileName(raw: string, ext: string): string {
  const cleaned = raw
    // control, zero-width space, ALM/LRM/RLM, line/paragraph separators, BOM + bidi-override
    // chars (ZWNJ/ZWJ U+200C-D are kept: Persian words and emoji need them)
    .replace(/[\u0000-\u001F\u007F\u061C\u200B\u200E\u200F\u2028\u2029\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
    .replace(/[\\/]/g, "") // path separators
    .replace(/\.[a-z0-9]{1,5}$/i, "") // one trailing extension; "J.Smith cv" keeps its dot
    .replace(/^\.+/, "")
    .trim();
  // By code points, not UTF-16 units: .slice(0, 200) could cut a surrogate pair in half.
  const base = Array.from(cleaned).slice(0, 200).join("");
  return `${base || "resume"}${ext}`;
}
