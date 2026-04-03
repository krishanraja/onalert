# Deployment

## Overview

OnAlert is deployed across three services:
- **Vercel**: Frontend SPA hosting with global CDN
- **Supabase**: Backend (PostgreSQL database, auth, edge functions, realtime)
- **Stripe**: Payment processing (configured via dashboard + webhooks)

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

The build command runs `tsc -b && vite build`:
1. TypeScript compiler for type checking (zero tolerance for type errors)
2. Vite + SWC bundler for production build
3. PWA service worker + manifest generation via vite-plugin-pwa
4. Static output to `dist/`

## Vercel Deployment

### Configuration
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node.js Version**: 18+

### SPA Routing
Vercel serves `index.html` for all routes (SPA fallback). This is automatic with the Vite framework preset.

### Custom Domain
- Primary: `onalert.app`
- Configured in Vercel Dashboard -> Domains
- SSL: Automatic via Vercel

## Supabase Setup

### Database
1. Create a new Supabase project
2. Run the migration: `supabase/migrations/001_initial_schema.sql`
3. This creates tables, indexes, RLS policies, and triggers

### Auth Configuration
1. **Email provider**: Enable with Magic Link / OTP
2. **Google OAuth**: Configure in Authentication -> Providers -> Google
   - Add Google Client ID and Client Secret
   - Set authorized redirect URI to `https://<project-id>.supabase.co/auth/v1/callback`
3. **Site URL**: `https://onalert.app`
4. **Redirect URLs**: `https://onalert.app/app`, `https://onalert.app/auth`

### Edge Functions
Deploy all five functions:
```bash
supabase functions deploy poll-appointments
supabase functions deploy send-alert
supabase functions deploy create-checkout
supabase functions deploy customer-portal
supabase functions deploy stripe-webhook
```

### CRON Setup
Set up a CRON job to invoke `poll-appointments` every 10 minutes:
- Use Supabase CRON (pg_cron) or external service (e.g., cron-job.org, Vercel Cron)
- Method: POST
- URL: `https://<project-id>.supabase.co/functions/v1/poll-appointments`
- Headers: `Authorization: Bearer <service_role_key>`

### Realtime
Enable Realtime for these tables:
1. Go to Database -> Realtime
2. Enable for `public.alerts` (INSERT events)
3. Enable for `public.monitors` (all events: INSERT, UPDATE, DELETE)

## Stripe Setup

### Products
No pre-created products needed -- `create-checkout` creates inline price data:
- Premium Monthly: $19/month (1900 cents)
- Premium Annual: $149/year (14900 cents)

### Webhook
1. Create webhook endpoint in Stripe Dashboard -> Developers -> Webhooks
2. URL: `https://<project-id>.supabase.co/functions/v1/stripe-webhook`
3. Events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Note the signing secret (`whsec_...`) and set it in Supabase edge function secrets

### Customer Portal
Enable the Stripe Customer Portal in Dashboard -> Settings -> Billing -> Customer portal. Configure with default settings.

## Monitoring

### Health Checks
The `scrape_logs` table tracks every polling run with:
- Start/end timestamps and duration
- Slots found per run
- Alerts fired per run
- Error messages (null = success)

### Key Diagnostic Queries
```sql
-- Recent polling failures
SELECT * FROM scrape_logs
WHERE error IS NOT NULL
ORDER BY started_at DESC LIMIT 20;

-- Undelivered alerts (possible email failures)
SELECT id, delivered_at, created_at
FROM alerts
WHERE delivered_at IS NULL
AND created_at > now() - interval '1 hour';

-- Active monitors count
SELECT count(*) FROM monitors WHERE active = true;

-- Premium user count
SELECT count(*) FROM profiles WHERE plan = 'premium';

-- Alert volume (last 24h)
SELECT count(*) FROM alerts
WHERE created_at > now() - interval '24 hours';
```
