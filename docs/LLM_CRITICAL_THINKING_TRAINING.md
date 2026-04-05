# LLM Critical Thinking Training

Guidelines for AI assistants working on the OnAlert codebase. This document helps LLMs understand the project context, make better decisions, and avoid common pitfalls.

## Project Context

OnAlert is a **production SaaS application** -- not a tutorial, prototype, or hobby project. Every change should be evaluated through the lens of: does this make the product more reliable, more valuable to users, or easier to maintain?

### What OnAlert Does
- Monitors CBP Trusted Traveler Program appointment schedulers (Global Entry, TSA PreCheck, NEXUS, SENTRI)
- Detects newly available slots by polling the CBP API and comparing against last-known state
- Delivers instant email alerts with direct booking links
- Freemium model: Free (1 monitor, 60min checks), Pro ($39 one-time, 5min checks), Multi ($59 one-time, 5 monitors)

### Critical Path
The most important flow in the entire application:
```
CRON -> poll-appointments -> detect new slot -> insert alert -> send-alert -> email delivered -> user books
```
Any change that could disrupt this pipeline requires extra scrutiny.

## Decision Framework

When making changes to OnAlert, consider these priorities in order:

1. **Don't break the alert pipeline**: The core value of the product is reliable, fast slot detection and notification. Never compromise this.
2. **Don't break the landing page**: The landing page must render without backend configuration (no Supabase env vars required). This was a hard-won fix (see DECISIONS_LOG D010).
3. **Don't break authentication**: Three auth methods (Google OAuth, email/password, magic link) must all continue working.
4. **Don't break payments**: Stripe checkout, webhook handling, and plan synchronization are revenue-critical.
5. **Improve UX**: After reliability, focus on making the product faster, clearer, and more delightful.

## Common Pitfalls

### Import Chain Fragility
The `supabase.ts` module returns `null` if env vars are missing. All hooks and components must handle `null` supabase gracefully. Never add a new import that creates a chain like:
```
PublicPage -> someModule -> supabase.ts (crashes without env vars)
```

### Optimistic Updates
Monitor toggle, delete, and alert mark-read all use optimistic updates with rollback. When modifying these hooks:
- Update local state immediately
- Make the API call
- Rollback local state on error
- Never remove the rollback logic

### Edge Function Invocation
The `poll-appointments` function directly invokes `send-alert` via Supabase function invocation (not HTTP). This is intentional for lower latency. Don't switch to HTTP-based invocation.

### CBP API Behavior
- The CBP API (`ttp.cbp.dhs.gov/schedulerapi`) has no documentation or SLA
- It may rate-limit, return empty results, or be temporarily unavailable
- Always handle errors gracefully -- return empty arrays, log failures, continue the next cycle
- Batch requests (5 at a time) with timeouts (10 seconds) to avoid overwhelming the API

### Plan Limits
- Free users: 1 active monitor, 3 locations per monitor, 60-minute check interval
- Pro users: 1 monitor, unlimited locations, 5-minute check interval, 24h cooldown on changes
- Multi users: Up to 5 monitors, unlimited locations, 5-minute check interval, no cooldown
- These limits are enforced in the frontend (AddMonitorPage) and should also be validated server-side

## Code Style and Conventions

### File Organization
- Pages in `src/pages/` -- one file per route
- Reusable components in `src/components/` -- grouped by domain (monitors, alerts, layout, ui)
- Data hooks in `src/hooks/` -- one hook per data domain (useProfile, useMonitors, useAlerts)
- Utilities in `src/lib/` -- pure functions and client initializers

### Naming
- Components: PascalCase (`MonitorCard.tsx`)
- Hooks: camelCase with `use` prefix (`useMonitors.ts`)
- Lib modules: camelCase (`cbpApi.ts`, `stripe.ts`)
- CSS variables: kebab-case (`--background-elevated`)
- Database tables: snake_case (`scrape_logs`)

### Styling
- Tailwind CSS for all styling -- no CSS modules or styled-components
- CSS custom properties (HSL) for design tokens in `src/index.css`
- `cn()` utility (clsx + tailwind-merge) for conditional classes
- Dark mode only -- no light mode toggle

### TypeScript
- Strict mode enabled
- Types defined in `src/lib/supabase.ts` for database entities (Profile, Monitor, Alert)
- Use `@/` path alias for imports from `src/`
- Prefer explicit types over `any`

## Testing Changes

Before considering a change complete:
1. `npm run build` passes (TypeScript type checking + Vite build)
2. `npm run lint` passes (ESLint)
3. Landing page renders at `/` without env vars
4. Auth flow works for all three methods
5. Monitor creation wizard completes
6. Alert feed displays correctly with real-time updates

## Architecture Awareness

### What's Server-Side (Edge Functions)
- `poll-appointments`: CRON-triggered, polls CBP API, creates alerts
- `send-alert`: Sends email via Resend API
- `create-checkout`: Creates Stripe Checkout session
- `customer-portal`: Creates Stripe billing portal session
- `stripe-webhook`: Handles Stripe subscription events

### What's Client-Side (React SPA)
- All UI rendering and routing
- Auth state management (via Supabase Auth)
- Real-time subscriptions (via Supabase Realtime)
- Stripe.js for payment form redirects

### What's in the Database (PostgreSQL + RLS)
- `profiles`: User data with plan status
- `monitors`: Monitor configuration with last-known state
- `alerts`: Alert records with delivery tracking
- `scrape_logs`: Polling audit trail
- All tables have Row Level Security -- users can only access their own data
