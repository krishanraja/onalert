# Sprints & Roadmap

## Completed Sprints

### Sprint 1: Reliability & Polish (Completed)

**Goal**: Ensure the app is production-ready with bulletproof data pipeline and comprehensive documentation.

- [x] Fix blank screen (module-level throw in supabase.ts)
- [x] Add ErrorBoundary for graceful error display
- [x] Decouple PLANS from supabase import chain
- [x] Add location names to poll-appointments
- [x] Parallel CBP API fetching with timeouts
- [x] Direct send-alert invocation from poll-appointments
- [x] Null supabase guards in all hooks
- [x] Optimistic updates with rollback
- [x] Error feedback on all user actions
- [x] Empty states for search results
- [x] Accessibility improvements (ARIA labels)
- [x] Create comprehensive project documentation (16 docs)

### Sprint 2: Authentication & UX (Completed)

**Goal**: Reduce sign-up friction and improve mobile experience.

- [x] Add Google OAuth sign-in
- [x] Add email/password sign-up and sign-in
- [x] Redesign auth page with mode switching
- [x] Redesign mobile hero section (3x logo)
- [x] Icon-only mobile headers
- [x] Add favicon for all browsers
- [x] Add icon to desktop navbar
- [x] UX audit and fixes
- [x] Replace em dashes with hyphens across codebase

### Sprint 3: Observability, Redesign & Analytics (Completed)

**Goal**: Add operational visibility, redesign core pages, and integrate analytics.

- [x] Admin audit & observability page (poll runs, location fetches, health checks)
- [x] Humblytics analytics integration with custom event tracking
- [x] Redesigned alerts page with unified card layout and filter bar
- [x] Redesigned homepage and pricing strategy
- [x] Government agency logos on landing page (DHS, CBP, TSA)
- [x] Email sender domain fix (alerts@onalert.app)
- [x] Dedicated 404 page with navigation
- [x] UX touch target improvements for mobile accessibility
- [x] Plan pricing update (Pro $39, Multi $59)
- [x] Replaced mobile Tinder-style swipe with scrollable alert list
- [x] Show all monitor slots inline on settings page
- [x] Smart digest alerts (send-digest-alert edge function)
- [x] Slot re-check alerts (process-rechecks edge function)
- [x] Delayed alert processing for free users (process-delayed-alerts edge function)
- [x] UX test report and production readiness verification

## Current Sprint: Notifications & Growth

**Goal**: Expand notification channels and lay groundwork for user acquisition.

### Priority Items
- [ ] SMS notifications via Twilio (premium feature)
- [ ] Add user phone number field to profiles
- [ ] Push notifications via Web Push API
- [ ] Email delivery status tracking (Resend webhooks)
- [ ] Alert retry mechanism for failed deliveries
- [ ] SEO optimization for landing page

## Backlog

### Features (High Priority)
- [ ] Slack/Discord webhook integration (premium)
- [ ] Multiple alert channels per monitor
- [ ] Alert snooze/mute functionality
- [ ] Appointment booking deep links (per-location URLs)
- [ ] Referral system for organic growth

### Features (Medium Priority)
- [ ] Custom check intervals (beyond 5/60min)
- [ ] Historical slot availability charts
- [ ] Multi-language support (Spanish, French)
- [ ] Email preference center
- [ ] Monitor sharing between family members

### Infrastructure
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated testing (Vitest + React Testing Library)
- [ ] Error tracking (Sentry)
- [x] Analytics (Humblytics -- integrated)
- [ ] Uptime monitoring (Checkly or UptimeRobot)
- [ ] Database backups automation
- [ ] Staging environment

### Optimizations
- [ ] Lazy-load routes (React.lazy + Suspense)
- [ ] Image optimization (WebP/AVIF)
- [ ] Create OG image for social sharing
- [ ] Cache CBP API responses for 5-minute TTL
- [ ] Bundle size analysis and tree-shaking audit
- [ ] Lighthouse performance optimization (target 95+)
