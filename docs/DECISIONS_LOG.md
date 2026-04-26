# Decisions Log

Key technical and product decisions with rationale. New decisions should be appended (do not renumber).

## D001 — Multi-method authentication

**Decision**: support Google OAuth, email + password, and magic link — let users choose their preferred method.

**Rationale**:
- Google OAuth reduces friction to near-zero for the majority of users
- Email + password is a familiar fallback for users who prefer traditional auth
- Magic link offers passwordless convenience for email-first users
- Multiple options maximize conversion by removing sign-up barriers
- Supabase Auth handles all three methods natively with minimal code

**Trade-off**: slightly more complex auth UI (mode switching), but the conversion lift outweighs the complexity.

**History**: originally launched with magic link only. Added Google OAuth and email + password in v0.3.0 based on onboarding feedback.

## D002 — Dark Bloomberg-terminal aesthetic

**Decision**: dark UI with crimson (`#9F0506`) accents and monospace data styling.

**Rationale**:
- Conveys precision, reliability, and urgency — critical for a monitoring product
- Reduces eye strain for users who check frequently
- Crimson communicates alertness without being aggressive
- Differentiates from generic SaaS designs in the travel-tools space
- Monospace (Fira Code) for data reinforces the "terminal" feel

## D003 — Supabase, not Firebase

**Decision**: use Supabase for auth, database, edge functions, and realtime.

**Rationale**:
- PostgreSQL with RLS provides robust, row-level data security
- Edge Functions (Deno) for server-side logic without a separate backend
- Realtime subscriptions for live in-app alerts
- Single platform reduces operational complexity
- Open source / self-hostable as an escape hatch

## D004 — Vite + React SPA, not Next.js

**Decision**: pure SPA with Vite, no SSR framework.

**Rationale**:
- App is entirely client-side after initial load (dashboard, monitors, alerts)
- SEO needs are limited to public surfaces (landing, locations, wait-times) which are server-rendered HTML at build time
- Faster development iteration with Vite HMR
- Simpler deployment (static files to CDN)
- PWA support via vite-plugin-pwa is clean
- Smaller footprint than Next.js for a pure SPA use case

## D005 — Inline Stripe pricing, not pre-created products

**Decision**: create Stripe prices inline in `create-checkout` using `price_data`.

**Rationale**:
- Single source of truth for pricing lives in code, not the Stripe Dashboard
- No need to sync product IDs across environments
- Easier to test (no Dashboard setup required)
- Acceptable because the price points are few and stable

**Trade-off**: cannot use Stripe Dashboard for price management. Acceptable.

## D006 — Polling, not webhooks, for the CBP API

**Decision**: poll the CBP scheduler API on a CRON schedule rather than waiting for callbacks.

**Rationale**:
- The CBP API has no webhook or push capability
- Polling is the only mechanism available
- 5-minute interval (Pro/Multi), 1-minute (Express), 60-minute (Free) balance freshness vs. API load
- Batch deduplication across all monitors reduces total API calls
- Parallel fetching in batches of 5 with timeouts prevents rate-limit storms

## D007 — In-app realtime, plus push (in progress)

**Decision**: use Supabase Realtime for in-app live alerts. Web Push is being added on top, not replacing email.

**Rationale**:
- Email is the primary delivery channel; works whether the app is open or not
- Realtime enhances the in-app experience for active sessions
- Web Push is the "while you're not in the app, on mobile" channel — added later

**Status**: Web Push subscription path is wired, but full VAPID JWT signing is on the roadmap (`send-push/index.ts` currently uses a simplified path).

## D008 — No global state library

**Decision**: use React hooks + a single `AlertsProvider` context + Supabase Realtime instead of Redux / Zustand / etc.

**Rationale**:
- Minimal cross-component shared state (profile, monitors, alerts)
- Each hook manages its own data lifecycle
- Realtime handles cross-tab sync
- Avoids dependency overhead and boilerplate
- Hooks are composable and testable without a store

## D009 — Optimistic updates with rollback

**Decision**: update UI immediately on user actions; rollback on server error.

**Rationale**:
- Makes the app feel instant
- Used in monitor toggle, delete, and alert mark-read
- Rollback ensures consistency without user confusion

## D010 — Decouple `PLANS` from the Supabase import chain

**Decision**: move `PLANS` into `src/lib/plans.ts` with zero dependencies.

**Rationale**:
- The landing page only needs static pricing to render
- Previous chain: `LandingPage → stripe.ts → supabase.ts`
- If `supabase.ts` failed (missing env vars), the entire landing page crashed
- Decoupling guarantees the public landing page always renders

## D011 — 3× hero logo on mobile

**Decision**: display the OnAlert logo at 3× scale in the mobile hero.

**Rationale**: mobile hero has limited vertical space; a large logo creates immediate brand impact. Icon-only header on mobile conserves space; the hero carries the brand weight.

## D012 — Icon-only mobile header

**Decision**: icon-only nav on mobile, full wordmark on desktop.

