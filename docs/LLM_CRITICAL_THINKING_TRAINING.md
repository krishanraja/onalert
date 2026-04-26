# LLM Critical Thinking Training

Guidelines for AI assistants working on the OnAlert codebase. Read this before editing code.

## Project context

OnAlert is a **production SaaS** — not a tutorial, prototype, or hobby. Every change should be evaluated by: does this make the product more reliable, more valuable to users, or easier to maintain?

### What OnAlert does
- Monitors the CBP Trusted Traveler scheduler for **Global Entry, NEXUS, and SENTRI** (TSA PreCheck is bundled in all three — there is no standalone TSA monitor)
- Detects new slots by polling the CBP API and diffing against last-known state per monitor
- Delivers alerts via branded HTML email + optional SMS + web push + in-app realtime
- Tiered one-time pricing: **Free** ($0, 1 monitor / 60-min polling), **Pro** ($39, 5-min), **Multi** ($59, 5 monitors), **Express** ($79, 1-min)

### The critical path
The most important flow in the entire application:

```
pg_cron → poll-appointments → detect new slot → INSERT alerts row → send-alert → email delivered → user books
```

Any change that could disrupt this pipeline requires extra scrutiny. The April 2026 incident (3-week silent outage from a leaked-then-revoked JWT) is the cautionary tale.

## Decision framework

When making changes, prioritize in this order:

1. **Don't break the alert pipeline.** Detection, delivery, latency. Above everything.
2. **Don't break the landing page.** It must render publicly without backend env vars (D010 — hard-won).
3. **Don't break authentication.** All three flows must keep working: Google OAuth, email + password, magic link. The magic-link deep-link must preserve `/app` destinations (regression already caught once — `a888fb3`).
4. **Don't break payments.** Stripe checkout, signed webhook, idempotent handler, plan sync. Revenue-critical.
5. **Don't bypass the security tiers.** Every edge function checks its required header (`x-cron-secret`, `x-internal-secret`, user JWT, or Stripe signature) **before** any business logic. Don't add a new function without its tier guard.
6. **Improve UX.** After reliability and security, focus on speed, clarity, and delight.

## Common pitfalls

### Import-chain fragility
`supabase.ts` returns `null` if env vars are missing. All hooks and components must handle a `null` client. **Never** add an import chain that lets a public page crash without backend config:

```
LandingPage → someModule → supabase.ts (crashes without env vars)  ← NEVER
```

### Optimistic updates
Monitor toggle, delete, and alert mark-read all use optimistic updates with rollback on error. When modifying these:
- Update local state immediately
- Make the API call
- Roll back local state on error
- Never remove the rollback

### Edge function invocation
`poll-appointments` directly invokes `send-alert` via Supabase function invocation (not HTTP). This is intentional for lower latency. Don't switch to HTTP-based invocation.

### Auth tier headers
- **`x-cron-secret`** required on `poll-appointments`, `process-delayed-alerts`, `process-rechecks`, `predict-slots`
- **`x-internal-secret`** required on `send-alert`, `send-digest-alert`, `send-push`
- Cron jobs embed `CRON_SECRET` inline in `cron.job.command` — rotation requires re-creating the cron jobs in the same SQL transaction
- The `INTERNAL_FUNCTION_SECRET` digest captured in project memory is the source of truth — verify against it before assuming the env is set right

### CBP API behavior
- The CBP API (`ttp.cbp.dhs.gov/schedulerapi`) has no documentation or SLA
- It may rate-limit, return empty, or be temporarily unavailable
- Always handle errors gracefully: return empty arrays, log failures, continue the next cycle
- Batch requests (5 at a time) with 10s timeouts to avoid overwhelming the API

### Plan limits
- Free: 1 monitor, 3 locations, 60-min polling, 7-day window, 15-min delivery delay
- Pro: 1 monitor, 10 locations, 5-min polling, 24h cooldown on changes
- Multi: 5 monitors, unlimited locations, 5-min polling, no cooldown
- Express: 1 monitor, unlimited locations, **1-min polling**, priority delivery
- Limits are enforced **both** in the frontend (AddMonitorPage UI) **and** in the database (trigger from migration `015_monitor_cap_trigger.sql`). Don't add a code path that bypasses either.

### Migration application
**`supabase db push` does not work cleanly on the production project** (`zcreubinittdqyoxxwtp`) due to a phantom `006` history entry. Use the Supabase Management API pattern documented in `reference_supabase_management_api.md`. New migrations should be numbered 018+ (the next free version).

