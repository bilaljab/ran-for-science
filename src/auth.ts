import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyPassword, DUMMY_PASSWORD_HASH } from "@/lib/password";
import { verifyTwoFactorCode } from "@/lib/mfa";
import { getLockoutRemainingMs, recordLoginFailure, recordLoginSuccess } from "@/lib/login-attempts";
import { logAbuseEvent } from "@/lib/abuse-log";
import { isKnownBadFingerprint, recordSuspiciousFingerprint } from "@/lib/fingerprint";

// Deliberately higher than login-attempts.ts's fingerprint-escalation
// threshold (8): this fixed-window limiter and the progressive lockout in
// login-attempts.ts key off the same ~15-minute window, and this check runs
// BEFORE recordLoginFailure is ever called. If this limit were <= 8, every
// attempt past it would be rejected here first, and recordLoginFailure's
// failure counter could never reach 8 — silently making that escalation
// tier unreachable. This is the coarse backstop ceiling; the escalating
// per-tier lockouts in login-attempts.ts are the primary defense.
const LOGIN_LIMIT = 12;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mfaCode: { label: "Verification code", type: "text" },
        fp: { label: "Device fingerprint", type: "text" },
        fpBot: { label: "Automation flag", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        const mfaCode = credentials?.mfaCode;
        const fp = typeof credentials?.fp === "string" ? credentials.fp : undefined;

        // Reject malformed/oversized credentials up front, before they're
        // used to build any rate-limit/lockout key or reach the database/bcrypt.
        // bcrypt itself silently truncates its input at 72 bytes, so an
        // unbounded string wouldn't change hashing cost — but left unchecked
        // it would still let an attacker mint unlimited distinct keys (one
        // per garbage "email") and bypass the per-account limiter.
        if (
          typeof email !== "string" ||
          typeof password !== "string" ||
          email.length === 0 ||
          email.length > 255 ||
          password.length === 0 ||
          password.length > 200 ||
          (typeof mfaCode === "string" && mfaCode.length > 0 && !/^\d{6}$/.test(mfaCode))
        ) {
          return null;
        }

        const ip = await getClientIp();
        const normalizedEmail = email.toLowerCase();

        // navigator.webdriver === true has an extremely low false-positive
        // rate for real users (essentially only set by Selenium/Playwright/
        // Puppeteer's default automation profile) — treat it as an instant,
        // high-confidence reject and escalate the fingerprint immediately,
        // rather than just feeding it into the softer signal-based checks.
        if (credentials?.fpBot === "1") {
          logAbuseEvent({ type: "webdriver_detected", ip, detail: `login email=${normalizedEmail}` });
          if (fp) void recordSuspiciousFingerprint(fp, "ADMIN", "webdriver_detected login");
          return null;
        }

        // Cheapest, highest-confidence check first: a device already flagged
        // by a prior lockout (possibly from a different IP) is rejected
        // immediately, before touching the rate-limiter/DB. Scoped to ADMIN —
        // a block earned on the public contact/quote/apply forms must never
        // lock an admin out of their own login, and vice versa.
        if (await isKnownBadFingerprint(fp, "ADMIN")) {
          logAbuseEvent({ type: "login_rejected_known_bad_fingerprint", ip, detail: `email=${normalizedEmail}` });
          return null;
        }

        // Three independent layers, each defending against a different
        // attack shape:
        //   - fixed-window ip+email limit: brute force against one account
        //     from one source.
        //   - progressive account lockout (by email): credential stuffing —
        //     the same account hammered from many rotating IPs, which a
        //     per-IP limiter alone would never see coming from one source.
        //   - progressive IP lockout (by bare IP): password spraying — many
        //     different accounts hammered from one source, which a per-
        //     ip+email limiter alone would never trip since each account
        //     only sees one or two attempts.
        const emailLockKey = `login-email:${normalizedEmail}`;
        const ipLockKey = `login-ip:${ip}`;

        const lockedMs = Math.max(getLockoutRemainingMs(emailLockKey), getLockoutRemainingMs(ipLockKey));
        if (lockedMs > 0) {
          logAbuseEvent({ type: "login_rejected_locked", ip, detail: `email=${normalizedEmail}` });
          return null;
        }

        const rateLimitKey = `login:${ip}:${normalizedEmail}`;
        if (!checkRateLimit(rateLimitKey, LOGIN_LIMIT, LOGIN_WINDOW_MS, { ip, source: "login", scope: "ADMIN" })) {
          console.warn(`[auth] rate limit exceeded for login attempt from ip=${ip} email=${email}`);
          return null;
        }

        const admin = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } });

        // Always run a real bcrypt compare, even when the account doesn't
        // exist, against a fixed dummy hash — otherwise "unknown email"
        // returns near-instantly while "known email, wrong password" takes
        // ~100ms+, letting an attacker enumerate valid admin emails purely
        // from response timing.
        const isValid = await verifyPassword(password, admin?.passwordHash ?? DUMMY_PASSWORD_HASH);

        if (!admin) {
          console.warn(`[auth] failed login attempt (unknown email) from ip=${ip}`);
          recordLoginFailure(ipLockKey, ip, "ip-spray", fp);
          return null;
        }

        if (!isValid) {
          console.warn(`[auth] failed login attempt (bad password) from ip=${ip} email=${email}`);
          recordLoginFailure(emailLockKey, ip, `account email=${normalizedEmail}`, fp);
          recordLoginFailure(ipLockKey, ip, "ip-spray", fp);
          return null;
        }

        if (!admin.emailVerified) {
          console.warn(`[auth] login blocked (email not verified) for ip=${ip} email=${email}`);
          recordLoginFailure(emailLockKey, ip, `account email=${normalizedEmail}`, fp);
          recordLoginFailure(ipLockKey, ip, "ip-spray", fp);
          return null;
        }

        if (admin.twoFactorEnabled) {
          const isCodeValid =
            admin.twoFactorSecret && typeof mfaCode === "string"
              ? await verifyTwoFactorCode(admin.twoFactorSecret, mfaCode)
              : false;
          if (!isCodeValid) {
            console.warn(`[auth] login blocked (invalid/missing MFA code) for ip=${ip} email=${email}`);
            recordLoginFailure(emailLockKey, ip, `account email=${normalizedEmail}`, fp);
            recordLoginFailure(ipLockKey, ip, "ip-spray", fp);
            return null;
          }
        }

        recordLoginSuccess(emailLockKey);
        recordLoginSuccess(ipLockKey);

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          passwordChangedAt: admin.passwordChangedAt.getTime(),
        };
      },
    }),
  ],
});
