# Decisions Log

Key technical and product decisions with rationale.

## D001: Multi-Method Authentication

**Decision**: Support Google OAuth, email/password, and magic link -- let users choose their preferred method.

**Rationale**:
- Google OAuth reduces friction to near-zero for the majority of users
- Email/password provides a familiar fallback for users who prefer traditional auth
- Magic link offers passwordless convenience for email-first users
- Multiple options maximize conversion by removing sign-up barriers
- Supabase Auth handles all three methods natively with minimal code

**Trade-off**: Slightly more complex auth UI (mode switching), but the conversion benefit outweighs the complexity.

**History**: Originally launched with magic link only (D001-v1). Added Google OAuth and email/password in v0.3.0 based on user onboarding feedback.

## D002: Dark Terminal Aesthetic

**Decision**: Bloomberg-inspired dark UI with crimson accents.

**Rationale**:
- Conveys precision, reliability, and urgency -- critical for a monitoring product
- Dark theme reduces eye strain for users who check frequently
- Crimson (#9F0506) communicates alertness and urgency without being aggressive
- Differentiates from generic SaaS designs in the travel tools space
- Monospace fonts (Fira Code) for data reinforce the "terminal" feel

## D003: Supabase (Not Firebase)

**Decision**: Use Supabase for auth, database, edge functions, and realtime.

**Rationale**:
- PostgreSQL with RLS provides robust, row-level data security
- Edge Functions (Deno) for server-side logic without a separate backend
- Realtime subscriptions for live in-app alerts
- Row Level Security eliminates most auth middleware code
- Open source and self-hostable as an escape hatch
- Single platform for auth + DB + functions + realtime reduces operational complexity

## D004: Vite + React SPA (Not Next.js)

**Decision**: Pure SPA with Vite, no SSR framework.

**Rationale**:
- App is entirely client-side after initial load (dashboard, monitors, alerts)
- No SEO needs beyond the landing page (which is static HTML)
- Faster development iteration with Vite HMR
- Simpler deployment (static files to CDN, no server runtime)
- PWA support via vite-plugin-pwa integrates cleanly
- Smaller footprint than Next.js for a pure SPA use case

## D005: Inline Stripe Pricing (Not Pre-Created Products)

**Decision**: Create Stripe prices inline in the `create-checkout` edge function using `price_data`.

**Rationale**:
- Single source of truth for pricing lives in code, not the Stripe Dashboard
- No need to sync product IDs between test/staging/production environments
- Easier to test (no Stripe Dashboard setup required)
- Acceptable because there are only 2 price points ($19/mo, $149/yr)

**Trade-off**: Cannot use Stripe Dashboard for price management. Acceptable given the simple pricing model.

## D006: Polling Instead of Webhooks for CBP

**Decision**: Poll the CBP API on a CRON schedule rather than waiting for callbacks.

**Rationale**:
- The CBP scheduler API has no webhook or push notification mechanism
- Polling is the only way to detect newly available appointment slots
- 10-minute interval balances freshness vs. API load
- Batch deduplication across all monitors reduces total API calls
- Parallel fetching in batches of 5 with timeouts prevents rate limiting

## D007: Client-Side Realtime (Not Push Notifications)

**Decision**: Use Supabase Realtime for in-app alerts rather than web push notifications.

**Rationale**:
- Simpler implementation (no push subscription management, no VAPID keys)
- Email is the primary notification channel and works whether the app is open or not
- Realtime enhances the in-app experience for users who are actively checking
- Web push can be added later as a premium enhancement

## D008: No Global State Management Library

**Decision**: Use React hooks + Supabase Realtime instead of Redux, Zustand, or similar.

**Rationale**:
- App has minimal shared state (profile, monitors, alerts)
- Each hook manages its own data lifecycle with loading/error states
- Supabase Realtime handles cross-tab synchronization
- Avoids dependency overhead and boilerplate
- Hooks are composable and testable without a store

## D009: Optimistic Updates with Rollback

**Decision**: Update UI immediately on user actions, rollback on server error.

**Rationale**:
- Makes the app feel instant and responsive
- Monitor toggle, delete, and alert mark-read all use this pattern
- Rollback on failure ensures data consistency without user confusion
- Better UX than showing a spinner and waiting for server response

## D010: Extract Plans from Supabase Import Chain

**Decision**: Move `PLANS` constant into `src/lib/plans.ts` with zero dependencies.

**Rationale**:
- The landing page only needs static pricing data to render
- Previous import chain: `LandingPage -> stripe.ts -> supabase.ts`
- If `supabase.ts` failed (missing env vars), the entire landing page crashed
- Decoupling ensures the public landing page always renders, even without backend config

## D011: 3x Hero Logo on Mobile

**Decision**: Display the OnAlert logo at 3x scale in the mobile hero section.

**Rationale**:
- Mobile hero has limited vertical space; a large logo creates immediate brand impact
- Icon-only header on mobile conserves space while the hero carries the brand weight
- Desktop retains the full wordmark in the navbar

## D012: Icon-Only Mobile Header

**Decision**: Use icon-only navigation on mobile, full wordmark on desktop.

**Rationale**:
- Mobile viewport (375px) has limited horizontal space
- Icon-only header maximizes content area
- Bottom navigation provides primary navigation on mobile
- Desktop header shows the full brand wordmark for context
