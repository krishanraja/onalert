# OnAlert rebuild — progress + resume state

Date: 2026-05-30
Branch: `upgrade/onalert/phase-2-hardening` (off `main` @ 2bac868). main is UNTOUCHED.
Local toolchain: Node 22 LTS via fnm (run `eval "$(fnm env --shell bash)"; fnm use 22` in every shell). Build + lint green.
Decisions locked: scope = Everything incl. AI; rendering = build-time prerender of public routes (vite-react-ssg); attribution = central OS warehouse `gojpffsrxybbpbdzzrvs`, build emit now; push to main at the END after preview-deploy verification; OS-handoff summary -> `C:\Users\krish\Downloads\app OS summaries\Onalert.md`.

## DONE + verified + deployed (committed on the branch)
1. **Phase 0 verified recon** — `_upgrade/onalert/PHASE-0.md`.
2. **Security: booking_clicks cross-tenant leak FIXED** — migration `018_fix_booking_clicks_cross_tenant_read.sql` applied to prod via Management API + verified. Commit bb82fef.
3. **Green baseline** — fnm + Node 22; root cause was a corrupted csstype, not Node 25.
4. **Single-source pricing + product truth** (commit 8a94895) — canonical `src/data/pricing.json` + `src/data/product-truth.base.json`; generator `scripts/gen-product-truth.mjs` emits `supabase/functions/_shared/pricing.ts` (committed), `public/.well-known/product-truth.json` + `public/llms.txt` (gitignored, built on prebuild/predev). `create-checkout` + `stripe-webhook` import the shared cents (no more 3-file fork). DEPLOYED + smoke-tested.
5. **Attribution spine** (commit 17c77ed) — first-paint capture (index.html) -> `src/lib/attribution.ts` -> signup user_metadata (AuthPage) -> Stripe customer+session metadata (create-checkout) -> server-side purchased/refunded (stripe-webhook) -> `track-lifecycle` edge fn forwards to OS warehouse via `_shared/lifecycle.ts`. landed/signed_up/activated emits wired. DEPLOYED + smoke-tested. Dormant until `VITE_ATTRIBUTION_ENABLED=true` + `ATTRIBUTION_INGEST_URL`/`ATTRIBUTION_INGEST_SECRET` set (no-op verified).
6. **CBP Book deep-link fix** (commit 91b18ac) — `buildBookUrl` (both copies) now uses real service codes (up/nh/sh) + verified URL template; per-location deep-link not supported by CBP (don't over-promise). Redeployed send-alert, send-digest-alert, process-rechecks, poll-appointments.

Edge functions currently deployed with new code: create-checkout, stripe-webhook, track-lifecycle (new), send-alert, send-digest-alert, process-rechecks, poll-appointments.

## REMAINING (not started or in progress)
- **#6 Public surface** (IN PROGRESS): `vite-react-ssg@0.9.0` is INSTALLED (dep added) but NO app code migrated yet. App.tsx still uses BrowserRouter; build still works the old way. To migrate: convert `src/App.tsx` -> exported `routes: RouteRecord[]` with a pathless RootLayout (`<StrictMode><ErrorBoundary><Outlet/></ErrorBoundary>`); rewrite `src/main.tsx` -> `export const createRoot = ViteReactSSG({ routes }, ({isClient}) => { /* move the landed-attribution side-effect here behind isClient */ })`; swap `<Helmet>`/import in 10 files (GuidePage, LocationPage, WaitTimesPage, NotFoundPage, LandingPage, LocationsIndexPage, PrivacyPage, TermsPage, ResetPasswordPage) to `<Head>` from vite-react-ssg + remove HelmetProvider from main; `ssgOptions.includedRoutes` allowlist = ['/','/privacy','/terms','/locations','/guide','/wait-times'] + p.startsWith('/locations/'); getStaticPaths on locations/:locationId from TOP_LOCATIONS; build script -> `tsc -b && vite-react-ssg build`. KNOWN GOTCHA to resolve empirically: index.html IS the prerendered landing, so the /app/* + /auth/* SPA fallback needs care (cleanUrls:true in vercel.json; decide whether to also prerender /app as a no-data loading shell to avoid a hydration mismatch vs. a dedicated fallback). AppLayout mounts AlertsProvider internally (only wraps /app) so it does not affect the public migration. Then: auto-generate sitemap from TOP_LOCATIONS (kills 48 soft-404s + 43 missing); per-location loader baking slot stats + Place JSON-LD from public-wait-times; per-page @vercel/og; "CBP Appointment Weather" public page + /api/weather feed; fix WaitTimes/Location swallowed-error + missing loading states; correct DECISIONS_LOG D004.
- **#7 Fix-the-magic** (deep-link DONE): remaining = custom service worker (injectManifest) with push + notificationclick deep-linking + real VAPID JWT signing in send-push (Web Crypto in Deno); wire predict-slots + process-rechecks into committed pg_cron (currently unscheduled in prod — needs a Management-API SQL like setup-cron-jobs.sql, embeds CRON_SECRET); Live Slot screen; EDT/DST bug; NEXUS/SENTRI coverage gap.
- **#8 AI layer**: survival/hazard forecaster + Haiku narration replacing predict-slots heuristic; reasoning ranker (grab-it score + rationale) OFF the <30s alert path; NL/voice monitor setup (Sonnet tool-call, resolve_locations bound to catalog); CBP-letter vision intake; concierge guidance; re-engagement; anomaly narration. ANTHROPIC_API_KEY already set in prod edge secrets.
- **#9 Design pass**: system spine + every-pixel + magic-moment micro-interactions; value-first anonymous onboarding; collapse duplicate alert-detail renderers; code-split the 576KB main chunk.
- **#12 Docs**: refresh docs/ (SALES_PLAYBOOK, VALUE_PROP, ICP, FEATURES capability status, OUTCOMES, STRATEGY, AGENT_BRIEFING) so an agent can autonomously sell+market; correct D004 + push status. Must agree with product-truth.json + llms.txt.
- **#10 Verify + ship**: Vercel preview deploy; mobile walk 390/375/430; perf+a11y; view-source proves real HTML; structured-data validate; test conversion end-to-end; MERGE branch to main + push; write OS-handoff to `C:\Users\krish\Downloads\app OS summaries\Onalert.md`.

## NEEDS KRISH (does not block build)
- **Service-role key rotation** (#11): leaked JWT is LIVE; rotation regenerates the anon key -> must update Vercel `VITE_SUPABASE_ANON_KEY` + redeploy. Runbook in PHASE-0 chat.
- **Stripe webhook events** (#13): add `charge.refunded` + `charge.dispute.created` to the live OnAlert webhook endpoint (downgrade path code-ready but Stripe not sending those events). Auto-mode blocked the automated change.
- **Warehouse creds**: `ATTRIBUTION_INGEST_URL` + `ATTRIBUTION_INGEST_SECRET` (+ flip `VITE_ATTRIBUTION_ENABLED=true`) to make lifecycle emission live; the OS repo must build `ingest-attribution` + the `attribution` schema.

## KEY FACTS
- Prod footprint: 4 profiles (3 free, 1 manual pro), ZERO completed payments ever (clean slate).
- Deploy edge fns: `SUPABASE_ACCESS_TOKEN=sbp_... supabase functions deploy <fn> --project-ref zcreubinittdqyoxxwtp` (Docker not needed; `db push` is broken — Management API for migrations).
- Stripe (working key ends `...rDgIn00ws1tJoCg`; the ACCESS-block `...aANz` key is DEAD).
