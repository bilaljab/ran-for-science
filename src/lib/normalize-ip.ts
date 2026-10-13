import { isIP } from "net";

/**
 * Collapses an IPv6 address to its /64 network (first four groups, e.g.
 * "2001:db8:1:2::") — a single subscriber typically owns a whole /64, so the
 * exact address is a free rotation vector for rate limits. IPv4-mapped IPv6
 * (::ffff:a.b.c.d) becomes the plain IPv4. IPv4 passes through. Input must
 * already have passed isIP().
 */
export function normalizeIp(ip: string): string {
  if (isIP(ip) !== 6) return ip;
  // Drop the zone id, and rewrite a dotted-quad tail (::ffff:1.2.3.4) as its
  // two hex groups so every group below is positional.
  const addr = ip
    .split("%")[0]
    .toLowerCase()
    .replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)$/, (_, a, b, c, d) =>
      `${((+a << 8) | +b).toString(16)}:${((+c << 8) | +d).toString(16)}`
    );

  // Expand "::" so the first four groups are positional.
  const [head, tail] = addr.split("::");
  const headGroups = head ? head.split(":") : [];
  const tailGroups = tail ? tail.split(":") : [];
  const groups =
    tail === undefined
      ? headGroups
      : [...headGroups, ...Array(8 - headGroups.length - tailGroups.length).fill("0"), ...tailGroups];
  // Hex-mapped form (::ffff:c000:0280) = IPv4 in the last 32 bits.
  if (groups.slice(0, 5).every((g) => Number.parseInt(g, 16) === 0) && groups[5] === "ffff") {
    const hi = Number.parseInt(groups[6], 16);
    const lo = Number.parseInt(groups[7], 16);
    return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  }
  return `${groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, "")).join(":")}::`;
}
