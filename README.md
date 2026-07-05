# RAN For Science

Bilingual (Arabic/English) corporate website and admin dashboard for RAN For Science — a scientific platform connecting job seekers with companies in the scientific, environmental, industrial, and health fields, and offering paid consulting/compliance services.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- `next-intl` for i18n (Arabic default at `/`, English at `/en`)
- Prisma + PostgreSQL
- NextAuth.js (Auth.js v5) credentials auth for the admin dashboard
- Local disk storage for resumes in dev; Cloudflare R2 (S3-compatible) in production when `R2_*` env vars are set

## Getting Started

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `AUTH_SECRET` (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`), and `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` (12+ characters, your own choice — there is no default).
2. Start a local Postgres (e.g. `docker run -d -e POSTGRES_USER=ran -e POSTGRES_PASSWORD=ranforsciencedev -e POSTGRES_DB=ran_for_science -p 55432:5432 postgres:16-alpine`) and point `DATABASE_URL` at it.
3. Install dependencies and set up the database:
   ```bash
   npm install
   npx prisma migrate dev
   npx prisma db seed
   ```
   The seed creates an admin login using the `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` you set (the seeded account is auto-verified) and a few sample job postings. It refuses to run at all if those env vars are missing, or if `NODE_ENV=production`.
4. Run the dev server:
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) for the public site and [http://localhost:3000/admin/login](http://localhost:3000/admin/login) for the admin dashboard.

## Project structure

- `src/app/[locale]/` — public bilingual pages (Home, About, Services, Jobs, Contact)
- `src/app/admin/` — admin dashboard (not locale-prefixed, Arabic UI)
- `src/features/{contact,jobs,quotes}/` — one folder per public feature, each with its own `actions/` (Server Actions), `components/`, and `validations/` (Zod schemas)
- `src/lib/actions/` — auth-related Server Actions (login, password reset, email verification)
- `src/lib/` — shared infrastructure: Prisma client, storage (R2/local disk), rate limiting, CAPTCHA, fingerprinting, audit/abuse logging
- `src/components/` — shared layout and UI primitives
- `src/messages/{ar,en}.json` — static editorial copy
- `prisma/schema.prisma` — data model (Prisma client generates to `src/generated/prisma`)

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run a production build locally |
| `npm run lint` | ESLint |

There is no automated test suite; changes are verified with type-checking (`npx tsc --noEmit`), lint, a production build, and manual testing.

## Security & abuse prevention

- Admin auth: NextAuth (Credentials) with bcrypt password hashing, optional TOTP-based MFA, login lockout after repeated failures, and DB-verified session checks on every admin/API route.
- Public forms (contact, quote request, job application) are protected by a layered stack: honeypot field, submission-timing trap, browser fingerprinting (escalated to a persistent block only after a real abuse threshold is crossed, never for normal traffic), IP-reputation tracking, rate limiting, and Cloudflare Turnstile.
- Security headers and a strict Content-Security-Policy are set centrally in `next.config.ts`.
- Admin actions are recorded in an audit log; abuse events (honeypot/timing-trap trips, blocked fingerprints, CAPTCHA failures) are logged separately.

## Production notes

- Set `R2_BUCKET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` to use Cloudflare R2 for resume storage (required if deploying to Vercel, since its filesystem is ephemeral).
- Set a real `DATABASE_URL` (e.g. Neon, Supabase, or any managed Postgres) and a freshly generated `AUTH_SECRET` — use a different value than in development, since rotating it invalidates every existing admin session.
- Set `RESEND_API_KEY` and `EMAIL_FROM` — the server refuses to start in production without a working email provider (see `src/instrumentation.ts`).
- Set `NEXTAUTH_URL` to the real production URL — it's used to build the links inside password-reset/verification emails.
- Never run `npx prisma db seed` against production; it's hard-blocked when `NODE_ENV=production`. Provision the first admin account directly in the database instead.
