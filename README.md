# LeverCRM

Multi-tenant SaaS CRM for gyms (`levercrm.net`). One Next.js app, two portals:

- **Admin** (`/admin/*`) — gym owners/staff (owner, manager, front_desk roles).
- **Member** (`/portal/[gymSlug]/*`) — the gym's own members, scoped by URL slug.

Both portals share one Supabase project. Every table carries a `gym_id` and is scoped by
Row-Level Security — tenant isolation and tier-flag gating (Base/Pro/Premium/Premium Plus)
are enforced in Postgres, not just hidden in the UI.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + RLS, Auth, Edge Functions, pg_cron)
- Stripe (Lever AI's billing of gyms — subscriptions drive tier flags via webhook)
- Resend (transactional email for automations)
- Netlify (hosting, git-push auto-deploy)

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in the Supabase URL/anon key. Server-only
secrets (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) are
also read from `.env.local` locally and from Netlify's environment settings in production
— never commit real values.

Don't run `npm run build` while `npm run dev` is also running against the same directory —
both write to `.next/` and will corrupt each other's cache. Stop one before starting the
other.

## Database

Schema, RLS policies, and triggers live in `supabase/migrations/`, applied in order via the
Supabase MCP tooling (not the Supabase CLI, in this project's workflow so far). Edge
Functions live in `supabase/functions/`:

- `stripe-webhook` — `invoice.paid` / `invoice.payment_failed` / `customer.subscription.deleted`
  → tier flag updates, with a 14-day grace period on failed payment before reverting to Base.
- `send-automation-emails` — daily cron job (birthday / 45-day re-engagement / class reminder),
  no-ops the actual send if `RESEND_API_KEY` isn't set as a function secret.

## Deployment

Push to `main` on GitHub; Netlify auto-deploys via `@netlify/plugin-nextjs` (see `netlify.toml`).
Never deploy via `netlify-cli` — it burns build credits that git-push auto-deploy doesn't.
