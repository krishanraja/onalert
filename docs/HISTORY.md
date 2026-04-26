# History

Project timeline and changelog. New entries are appended at the top.

## v0.5.0 — Audit & hardening sprint (April 2026)

**PR**: #49 `audit-fixes-2026-04` (5 commits)

A full-app audit surfaced ~50 issues across security, functional correctness, design, and drift. PR #49 shipped fixes in five focused commits.

### Backend security hardening
- **Edge function auth tiering** rolled out across all 12 functions: `x-cron-secret` (cron tier), `x-internal-secret` (internal tier), user JWT (auth tier), Stripe signature (webhook tier). `CRON_SECRET` and `INTERNAL_FUNCTION_SECRET` are now required production env vars. (D016)
- **Stripe webhook idempotency** via the new `stripe_events` table (migration `013`). Events are claimed before any side effect; rolled back on handler error so Stripe will retry safely. (D017)
- **Stripe price-tampering defense** — webhook validates `amount_total` against expected plan price before applying.
- **Column-level UPDATE grants** on `profiles` and `alerts` prevent self-elevation of `plan` or admin fields. CHECK constraint locks plan values to `free | pro | multi | express`. (D018, migration `012`)
- **Unique partial index on alerts** prevents duplicate notifications for the same slot. Historical duplicates deduped before index creation. (D019, migration `013`, commit `e247717`)
- **Missing RLS policies** added (migration `014`). Server-side monitor-cap trigger enforces per-plan limits regardless of client (migration `015`). Profile email auto-resync (migration `016`). Recheck-requests RLS fix (migration `017`).
- **Vercel security headers** hardened: HSTS (`max-age=63072000`), X-Frame-Options=DENY, no-sniff, strict-origin referrer policy, restricted Permissions-Policy. `/app/*` routes set to `noindex, nofollow`.

### Frontend cleanup
- Design tokens cleaned up (border `#2A2A2A → #383838` for visibility ratio; muted text `#666 → #808080` for WCAG AA)
- Magic-link deep-link auth regression fixed — auth callback now preserves the original destination
- Web Push subscribe path stabilized (full VAPID JWT signing remains on roadmap)
- Dead code and unused dependencies removed

### Operational follow-ups (still open)
- Rotate the leaked Supabase service-role JWT in the dashboard (already revoked at the auth layer; rotation makes the audit trail clean)
- Reconcile migration history so `supabase db push` works again, or freeze on the Management API pattern
- Wire VAPID JWT signing in `send-push`
- Build the org invite endpoint backing `/app/organization`

### April 2026 incident
Polling silently returned 401 for ~3 weeks (2026-04-04 through 2026-04-26 17:09 UTC). Root cause: a leaked service-role JWT in `setup-cron-jobs.sql` was auto-revoked by Supabase's leak scanning; `net._http_response` showed 401s the whole time but no one was watching the audit dashboard. **Lesson:** the audit dashboard is now a primary on-call signal.

## v0.4.x — Settings, billing, and SEO polish (April 2026)

