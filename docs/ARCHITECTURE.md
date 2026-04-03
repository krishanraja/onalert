# Architecture

## System Overview

```
+--------------+     +---------------+     +------------------+
|   Browser    |---->|   Vercel      |---->|  Static SPA      |
|   (React)    |<----|   CDN         |<----|  (dist/)         |
+------+-------+     +---------------+     +------------------+
       |
       | Supabase JS Client
       |
+------v----------------------------------------------------------+
|                     Supabase Platform                            |
|                                                                  |
|  +-----------+  +--------------+  +--------------------------+   |
|  |   Auth    |  |  PostgreSQL  |  |    Edge Functions         |  |
|  | (OAuth,   |  |   + RLS      |  |                          |  |
|  |  Email,   |  |              |  |  poll-appointments       |  |
|  |  OTP)     |  |              |  |  send-alert              |  |
|  +-----------+  +--------------+  |  create-checkout         |  |
|                                   |  customer-portal         |  |
|                                   |  stripe-webhook          |  |
|                                   +------------+-------------+   |
+-----------------------------------------------|------------------+
                                                |
                    +---------------------------+----------+
                    |                           |          |
               +----v-----+  +------------+  +-v--------+
               | CBP API  |  |   Stripe   |  |  Resend  |
               | (slots)  |  | (payments) |  | (email)  |
               +----------+  +------------+  +----------+
```

## Data Flow: Alert Pipeline

This is the critical path -- how a user gets notified when a slot opens:

```
1. CRON trigger (every 10min) --> poll-appointments edge function
2. poll-appointments:
   a. SELECT active monitors from DB
   b. Deduplicate location IDs across all monitors
   c. Fetch slots from CBP API (parallel, batches of 5, 10s timeout)
   d. Compare against last_known_slots per monitor
   e. For each new slot:
      i.   INSERT alert record into alerts table
      ii.  INVOKE send-alert function with alert payload
      iii. Generate human-readable narrative
   f. UPDATE monitor.config.last_known_slots
   g. UPDATE monitor.last_checked_at
   h. INSERT scrape_log record
3. send-alert:
   a. SELECT user profile (email, plan)
   b. Generate branded HTML email (dark theme, crimson header)
   c. POST to Resend API (from: alerts@themindmaker.ai)
   d. UPDATE alert.delivered_at
4. Realtime:
   a. Supabase Realtime pushes INSERT event to browser
   b. useAlerts hook receives new alert, triggers haptic + UI update
```

## Database Schema

### Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User data (extends auth.users) -- email, plan, stripe_customer_id | Own records only |
| `monitors` | Appointment monitoring config -- service type, locations, active state | Own records (CRUD) |
| `alerts` | Generated alerts with payload -- location, slot time, booking URL | Own records (read/update) |
| `scrape_logs` | Polling run audit trail -- duration, slots found, errors | Read-only for all users |

### Key Relationships

```
auth.users (1) --> (1) profiles
profiles   (1) --> (N) monitors
monitors   (1) --> (N) alerts
```

### Data Types

**Monitor Config (JSONB)**:
```json
{
  "location_ids": [5140, 5180, 5446],
  "service_type": "GE",
  "last_known_slots": { "5140": ["2026-04-15T14:30:00"] }
}
```

**Alert Payload (JSONB)**:
```json
{
  "location_id": 5140,
  "location_name": "JFK International Airport",
  "slot_timestamp": "2026-04-15T14:30:00",
  "book_url": "https://ttp.cbp.dhs.gov/",
  "service_type": "GE",
  "narrative": "Global Entry slot at JFK International Airport on Tuesday, April 15 at 2:30 PM"
}
```

### Indexes

- `idx_monitors_user_id` -- Filter monitors by user
- `idx_monitors_active` -- Partial index for active monitors only (WHERE active = true)
- `idx_alerts_user_id` -- Filter alerts by user
- `idx_alerts_created_at` -- Sort alerts by newest first (DESC)
- `idx_alerts_monitor_id` -- Join alerts to monitors

### Triggers

- `handle_new_user` -- Auto-creates profile row on auth.users signup
- `handle_profiles_updated_at` -- Maintains updated_at timestamp on profile changes

## Frontend Architecture

### Routing

```
/              -> LandingPage (public)
/auth          -> AuthPage (public, Google OAuth + email/password + magic link)
/privacy       -> PrivacyPage (public)
/terms         -> TermsPage (public)
/app           -> AppLayout (auth guard)
  /app         -> DashboardPage (monitors list + upgrade CTA)
  /app/alerts  -> AlertsPage (alert feed with unread badge)
  /app/alerts/:id -> AlertDetailPage (slot details + booking link)
  /app/add     -> AddMonitorPage (3-step wizard)
  /app/settings -> SettingsPage (plan, billing, notifications, sign out)
*              -> Redirect to /
```

### State Management

- **No global store** -- React hooks + Supabase Realtime
- `useProfile()` -- Current user profile + plan status (isPaid, isFamily)
- `useMonitors()` -- Monitor CRUD + realtime sync + optimistic updates
- `useAlerts()` -- Alert feed + realtime inserts + mark-read + unread count
- All hooks include null Supabase guards for graceful degradation

### Component Hierarchy

```
main.tsx
  +-- ErrorBoundary
        +-- App (BrowserRouter)
              +-- LandingPage
              +-- AuthPage
              +-- PrivacyPage / TermsPage
              +-- AppLayout (auth guard)
                    +-- Outlet (page content)
                    +-- BottomNav (Home, Alerts, Add, Settings)
```

## Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `poll-appointments` | CRON (every 10min) | Poll CBP API, detect new slots, create alerts |
| `send-alert` | Invoked by poll-appointments | Deliver branded HTML email via Resend |
| `create-checkout` | User action (upgrade button) | Create Stripe Checkout session (one-time payment for Pro or Family) |
| `stripe-webhook` | Stripe events | Handle one-time payment completion, upgrade user plan |

## Security

- **Row Level Security (RLS)**: All tables enforce user-scoped access via Supabase policies
- **Auth**: Supabase Auth with Google OAuth, email/password, and magic link OTP
- **Edge Functions**: Service role key used server-side only, never exposed to client
- **Stripe**: Webhook signature verification with STRIPE_WEBHOOK_SECRET
- **CORS**: Handled by Supabase for the anon key
- **Environment isolation**: Sensitive keys stored as Supabase Edge Function secrets
