# OnAlert — Phase 0: Sync + Recon (VERIFIED)

Date: 2026-05-30
Branch: `main` @ `2bac868` (clean tree; up to date with origin)
Mode: recon only, no code changes.
Method: prior recon claims independently re-verified against current code + live probes by a 6-reader fan-out, then a 3-lens 5X pass. Every claim below carries file:line or command evidence. Live state probed where possible.

---

## SETUP result

| Step | Result |
|------|--------|
| Repo present at `MindmakerOS-Apps/onalert` | Yes. Remote clean `https://github.com/krishanraja/onalert.git`. On `main`, clean tree (only this `_upgrade/` untracked), up to date with origin. |
| Identity | README confirms OnAlert (CBP Trusted Traveler alerts). Correct repo. |
| `npm install` | Clean. |
| `npm run lint` / `npm run build` | RED locally. Root cause is the local runtime, NOT the repo: Node `v25.5.0` (non-LTS) vs a toolchain pinned to Node 22 LTS (TS 5.6.3, ESLint 9.13). `onalert.app` builds green on Vercel's LTS Node. No Node version manager is installed (no fnm/nvm/volta). |
| Access: GitHub | Confirmed (clone + push creds cached). |
| Access: Supabase | Token + service-role present; project `zcreubinittdqyoxxwtp`. EXERCISED: REST root probe returned 200 (see security finding). |
| Access: Vercel | Token + project id present; not yet exercised. |

**Gate item:** install a Node version manager and pin Node 22/24 LTS, then reinstall, to get a true-green local baseline before any code phase.

---

## P0 — CRITICAL / URGENT (newly surfaced, act before or alongside build work)

1. **Leaked service-role JWT is STILL LIVE — not revoked.** A read-only probe of `https://zcreubinittdqyoxxwtp.supabase.co/rest/v1/` with the ACCESS-block key returned **HTTP 200**. Decoded payload: `role=service_role`, `ref=zcreubinittdqyoxxwtp`, `iat=1775228745` (2026-04-04), `exp=2090804745` (~2036). The token grants full RLS bypass and is embedded in `supabase/setup-cron-jobs.sql:18,35` across 60+ historical commits. The 2026-04-26 memory note ("appears revoked / rotation still required") is **wrong on revocation and confirmed on the un-done rotation**. CAUTION: rotating the project JWT secret also regenerates the **anon** key the live frontend uses (Vercel `VITE_SUPABASE_ANON_KEY`), so rotation must be coordinated with a Vercel redeploy — do not blind-rotate.
2. **`booking_clicks` is world-readable cross-tenant.** `006_sms_and_tracking.sql:28-30` creates a `FOR SELECT USING (true)` policy ("Service role can read all clicks") that is NOT scoped to the service role, so any authenticated user can read every user's booking activity (alert_id, user_id, location_id, timestamps). The April 014 hardening pass did not touch this table. Needs a Management-API migration 018 (db push is broken). The prior audit missed this.
3. **Stripe webhook secret may be blocking all payments.** `ONALERT_STRIPE_WEBHOOK_SECRET` is empty in the ACCESS block. `stripe-webhook/index.ts:43` `constructEventAsync` rejects EVERY event with 400 if the secret is empty/wrong — meaning `checkout.session.completed` upgrades silently never apply (user pays, stays free) AND refunds/disputes never downgrade. Live value is unverifiable from source; must verify in prod (money-correctness, not just attribution).
4. **Web Push magic moment is non-functional.** `vite.config.ts` uses VitePWA default `generateSW` (precache only); there is NO `push`/`notificationclick` service-worker handler anywhere, and `send-push` VAPID signing is a stub (`send-push/index.ts:11-34`) that `poll-appointments` never even invokes. The "phone buzzes the instant a slot opens" promise does not work when the app is closed. Realtime only fires while foregrounded.
5. **CBP "Book" deep link is degraded.** Both `src/lib/cbpApi.ts` and `supabase/functions/_shared/buildBookUrl.ts` emit `service=Global%20Entry` (real CBP scheduler expects the `up`/`UP` code) and the backend helper DROPS the location entirely. Users who tap Book from email/SMS land on a generic location picker, not their slot, at the exact moment seconds matter. This silently erodes the entire value prop and the north-star booking metric.
6. **Two paid-feeling features may be silently dead in prod.** `setup-cron-jobs.sql` schedules ONLY `poll-appointments` (1 min) and `process-delayed-alerts` (5 min). `predict-slots` and `process-rechecks` have NO committed cron schedule — if never added manually in the live DB, the PredictionCard renders nothing and the "re-check this slot" feature never returns an answer. Verify the live `cron.job` table.
7. **Sitemap is 96% broken.** Of 50 location URLs in `public/sitemap.xml`, only 2 (5140, 5446) match the 46 `TOP_LOCATIONS` IDs in code; the other 48 are soft-404s served HTTP 200 with `X-Robots-Tag: all`, and 43 real high-intent pages are absent. The sitemap was built against the pre-D014 (commit 034ad21) CBP ID scheme and never regenerated. Actively harming SEO right now.

