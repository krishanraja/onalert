# Decisions Log

Key technical and product decisions with rationale.

## D001: Magic Link Auth (No Passwords)

**Decision**: Use Supabase magic link OTP instead of email/password.

**Rationale**:
- Reduces friction for a single-purpose tool
- No password reset flow needed
- Lower support burden
- Users already providing email for alerts — reuse the same channel

**Trade-off**: Requires email access to log in (no offline auth). Acceptable for this use case.

## D002: Dark Terminal Aesthetic

**Decision**: Bloomberg-inspired dark UI with crimson accents.

**Rationale**:
- Conveys precision, reliability, and urgency
- Works well for a monitoring/alerting product
- Reduces eye strain for frequent checking
- Differentiates from generic SaaS designs

## D003: Supabase (Not Firebase)

**Decision**: Use Supabase for auth, database, and edge functions.

**Rationale**:
- PostgreSQL with RLS for data security
- Edge Functions (Deno) for server-side logic
- Realtime subscriptions for live alerts
- Row Level Security eliminates most auth middleware
- Open source, self-hostable as an escape hatch

## D004: Vite + React (Not Next.js)

**Decision**: Pure SPA with Vite, no SSR.

**Rationale**:
- App is entirely client-side after initial load
- No SEO needs beyond the landing page (which is static)
- Faster development iteration with Vite HMR
- Simpler deployment (static files to CDN)
- PWA support via vite-plugin-pwa

## D005: Inline Stripe Pricing (Not Pre-Created Products)

**Decision**: Create Stripe prices inline in `create-checkout` edge function.

**Rationale**:
- Single source of truth for pricing in code
- No need to sync product IDs between environments
- Easier to test (no Stripe Dashboard setup required)
- Acceptable because there are only 2 price points

## D006: Polling Instead of Webhooks

**Decision**: Poll the CBP API on a CRON schedule rather than waiting for callbacks.

**Rationale**:
- The CBP scheduler API has no webhook/push mechanism
- Polling is the only way to detect new slots
- 10-minute interval balances freshness vs. API load
- Batch deduplication across monitors reduces API calls

## D007: Client-Side Realtime (Not Push Notifications)

**Decision**: Use Supabase Realtime for in-app alerts rather than web push.

**Rationale**:
- Simpler implementation (no push subscription management)
- Email is the primary notification channel (works offline)
- Realtime only enhances the in-app experience
- Web push can be added later as an enhancement

## D008: No Global State Management Library

**Decision**: Use React hooks + Supabase Realtime, no Redux/Zustand.

**Rationale**:
- App has minimal shared state (profile, monitors, alerts)
- Each hook manages its own data lifecycle
- Supabase Realtime handles synchronization
- Avoids dependency and boilerplate overhead

## D009: Optimistic Updates with Rollback

**Decision**: Update UI immediately on user actions, rollback on server error.

**Rationale**:
- Makes the app feel instant
- Monitor toggle, delete, and alert mark-read all use this pattern
- Rollback on failure ensures data consistency
- Better UX than waiting for server response

## D010: Extract Plans Data from Supabase Import Chain

**Decision**: Move `PLANS` constant into `src/lib/plans.ts` (zero dependencies).

**Rationale**:
- The landing page only needs static pricing data
- Previous import chain: `LandingPage → stripe.ts → supabase.ts`
- If supabase.ts failed (missing env vars), the landing page crashed
- Decoupling ensures the public landing page always renders
