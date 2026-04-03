# Architecture

## System Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Browser    │────▶│   Vercel     │────▶│  Static SPA     │
│   (React)    │◀────│   CDN        │◀────│  (dist/)        │
└─────┬───────┘     └──────────────┘     └─────────────────┘
      │
      │ Supabase JS Client
      │
┌─────▼───────────────────────────────────────────────────────┐
│                     Supabase Platform                        │
│                                                              │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   Auth   │  │  PostgreSQL  │  │    Edge Functions       │ │
│  │  (OTP)   │  │   + RLS      │  │                        │ │
│  └──────────┘  └──────────────┘  │  poll-appointments     │ │
│                                   │  send-alert            │ │
│                                   │  create-checkout       │ │
│                                   │  customer-portal       │ │
│                                   │  stripe-webhook        │ │
│                                   └───────────┬────────────┘ │
└───────────────────────────────────────────────┼──────────────┘
                                                │
                    ┌───────────────────────────┼──────────┐
                    │                           │          │
               ┌────▼─────┐  ┌────────────┐  ┌─▼────────┐
               │ CBP API  │  │   Stripe   │  │  Resend  │
               │ (slots)  │  │ (payments) │  │ (email)  │
               └──────────┘  └────────────┘  └──────────┘
```

## Data Flow: Alert Pipeline

This is the critical path — how a user gets notified when a slot opens:

```
1. CRON trigger (every 10min) ──▶ poll-appointments edge function
2. poll-appointments:
   a. SELECT active monitors from DB
   b. Deduplicate location IDs across all monitors
   c. Fetch slots from CBP API (parallel, batches of 5)
   d. Compare against last_known_slots per monitor
   e. For each new slot:
      i.   INSERT alert record into alerts table
      ii.  INVOKE send-alert function with alert payload
      iii. INCREMENT newAlerts counter
   f. UPDATE monitor.config.last_known_slots
   g. UPDATE monitor.last_checked_at
   h. INSERT scrape_log record
3. send-alert:
   a. SELECT user profile (email, plan)
   b. Generate branded HTML email
   c. POST to Resend API
   d. UPDATE alert.delivered_at
4. Realtime:
   a. Supabase Realtime pushes INSERT event to browser
   b. useAlerts hook receives new alert, triggers haptic + UI update
```

## Database Schema

### Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User data (extends auth.users) | Own records only |
| `monitors` | Appointment monitoring config | Own records (CRUD) |
| `alerts` | Generated alerts with payload | Own records (read/update) |
| `scrape_logs` | Polling run audit trail | Read-only for all |

### Key Relationships

```
auth.users (1) ──▶ (1) profiles
profiles   (1) ──▶ (N) monitors
monitors   (1) ──▶ (N) alerts
```

### Indexes

- `idx_monitors_user_id` — Filter monitors by user
- `idx_monitors_active` — Partial index for active monitors only
- `idx_alerts_user_id` — Filter alerts by user
- `idx_alerts_created_at` — Sort alerts by newest first
- `idx_alerts_monitor_id` — Join alerts to monitors

## Frontend Architecture

### Routing

```
/              → LandingPage (public)
/auth          → AuthPage (public, magic link OTP)
/app           → AppLayout (auth guard)
  /app         → DashboardPage (monitors list)
  /app/alerts  → AlertsPage (alert feed)
  /app/alerts/:id → AlertDetailPage
  /app/add     → AddMonitorPage (3-step wizard)
  /app/settings → SettingsPage (plan, billing, sign out)
*              → Redirect to /
```

### State Management

- **No global store** — React hooks + Supabase Realtime
- `useProfile()` — Current user profile + plan
- `useMonitors()` — Monitor CRUD + realtime sync
- `useAlerts()` — Alert feed + realtime inserts + mark-read
- All hooks include null Supabase guards for graceful degradation

### Component Hierarchy

```
main.tsx
  └── ErrorBoundary
        └── App (BrowserRouter)
              ├── LandingPage
              ├── AuthPage
              └── AppLayout (auth guard)
                    ├── Outlet (page content)
                    └── BottomNav
```

## Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `poll-appointments` | CRON (POST) | Poll CBP API, detect new slots, create alerts |
| `send-alert` | Invoked by poll-appointments | Deliver email notification via Resend |
| `create-checkout` | User action | Create Stripe Checkout session |
| `customer-portal` | User action | Create Stripe billing portal session |
| `stripe-webhook` | Stripe events | Handle subscription lifecycle |

## Security

- **Row Level Security (RLS)**: All tables enforce user-scoped access
- **Auth**: Supabase Auth with magic link OTP (passwordless)
- **Edge Functions**: Service role key (server-side only)
- **Stripe**: Webhook signature verification
- **CORS**: Supabase handles CORS for the anon key
