# Architecture

## System overview

```
+--------------+     +---------------+     +------------------+
|   Browser    |---->|   Vercel      |---->|  Static SPA      |
|  (React PWA) |<----|   CDN + HSTS  |<----|  (dist/)         |
+------+-------+     +---------------+     +------------------+
       |
       | Supabase JS client (anon key)
       |
+------v---------------------------------------------------------------+
|                      Supabase Platform                                |
|                                                                       |
|  +-----------+  +--------------+  +---------------------------------+ |
|  |   Auth    |  |  PostgreSQL  |  |    Edge Functions (12, Deno)    | |
|  | (Google,  |  |   + RLS      |  |                                 | |
|  |  Email,   |  |   + 17       |  |  CRON tier (x-cron-secret):     | |
|  |  Magic)   |  |  migrations  |  |    poll-appointments            | |
|  +-----------+  +--------------+  |    process-delayed-alerts       | |
|                                   |    process-rechecks             | |
|                                   |    predict-slots                | |
|                                   |                                 | |
|  +--------------+                 |  Internal tier (x-internal):    | |
|  |  pg_cron     |                 |    send-alert                   | |
|  |  + secrets   |                 |    send-digest-alert            | |
|  +--------------+                 |    send-push                    | |
|                                   |                                 | |
|  +--------------+                 |  User-JWT tier:                 | |
|  | Realtime     |                 |    create-checkout              | |
|  | (alerts)     |                 |    customer-portal              | |
|  +--------------+                 |    track-booking-click          | |
|                                   |                                 | |
|                                   |  Stripe-signature tier:         | |
|                                   |    stripe-webhook               | |
|                                   |                                 | |
|                                   |  Public (CORS-cached):          | |
|                                   |    public-wait-times            | |
|                                   +---------------+-----------------+ |
+-----------------------------------------------|----------------------+
                                                |
        +------------+----------------+----------+----------+
        |            |                |                     |
   +----v-----+  +--v-------+  +-----v------+  +-----------v-------+
   | CBP API  |  | Stripe   |  |  Resend    |  |  Twilio + Web     |
   | (slots)  |  | (Checkout|  |  (email)   |  |  Push (paid only) |
   |          |  |  + webhook)| |            |  |                   |
   +----------+  +----------+  +------------+  +-------------------+
```

## Edge functions (all 12)

| Function | Auth tier | Trigger | Responsibility |
|----------|-----------|---------|---------------|
| `poll-appointments` | `x-cron-secret` | pg_cron (every 1 min) | Polls CBP API, deduplicates locations across all monitors, batches in groups of 5 with 10s timeout, detects new slots via stateful diff against `monitors.config.last_known_slots`, applies deadline filter, creates individual or digest alerts, invokes `send-alert` / `send-digest-alert` directly, updates `monitors.last_checked_at`, writes `scrape_logs` and `location_fetch_logs`. |
| `process-delayed-alerts` | `x-cron-secret` | pg_cron (every 5 min) | Sends queued free-tier alerts whose 15-minute `delay_until` window has passed. Batches of 5. |
| `process-rechecks` | `x-cron-secret` | pg_cron (periodic) | Processes user-requested slot rechecks; refetches the location and verifies slot still exists. |
| `predict-slots` | `x-cron-secret` | pg_cron (daily) | Computes day-of-week prediction patterns from `slot_history` (90-day rolling window). |
| `send-alert` | `x-internal-secret` | Invoked by `poll-appointments` and `process-delayed-alerts` | Sends branded HTML email via Resend; sends SMS via Twilio for paid users with `phone_number` and `sms_alerts_enabled = true`; HTML-escapes all payload values; updates `alerts.delivered_at`. |
| `send-digest-alert` | `x-internal-secret` | Invoked by `poll-appointments` for multi-slot bursts | Bundles 2+ slots into a single email; falls back to `send-alert` on failure. |
| `send-push` | `x-internal-secret` | Invoked by alert pipeline | Web Push delivery; cleans up expired subscriptions. VAPID JWT signing is currently simplified — full handshake is on the roadmap. |
| `create-checkout` | User JWT | User clicks upgrade | Creates a Stripe one-time Checkout session with inline `price_data`. CORS-restricted to `onalert.app` and `localhost:5173`. Reuses an existing Stripe customer for the user when present. |
| `customer-portal` | User JWT | User clicks "Manage billing" | Returns Stripe Customer Portal URL for the user's customer record. |
| `track-booking-click` | User JWT | User clicks the booking CTA | Logs the outbound click to `booking_clicks` for attribution. |
| `stripe-webhook` | Stripe signature + `stripe_events` idempotency | Stripe events | Validates signature with `STRIPE_WEBHOOK_SECRET`. Claims event in `stripe_events` table for at-most-once semantics; rolls back claim on handler error to allow retries. Handles `checkout.session.completed` (upgrade), `charge.refunded` and `charge.dispute.created` (downgrade to free). Validates `amount_total` against expected plan price to defend against price tampering. |
| `public-wait-times` | Public GET (CORS-cached 5 min) | Public traffic on `/wait-times` and `/locations/*` | Returns aggregate wait-time stats: slots/week, average fill minutes, last slot, per-location breakdown. Backs the public SEO surfaces. |

