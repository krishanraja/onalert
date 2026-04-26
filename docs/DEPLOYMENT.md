# Deployment

## Overview

OnAlert runs on three managed services:

- **Vercel** — frontend SPA (static build, global CDN, security headers, HSTS)
- **Supabase** — backend (Postgres + RLS, Auth, Edge Functions on Deno, Realtime, pg_cron)
- **Stripe** — payment processing (one-time Checkout, signed webhooks, idempotency)

Plus three downstream integrations: **Resend** (email), **Twilio** (SMS, paid plans), and the **CBP scheduler API** (read-only).

Production project ref: `zcreubinittdqyoxxwtp` (Supabase, East US Virginia).

## Environment variables

### Frontend (Vercel)

```
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_APP_URL=https://onalert.app
```

### Supabase Edge Functions (set as secrets)

```
SUPABASE_URL                 # auto-set by Supabase
SUPABASE_SERVICE_ROLE_KEY    # auto-set by Supabase
APP_URL=https://onalert.app

# Email + SMS
RESEND_API_KEY=re_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Function-tier auth (post-audit, both required)
CRON_SECRET=...               # required by poll-appointments, process-delayed-alerts,
                              # process-rechecks, predict-slots
INTERNAL_FUNCTION_SECRET=...  # required by send-alert, send-digest-alert, send-push
```

> **CRON_SECRET rotation:** the secret is embedded inline in the `cron.job.command` of `poll-appointments-every-1-min` and `process-delayed-alerts-every-5-min`. Rotation requires re-creating both jobs in the same SQL transaction. Failing to rotate both atomically will silently 401 the cron and break the alert pipeline (see April 2026 incident).

> **INTERNAL_FUNCTION_SECRET digest:** verify the value via `select md5(...)` against the digest captured in the project memory (`51eb59dd…438e19af`).

## Build process

```bash
npm install
npm run build      # tsc -b && vite build
```

The build runs:
1. TypeScript compiler — zero tolerance for type errors
2. Vite + SWC bundler for production output
3. PWA service worker + manifest via vite-plugin-pwa
4. Static output to `dist/`

## Vercel

### Configuration
- **Framework**: Vite (auto-detected)
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Install command**: `npm install`
- **Node version**: 20+

### `vercel.json`
- SPA rewrite: all non-`/api/*` requests → `/index.html`
- **Security headers** on every response: HSTS (`max-age=63072000`), X-Frame-Options=DENY, no-sniff, strict-origin referrer policy, restricted Permissions-Policy (`geolocation=self, payment=self`)
- **`/app/*` headers**: `noindex, nofollow` so authenticated pages stay out of search

### Custom domain
- Primary: `onalert.app`
- SSL: managed by Vercel
- DNS: configured in Vercel Dashboard → Domains

## Supabase

### Database

The schema is composed of 17 SQL migrations in `supabase/migrations/`. **In this project the Supabase CLI cannot push migrations cleanly** because of a phantom `006` history entry that originated from an early manual `apply-missing-migrations.sql` run.

**Use the Supabase Management API** for any future migration. The pattern is captured in the project's auto-memory under `reference_supabase_management_api.md` and is the only reliable path until the migration history is reconciled (or new migrations are renamed to versions that don't conflict).

### Auth

1. **Email provider**: enable with Magic Link / OTP
2. **Google OAuth**: Authentication → Providers → Google
   - Add Google Client ID and Client Secret
   - Authorized redirect URI: `https://<project-id>.supabase.co/auth/v1/callback`
3. **Site URL**: `https://onalert.app`
4. **Redirect URLs**: `https://onalert.app/app`, `https://onalert.app/auth`, `https://onalert.app/auth/reset`

### Edge functions (deploy all 12)

```bash
supabase functions deploy poll-appointments
supabase functions deploy process-delayed-alerts
supabase functions deploy process-rechecks
supabase functions deploy predict-slots
supabase functions deploy send-alert
supabase functions deploy send-digest-alert
supabase functions deploy send-push
supabase functions deploy create-checkout
supabase functions deploy customer-portal
supabase functions deploy stripe-webhook
supabase functions deploy track-booking-click
supabase functions deploy public-wait-times
```

`supabase/config.toml` contains the per-function configuration (verify_jwt, cors, etc.).

### CRON setup (pg_cron)

The CRON jobs must embed `CRON_SECRET` inline so the targeted edge function can verify the `x-cron-secret` header.

