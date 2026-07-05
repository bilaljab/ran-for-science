import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const handleIntlRouting = createMiddleware(routing);

// Pages that must stay reachable without a session (pre-login / account-recovery flows).
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password", "/admin/reset-password", "/admin/verify-email"];

// Matches auth.config.ts's cookie name logic (prod uses the __Secure- prefix).
const SESSION_COOKIE_NAMES = ["__Secure-authjs.session-token", "authjs.session-token"];

// Deliberately does NOT call NextAuth's `auth()` wrapper here. An earlier
// version did, via a second `NextAuth(authConfig)` instance — but that
// caused this middleware's own session-fetch/JWT-rotation logic to race
// against the "real" auth.ts instance's rotation inside the same request
// (most visibly on Server Action POSTs), where one would issue a refreshed
// session cookie and the other would issue a conflicting `Max-Age=0`
// clear-cookie in the very same response, silently logging an admin out
// mid-action. A cheap presence-only check avoids ever decoding/rotating the
// JWT at this layer at all. This is NOT full verification (a forged/expired
// cookie value still passes) — that's fine, since the real,
// cryptographically-verified check already happens in every page/action via
// getValidAdminSession()/requireAdmin(); this is only the outer "is there
// even a session" fast-fail, exactly as it always was meant to be.
export default function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some((path) => req.nextUrl.pathname.startsWith(path));
    const hasSessionCookie = SESSION_COOKIE_NAMES.some((name) => req.cookies.has(name));
    if (!isPublicAdminPath && !hasSessionCookie) {
      const loginUrl = new URL("/admin/login", req.nextUrl.origin);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }
  return handleIntlRouting(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
