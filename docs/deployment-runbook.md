# Deployment runbook

Operational procedures for rollback and secret rotation. Not developer-facing architecture docs — see the main `README.md` and `CLAUDE.md` for those.

## Rollback

Vercel deployments are immutable and versioned by default — every deploy gets its own URL, and promoting a previous deployment back to production is Vercel's built-in instant rollback. No blue-green infrastructure needs to be built or maintained separately; Vercel's model already provides the equivalent natively.

**To roll back:**
- Dashboard: Project → Deployments → find the last known-good deployment → **Promote to Production**.
- CLI: `vercel rollback` (rolls back to the previous production deployment) or `vercel promote <deployment-url>` (promotes a specific one).

**The real risk isn't the code rollback itself — it's a database migration that shipped alongside the code you just rolled back from.** If a migration isn't backward-compatible with the *previous* code, rolling back the app without also rolling back the schema can break it. Follow the **expand/contract** pattern for every schema change:

1. **Expand**: add new columns/tables as nullable or with a default — never as a change that breaks code that doesn't know about them yet. Deploy this on its own.
2. **Migrate code**: deploy the code that actually uses the new column/table. If a rollback is needed at this point, the previous code still works fine against the expanded schema (the new column is simply unused).
3. **Contract**: only in a *later*, separate deploy — once nothing references the old column/table anymore — drop or rename it.

Never combine step 1 and step 3 in one migration. This is exactly what makes `sessionVersion` (added this pass) safe: it's additive with a default, so old code that doesn't know about it still runs correctly against the new schema.

**Pre-deploy checklist** (matches this project's existing verification convention — there is no automated test suite):
```bash
npx tsc --noEmit
npx eslint .
npm run build
```

## Secret rotation

Recommended cadence: every 90 days, or immediately if a leak is suspected. Not every secret rotates the same way:

| Secret | Zero-downtime? | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Provision new DB credentials → update env var → redeploy → revoke old credentials. Nothing in the app caches this beyond process lifetime. |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Yes | Same pattern — generate new R2 API token, update env vars, redeploy, revoke the old token. |
| `RESEND_API_KEY` | Yes | Generate a new key in Resend, swap the env var, redeploy. |
| `TURNSTILE_SECRET_KEY` | Yes | Rotate in the Cloudflare dashboard, swap the env var, redeploy. The public `NEXT_PUBLIC_TURNSTILE_SITE_KEY` doesn't need rotation (it's meant to be public). |
| `SENTRY_AUTH_TOKEN` | Yes | Only used at build time for source-map upload — rotating it doesn't affect a running deployment at all. |
| **`AUTH_SECRET`** | **No** | Rotating this **invalidates every existing admin session immediately** (NextAuth signs/encrypts session JWTs with it) — every logged-in admin gets logged out on their next request. Rotate during a low-admin-activity window, not on a silent schedule, and give admins a heads-up. This is already noted in the project's own README for the initial production setup; the same caveat applies to any later rotation. |

Rotating `AUTH_SECRET` is the one exception to "safe to rotate silently on a fixed schedule" — plan it deliberately rather than automating it away.