A series of focused PRs (#40–#48) shipped UX and operational improvements:
- **Settings redesign** with no-scroll mobile layout and centered upgrade overlay (PRs #43, #44, #45)
- **Per-page SEO meta tags** via `react-helmet-async` to fix Google Search Console indexing (D020, commit `10d876e`)
- **Mobile billing button** visibility fix (commit `36cdd0e`)
- **"Fastest alerts" badge** alignment fix (commit `a870d8c`)
- **Stripe error visibility** — surface the actual Stripe error string instead of a generic message (commit `197e4a1`)
- **Book link routing** — generate location- and service-specific deep-links into the CBP scheduler (PRs #47, #48; commit `4fe45c5`)
- **Location ID remap** migration to fix incorrect IDs in existing monitors and alerts (commits `034ad21`, `cb550ae`, migration `011`)
- **TSA logo removed** from landing page agency strip — TSA PreCheck is now correctly documented as bundled with GE/NEXUS/SENTRI rather than a standalone monitor (D014, commit `a3b6f6d`)
- **Mobile no-scroll viewport** enforced on app pages (commit `01b43f0`)
- **Auth header missing edge case** in checkout and portal functions (commit `141dfd5`)

## v0.4.0 — Observability, redesign & analytics (April 2026)

**Commits**: PRs #19 through #28.

### Observability & audit
- Admin audit page (`/app/admin/audit`) with poll-run history, per-location fetch logs, anomaly flags
- Enhanced `scrape_logs` with detailed telemetry, run correlation IDs
- New `location_fetch_logs` table for per-location polling details

### Redesigned core pages
- Alerts page redesigned with unified card layout and filter bar (live/history)
- Homepage redesign with updated pricing display
- Replaced mobile Tinder-style swipe cards with a scrollable alert list
- Settings page now shows all monitor slots inline

### Edge functions added (3 new)
- `send-digest-alert` — bundled multi-slot email
- `process-delayed-alerts` — 15-min delay pipeline for free users
- `process-rechecks` — slot-verification recheck queue

### Landing page improvements
- Government agency logos (DHS, CBP)
- Updated pricing display with one-time tiers

### Infrastructure
- Humblytics analytics integration
- Email sender domain fix (alerts@onalert.app)
- Dedicated 404 page with navigation
- 44px minimum touch target enforcement on mobile
- Production readiness verification (UX test report)

## v0.3.0 — Authentication & UX overhaul (March 2026)

### Multi-method authentication
- Google OAuth sign-in
- Email + password sign-up and sign-in
- Magic link retained as a third option
- Auth page redesigned with mode switching

### Mobile hero redesign
- Hero logo at 3× scale on mobile
- Icon-only mobile headers
- Desktop navbar retains full wordmark

### Favicon and PWA
- Icon favicon for all browsers
- Icon in desktop navbar
- Updated apple-touch-icon

## v0.2.x — Reliability & documentation (March 2026)

### Blank-screen fix
- Extracted `PLANS` into zero-dependency `src/lib/plans.ts` (D010)
- Replaced fatal throw in `supabase.ts` with warning + null fallback
- Added top-level `ErrorBoundary`

### Data pipeline hardening
- Location name mapping in `poll-appointments`
- Parallel CBP API fetches in batches of 5 with 10s timeouts
- Direct invocation of `send-alert` from `poll-appointments` for lower latency
- Consistent timezone handling (America/New_York)

### Frontend robustness
- Null Supabase guards in all hooks and pages
- Optimistic updates with rollback (D009)
- Error feedback in AddMonitorPage, SettingsPage, MonitorCard
- Empty state for location search with no results
- ARIA labels and accessibility passes

### Build & docs
- Missing `warning` color added to Tailwind config
- `tsbuildinfo` and `test-results/` ignored
- Initial `docs/` directory authored
- `.env.example` added

## v0.1.x — Initial build (March 2026)

### v0.1.0
- React 18 + TypeScript + Vite frontend
- Supabase backend (auth, DB, edge functions)
- CBP API integration
- Email notifications via Resend
- Stripe one-time Checkout
- PWA with Workbox service worker
- Dark Bloomberg-terminal design system
- 7 core pages (Landing, Auth, Dashboard, Alerts, Alert Detail, Add Monitor, Settings)
- 50 top CBP enrollment locations *(now refined to 45 verified IDs)*
- Bottom navigation with unread alert badge

### v0.1.1 — Cleanup
Removed artifacts from a previous project to establish a clean codebase.

### v0.1.2 — Component cleanup
Removed 23 unused shadcn/ui component files with missing dependencies.

## Architecture decisions

See [DECISIONS_LOG.md](./DECISIONS_LOG.md) for detailed rationale behind every key technical decision (D001–D020).
