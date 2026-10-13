// Display name stored with an application. The base name is the user's, but
// the extension is forced to the DETECTED file type so a client can't label a
// .docx as ".exe" (or anything else) in the admin's download dialog.
export function sanitizeResumeFileName(raw: string, ext: string): string {
  const base = raw
    .replace(/[\u0000-\u001F\u007F‎‏‪-‮⁦-⁩]/g, "") // control + bidi-override chars
    .replace(/[\\/]/g, "") // path separators
    .replace(/\.[a-z0-9]{1,5}$/i, "") // one trailing extension; "J.Smith cv" keeps its dot
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 200);
  return `${base || "resume"}${ext}`;
}
