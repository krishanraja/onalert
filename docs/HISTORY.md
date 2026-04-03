# History

## Project Timeline

### v0.1.0 — Initial Build (April 2026)

**Commit**: `5499ac1` — feat: initial OnAlert build — government appointment monitor

First working version of the platform:
- React 18 + TypeScript + Vite frontend
- Supabase backend with auth, database, edge functions
- CBP API integration for slot monitoring
- Email notifications via Resend
- Stripe payments (monthly + annual)
- PWA with service worker
- Dark terminal-aesthetic design system
- 7 pages: Landing, Auth, Dashboard, Alerts, Alert Detail, Add Monitor, Settings
- 50 top CBP enrollment locations

### v0.1.1 — Cleanup (April 2026)

**Commit**: `7df28aa` — chore: remove fractional-circle artifacts — clean slate for OnAlert

Removed artifacts from a previous project to establish a clean codebase.

### v0.1.2 — Component Cleanup (April 2026)

**Commit**: `dba072c` — fix: remove unused shadcn/ui components with missing deps

Removed 23 unused UI component files that had missing dependencies. Reduced bundle size.

### v0.2.0 — Reliability & Documentation (April 2026)

**Commit**: `175fcbf+` — fix: resolve blank screen + comprehensive hardening

Major reliability and documentation overhaul:

**Blank screen fix**:
- Extracted `PLANS` into zero-dependency `src/lib/plans.ts`
- Replaced fatal throw in `supabase.ts` with warning + null fallback
- Added top-level `ErrorBoundary` component

**Data pipeline hardening**:
- Added location name mapping to `poll-appointments` (was showing "Location 5140")
- Parallel CBP API fetches in batches of 5 with 10-second timeouts
- Direct invocation of `send-alert` from `poll-appointments` for immediate delivery
- Consistent timezone handling (America/New_York)

**Frontend robustness**:
- Null supabase guards in all hooks and pages
- Optimistic updates with rollback on error (useMonitors, useAlerts)
- Error feedback in AddMonitorPage, SettingsPage, MonitorCard
- Empty state for location search with no results
- Accessibility: ARIA labels on navigation, search input

**Documentation**:
- Created comprehensive `docs/` directory with 16 documents
- Added `.env.example` file
- Updated README with complete project information

## Architecture Decisions

See [DECISIONS_LOG.md](./DECISIONS_LOG.md) for detailed rationale behind key technical choices.
