# Features

Authoritative inventory of what OnAlert does, organized by surface and by plan tier. Sales/marketing AI agents should treat this file as the source-of-truth for what to claim in copy.

## Programs supported

OnAlert covers all three CBP Trusted Traveler enrollment programs. **TSA PreCheck is a benefit included in all three** — there is no separate TSA PreCheck monitor, because users who complete any of these programs automatically receive PreCheck.

| Program | Cost | Validity | What you get |
|---------|------|----------|--------------|
| **Global Entry (GE)** | $100 | 5 years | Expedited US customs + TSA PreCheck |
| **NEXUS** | $50 | 5 years | Expedited US ↔ Canada + Global Entry + TSA PreCheck |
| **SENTRI** | $122.25 | 5 years | Expedited US ↔ Mexico land crossings + Global Entry + TSA PreCheck |

Per-program journey, prerequisites, and booking steps are defined in `src/lib/programs.ts`.

## Locations supported

**45 enrollment centers** mapped by ID against the live CBP scheduler. Coverage includes every high-demand metro: NYC (JFK, Bowling Green), Newark, LA (LAX), San Francisco, Chicago O'Hare, Miami, Seattle-Tacoma, Boston-Logan, Atlanta, Dallas/Fort Worth, Denver, Las Vegas, Phoenix, Washington Dulles, Houston, Minneapolis-St. Paul, Portland, San Diego, Tucson, Albuquerque, and more.

Source: `src/lib/locations.ts` — IDs verified against `https://ttp.cbp.dhs.gov/schedulerapi/locations/`.

## Core capabilities

### Monitor management
- 3-step creation wizard: service type → locations → confirm
- Pause / resume without deleting configuration
- Delete with confirmation dialog
- Plan-enforced limits (server-side trigger in migration `015_monitor_cap_trigger.sql` plus client UI)
- Starred monitors and per-tier change cooldowns (migration `0066`)
- Free-tier 7-day window with auto-pause

### Alert pipeline
- **Detection** via stateful diff: `poll-appointments` compares the current CBP API response against `monitors.config.last_known_slots` and emits an alert only for genuinely new slots
- **Per-plan polling cadence**: 60 min (Free), 5 min (Pro/Multi), 1 min (Express); enforced inside the function regardless of CRON frequency
- **Deadline filter**: Pro+ users can set a latest acceptable date; slots after the date are silently filtered
- **Smart digest**: when 2+ slots fire for a Multi user in the same window, alerts bundle into a single digest email
- **Slot recheck / pre-verification**: Pro+ users can request an automatic recheck ~2 minutes after an alert fires; Express runs auto-verification 30s before delivery (in progress)
- **Free-tier delivery delay**: 15 minutes via `process-delayed-alerts` CRON to preserve paid-tier speed advantage
- **Realtime feed**: alerts arrive in `/app/alerts` with no page refresh, via Supabase Realtime on the `alerts` table
- **Haptic feedback**: mobile devices vibrate on new alert (`useHaptics`)
- **Mark-as-read**: automatic on view; visible unread badge on the bottom-nav bell

### Notification channels
| Channel | Status | Notes |
|---------|--------|-------|
| Branded HTML email | **Live** | Resend; dark-themed, HTML-escaped payloads, includes booking deep-link |
| Smart digest email | **Live** | `send-digest-alert`; bundles multi-slot alerts |
| SMS | **Live** | Twilio; paid plans only; gated on `profile.sms_alerts_enabled` + `phone_number` |
| Web push | **Partial** | Subscription wired, send path simplified — VAPID JWT signing on the roadmap |
| In-app realtime | **Live** | Supabase Realtime on `alerts` table |

### Authentication
- **Google OAuth** — one-tap sign-in
- **Email + password** — 6+ character passwords
- **Magic link** — passwordless email link
- **Session persistence** with auto-refresh tokens
- **`/app` auth guard** with deep-link preservation (regression-tested fix in `a888fb3`)
- **Password reset flow** at `/auth/reset`

### Payments & billing
- **Stripe one-time Checkout** — no subscription anywhere in the system
- **Idempotent webhook** — `stripe_events` table (migration `013`) gives at-most-once semantics; rolled-back on handler failure to allow retries
- **Signature-verified** — `stripe.webhooks.constructEventAsync` with `STRIPE_WEBHOOK_SECRET`
- **Price-tampering defense** — webhook validates `amount_total` against expected plan price before applying
- **Refund handling** — `charge.refunded` and `charge.dispute.created` automatically downgrade to Free
- **Customer portal** for managing payment methods and viewing receipts
- **Legacy `family` plan alias** is normalized to `multi` for backwards compatibility (older purchases)

### Pro+ exclusives
- Deadline date filter
- Smart digest alerts
- Advanced location insights (frequency, days since last alert, average fill time)
- Slot re-check / pre-verification
- Admin observability page (`/app/admin/audit`) — poll history, location fetch logs, anomaly flags