**Rationale**: 375px viewport has limited horizontal space. Bottom navigation provides primary navigation on mobile.

## D013 — One-time payments, not subscriptions

**Decision**: every paid tier is a one-time purchase. No subscriptions anywhere in the system.

**Rationale**:
- Aligns with how customers actually use the product (until they book the interview, then they're done)
- Removes the #1 objection in the category ("am I going to be charged forever?")
- Eliminates cancellation churn and dunning ops entirely
- Stripe webhook surface is much smaller (only `checkout.session.completed`, `charge.refunded`, `charge.dispute.created`)

**Trade-off**: no recurring revenue per customer. Mitigated by tiered pricing (Free → Pro → Multi → Express) and word-of-mouth referrals; the customer LTV is single-purchase but the funnel doesn't need to overcome a subscription objection.

## D014 — TSA PreCheck is bundled, not a standalone monitor

**Decision**: support only Global Entry, NEXUS, and SENTRI. TSA PreCheck is documented as a bundled benefit of all three.

**Rationale**:
- TSA PreCheck enrollment uses a different scheduling system than CBP TTP and is not on the same API
- All three CBP TTP programs include PreCheck as a benefit anyway
- Users who want only PreCheck are better served by applying for Global Entry directly (same fee, broader benefit)
- Reduces product confusion and code surface

**History**: an earlier landing page included a TSA logo and four-program copy. Cleaned up in `a3b6f6d` and the `034ad21` location-ID remap.

## D015 — Tiered urgency pricing (add Express $79)

**Decision**: introduce Express ($79 one-time) with 1-minute polling and priority delivery, on top of Pro ($39) and Multi ($59).

**Rationale**:
- Captures peak willingness-to-pay at the moment of highest need (confirmed trip <2 weeks)
- Differentiates clearly from Pro (5-min polling) — the math meaningfully favors Express in tight windows
- Adds a third price point to the value ladder, supporting expansion revenue

**Trade-off**: more SKUs to maintain. Acceptable — they share the same edge-function and webhook code paths.

## D016 — Edge function auth tiering (CRON / internal / user-JWT / Stripe)

**Decision**: every edge function checks a tier-specific header before any business logic. Four tiers: `x-cron-secret`, `x-internal-secret`, user JWT, Stripe signature.

**Rationale**:
- Pre-audit, several functions accepted requests with only the anon key, which is publicly exposed in the frontend bundle
- Tiered secrets make it impossible for an attacker with the anon key to invoke cron-only or internal-only functions
- Idempotent and cheap to enforce — single header check at the top of each function

**Implementation**: rolled out across all 12 edge functions in PR #49 (April 2026). `CRON_SECRET` and `INTERNAL_FUNCTION_SECRET` are required env vars in production.

**Operational gotcha**: cron jobs embed `CRON_SECRET` inline in `cron.job.command`, so rotation requires re-creating the cron jobs in the same SQL transaction. (See April 2026 incident.)

## D017 — Stripe webhook idempotency table

**Decision**: every Stripe webhook event is claimed in a `stripe_events` table (primary key on `event_id`) before any side effect.

**Rationale**:
- Stripe will retry events on any non-2xx response; without idempotency, retries can double-apply state changes (double-upgrade, double-refund)
- The claim is rolled back if the handler errors so Stripe will retry safely
- At-most-once semantics with retry safety

**Migration**: `013_idempotency_and_dedup.sql`.

## D018 — Column-level UPDATE grants on `profiles` and `alerts`

**Decision**: revoke direct UPDATE on sensitive columns (`plan`, `is_admin`, etc.) from the `authenticated` role; updates only flow through trusted edge functions or trigger-controlled paths.

**Rationale**:
- Pre-audit, RLS allowed users to UPDATE their own row, including `plan` — a user could theoretically self-elevate to Pro/Multi/Express
- Column-level grants close that hole at the privilege layer rather than relying on app code

**Migration**: `012_security_hardening.sql`. Includes a CHECK constraint restricting `plan` to `free | pro | multi | express`.

## D019 — Unique partial index on alerts

**Decision**: add a unique partial index on `alerts(monitor_id, payload->>location_id, payload->>slot_timestamp)` to prevent duplicate alerts for the same slot.

**Rationale**:
- Without this, a transient bug or retry could fire two alerts for the same slot, eroding user trust ("why did I get notified twice for the same slot?")
- Database-level constraint is robust regardless of application code

**Migration**: `013_idempotency_and_dedup.sql`. Migration deletes historical duplicates first so the unique index can be created (`e247717`).

## D020 — Per-page SEO meta via react-helmet-async

**Decision**: every public route sets its own `<title>` and `<meta name="description">` via `react-helmet-async`.

**Rationale**:
- Google Search Console flagged indexing issues on the SPA where every page rendered with the same default title
- Per-page meta enables proper indexing of `/locations/:id`, `/wait-times`, `/guide`, etc.
- Public surfaces are the SEO surface area; `/app/*` is `noindex, nofollow`

**Implementation**: `10d876e` (April 2026).
