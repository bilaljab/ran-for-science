@AGENTS.md
@README.md

## 1. Project Overview

- Bilingual (Arabic default `/`, English `/en`) corporate site + admin dashboard for RAN For Science
- Connects job seekers with companies in scientific/environmental/industrial/health fields; also sells paid consulting/compliance services
- Public marketing site (`src/app/[locale]/**`) is fully bilingual; admin dashboard (`src/app/admin/**`) is Arabic-only, not locale-prefixed
- No automated test suite — verification is `tsc --noEmit` + `eslint .` + `npm run build` + manual smoke test

## 2. Tech Stack

- Next.js 16.2.9 (App Router) · React 19.2.4 / react-dom 19.2.4 · TypeScript 5.9.3 (strict)
- Tailwind CSS v4 (`^4`) · next-intl 4.13.1 · framer-motion 12.42.2 · zod 4.4.3
- Prisma 7.8.0 + `@prisma/client` 7.8.0 + `@prisma/adapter-pg` 7.8.0 · PostgreSQL
- next-auth (Auth.js) `5.0.0-beta.31` · Sentry (`@sentry/nextjs` 10.65.0) · pino 10.3.1
- Resend 6.16.0 (email) · AWS SDK S3 client (Cloudflare R2 storage) · Cloudflare Turnstile

⚠️ **Next 16, Tailwind v4, Auth.js v5, and Prisma 7 all differ meaningfully from older versions a model might assume from training data** (e.g. middleware is renamed "Proxy", Tailwind has no JS config file, Prisma's generator is `"prisma-client"` not `"prisma-client-js"`) — see `AGENTS.md` and check `node_modules/next/dist/docs/` before assuming an API.

## 3. Commands

- `npm run dev` — start dev server (Turbopack)
- `npm run build` — `prisma migrate deploy && next build` (applies pending migrations, then builds)
- `npm run start` — run a production build locally
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type-check only
- `npm run knip` — dead-code/unused-export detection
- `npx prisma migrate dev` — create/apply a migration **locally only**
- `npx prisma db seed` — seed local dev DB (hard-blocked when `NODE_ENV=production`)

## 4. Architecture at a Glance

- `src/app/[locale]/` — public bilingual pages (home, about, services, jobs, contact)
- `src/app/admin/` — admin dashboard (Arabic-only, not locale-prefixed)
- `src/app/api/` — route handlers: admin resume uploads, NextAuth, dev-only resume stub, health check
- `src/features/{contact,jobs,quotes}/` — one folder per public feature (`actions/`, `components/`, `data/`, `validations/`, `constants/`)
- `src/lib/` — shared infra: Prisma client, rate-limit/login-attempts/ip-reputation/abuse-counter, storage, email, captcha, fingerprint, logger, require-admin
- `src/components/` — shared UI (`ui/`, `layout/`, `motion/`, `illustrations/`, `admin/`, `home/`, `about/`, `services/`)
- `src/auth.ts` / `src/auth.config.ts` — NextAuth v5 config, split for edge-runtime compatibility
- `src/proxy.ts` — Next 16's renamed middleware (locale routing + admin cookie gate)
- `src/messages/{ar,en}.json` — static editorial copy
- `prisma/schema.prisma` — data model; client generates to `src/generated/prisma` (gitignored)

## 5. Conventions

- Path alias `@/*` → `src/*`
- Server Actions return a shared `ActionState` shape (`src/lib/actions/types.ts`), consumed via `useActionState`; validation is Zod schemas under each feature's `validations/`
- Admin routes/actions use `getValidAdminSession()` / `requireAdmin()` from `src/lib/require-admin.ts` — never raw `auth()` (a previously-fixed session-bypass bug)
- Public forms (contact, quote, apply) each carry: a honeypot field (`website`), a timing-trap field (`formRenderedAt`), a fingerprint pair (`fp`/`fpBot`), and Cloudflare Turnstile
- One-time-token flows (password reset, email verification) claim atomically via `updateMany({ where: { usedAt: null } })` before any slow operation (bcrypt) — avoids a TOCTOU race
- Structured logging goes through `src/lib/logger.ts` (pino → stdout JSON), not raw `console.*`
- CSP/security headers are centralized in `next.config.ts` — not middleware or a meta tag
- Rate limiting/lockout state is persisted in Postgres (`AbuseCounter` table) — not in-memory — because Vercel's serverless model runs multiple instances with no shared memory

## 6. Never Do

- Never commit `.env`, or print/paste secret values (DB URLs, API keys, `AUTH_SECRET`) into files, commits, or logs
- Never run `npx prisma db seed` against production
- Never run `npx prisma migrate dev` against production — production migrations apply automatically via `prisma migrate deploy` inside `npm run build`
- Never use raw `auth()` in admin routes/API handlers — always `getValidAdminSession()`/`requireAdmin()`
- Never `git push` or trigger a deployment without explicit user confirmation first

## 7. Known Gotchas

- Prisma's generator is `provider = "prisma-client"` (not the classic `"prisma-client-js"`) and outputs to `src/generated/prisma`, not `node_modules/.prisma` — run `npx prisma generate` after pulling schema changes, or TypeScript won't resolve it
- `AUTH_SECRET` rotation invalidates every existing admin session immediately, no grace period
- Git Bash's `/tmp` is invisible to natively-installed Windows tools — write scratch files into the project dir or OS scratchpad instead
- `core.autocrlf=true` (a common Windows git default) corrupts checksum verification on fresh clones (LF→CRLF rewrite on checkout) — reclone with `-c core.autocrlf=false` when verifying file hashes
- R2 bucket CORS is a Cloudflare-dashboard setting, not code — resumes upload directly browser→R2, so `AllowedOrigins` must list every live domain (custom domain included). A mismatch fails silently client-side with no server log; if a domain changes, CORS needs a manual update too