### Auth-tier enforcement

The shared CORS module is in `supabase/functions/_shared/`. Each function checks its required header before any business logic:

- **CRON tier** rejects requests missing `x-cron-secret` matching `CRON_SECRET`. Cron jobs embed the secret inline in `cron.job.command`.
- **Internal tier** rejects requests missing `x-internal-secret` matching `INTERNAL_FUNCTION_SECRET`. Only other edge functions invoke these.
- **User-JWT tier** uses Supabase's standard `Authorization: Bearer <jwt>` enforcement.
- **Stripe tier** validates the `stripe-signature` header against `STRIPE_WEBHOOK_SECRET` using `stripe.webhooks.constructEventAsync`.

## Data flow — the alert pipeline (the critical path)

```
1. pg_cron fires (every 1 min)
2. poll-appointments (x-cron-secret guarded):
   a. SELECT active monitors due for check (per-plan interval)
   b. Auto-pause free monitors > 7 days old
   c. Deduplicate location IDs across all due monitors
   d. Fetch CBP API in parallel batches of 5, 10s timeout per location
   e. Apply deadline filter for paid users with date_filter set
   f. For each monitor, diff current slots against config.last_known_slots
   g. For each NEW slot:
      - Single slot → INSERT into alerts, INVOKE send-alert
      - Multi-slot burst (Multi user, 2+ slots same window) → INVOKE send-digest-alert
   h. UPDATE monitors.config.last_known_slots
   i. UPDATE monitors.last_checked_at
   j. INSERT scrape_logs row with anomaly flags + correlation ID
   k. INSERT location_fetch_logs per location

3. send-alert (x-internal-secret guarded):
   a. SELECT user profile (email, phone, plan, notification prefs)
   b. Generate branded HTML email (dark, crimson header, HTML-escaped payload)
   c. POST to Resend (from: alerts@onalert.app)
   d. If paid + sms_alerts_enabled + phone_number: send Twilio SMS in parallel
   e. UPDATE alerts.delivered_at

4. send-push (x-internal-secret guarded, fired in parallel):
   a. SELECT push subscriptions for user
   b. Send to each endpoint
   c. Clean up expired/invalid subscriptions

5. Realtime:
   a. Supabase Realtime broadcasts the alerts INSERT event
   b. AlertsProvider context receives the row and pushes to useAlerts hook
   c. UI updates immediately, haptic vibration fires on mobile (useHaptics)
```

For free-tier users, step 2g routes the alert to `delay_until = now() + 15 min` instead of invoking `send-alert` immediately. `process-delayed-alerts` fires those once the window passes.

## Database schema

### Tables (current)

| Table | Purpose | RLS posture |
|-------|---------|-------------|
| `profiles` | Extends `auth.users`. Email, plan, stripe customer ID, notification prefs, phone, referral code. **Column-level UPDATE grants** (migration `012`) prevent self-elevation of `plan` or admin fields. CHECK constraint restricts `plan` to `free|pro|multi|express`. | Own record, restricted columns |
| `monitors` | Service type, location IDs, active flag, last-known-slots (JSONB), date_filter, last_checked_at, starred. **Server-side trigger** (migration `015`) enforces per-plan monitor caps. | Own records (full CRUD) |
| `alerts` | Slot payload (JSONB), delivery timestamps, read state, narrative text, delay_until (free-tier). **Unique partial index** on `(monitor_id, payload->>location_id, payload->>slot_timestamp)` prevents duplicates (migration `013`). | Own records (read + update read state) |
| `slot_history` | Every observed slot with `first_seen_at` / `gone_at`. Powers predictions, location intelligence, public wait-times. | Service role only |
| `scrape_logs` | Polling run audit trail: duration, slots found, alerts fired, anomaly flags, correlation IDs. | Read-only for all users |
| `location_fetch_logs` | Per-location HTTP status, latency, response shape per fetch. | Read-only for all users |
| `recheck_requests` | User-initiated slot recheck queue. RLS lets users create their own (migration `017` fix). | Own records |
| `booking_clicks` | Outbound CBP click attribution per alert. | Own records |
| `booking_stories` | Post-booking success-story prompts (with consent). | Own records |
| `push_subscriptions` | Web Push endpoints + keys per user. | Own records |
| `org_invites` (stub) | Organization invite flow scaffolding (endpoint not yet built). | Own records |
| `stripe_events` | Stripe webhook idempotency table — primary key on `event_id`, at-most-once semantics (migration `013`). | Service role only |