---

## Section 3 row: confirmed, with corrections

- Live `onalert.app` (200), Vite SPA + PWA, dark Bloomberg-terminal (crimson `#9F0506` on `#0A0A0A`, Inter + Fira Code): all confirmed against `src/index.css`, `tailwind.config.ts`, `index.html`.
- Magic moment (alert in seconds, one-tap deep link into CBP) confirmed as intended — but currently broken in two places (P0 #4, #5).
- README drift: claims 18 routes / 12 fns / 17 migrations; reality ~16 route paths, 12 fns + `_shared`, 18 migration files (17 logical + duplicate `006_z`).

---

## Subsystem audit (verified)

### Data model / RLS / migrations
RLS confirmed ON for every user-scoped table (profiles, monitors, alerts, booking_clicks, monitor_changes, push_subscriptions, success_stories, referrals, slot_predictions, organizations, organization_members, recheck_requests, stripe_events). April hardening 012-015 all confirmed present (column-level UPDATE grants block plan self-elevation; Stripe idempotency table + unique partial alert index; admin-only locks on observability tables; server-side monitor-cap trigger). Corrections: table is `success_stories` (not "booking_stories"); 017 is an additive recheck schema reconciliation (the recheck RLS hardening is in 014); `stripe_events` is the only true no-policy service-role-only table. Phantom-006 + duplicate-006 confirmed → `supabase db push` permanently broken; all future migrations 018+ via Supabase Management API.

### Edge functions / AI pipelines
12 Deno functions + `_shared`; three auth tiers (cron `x-cron-secret`, internal `x-internal-secret`, public/auth) confirmed against `config.toml` + in-handler guards. **Zero model inference anywhere** (exhaustive grep across functions, src, package.json) — confirmed. `predict-slots` is a pure day-of-week + `exp(-0.1*ageWeeks)` decay heuristic; alert "narrative" is hardcoded template strings in `formatNarrativeFromHistory`. `poll-appointments` failure handling is genuinely mature (rate-limit preservation, alert-write gating, 23505 handling, anomaly flags, structured logging). EDT-year-round timezone bug noted (`poll:300`).

### Attribution / commerce
All prior gaps confirmed: no UTM/click-id capture anywhere; `create-checkout` stamps only `{supabase_user_id, plan}`; `stripe-webhook` reads only those; analytics is client-only fire-and-forget to `window.hmbl` (prod-hostname-gated, 5 of 12 defined events never fired, no server sink); `?ref=` captured to localStorage then dropped at signup (never read, never a Stripe coupon, dead referral loop despite migration 009 scaffold). Pricing forks across THREE files (plans.ts dollars, create-checkout cents, stripe-webhook cents) guarded only by a comment. The fleet cannot attribute a single signup or dollar today. Stripe account = `mindmaker_llc` (per ACCESS block; unverifiable in code).

### Product truth / docs
20 docs in `docs/`, unusually complete and verified against code. LOCKED: ICP (applied + conditionally approved + facing a 3-12mo interview wait); one painful problem (cancellation slots open invisibly, refill in 5-15 min, CBP has no notifications); pitch "Stop checking. Start knowing."; magic moment (instant multi-channel alert + one-tap CBP deep link); pricing Free / Pro $39 / Multi $59 / Express $79, all one-time. No active offer (money-back guarantee + $10 referral are roadmap only). Corrections: NO `CLAUDE.md` (migration convention lives in `docs/DEPLOYMENT.md`); web push is "partial," not live. **5b gap confirmed:** none of this truth ships at a runtime machine-readable path; the only shipped artifact (PWA manifest) is off-brand/generic.

### User journey / UX / mobile
Journey is genuinely tight: zero-typed-input one-tap Quick Start (geo-detected centers, GE default). Four-states excellent on Alerts, good on Dashboard, but public WaitTimes/Location pages swallow fetch errors silently and lack loading/error states. Mobile posture thoughtful (safe-area, haptics, reduced-motion). The two highest-severity UX gaps are P0 #4 (push) and P0 #5 (deep link) — both attack the core magic moment. NEXUS marketed but zero NEXUS centers in `TOP_LOCATIONS`; SuccessScreen auto-dismisses the highest-intent 2 seconds; two duplicate alert-detail renderers.

---

## Public-surface render state (5a)
100% client-rendered. Live `/` body is `<div id="root"></div>` (4,465 bytes); all copy, per-page titles, and location stats are injected client-side via react-helmet-async after JS + Supabase fetches. No SSR/SSG/prerender dependency. `DECISIONS_LOG` D004 falsely claims pages are "server-rendered at build time." Fleet clicks and crawlers/AI assistants hit a blank body. The no-auth `public-wait-times` edge fn already returns the exact slot_history aggregates needed to bake real per-location content at build.

## Attribution / read-back state (5c/5d)
No capture → no persistence → no Stripe stamping → no warehouse → no lifecycle. Warehouse target per ACCESS block = Mindmaker OS Supabase `gojpffsrxybbpbdzzrvs` via an `ingest-attribution` edge function — but the warehouse service-role key, DB URL, and `ATTRIBUTION_INGEST_SECRET` are NOT yet provided, and per the master prompt the ingest function is owned by the OS repo, not OnAlert. OnAlert's job is the emit side.

---

## 5X vision headlines (unbounded; scope chosen at the gate)

**Experience & feel**
1. The Live Slot moment — phone buzzes while closed → one tap opens a full-bleed slot screen with a draining countdown ring (driven by that center's real fill-minutes), background re-verification, "gone, but 2 siblings nearby" fallback, deep-link to the EXACT CBP slot. Buzz-to-booked under 10s. (Needs: push SW + buildBookUrl fix + process-rechecks cron.)
2. The personal-scout alert voice — replace template narratives with a reasoning layer over slot_history + deadline → traffic-light grab-it score + one personalized rationale line.
3. Value-first onboarding — arm a live anonymous monitor on the landing tap; collect identity at peak desire, not as a tollgate.

**AI intelligence (the wide-open vein — zero inference today)**
1. Concierge booking guidance at alert-fire (Express upsell) — LLM kept OFF the <30s alert critical path (precompute nightly, fill live numbers at fire, deterministic fallback).
2. Real predictive engine — numeric survival/hazard forecaster (calibrated, cheap) + Haiku narration; powers pre-positioning, re-engagement near-miss math, anomaly detection.
3. Natural-language / voice setup — Sonnet tool-call with a `resolve_locations` tool bound to the real catalog (users can't be trusted with CBP IDs — migration 011 proved it).
4. Vision intake of the CBP approval letter/screenshot (privacy-bounded: extract → discard image).

**Commerce / fleet flywheel**
1. Programmatic SEO: build-time prerender of public routes only (keep `/app` SPA), center×program matrix (~150 pages) with per-page Service/Offer/FAQ/Place JSON-LD, auto-generated sitemap from TOP_LOCATIONS, per-page @vercel/og. Zero new infra; data source (public-wait-times) exists.
2. Unified attribution contract: first-paint UTM/click-id capture → signup user_metadata → Stripe customer+session metadata → server-side lifecycle events to the shared fleet warehouse. Fixes the money bug too.
3. "CBP Appointment Weather" viral/PR asset built from the same slot_history aggregate — the only durable, free, compounding acquisition channel OnAlert can own + the citable AI-answer source. Reuses the prerender/OG infra. Revive the dead referral loop.

---

## Recommendations into the gate
- **Rendering:** build-time prerender of the public route list only; keep `/app/*` a pure SPA. Lowest risk, no new infra, fixes 5a + sitemap together.
- **Warehouse:** central shared attribution Supabase (OS `gojpffsrxybbpbdzzrvs`); build OnAlert's capture + Stripe-stamp now (self-attributing standalone), wire the warehouse emit behind a flag once the OS `ingest-attribution` fn + secret exist.
- **Sequence:** P0 security/money triage + verify-live-state → fix-the-magic (push SW, deep link, cron) + commerce spine (prerender/SEO, attribution, product-truth) → AI layer as fast-follow.
- **Baseline:** pin Node 22/24 LTS locally before any code phase.

Gate questions are batched in chat (4). STOP for scope selection + the urgent-triage decision.