### Express exclusives
- 1-minute polling (60× faster than Free, 5× faster than Pro/Multi)
- Priority alert pipeline
- Pre-verified slot confirmation (auto-recheck before delivery)

### Public surfaces
- **Landing page** (`/`) — hero, program badges, pricing, agency logos, social proof scaffolding
- **Locations directory** (`/locations`) — searchable, indexable directory of all 45 enrollment centers
- **Per-location pages** (`/locations/:locationId`) — wait time, services, slot history snippet
- **Wait Times** (`/wait-times`) — public aggregate stats (slots/week, avg fill time per location)
- **Guide** (`/guide`) — how OnAlert works, in plain English
- **Privacy** (`/privacy`) and **Terms** (`/terms`)
- **Per-page SEO meta tags** via react-helmet-async (regression fix `10d876e`)

### App surfaces
- **Dashboard** (`/app`) — quick stats, monitor list, activity feed, insights cards, all-clear card, prediction card, plan-aware upsells
- **Alerts** (`/app/alerts`) — reverse-chronological feed with filter bar, unread badge
- **Alert detail** (`/app/alerts/:id`) — full slot info, location intelligence, time warning, booking CTA
- **Add monitor** (`/app/add`) — 3-step wizard
- **Settings** (`/app/settings`) — profile, notification toggles, plan/billing, phone (SMS), upgrade overlay, danger zone
- **Interview prep** (`/app/interview-prep`) — per-program steps and document checklist
- **Organization** (`/app/organization`) — org invite stub (endpoint not yet built)
- **Admin audit** (`/app/admin/audit`) — observability dashboard

### PWA
- Installable on iOS, Android, desktop
- Workbox service worker for offline caching
- Custom 192px / 512px icons, standalone display, portrait orientation
- Custom splash and theme color (crimson `#9F0506`)

### Security & ops
- Row-level security on every user-owned table
- Column-level UPDATE grants on `profiles` and `alerts` (users cannot self-elevate plan or admin status — migration `012`)
- CHECK constraint on `profiles.plan` restricting values to `free | pro | multi | express` (migration `012`)
- Edge function auth tiering:
  - **CRON tier** (`x-cron-secret`): `poll-appointments`, `process-delayed-alerts`, `process-rechecks`, `predict-slots`
  - **Internal tier** (`x-internal-secret`): `send-alert`, `send-digest-alert`, `send-push`
  - **User-JWT tier**: `create-checkout`, `customer-portal`, `track-booking-click`
  - **Stripe-signature tier**: `stripe-webhook`
  - **Public**: `public-wait-times` (GET, 5-minute CORS cache)
- Stripe webhook idempotency table (`stripe_events`)
- Unique partial index on `alerts(monitor_id, location_id, slot_timestamp)` to prevent duplicate alerts (migration `013`)
- HSTS, X-Frame-Options DENY, no-sniff, strict-origin referrer policy, restricted Permissions-Policy
- `/app/*` is `noindex, nofollow` to keep authenticated pages out of search

## Plan-by-plan feature matrix

| Feature | Free | Pro ($39) | Multi ($59) | Express ($79) |
|---------|------|-----------|-------------|----------------|
| Active monitors | 1 | 1 | 5 | 1 |
| Locations per monitor | 3 | 10 | Unlimited | Unlimited |
| Check interval | 60 min (enforced) | 5 min (12× faster) | 5 min (12× faster) | **1 min (60× faster)** |
| Email alert delivery | Delayed 15 min | Instant | Instant | Priority instant |
| SMS alerts | — | Yes | Yes | Yes |
| Web push | — | Yes | Yes | Yes |
| Real-time in-app feed | Yes | Yes | Yes | Yes |
| Direct booking deep-links | Yes | Yes | Yes | Yes |
| Deadline date filter | — | Yes | Yes | Yes |
| Smart digest alerts | — | Yes | Yes | Yes |
| Advanced location insights | — | Yes | Yes | Yes |
| Slot re-check alerts | — | Yes | Yes | Auto-verified |
| Monitor change cooldown | — | 24h | None | None |
| Monitoring window | 7 days | Forever | Forever | Forever |
| Payment | Free | One-time | One-time | One-time |

## Roadmap (selected)

- [ ] Web Push hardened with VAPID JWT signing
- [ ] Live booking counter on landing page
- [ ] 30-day money-back guarantee (Stripe refunds wired)
- [ ] Post-booking referral program with credit tracking
- [ ] Slack / Discord webhook channels
- [ ] Multi-language support (Spanish, French)
- [ ] Email delivery status tracking via Resend webhooks
- [ ] Alert retry mechanism for transient delivery failures
- [ ] Cornerstone SEO content ("Complete Guide to Getting Your Global Entry Interview Faster")
- [ ] Per-location SEO guides for top 20 enrollment centers
- [ ] Employer / group plans with consolidated billing
