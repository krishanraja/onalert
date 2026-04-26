# Sprints & Roadmap

## Completed sprints

### Sprint 1 — Reliability & polish (March 2026)
**Goal**: production-ready alert pipeline and comprehensive documentation.
- [x] Blank-screen fix (D010)
- [x] ErrorBoundary
- [x] Decouple `PLANS` from supabase import chain
- [x] Location name mapping in `poll-appointments`
- [x] Parallel CBP API fetching with timeouts
- [x] Direct `send-alert` invocation from `poll-appointments`
- [x] Null supabase guards in all hooks
- [x] Optimistic updates with rollback (D009)
- [x] Error feedback on all user actions
- [x] Empty states for search results
- [x] Accessibility (ARIA labels)
- [x] Initial docs/ directory

### Sprint 2 — Authentication & UX (March 2026)
**Goal**: reduce sign-up friction, improve mobile experience.
- [x] Google OAuth (D001)
- [x] Email + password sign-up and sign-in
- [x] Auth page redesign with mode switching
- [x] Mobile hero redesign (3× logo, D011)
- [x] Icon-only mobile headers (D012)
- [x] Favicon for all browsers
- [x] Icon in desktop navbar
- [x] UX audit and fixes
- [x] Em-dash → hyphen normalization

### Sprint 3 — Observability, redesign & analytics (April 2026)
**Goal**: operational visibility, redesigned core pages, analytics.
- [x] Admin audit page (`/app/admin/audit`)
- [x] Humblytics analytics integration
- [x] Alerts page redesign (filter bar, live/history)
- [x] Homepage redesign + pricing strategy
- [x] Government agency logos
- [x] Email sender domain fix (alerts@onalert.app)
- [x] Dedicated 404 page
- [x] 44px touch targets enforced
- [x] Pro $39 / Multi $59 pricing live
- [x] `send-digest-alert` edge function
- [x] `process-rechecks` edge function
- [x] `process-delayed-alerts` edge function
- [x] UX test report and production readiness verification

### Sprint 4 — Settings, billing, and SEO polish (April 2026)
**Goal**: smooth out the conversion path and unblock organic SEO.
- [x] Settings page no-scroll mobile redesign with upgrade overlay
- [x] Per-page SEO meta tags via react-helmet-async (D020)
- [x] Mobile billing button visibility fix
- [x] Stripe error string surfaced to user
- [x] Location-specific deep-links into CBP scheduler
- [x] Location ID remap migration
- [x] TSA-as-program removed from landing page (D014)
- [x] Mobile no-scroll viewport enforced

### Sprint 5 — Audit & security hardening (April 2026, PR #49)
**Goal**: ship every fix from the full-app audit; production-grade security posture.
- [x] Edge function auth tiering across all 12 functions (D016)
- [x] `CRON_SECRET` and `INTERNAL_FUNCTION_SECRET` rolled out
- [x] Stripe webhook idempotency (`stripe_events` table) (D017)
- [x] Stripe price-tampering defense
- [x] Column-level UPDATE grants on profiles/alerts (D018)
- [x] Plan CHECK constraint
- [x] Unique partial index on alerts (D019)
- [x] Server-side monitor cap trigger
- [x] Profile email auto-resync
- [x] Recheck-requests RLS fix
- [x] Vercel security headers hardened (HSTS + restricted Permissions-Policy)
- [x] `/app/*` `noindex, nofollow`
- [x] Design tokens cleaned up (border + muted text contrast)
- [x] Magic-link deep-link auth regression fixed
- [x] Web Push subscribe stabilized

## Current sprint — Express tier launch & growth foundation

**Goal**: monetize peak willingness-to-pay with Express ($79); lay the foundation for compounding growth loops.

### Priority items
- [ ] Express ($79) launch — landing page placement, settings overlay, email lifecycle
- [ ] Pre-alert slot verification on Express (auto-recheck 30s before delivery)
- [ ] Web Push hardened with VAPID JWT signing
- [ ] Live booking counter on landing page
- [ ] 30-day money-back guarantee implementation (Stripe refunds wired)
- [ ] Post-booking referral prompt with $10-off coupon
- [ ] Cornerstone SEO content: "Complete Guide to Getting Your Global Entry Interview Faster"
- [ ] Twilio SMS lifecycle copy refresh

### Operational follow-ups (from PR #49)
- [ ] Rotate Supabase service-role JWT in dashboard
- [ ] Reconcile migration history (or freeze on Management API pattern)
- [ ] Build `/app/organization` invite endpoint
- [ ] Fix VAPID JWT signing in `send-push`

## Backlog

### Features (high priority)
- [ ] Slack / Discord webhook channels (premium)
- [ ] Per-location SEO guides for top 20 enrollment centers
- [ ] Location intelligence dashboard (frequency, day-of-week, fill-time)
- [ ] Slot survival rate displayed inline
- [ ] Wait-time index — citable benchmark
- [ ] Predictive alerts (requires 90+ days of slot_history)
- [ ] Public success stories feed (with consent)

### Features (medium priority)
- [ ] Custom check intervals beyond 1/5/60 min
- [ ] Historical slot availability charts on `/app/admin/audit`
- [ ] Multi-language support (Spanish, French)
- [ ] Email preference center (digest cadence, channels)
- [ ] Monitor sharing between family members (Multi-tier UX)
- [ ] Alert snooze / mute

### Features (B2B expansion)
- [ ] Employer / group plans with consolidated billing
- [ ] Volume discounts at 10/25/50 seats
- [ ] Self-serve admin console for org admins
- [ ] Optional concierge tier for Express users

### Infrastructure
- [ ] CI/CD pipeline (GitHub Actions: lint, build, deploy)
- [ ] Automated tests (Vitest + React Testing Library)
- [ ] Error tracking (Sentry)
- [x] Analytics (Humblytics — integrated)
- [ ] Uptime monitoring (Checkly or equivalent)
- [ ] Automated database backups
- [ ] Staging environment

### Optimizations
- [ ] Lazy-load routes (React.lazy + Suspense)
- [ ] Image optimization (WebP/AVIF) for landing page
- [ ] OG image refresh
- [ ] Cache CBP API responses for short TTL where safe
- [ ] Bundle size analysis + tree-shaking audit
- [ ] Lighthouse: target 95+ on every public surface
