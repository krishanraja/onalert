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
- [ ] Custom check intervals (beyond 10/60min)
- [ ] Historical slot availability charts
- [ ] Multi-language support (Spanish, French)
- [ ] Email preference center
- [ ] Monitor sharing between family members

### Infrastructure
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated testing (Vitest + React Testing Library)
- [ ] Error tracking (Sentry)
- [ ] Analytics (PostHog or Plausible)
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
