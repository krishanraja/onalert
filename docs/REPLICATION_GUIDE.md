# Replication Guide

Step-by-step instructions to set up OnAlert from scratch.

## Prerequisites

- Node.js 18+
- npm 9+
- Supabase account (free tier works)
- Stripe account
- Resend account (for email delivery)
- Vercel account (or any static hosting)

## Step 1: Clone and Install

```bash
git clone https://github.com/krishanraja/onalert.git
cd onalert
npm install
```

## Step 2: Supabase Setup

### 2a. Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Note your **Project URL** and **Anon Key** (Settings → API)
3. Note your **Service Role Key** (Settings → API → service_role)

### 2b. Run Database Migration
1. Go to SQL Editor in Supabase Dashboard
2. Paste contents of `supabase/migrations/001_initial_schema.sql`
3. Run the query

This creates:
- `profiles`, `monitors`, `alerts`, `scrape_logs` tables
- Row Level Security policies
- Auto-create profile trigger on signup
- Updated_at trigger for profiles

### 2c. Enable Realtime
1. Go to Database → Realtime
2. Enable for `alerts` table (INSERT events)
3. Enable for `monitors` table (all events)

### 2d. Configure Auth
1. Go to Authentication → Providers
2. Ensure Email is enabled with Magic Link
3. Set Site URL: `http://localhost:5173` (dev) or your production URL
4. Add Redirect URLs: `http://localhost:5173/app`, `https://yourdomain.com/app`

## Step 3: Stripe Setup

### 3a. Get API Keys
1. Go to [stripe.com](https://stripe.com) → Developers → API Keys
2. Note your **Publishable Key** (`pk_test_...`)
3. Note your **Secret Key** (`sk_test_...`)

### 3b. Configure Customer Portal
1. Go to Settings → Billing → Customer portal
2. Enable the portal with default settings

### 3c. Webhook (for production)
1. Go to Developers → Webhooks → Add endpoint
2. URL: `https://<your-supabase-project>.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Note the **Signing Secret** (`whsec_...`)

## Step 4: Resend Setup

1. Create account at [resend.com](https://resend.com)
2. Verify your sending domain (or use the sandbox domain for testing)
3. Create an API Key
4. Update the `from` address in `supabase/functions/send-alert/index.ts` to match your verified domain

## Step 5: Environment Variables

### Local Development
Create `.env.local` in the project root:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_APP_URL=http://localhost:5173
```

### Supabase Edge Functions
Set secrets via CLI or Dashboard (Settings → Edge Functions → Secrets):
```bash
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set APP_URL=https://yourdomain.com
```

## Step 6: Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref <your-project-id>

# Deploy all functions
supabase functions deploy poll-appointments
supabase functions deploy send-alert
supabase functions deploy create-checkout
supabase functions deploy customer-portal
supabase functions deploy stripe-webhook
```

## Step 7: Set Up Polling CRON

The `poll-appointments` function needs to be called periodically.

### Option A: Supabase pg_cron
```sql
SELECT cron.schedule(
  'poll-appointments',
  '*/10 * * * *',  -- every 10 minutes
  $$
  SELECT net.http_post(
    url := 'https://<project-id>.supabase.co/functions/v1/poll-appointments',
    headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
  );
  $$
);
```

### Option B: External CRON Service
Use cron-job.org, Vercel Cron, or similar:
- URL: `https://<project-id>.supabase.co/functions/v1/poll-appointments`
- Method: POST
- Header: `Authorization: Bearer <service_role_key>`
- Schedule: Every 10 minutes

## Step 8: Run Locally

```bash
npm run dev
```

Open `http://localhost:5173`  - you should see the landing page.

## Step 9: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard
# or via CLI:
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_STRIPE_PUBLISHABLE_KEY
vercel env add VITE_APP_URL
```

## Verification Checklist

- [ ] Landing page loads at `/`
- [ ] Magic link email is received
- [ ] Auth redirect works to `/app`
- [ ] Can create a monitor (3-step wizard)
- [ ] Monitor appears on dashboard
- [ ] CRON triggers poll-appointments successfully
- [ ] Alert appears when new slot detected
- [ ] Email notification is delivered
- [ ] Stripe checkout works
- [ ] Webhook updates plan to premium
- [ ] Customer portal opens
