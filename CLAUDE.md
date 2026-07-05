@AGENTS.md
@README.md

## Commands

- `npm run dev` — start dev server (Turbopack)
- `npm run build` — production build (also type-checks via `next build`)
- `npx tsc --noEmit` — type-check only
- `npx eslint .` — lint
- `npx prisma migrate dev` — apply/create a migration locally
- `npx prisma db seed` — seed local dev DB only (hard-blocked when `NODE_ENV=production`)

No automated test suite exists. Verify changes with `tsc --noEmit` + `eslint .` + `npm run build`, then a manual smoke test against the running dev server. Playwright is not an installed dependency — if a task genuinely needs it, install it, run the check, and uninstall it again afterward rather than leaving it in `package.json`.

## Architecture conventions

- Path alias `@/*` → `src/*`.
- Feature-based folders under `src/features/<feature>/` (`actions/`, `components/`, `constants/`, `data/`, `validations/`) for the public-facing features (contact, jobs, quotes). Cross-cutting/shared code lives in `src/lib/` and `src/components/`.
- Server Actions return a shared `ActionState` shape (`src/lib/actions/types.ts`) consumed via `useActionState`; validation is Zod schemas under each feature's `validations/`.
- Prisma client is generated to `src/generated/prisma` (not `node_modules`), gitignored — run `npx prisma generate` (or any `migrate`/`db` command, which runs it automatically) after pulling schema changes before TypeScript will resolve it.
- Admin routes (`src/app/admin/**`) are intentionally **not** locale-prefixed (Arabic-only UI); public routes (`src/app/[locale]/**`) are bilingual via `next-intl` (`ar` default/unprefixed, `en` at `/en`, `localePrefix: "as-needed"`).
- Admin auth check: use `getValidAdminSession()` / `requireAdmin()` from `src/lib/require-admin.ts` (DB-verified) — never `auth()` from `src/auth.ts` directly in admin routes/API handlers; that was a real bypass bug fixed earlier in this project.

## Security/anti-abuse conventions (don't accidentally weaken these)

- Public forms (contact, quote request, job application) each carry: a honeypot field named `website` (deliberately generic, not `honeypot`), a `formRenderedAt` timing-trap field (`FormTimingGuard` component — must stay effect-based, not a lazy `useState` initializer, or SSR hydration keeps a stale timestamp), an `fp`/`fpBot` browser-fingerprint pair (`BrowserFingerprint` component), and Cloudflare Turnstile. Any new public form should follow the same pattern.
- `document.prerendering`/`prerenderingchange` gating in `FormTimingGuard` exists specifically so the Speculation Rules prerendering in `src/app/[locale]/layout.tsx` can't be used to start the timing-trap clock early — keep both changes in sync if either is touched.
- CSP/security headers live in `next.config.ts`, not in a middleware or meta tag — add new third-party origins there.
- Resume storage: local disk in dev, Cloudflare R2 in production, switched automatically based on whether `R2_*` env vars are set (`src/lib/storage.ts`). Don't assume either backend — check `storage.ts`.
- Token flows (password reset, email verification) use an atomic `updateMany({ where: { usedAt: null, ... }, data: { usedAt: now } })` claim *before* any slow operation (bcrypt hashing), not a `findUnique`-then-check — this avoids a TOCTOU race that was previously exploitable. Follow the same pattern for any new one-time-token flow.

## Environment

See `.env.example` for the full list. `NEXTAUTH_URL` doubles as the canonical base URL used to build absolute links in emails — keep it correct per environment, not just for NextAuth's own use.

## Windows dev environment notes

- Git Bash's `/tmp` is invisible to natively-installed Windows Python — write scratch files a script needs to read into the project directory (or the actual OS scratchpad dir) instead.
- `git config core.autocrlf=true` (common Windows default) will corrupt checksum verification of freshly cloned repos (LF→CRLF rewrite on checkout). Re-clone with `-c core.autocrlf=false` when verifying file hashes.
