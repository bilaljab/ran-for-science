# RAN For Science

A bilingual (Arabic/English) platform that connects job seekers with employers in the scientific, environmental, industrial, and health sectors — and helps companies in those sectors get expert consulting and compliance support.

![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-blue?logo=postgresql)

<!-- TODO: أضف screenshot أو رابط demo هون -->

## Overview

RAN For Science gives job seekers and businesses a single place to connect. Visitors can browse open job listings, apply directly on the site, request a paid consulting or compliance service, or reach out with a question — all in Arabic or English. On the other side, the company's own staff use a private admin dashboard to post jobs, review applications, respond to service requests and messages, and keep track of everything that comes in, with a full record of who did what.

## Features

- **Bilingual experience** — the entire public site works in both Arabic and English, so visitors can use whichever language they're comfortable with
- **Job board** — visitors browse open positions, apply with a resume upload, and can track the status of their application; staff review every application from the dashboard
- **Service quote requests** — businesses can request a quote for environmental, legal, digital, or company-registration services, and every request is tracked from submission through to resolution
- **Contact form** — a simple way for visitors to reach out, protected by the same spam defenses as every other form on the site
- **Built-in spam and abuse protection** — every public form (jobs, quotes, contact) is shielded by multiple layers of automated defenses, so submissions stay genuine without adding friction for real visitors
- **Secure admin access** — staff log in with optional two-factor authentication, repeated failed logins are automatically slowed down, and any admin can instantly sign out of all their active sessions if they suspect their account was compromised
- **Full activity history** — every action an admin takes is recorded, so there's always a clear answer to "who did what, and when"
- **Automatic error monitoring** — problems are detected and logged automatically, so issues can be found and fixed quickly rather than being reported by frustrated users
- **Reliable file storage** — resumes and uploaded files are stored safely whether the site is running locally or live in production

## Tech Stack

- **Framework**: Next.js 16.2.9 (App Router) · React 19.2.4 · TypeScript 5.9.3
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL via Prisma 7.8.0 (`@prisma/adapter-pg` driver adapter)
- **Auth**: NextAuth.js (Auth.js) 5.0.0-beta.31, credentials + TOTP 2FA
- **i18n**: next-intl 4.13.1
- **Animation**: framer-motion 12.42.2
- **Validation**: Zod 4.4.3
- **Email**: Resend 6.16.0
- **File storage**: Cloudflare R2 (S3-compatible, via AWS SDK)
- **Bot protection**: Cloudflare Turnstile
- **Observability**: Sentry (`@sentry/nextjs` 10.65.0), pino 10.3.1

## Getting Started

### Prerequisites

- Node.js `>= 20.9.0`
- A local PostgreSQL instance (or Docker)

### Installation

```bash
git clone https://github.com/bilaljab/ran-for-science.git
cd ran-for-science
npm install
cp .env.example .env
```

Fill in `.env` (see [Environment Variables](#environment-variables) below), then start a local Postgres:

```bash
docker run -d -e POSTGRES_USER=ran -e POSTGRES_PASSWORD=CHANGE_ME -e POSTGRES_DB=ran_for_science -p 55432:5432 postgres:16-alpine
```

`CHANGE_ME` is a local-dev-only placeholder — pick any password, just keep it consistent with `DATABASE_URL` below. Example `DATABASE_URL` matching the command above:

```
DATABASE_URL="postgresql://ran:CHANGE_ME@localhost:55432/ran_for_science?schema=public"
```

Generate `AUTH_SECRET` with the official Auth.js v5 CLI:

```bash
npx auth secret
```

Set up the database and run the dev server:

```bash
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) for the public site and [http://localhost:3000/admin/login](http://localhost:3000/admin/login) for the admin dashboard (login created by the seed script).

## Environment Variables

| Variable | Requirement | Description |
|---|---|---|
| `DATABASE_URL` | **Required** | PostgreSQL connection string |
| `AUTH_SECRET` | **Required** | Session encryption secret — generate with `npx auth secret` |
| `SEED_ADMIN_EMAIL` | Required (seed script only) | Admin email used when seeding the local database |
| `SEED_ADMIN_PASSWORD` | Required (seed script only) | Admin password used when seeding the local database (12+ chars) |
| `R2_BUCKET` | Optional (dev) / **Required (production)** | Cloudflare R2 bucket name for file storage |
| `R2_ACCOUNT_ID` | Optional (dev) / **Required (production)** | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Optional (dev) / **Required (production)** | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | Optional (dev) / **Required (production)** | Cloudflare R2 secret key |
| `RESEND_API_KEY` | Optional (dev) / **Required (production)** | API key for sending emails via Resend |
| `EMAIL_FROM` | Optional | "From" address used on outgoing emails |
| `NEXTAUTH_URL` | Optional | The site's canonical URL, used to build links in emails |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional | Public site key for the Cloudflare Turnstile CAPTCHA widget |
| `TURNSTILE_SECRET_KEY` | Optional (dev) / **Required (production)** | Secret key for verifying CAPTCHA submissions |
| `SENTRY_DSN` | Optional | Destination for server-side error reports |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Destination for browser-side error reports |
| `SENTRY_ORG` | Optional | Sentry organization slug (used when uploading source maps) |
| `SENTRY_PROJECT` | Optional | Sentry project slug (used when uploading source maps) |
| `SENTRY_AUTH_TOKEN` | Optional | Auth token for uploading source maps to Sentry |

## Available Scripts

| Script | Runs | Description |
|---|---|---|
| `npm run dev` | `next dev` | Start the dev server (Turbopack) |
| `npm run build` | `prisma migrate deploy && next build` | Apply pending DB migrations, then production build |
| `npm run start` | `next start` | Run a production build locally |
| `npm run lint` | `eslint` | Lint the codebase |
| `npm run knip` | `knip` | Detect dead code and unused exports |

## Project Structure

```
src/
├── app/
│   ├── [locale]/    # Public bilingual pages (home, about, services, jobs, contact)
│   ├── admin/       # Admin dashboard (Arabic-only, not locale-prefixed)
│   └── api/         # Route handlers (NextAuth, resume uploads, health check)
├── features/        # contact/, jobs/, quotes/ — actions, components, validations per feature
├── components/      # Shared UI, layout, motion, illustrations
├── lib/             # Shared infra: Prisma client, rate limiting, storage, email, logging
├── auth.ts, auth.config.ts   # NextAuth v5 configuration
├── proxy.ts         # Locale routing + admin auth gate
└── messages/        # ar.json / en.json editorial copy

prisma/
└── schema.prisma    # Data model
```

## License

This is a proprietary project. All rights reserved.

## Author

**Bilal Jabasini**
- GitHub: [@bilaljab](https://github.com/bilaljab)
- LinkedIn: [bilal-jabasini](https://linkedin.com/in/bilal-jabasini)
- Email: bilal.jabasini@gmail.com