### TSA PreCheck is not a monitor
The product covers GE / NEXUS / SENTRI. TSA PreCheck is a benefit included in all three. Do not add a fourth program; do not put TSA in service badges, copy, or pricing tables. (D014, regression-fix `a3b6f6d`.)

### Family plan is a legacy alias
Old purchases may have `plan = 'family'` for what is now the `multi` tier. The Stripe webhook normalizes `family → multi`. Don't remove this until all historical users have been migrated.

## Code style and conventions

### File organization
- Pages in `src/pages/` — one file per route
- Reusable components in `src/components/` — grouped by domain (`dashboard/`, `monitors/`, `alerts/`, `settings/`, `layout/`, `ui/`)
- Data hooks in `src/hooks/` — one hook per data domain
- Pure utilities and clients in `src/lib/`

### Naming
- Components: PascalCase (`MonitorCard.tsx`)
- Hooks: camelCase with `use` prefix (`useMonitors.ts`)
- Lib modules: camelCase (`cbpApi.ts`, `stripe.ts`)
- CSS variables: kebab-case (`--background-elevated`)
- Database tables and columns: snake_case (`scrape_logs`, `delivered_at`)

### Styling
- Tailwind CSS for all styling — no CSS modules or styled-components
- CSS custom properties (HSL) for design tokens in `src/index.css`
- `cn()` (clsx + tailwind-merge) for conditional classes
- Dark mode only — no light mode toggle

### TypeScript
- Strict mode enabled
- Types for database entities live in `src/lib/supabase.ts`
- Use the `@/` path alias for imports from `src/`
- Prefer explicit types over `any`

### Comments
- Default to none. Code should explain itself via good naming.
- Comment only when *why* is non-obvious (a workaround, a hidden constraint, a subtle invariant)

## Testing changes

Before considering a change complete:
1. `npm run build` passes (TypeScript + Vite)
2. `npm run lint` passes
3. Landing page renders at `/` without env vars
4. All three auth flows work
5. Monitor creation completes for all four plan tiers
6. Alert feed displays correctly with real-time updates
7. If you touched edge functions: verify the auth tier still rejects requests without the right header
8. If you touched migrations: confirm they apply cleanly via the Management API path

## Architecture awareness

### Edge functions (12)
| Function | Tier | Role |
|----------|------|------|
| `poll-appointments` | cron | CBP API polling, slot detection, alert creation |
| `process-delayed-alerts` | cron | Free-tier 15-min delayed delivery |
| `process-rechecks` | cron | User-requested slot re-verification |
| `predict-slots` | cron | Daily predictions from slot_history |
| `send-alert` | internal | Resend email + Twilio SMS |
| `send-digest-alert` | internal | Bundled multi-slot email |
| `send-push` | internal | Web Push delivery |
| `create-checkout` | user JWT | Stripe one-time Checkout session |
| `customer-portal` | user JWT | Stripe billing portal redirect |
| `track-booking-click` | user JWT | Outbound CBP click attribution |
| `stripe-webhook` | Stripe sig | Plan sync with idempotency |
| `public-wait-times` | public | Aggregate stats for public SEO surfaces |

### Frontend (React SPA)
- All UI rendering and routing
- Auth state via Supabase Auth
- Real-time subscriptions via Supabase Realtime (single channel managed by `AlertsProvider`)
- Stripe.js for payment redirects only

### Database (Postgres + RLS)
- 17 migrations (001 through 017, with `0066` between 006 and 007)
- All user-owned tables enforce row-level security
- Column-level UPDATE grants prevent self-elevation of `plan` or admin fields (migration `012`)
- Stripe webhook idempotency in `stripe_events` (migration `013`)
- Server-side monitor cap trigger (migration `015`)

## When in doubt

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) before changing edge functions or migrations
- Read [DECISIONS_LOG.md](./DECISIONS_LOG.md) before changing anything that "feels weird" — there's probably a reason
- Read [COMMON_ISSUES.md](./COMMON_ISSUES.md) before debugging
- Read [BRANDING.md](./BRANDING.md) and [VALUE_PROP.md](./VALUE_PROP.md) before writing user-facing copy
- If you're about to delete the rollback in an optimistic update, the answer is no
- If you're about to remove an auth-tier header check "for testing", the answer is no
- If you're about to push a migration with `supabase db push`, use the Management API instead