```sql
SELECT cron.schedule(
  'poll-appointments-every-1-min',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<project-id>.supabase.co/functions/v1/poll-appointments',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'process-delayed-alerts-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<project-id>.supabase.co/functions/v1/process-delayed-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Verify cron health by inspecting `net._http_response`:

```sql
SELECT id, status_code, created
FROM net._http_response
WHERE created > now() - interval '1 hour'
ORDER BY created DESC
LIMIT 20;
```

A run of 401 responses means `CRON_SECRET` was rotated without re-creating the cron jobs — fix immediately.

### Realtime

Enable for these tables (Database → Realtime):
- `public.alerts` (INSERT events) — drives in-app alerts feed
- `public.monitors` (all events) — drives optimistic UI sync

## Stripe

### Products
No pre-created Stripe products needed. `create-checkout` creates inline `price_data` for each plan (decision D005):
- Pro: $39 one-time (3900 cents)
- Multi: $59 one-time (5900 cents)
- Express: $79 one-time (7900 cents)
- Legacy `family` alias maps to Multi pricing for backwards compatibility

### Webhook
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://<project-id>.supabase.co/functions/v1/stripe-webhook`
3. Events to listen for:
   - `checkout.session.completed` — upgrade user plan
   - `charge.refunded` — downgrade user to free
   - `charge.dispute.created` — downgrade user to free
4. Note the signing secret (`whsec_...`) and set as `STRIPE_WEBHOOK_SECRET` in Supabase function secrets

The webhook is **idempotent** via the `stripe_events` table (migration `013`) — replays are safe. The handler also validates `amount_total` against expected plan price to defend against tampering, and rolls back the `stripe_events` claim on handler failure so Stripe will retry.

### Customer portal
Settings → Billing → Customer portal → Activate. Default settings are fine.

## Monitoring

### `/app/admin/audit`
The first place to look when alerts stop. Surfaces:
- Recent poll-run history with anomaly flags
- Per-location fetch success/latency
- Alert delivery stats
- Last cron heartbeat

> **Watch this dashboard.** The April 2026 incident — polling silently 401'd for ~3 weeks because a leaked service-role JWT had been auto-revoked by Supabase's leak scanner — would have been caught immediately if anyone had been monitoring this page.

### Diagnostic queries

```sql
-- Recent polling failures
SELECT * FROM scrape_logs
WHERE error IS NOT NULL
ORDER BY started_at DESC LIMIT 20;

-- Undelivered alerts (possible email/sms failure)
SELECT id, delivered_at, created_at, payload->>'location_name' AS location
FROM alerts
WHERE delivered_at IS NULL
  AND created_at > now() - interval '1 hour';

-- Cron heartbeat
SELECT id, status_code, created
FROM net._http_response
WHERE created > now() - interval '1 hour'
ORDER BY created DESC LIMIT 20;

-- Active monitors per plan
SELECT p.plan, COUNT(*) AS active_monitors
FROM monitors m
JOIN profiles p ON p.id = m.user_id
WHERE m.active = true
GROUP BY p.plan;

-- Paid users by tier
SELECT plan, COUNT(*) FROM profiles
WHERE plan IN ('pro', 'multi', 'express')
GROUP BY plan;

-- Alert volume (last 24h)
SELECT COUNT(*) FROM alerts
WHERE created_at > now() - interval '24 hours';

-- Stripe webhook idempotency state
SELECT event_type, COUNT(*) FROM stripe_events
WHERE created_at > now() - interval '7 days'
GROUP BY event_type;
```

## Post-deploy verification (every release)

- [ ] Landing page renders publicly without env vars (graceful degradation)
- [ ] All three auth flows work end-to-end
- [ ] Magic-link deep-link from email opens authenticated `/app` (regression: this broke once)
- [ ] Monitor creation completes for free, Pro, Multi, Express
- [ ] Alert email is delivered (Resend) and HTML-escaped
- [ ] Stripe checkout creates one-time charge and webhook upgrades user plan
- [ ] Edge functions reject requests missing `x-cron-secret` (cron tier) and `x-internal-secret` (internal tier)
- [ ] `/app/*` routes serve `noindex, nofollow`
- [ ] Public wait-times page loads
- [ ] PWA manifest validates in Chrome DevTools
- [ ] `/app/admin/audit` shows recent successful poll runs

## Outstanding hardening (post-audit follow-ups)

From the April 2026 audit (still open):

- [ ] **Rotate the Supabase service-role JWT** in the dashboard. The leaked one is already revoked at the auth layer, but rotation makes the audit trail clean.
- [ ] **Reconcile migration history** so `supabase db push` works again (or freeze on the Management API pattern indefinitely).
- [ ] **Wire VAPID JWT signing** in `send-push` so web push works for all subscribers, not just the simplified path.
- [ ] **Build the org invite endpoint** to back the `/app/organization` page UI.
