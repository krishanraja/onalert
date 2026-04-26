# OnAlert

**Real-time CBP appointment alerts for the Trusted Traveler Programs.**

**[onalert.app](https://onalert.app)** — Stop checking. Start knowing.

OnAlert monitors the CBP scheduler for Global Entry, NEXUS, and SENTRI interview appointments (all three include TSA PreCheck) and notifies you within minutes when a slot opens from a cancellation. Set up a monitor once and OnAlert watches 24/7 so you never miss the 5–15 minute window before a slot fills.

---

## Why OnAlert exists

Millions of conditionally approved travelers wait 3–12 months for an enrollment interview at popular centers (JFK, LAX, SFO, ORD, EWR, DFW). The CBP scheduler offers no notification system. Cancellation slots open and refill within minutes. Manual refreshing is a losing strategy. OnAlert gives every applicant a fair shot at an early appointment with cloud-based 24/7 monitoring and instant multi-channel delivery.

## How it works

1. **Pick a program and locations** in a 3-step wizard (Global Entry, NEXUS, or SENTRI; up to 45 enrollment centers)
2. **OnAlert polls the CBP API** every 5 min (Pro/Multi), every 1 min (Express), or every 60 min (Free), 24/7
3. **You get an alert in seconds** — branded HTML email, optional SMS, web push, and an in-app realtime feed
4. **You book before it fills** with a one-tap deep link directly into the CBP scheduler at the right location and service

## Pricing — all one-time, no subscriptions

| Plan | Price | Monitors | Locations | Check interval | Channels | Notes |
|------|-------|----------|-----------|----------------|----------|-------|
| **Free** | $0 | 1 | 3 | 60 min | Email (15-min delay) | 7-day window |
| **Pro** | **$39 once** | 1 | 10 | 5 min | Email + SMS | Instant alerts, digest, recheck, insights, never expires |
| **Multi** | **$59 once** | 5 | Unlimited | 5 min | Email + SMS | All Pro + family/multi-applicant coverage, no cooldown |
| **Express** | **$79 once** | 1 | Unlimited | **1 min** | Email + SMS | Highest priority pipeline, pre-verified slots — for trips <2 weeks |

All paid tiers are one-time purchases. No subscriptions, no auto-renewal, no cancellation friction. You buy it until you book, then you're done.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS, shadcn/ui, react-router-dom, react-helmet-async |
| Backend | Supabase (Postgres + RLS, Auth, Edge Functions on Deno, Realtime, pg_cron) |
| Payments | Stripe one-time Checkout, signed webhooks with idempotency table |
| Email | Resend (transactional) |
| SMS | Twilio (paid plans, optional) |
| Web Push | Native Web Push API + VAPID (in progress) |
| Hosting | Vercel (static SPA + global CDN, security headers, HSTS) |
| PWA | Workbox service worker, installable on mobile |

## Quick start

```bash
git clone https://github.com/krishanraja/onalert.git
cd onalert
npm install
cp .env.example .env.local   # fill in your keys
npm run dev                   # http://localhost:5173
```

Required env vars (frontend):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_APP_URL=http://localhost:5173
```

See [docs/REPLICATION_GUIDE.md](docs/REPLICATION_GUIDE.md) for the full setup including Supabase, Stripe, Resend, Twilio, Google OAuth, edge function deployment, and pg_cron configuration.

## Project structure

```
src/
  pages/                # 18 routes (public + protected)
  components/           # dashboard/, monitors/, alerts/, settings/, layout/, ui/
  hooks/                # useProfile, useMonitors, useAlerts, useInsights,
                        # useAuditData, useLocationIntelligence, useKeyboardShortcuts, useToast
  contexts/             # AlertsProvider (single realtime channel)
  lib/                  # supabase, stripe, plans, cbpApi, locations, programs,
                        # time, utils, tracking, geolocation, haptics,
                        # pushNotifications, analytics, recommendations
  App.tsx               # Router (public + /app/* protected)
  main.tsx              # Entry + ErrorBoundary
  index.css             # Design tokens (HSL CSS variables)

supabase/
  functions/            # 12 edge functions, organized by auth tier
    poll-appointments/      # CRON, x-cron-secret guarded
    process-delayed-alerts/ # CRON, x-cron-secret guarded
    process-rechecks/       # CRON, x-cron-secret guarded
    predict-slots/          # CRON, x-cron-secret guarded
    send-alert/             # Internal, x-internal-secret guarded
    send-digest-alert/      # Internal, x-internal-secret guarded
    send-push/              # Internal, x-internal-secret guarded
    create-checkout/        # User JWT
    customer-portal/        # User JWT
    track-booking-click/    # User JWT
    stripe-webhook/         # Stripe signature + idempotency table
    public-wait-times/      # Public GET (5-min CORS cache)
  migrations/           # 17 SQL migrations (012/013/014 = security hardening)

docs/                   # 19 markdown documents (business, product, technical, GTM)
```

## Scripts

```bash
npm run dev      # Vite dev server
npm run build    # tsc -b + vite build (zero-tolerance type checking)
npm run lint     # ESLint
npm run preview  # Preview the production build
```

## Features at a glance

- **3 programs**: Global Entry, NEXUS, SENTRI (each includes TSA PreCheck — there is no standalone TSA PreCheck monitor)
- **45 enrollment centers** mapped by ID against the live CBP scheduler
- **Multi-method auth**: Google OAuth, email + password, magic link
- **Real-time alerts**: branded email + optional SMS + web push + in-app realtime feed with haptic feedback on mobile
- **Smart alert pipeline**: digest emails for multi-slot bursts, slot pre-verification (recheck), 15-min batched delivery on free
- **Predictive insights** (Pro+): per-location frequency, day-of-week patterns, average fill time, "best time to monitor"
- **Public wait-times directory**: indexable SEO pages for every enrollment center, fed by aggregate slot data
- **PWA**: installable on iOS/Android/desktop, dark Bloomberg-terminal aesthetic
- **Production-grade security**: column-level RLS, signed CRON + internal-function secrets, Stripe idempotency, signed webhooks, HSTS + tight Vercel security headers
- **Admin observability**: audit page with poll-run history, per-location fetch logs, anomaly flags, alert delivery stats

## Documentation

Full documentation lives in [`docs/`](docs/).

### Sales & marketing (for AI sales/marketing agents)
- **[Sales Playbook](docs/SALES_PLAYBOOK.md)** — Positioning, objection handling, persona scripts, channel-specific messaging
- **[Value Proposition](docs/VALUE_PROP.md)** — One-liners, benefits-by-persona, anchor stats, competitive teardown
- **[Ideal Customer Profile](docs/ICP.md)** — Personas, segments, intent signals, acquisition channels
- **[Outcomes](docs/OUTCOMES.md)** — Customer outcomes, KPIs, revenue milestones, ROI math
- **[Strategy](docs/STRATEGY.md)** — Five-layer competitive moat, growth loops, pricing innovation
- **[Executive Summary](docs/EXECUTIVE_SUMMARY.md)** — One-page brief for stakeholders

### Product
- **[Purpose](docs/PURPOSE.md)** — Why OnAlert exists, design philosophy
- **[Features](docs/FEATURES.md)** — Full feature inventory + plan-by-plan matrix
- **[Branding](docs/BRANDING.md)** — Identity, voice, logo usage, copy do/don't
- **[Design System](docs/DESIGN_SYSTEM.md)** — Tokens, typography, components
- **[Visual Guidelines](docs/VISUAL_GUIDELINES.md)** — Layout, responsive patterns, alert card anatomy

### Engineering
- **[Architecture](docs/ARCHITECTURE.md)** — System diagram, data flow, schema, all 12 edge functions, all 17 migrations, security model
- **[Deployment](docs/DEPLOYMENT.md)** — Vercel + Supabase + Stripe production deploy
- **[Replication Guide](docs/REPLICATION_GUIDE.md)** — Set up from scratch
- **[Common Issues](docs/COMMON_ISSUES.md)** — Troubleshooting
- **[Decisions Log](docs/DECISIONS_LOG.md)** — Technical decisions with rationale
- **[LLM Critical Thinking](docs/LLM_CRITICAL_THINKING_TRAINING.md)** — Guidelines for AI assistants editing this codebase

### Project management
- **[History](docs/HISTORY.md)** — Timeline and changelog
- **[Sprints](docs/SPRINTS.md)** — Roadmap, backlog, completed work

See [docs/README.md](docs/README.md) for the full documentation index.

## License

Proprietary. All rights reserved.
