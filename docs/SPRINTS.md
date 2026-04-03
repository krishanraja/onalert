# Sprints & Roadmap

## Current Sprint: Reliability & Polish

**Goal**: Ensure the app is production-ready with bulletproof data pipeline and comprehensive documentation.

### Completed
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
- [x] Create comprehensive project documentation

## Next Sprint: Notifications & Growth

### Priority Items
- [ ] SMS notifications via Twilio (premium feature)
- [ ] Add user phone number field to profiles
- [ ] Push notifications (Web Push API)
- [ ] Email delivery status tracking (Resend webhooks)
- [ ] Alert retry mechanism for failed deliveries

## Backlog

### Features
- [ ] Slack/Discord webhook integration
- [ ] Custom check intervals (beyond 10/60min)
- [ ] Multiple alert channels per monitor
- [ ] Alert snooze/mute functionality
- [ ] Appointment booking deep links (per-location URLs)
- [ ] Historical slot availability charts
- [ ] Multi-language support (Spanish, French)

### Infrastructure
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated testing (Vitest + React Testing Library)
- [ ] Error tracking (Sentry)
- [ ] Analytics (PostHog or Plausible)
- [ ] Uptime monitoring (Checkly or UptimeRobot)
- [ ] Database backups automation

### Optimizations
- [ ] Lazy-load routes (React.lazy + Suspense)
- [ ] Image optimization (WebP/AVIF)
- [ ] Create OG image for social sharing
- [ ] Cache CBP API responses for 5-minute TTL
- [ ] Bundle size analysis and optimization
