# Replication Guide

Step-by-step instructions to set up OnAlert from scratch (development or a fresh production environment).

## Prerequisites

- Node.js 20+
- npm 9+
- Supabase account (free tier works for dev)
- Stripe account (test mode for development)
- Resend account (transactional email)
- Twilio account (optional, for SMS on paid plans)
- Vercel account (or any static host)
- Google Cloud Console project (for OAuth — optional but recommended)

## Step 1 — Clone and install

```bash
git clone https://github.com/krishanraja/onalert.git
cd onalert
npm install
```

## Step 2 — Supabase

### 2a. Create the project
1. [supabase.com](https://supabase.com) → New project
2. Note the **Project URL** (Settings → API)
3. Note the **Anon key** (Settings → API → anon/public)
4. Note the **Service role key** (Settings → API → service_role) — keep this secret

### 2b. Apply migrations

Apply all 17 migrations in `supabase/migrations/` **in numeric order**. The order matters:
`001 → 002 → 003 → 004 → 005 → 006 → 0066 → 007 → 008 → 009 → 010 → 011 → 012 → 013 → 014 → 015 → 016 → 017`

**Recommended path: Supabase Management API.** A clean clone with `supabase link` and `supabase db push` will work for a fresh project. The production project (`zcreubinittdqyoxxwtp`) has a phantom `006` history entry from an early manual run — for that project, use the Management API pattern documented in `reference_supabase_management_api.md`.

After applying, verify in the SQL editor:

```sql
-- Should return 17 rows
SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;

-- Should include 'profiles', 'monitors', 'alerts', 'slot_history', 'scrape_logs',
-- 'location_fetch_logs', 'recheck_requests', 'booking_clicks', 'booking_stories',
-- 'push_subscriptions', 'org_invites', 'stripe_events'
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### 2c. Enable Realtime
Database → Realtime:
- `alerts` table — enable INSERT events
- `monitors` table — enable all events

### 2d. Configure auth providers

**Email (required):**
1. Authentication → Providers → Email
2. Enable email + magic link
3. Site URL: `http://localhost:5173` (dev) or `https://onalert.app`
4. Redirect URLs: `http://localhost:5173/app`, `https://onalert.app/app`, `https://onalert.app/auth/reset`

**Google OAuth (recommended):**
1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
4. Supabase Dashboard → Authentication → Providers → Google → enter client ID + secret → enable

## Step 3 — Stripe

### 3a. Get API keys
1. [stripe.com](https://stripe.com) → Developers → API keys
2. Note the **Publishable key** (`pk_test_...`)
3. Note the **Secret key** (`sk_test_...`)

### 3b. Customer portal
Settings → Billing → Customer portal → Activate. Default settings.

### 3c. Webhook
1. Developers → Webhooks → Add endpoint
2. URL: `https://<your-project>.supabase.co/functions/v1/stripe-webhook`
3. Events to send (one-time payment model — **do not** select subscription events):
   - `checkout.session.completed`
   - `charge.refunded`
   - `charge.dispute.created`
4. Note the signing secret (`whsec_...`) — this becomes `STRIPE_WEBHOOK_SECRET`

## Step 4 — Resend

1. Create account at [resend.com](https://resend.com)
2. Verify your sending domain (or use the sandbox for early testing)
3. Create an API key — this becomes `RESEND_API_KEY`
4. Update the `from` address in `supabase/functions/send-alert/index.ts` to match your verified domain (production uses `alerts@onalert.app`)

## Step 5 — Twilio (optional, for SMS on paid plans)

1. [twilio.com](https://twilio.com) — create an account
2. Note your **Account SID** and **Auth token**
3. Buy a phone number → note the **From number** (e.g., `+15551234567`)
4. These become `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`

If you skip Twilio, paid plans simply won't deliver SMS — email + web push + in-app realtime still work.

## Step 6 — Environment variables

### Local frontend (`.env.local`)
```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_APP_URL=http://localhost:5173
```

### Supabase edge function secrets
```bash
supabase secrets set APP_URL=http://localhost:5173
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set TWILIO_ACCOUNT_SID=AC...
supabase secrets set TWILIO_AUTH_TOKEN=...
supabase secrets set TWILIO_FROM_NUMBER=+15551234567

# Generate strong random secrets — function-tier auth (post-audit, both required)
supabase secrets set CRON_SECRET="$(openssl rand -hex 32)"
supabase secrets set INTERNAL_FUNCTION_SECRET="$(openssl rand -hex 32)"
```

Save the values you generate — you need `CRON_SECRET` again in step 8.

## Step 7 — Deploy edge functions

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-id>

# Deploy all 12 functions
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

Per-function settings (verify_jwt, etc.) are in `supabase/config.toml`.

## Step 8 — Set up CRON via pg_cron

The CRON jobs **must** embed `CRON_SECRET` inline so the targeted function can verify the `x-cron-secret` header. Replace `<CRON_SECRET>` with the value you set in step 6.

```sql
-- Enable extensions if not already
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'poll-appointments-every-1-min',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<your-project>.supabase.co/functions/v1/poll-appointments',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','<CRON_SECRET>'),
    body := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'process-delayed-alerts-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<your-project>.supabase.co/functions/v1/process-delayed-alerts',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','<CRON_SECRET>'),
    body := '{}'::jsonb
  );
  $$
);
```

> **Rotation rule:** any time you rotate `CRON_SECRET`, you **must** re-create both jobs in the same SQL transaction, or polling will silently 401 and the alert pipeline goes dark.

Optionally schedule `process-rechecks` (every 2 min) and `predict-slots` (daily) if you want recheck and prediction features active.

## Step 9 — Run locally

```bash
npm run dev
```

Open `http://localhost:5173`. You should see the landing page.

Test the auth flow:
1. Click "Get started" or "Sign in"
2. Try Google OAuth (if configured) or email sign-up
3. Verify redirect to `/app` dashboard
4. Magic-link emails deep-link directly into `/app` (do not break this — regression-tested)

## Step 10 — Deploy to Vercel

```bash
npm install -g vercel
vercel
# Or just connect the GitHub repo via the Vercel dashboard.

# Set frontend env vars in Vercel:
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_STRIPE_PUBLISHABLE_KEY
vercel env add VITE_APP_URL   # https://yourdomain.com
```

`vercel.json` handles the SPA rewrite, security headers, and `/app/*` indexing controls automatically.

## Verification checklist

- [ ] Landing page loads at `/` with hero, programs, pricing, agency logos
- [ ] Public surfaces load: `/locations`, `/locations/:id`, `/wait-times`, `/guide`, `/privacy`, `/terms`
- [ ] Google OAuth sign-in works (if configured)
- [ ] Email + password sign-up and sign-in work
- [ ] Magic-link email is received and opens `/app` (deep-link preserved)
- [ ] Auth redirects work to `/app`
- [ ] Can create a monitor via the 3-step wizard for each plan tier
- [ ] Plan cap enforced server-side (try to create a 6th monitor on Multi — must be rejected)
- [ ] Monitor appears on dashboard with correct status
- [ ] CRON triggers `poll-appointments` successfully (check `net._http_response` for 200s)
- [ ] `scrape_logs` shows successful runs
- [ ] Alert appears (or wait for a real CBP slot to open)
- [ ] Email notification is delivered with booking link
- [ ] SMS notification arrives (if Twilio configured and user has phone)
- [ ] Stripe checkout works (test mode) for Pro / Multi / Express
- [ ] Webhook upgrades plan correctly; refund downgrades to free
- [ ] Customer portal opens
- [ ] PWA is installable on mobile
- [ ] `/app/admin/audit` shows recent successful poll runs
- [ ] Edge functions reject requests missing the right secret header (`x-cron-secret`, `x-internal-secret`)
