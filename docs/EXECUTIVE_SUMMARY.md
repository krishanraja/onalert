# Executive Summary

## What is OnAlert?

OnAlert is a production SaaS that watches the U.S. Customs and Border Protection (CBP) Trusted Traveler scheduler 24/7 and alerts users within minutes when an interview slot opens from a cancellation. It covers Global Entry, NEXUS, and SENTRI — all three programs include TSA PreCheck as a benefit, so OnAlert effectively unblocks every Trusted Traveler enrollment path in the United States.

**Live at [onalert.app](https://onalert.app).** Tagline: *Stop checking. Start knowing.*

## The problem

Every year, millions of conditionally approved Trusted Traveler applicants face 3–12 month waits for an in-person interview at popular enrollment centers (JFK, LAX, SFO, ORD, EWR, DFW, BOS, MIA, SEA). The CBP scheduler offers no notification system. Cancellation slots open and refill in 5–15 minutes. The applicants who happen to be refreshing the page in that window get an appointment; everyone else waits another month.

This is a high-anxiety, high-frequency problem with a measurable cost (missed trips, employer reimbursement clocks, expiring conditional approvals) and zero good solutions.

## The solution

OnAlert eliminates manual checking entirely:

1. **Pick a program and locations** in a 3-step wizard
2. **OnAlert polls the CBP API** every 5 min (Pro/Multi), every 1 min (Express), or every 60 min (Free)
3. **You get instant alerts** via branded HTML email, optional SMS (Twilio), web push, and an in-app realtime feed
4. **You book in one tap** through a deep link directly into the CBP scheduler at the right location and service

The product is built for the moment that matters: the 5–15 minute window when a slot is bookable.

## Business model — one-time, no subscriptions

OnAlert is priced to match how customers actually use it: they need monitoring until they book the interview, then they're done. No recurring charges, no cancellation friction, no surprise renewals.

| Tier | Price | Monitors | Locations | Check interval | Channels | Window |
|------|-------|----------|-----------|----------------|----------|--------|
| Free | $0 | 1 | 3 | 60 min | Email (15-min delay) | 7 days |
| Pro | **$39 once** | 1 | 10 | 5 min | Email + SMS | Forever |
| Multi | **$59 once** | 5 | Unlimited | 5 min | Email + SMS | Forever |
| Express | **$79 once** | 1 | Unlimited | **1 min** | Email + SMS (priority) | Forever |

**ROI math.** A typical Global Entry slot fills in 5–15 minutes. Free checks every 60 minutes and adds a 15-minute delivery delay — by definition free users almost never catch a slot. Pro pays for itself the first time it lands an alert before the slot fills. Express pays for itself when a user has a confirmed trip in <2 weeks and needs sub-minute polling.

## Tech stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + TypeScript + Vite + Tailwind + shadcn/ui | Fast, type-safe, component-driven SPA with PWA |
| Backend | Supabase (Postgres + RLS, Auth, Edge Functions on Deno, Realtime, pg_cron) | Single-platform backend with row-level security and built-in realtime |
| Payments | Stripe one-time Checkout + signed webhooks + idempotency table | Industry standard, no subscription overhead, dispute-safe |
| Email | Resend | Developer-first transactional email |
| SMS | Twilio (paid plans) | Multi-channel delivery, paid-tier upsell |
| Web Push | Native Web Push API | Background delivery without an app store |
| Hosting | Vercel | Static SPA, global CDN, security headers, HSTS, indexing controls on `/app/*` |

## Key metrics & SLOs

| Metric | Target |
|--------|--------|
| Slot detection latency | <5 minutes (Pro/Multi), <1 minute (Express) |
| Alert delivery latency | <30 seconds after detection |
| Alert delivery rate | >99% |
| Polling success rate | >98% |
| Free → Paid conversion | >5% |
| Multi share of paid revenue | >30% |
| Target uptime | 99.9% |

## Competitive advantage

Every layer of OnAlert compounds:

1. **Speed** — Express tier polls every 60 seconds with multi-channel simultaneous delivery; the first alert wins the slot
2. **Data** — Every poll cycle generates proprietary slot history that powers the predictive insights, location intelligence, and public wait-times directory; this asset is impossible for a new competitor to replicate on day one
3. **Trust** — Production-grade security (column-level RLS, signed CRON + internal-function secrets, Stripe idempotency, signed webhooks), real audit observability, and active development cycles
4. **Pricing** — One-time payment removes the #1 objection in the category ("am I going to be charged forever?") and tiered urgency pricing (Free → Pro → Multi → Express) captures willingness-to-pay at the moment of need
5. **Coverage** — All three Trusted Traveler programs and all 45 enrollment centers, with a public wait-times directory feeding organic SEO

## Status

Production. Last major milestone (April 2026): full security and reliability audit shipped (PR #49 — column-level RLS hardening, Stripe webhook idempotency, signed CRON + internal-function secrets, edge function auth tiering, design token cleanup, deep-link auth fix). 17 SQL migrations and 12 edge functions are live.