### Key relationships

```
auth.users (1) --> (1) profiles
profiles   (1) --> (N) monitors
monitors   (1) --> (N) alerts
alerts     (1) --> (N) booking_clicks
locations  (∞) <-- (∞) slot_history
profiles   (1) --> (N) push_subscriptions
profiles   (1) --> (N) recheck_requests
```

### Sample JSONB shapes

**`monitors.config`**
```json
{
  "location_ids": [5140, 5180, 5446],
  "service_type": "GE",
  "date_filter": "2026-08-15",
  "last_known_slots": {
    "5140": ["2026-04-15T14:30:00"]
  }
}
```

**`alerts.payload`**
```json
{
  "location_id": 5140,
  "location_name": "JFK International Airport",
  "slot_timestamp": "2026-04-15T14:30:00",
  "book_url": "https://ttp.cbp.dhs.gov/schedulerui/...",
  "service_type": "GE",
  "narrative": "Global Entry slot at JFK on Tuesday April 15 at 2:30 PM EDT"
}
```

### Indexes (key ones)
- `idx_monitors_user_id` — filter by user
- `idx_monitors_active` — partial on `WHERE active = true`
- `idx_alerts_user_id`
- `idx_alerts_created_at` — DESC for feed sort
- `idx_alerts_monitor_id`
- `idx_alerts_unique_slot` — UNIQUE partial: `(monitor_id, payload->>location_id, payload->>slot_timestamp)` (migration `013`)
- `idx_slot_history_location_created` — BTREE on `(location_id, created_at)` to fix N+1 (migration `013`)

### Triggers
- `handle_new_user` — auto-creates `profiles` row on `auth.users` signup
- `handle_profiles_updated_at` — maintains `updated_at` on profile change
- `enforce_monitor_cap` — rejects monitor INSERT if user is at plan cap (migration `015`)
- `sync_profile_email` — keeps `profiles.email` in sync with `auth.users.email` (migration `016`)

## Migrations (all 17)

| # | File | Purpose |
|---|------|---------|
| 001 | `001_initial_schema.sql` | Core tables, RLS, baseline indexes |
| 002 | `002_notification_preferences.sql` | `email_alerts_enabled`, `sms_alerts_enabled`, `phone_number` |
| 003 | `003_alert_delay.sql` | `alerts.delay_until` for free-tier delivery delay |
| 004 | `004_recheck_requests.sql` | Recheck request queue |
| 005 | `005_audit_observability.sql` | `scrape_logs` and `location_fetch_logs` |
| 006 | `006_sms_and_tracking.sql` | SMS delivery tracking, `booking_clicks` |
| 0066 | `0066_starred_and_cooldown.sql` | Starred monitors, monitor change cooldown |
| 007 | `007_slot_history.sql` | `slot_history` table for fill-time analysis |
| 008 | `008_push_and_stories.sql` | `push_subscriptions`, `booking_stories` |
| 009 | `009_referrals.sql` | Referral code + referred_by columns |
| 010 | `010_organizations.sql` | Org invite scaffolding |
| 011 | `011_fix_location_ids.sql` | Remap incorrect CBP location IDs in existing monitors and alerts |
| **012** | `012_security_hardening.sql` | **Security:** column-level UPDATE grants on `profiles` and `alerts`, CHECK constraint on plan values, RLS tightening |
| **013** | `013_idempotency_and_dedup.sql` | **Security:** `stripe_events` idempotency table, unique partial index on alerts to prevent duplicates, fill N+1 indexes |
| **014** | `014_missing_rls_policies.sql` | **Security:** missing RLS policies added; service-role-vs-user-JWT clarification |
| 015 | `015_monitor_cap_trigger.sql` | Server-side trigger enforcing per-plan monitor caps |
| 016 | `016_profile_email_resync.sql` | Sync `profiles.email` with `auth.users.email` via trigger |
| 017 | `017_recheck_requests_fix.sql` | Fix RLS that was preventing users from creating their own rechecks |

