/**
 * RFC 6266 / 5987 attachment header: an ASCII `filename` fallback for old
 * clients plus `filename*` carrying the real UTF-8 name, so Arabic names
 * save as Arabic instead of literal %D8%A7... (a bare encodeURIComponent in
 * `filename=` is not decoded by browsers).
 */
export function attachmentDisposition(name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]|["\\%;]/g, "_");
  // encodeURIComponent leaves ' ( ) * unescaped, which RFC 5987 attr-char forbids.
  const encoded = encodeURIComponent(name).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
