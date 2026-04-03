# History

## Project Timeline

### v0.1.0 -- Initial Build (March 2026)

**Commit**: `5499ac1` -- feat: initial OnAlert build -- government appointment monitor

First working version of the platform:
- React 18 + TypeScript + Vite frontend
- Supabase backend with auth, database, edge functions
- CBP API integration for appointment slot monitoring
- Email notifications via Resend
- Stripe payments (monthly + annual subscriptions)
- PWA with Workbox service worker
- Dark terminal-aesthetic design system (Bloomberg-inspired)
- 7 pages: Landing, Auth, Dashboard, Alerts, Alert Detail, Add Monitor, Settings
- 50 top CBP enrollment locations
- Bottom navigation with unread alert badge

### v0.1.1 -- Cleanup (March 2026)

**Commit**: `7df28aa` -- chore: remove fractional-circle artifacts -- clean slate for OnAlert

Removed artifacts from a previous project to establish a clean codebase.

### v0.1.2 -- Component Cleanup (March 2026)

**Commit**: `dba072c` -- fix: remove unused shadcn/ui components with missing deps

Removed 23 unused UI component files that had missing dependencies. Reduced bundle size and eliminated build warnings.

### v0.2.0 -- Reliability & Documentation (March 2026)

**Commits**: `175fcbf` through `38f0d76`

Major reliability and documentation overhaul:

**Blank screen fix**:
- Extracted `PLANS` into zero-dependency `src/lib/plans.ts`
- Replaced fatal throw in `supabase.ts` with warning + null fallback
- Added top-level `ErrorBoundary` component with inline styles

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
- Accessibility improvements: ARIA labels on navigation, search input

**Build fixes**:
- Added missing `warning` color to Tailwind config
- Added `tsbuildinfo` and `test-results/` to `.gitignore`

**Documentation**:
- Created comprehensive `docs/` directory with 16 documents
- Added `.env.example` file
- Updated README with complete project information

### v0.2.1 -- Text Cleanup (March 2026)

**Commit**: `225e2fb` -- fix: replace all em dashes with regular hyphens across codebase

Standardized all em dashes to regular hyphens for consistency across the codebase and documentation.

### v0.3.0 -- Authentication & UX Overhaul (March 2026)

**Commits**: `e7d4839` through `0921b87`

Major authentication and user experience improvements:

**Multi-method authentication**:
- Added Google OAuth sign-in (one-tap via Supabase Auth)
- Added email + password sign-up and sign-in (6+ character passwords)
- Retained magic link as a third option
- Auth page redesigned with mode switching (sign_in, sign_up, magic_link, google)

**Mobile hero redesign**:
- Hero logo displayed at 3x scale for brand impact
- Icon-only mobile headers to maximize content space
- Desktop navbar retains full wordmark

**Favicon and PWA improvements**:
- Added icon favicon for all browsers
- Added icon to desktop navbar
- Updated apple-touch-icon

**UX audit fixes**:
- Improved mobile layout and spacing
- Enhanced visual hierarchy on landing page

## Architecture Decisions

See [DECISIONS_LOG.md](./DECISIONS_LOG.md) for detailed rationale behind key technical choices.