> **Migration history note:** because of historical drift, applying migrations on the linked Supabase project must use the Management API pattern documented in the project memory; `supabase db push` cannot reconcile cleanly. See [DEPLOYMENT.md](./DEPLOYMENT.md).

## Frontend architecture

### Routing (18 pages)

```
Public:
  /                          → LandingPage
  /auth                      → AuthPage (Google + email/password + magic link)
  /auth/reset                → ResetPasswordPage
  /privacy                   → PrivacyPage
  /terms                     → TermsPage
  /locations                 → LocationsIndexPage
  /locations/:locationId     → LocationPage
  /guide                     → GuidePage
  /wait-times                → WaitTimesPage

Protected (AppLayout, auth guard):
  /app                       → DashboardPage
  /app/alerts                → AlertsPage
  /app/alerts/:id            → AlertDetailPage
  /app/add                   → AddMonitorPage
  /app/settings              → SettingsPage
  /app/interview-prep        → InterviewPrepPage
  /app/organization          → OrganizationPage (org invites — endpoint stub)
  /app/admin/audit           → AdminAuditPage

Catch-all:
  *                          → NotFoundPage (also rendered inside AppLayout for /app/*)
```

### State management

- **No global store.** React hooks + Supabase Realtime + a single `AlertsProvider` context for the realtime alerts channel.
- **Hooks:**
  - `useProfile` — current user, plan, prefs (with `isPaid`, `isMulti`, `isExpress` derivations)
  - `useMonitors` — CRUD + realtime sync + optimistic updates with rollback
  - `useAlerts` — feed + realtime inserts + unread count + mark-read
  - `useInsights` — slot frequency / trend math (free tier basic, Pro+ advanced)
  - `useAuditData` — scrape & fetch logs for `/app/admin/audit`
  - `useLocationIntelligence` — per-location history (days since last alert, 30-day count, avg fill)
  - `useKeyboardShortcuts` — Cmd+K, Esc, etc.
  - `useToast` — Sonner-backed toast notifications
- All hooks include null-supabase guards so the public landing page renders even without env vars.

### Component hierarchy

```
main.tsx
└── ErrorBoundary
    └── App (BrowserRouter)
        ├── LandingPage / AuthPage / Locations* / Guide / Wait / Privacy / Terms
        └── AppLayout (auth guard)
            ├── Sidebar (desktop)
            ├── PageHeader
            ├── <Outlet/>  ← page content
            └── BottomNav (mobile, with unread alert badge)
```

Component directories: `dashboard/`, `monitors/`, `alerts/`, `settings/`, `layout/`, `ui/` (shadcn/ui primitives).

## Security model

| Concern | Control |
|---------|---------|
| Data isolation | Row-level security on every user-owned table |
| Privilege escalation | Column-level UPDATE grants prevent users from changing `plan` or admin flags (migration `012`) |
| Plan tampering | CHECK constraint on `profiles.plan` (migration `012`) + price validation in `stripe-webhook` |
| Webhook authenticity | Stripe signature verification with `STRIPE_WEBHOOK_SECRET` |
| Webhook replay | `stripe_events` idempotency table (migration `013`) |
| Cron auth | Every cron-triggered function requires `x-cron-secret = CRON_SECRET`; secret embedded inline in `cron.job.command` |
| Internal function auth | `send-alert`, `send-digest-alert`, `send-push` require `x-internal-secret = INTERNAL_FUNCTION_SECRET` |
| Stored XSS | All alert payload fields HTML-escaped before email rendering |
| Duplicate alerts | Unique partial index `(monitor_id, location_id, slot_timestamp)` |
| Browser security | HSTS (max-age=63072000), X-Frame-Options=DENY, no-sniff, strict-origin referrer policy, restricted Permissions-Policy via `vercel.json` |
| Search-engine isolation | `/app/*` routes serve `noindex, nofollow` headers |
| CORS | `create-checkout` and `customer-portal` restrict to `onalert.app` and `localhost:5173` only |

## Operational notes

- Production project ref: `zcreubinittdqyoxxwtp` (Supabase, East US Virginia)
- **Migration application** uses the Supabase Management API rather than `supabase db push` because of a phantom `006` history entry from an early manual SQL run. Pattern is captured in the project's auto-memory.
- **Cron jobs** `poll-appointments-every-1-min` and `process-delayed-alerts-every-5-min` embed `CRON_SECRET` inline. Rotating `CRON_SECRET` requires re-creating both jobs in the same SQL transaction.
- **Audit dashboard** at `/app/admin/audit` is the first place to look when alerts stop flowing — the April 2026 incident where polling silently 401'd for 3 weeks would have been caught immediately if the dashboard had been monitored.
