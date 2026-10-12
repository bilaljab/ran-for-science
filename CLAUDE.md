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
- `src/app/w/` — Arabic-only workshop pages (`/w/[slug]` feedback form, `/w/[slug]/done/[id]` certificate download), outside `[locale]` like `/admin`; `src/proxy.ts` bypasses next-intl for `/w`. Admin side lives in `src/app/admin/(dashboard)/workshops/**` and `src/features/workshops/`
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

- Workshop certificates: attendance is proven ONLY by the time-boxed registration window (`Workshop.opensAt`/`closesAt`, opened by the admin's button, default 10 min), enforced server-side in `features/workshops/actions/submit.actions.ts` via `getRegistrationState` (`lib/registration-window.ts`, tested). The certificate is drawn client-side on a canvas over `public/certificate/template.jpg`; all design coordinates live in `features/workshops/lib/certificate-config.ts`. `WorkshopResponse.id` is the unguessable token in the certificate URL — keep it a cuid
- Workshop public page speed: `/w/[slug]` reads the workshop via `getPublicWorkshop` (`unstable_cache`, tag `WORKSHOPS_TAG`, dates revived from ISO strings); every admin workshop mutation calls `updateTag(WORKSHOPS_TAG)`. The submit action deliberately reads the uncached row (`getWorkshopBySlug`) for the window check. Admin actions write the audit row via `after()`, and open/close the window with ONE raw SQL statement using the database clock (`now()`), not app time
- The workshop form's honeypot is `HONEYPOT_FIELD` (`extra_info`, in `features/workshops/constants/options.ts`), not `website` — browsers autofill hidden `website`/`url` fields. Unlike contact/quote/apply, blocked workshop submits return a VISIBLE error (not a fake success) so a false positive never leaves a real student stuck
- Unit tests exist only for pure workshop logic: `npx tsx --test src/features/workshops/lib/*.test.ts` (node:test, no framework)
- Hosting/DB: Neon Postgres in `eu-central-1` (Frankfurt, pooled endpoint); `vercel.json` pins functions to `fra1` next to it (Hobby plan = one region). Measured before the move: ~1s per DB query from `iad1`. Treat every Postgres round trip as expensive: parallelise independent queries (`Promise.all`), cache public reads, avoid read-then-write when one SQL statement works

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
- React 19 resets every uncontrolled field after a `<form action={...}>` completes, so a validation error wipes the form. Long forms (`FeedbackForm`, `WorkshopForm`) dispatch manually: `onSubmit` → `new FormData(form)` → `startTransition(() => formAction(data))`
- The sidebar logout `<form>` precedes page content in the admin DOM — scripted tests must target `main form`, not `document.querySelector("form")`
- React 19 re-applies `defaultValue=""` to hidden inputs on every parent re-render, wiping DOM-written values. `FormTimingGuard` and `BrowserFingerprint` are therefore `memo`'d — removing `memo` makes a second submit after a validation error fail the server's timing trap silently
- Certificate canvas is 3508×2480 and some Android phones can't allocate it: `lib/certificate.ts` retries at 70% then 50% (a failed canvas comes back blank; the template's corner pixel must be opaque) and prints the technical reason under the download buttons
- `npm run start` locally refuses to boot without `RESEND_API_KEY`, all four `R2_*` vars and `TURNSTILE_SECRET_KEY` (instrumentation checks). For a local production smoke test use dummies; the Cloudflare always-pass test keys are site `1x00000000000000000000AA` / secret `1x0000000000000000000000000000000AA`
- Local DB for development: the README's Docker Postgres (container `ran-postgres`, port 55432). Docker Desktop must be running; never `wsl --shutdown` or kill Docker processes — other containers on the machine may be in use
- R2 bucket CORS is a Cloudflare-dashboard setting, not code — resumes upload directly browser→R2, so `AllowedOrigins` must list every live domain (custom domain included). A mismatch fails silently client-side with no server log; if a domain changes, CORS needs a manual update too
