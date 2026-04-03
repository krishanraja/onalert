# Deployment

## Overview

OnAlert is deployed across three services:
- **Vercel**: Frontend SPA hosting
- **Supabase**: Backend (database, auth, edge functions)
- **Stripe**: Payment processing (configured via dashboard)

## Environment Variables

### Frontend (Vercel)
```
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_APP_URL=https://onalert.app
```

### Supabase Edge Functions
```
SUPABASE_URL=           (auto-set by Supabase)
SUPABASE_SERVICE_ROLE_KEY= (auto-set by Supabase)
RESEND_API_KEY=re_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=https://onalert.app
```

## Build Process

```bash
# Install dependencies
npm install

# Type check + build
npm run build

# Output: dist/
```

The build command is `tsc -b && vite build`. It:
1. Runs TypeScript compiler for type checking
2. Bundles with Vite + SWC
3. Generates PWA service worker + manifest
4. Outputs to `dist/`

## Vercel Deployment

### Configuration
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### SPA Routing
Vercel must be configured to serve `index.html` for all routes (SPA fallback). This is automatic with the Vite framework preset.

### Custom Domain
- Primary: `onalert.app`
- Configured in Vercel dashboard → Domains

## Supabase Setup

### Database
1. Create a new Supabase project
2. Run the migration: `supabase/migrations/001_initial_schema.sql`
3. This creates tables, indexes, RLS policies, and triggers

### Auth
- Provider: Email (Magic Link / OTP)
- Site URL: `https://onalert.app`
- Redirect URLs: `https://onalert.app/app`

### Edge Functions
Deploy each function:
```bash
supabase functions deploy poll-appointments
supabase functions deploy send-alert
supabase functions deploy create-checkout
supabase functions deploy customer-portal
supabase functions deploy stripe-webhook
```

### CRON Setup
Set up a CRON job to invoke `poll-appointments` every 10 minutes:
- Use Supabase CRON (pg_cron) or external service (e.g., cron-job.org)
- Method: POST
- URL: `https://<project-id>.supabase.co/functions/v1/poll-appointments`
- Headers: `Authorization: Bearer <service_role_key>`

### Realtime
Enable Realtime for `alerts` and `monitors` tables:
1. Go to Database → Realtime
2. Enable for `public.alerts` (INSERT events)
3. Enable for `public.monitors` (all events)

## Stripe Setup

### Products
No pre-created products needed — `create-checkout` creates inline price data:
- Premium Monthly: $19/month
- Premium Annual: $149/year

### Webhook
1. Create webhook endpoint in Stripe Dashboard
2. URL: `https://<project-id>.supabase.co/functions/v1/stripe-webhook`
3. Events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

### Customer Portal
Enable the Stripe Customer Portal in Dashboard → Settings → Billing → Customer portal.

## Monitoring

### Health Checks
- `scrape_logs` table tracks every polling run with:
  - Duration, slots found, alerts fired, errors
- Check for runs with `error IS NOT NULL` to detect failures

### Key Queries
```sql
-- Recent polling failures
SELECT * FROM scrape_logs
WHERE error IS NOT NULL
ORDER BY started_at DESC LIMIT 20;

-- Alert delivery status
SELECT id, delivered_at, created_at
FROM alerts
WHERE delivered_at IS NULL
AND created_at > now() - interval '1 hour';

-- Active monitors count
SELECT count(*) FROM monitors WHERE active = true;
```
