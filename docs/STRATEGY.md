# Strategy

How OnAlert wins, defends, and grows the CBP Trusted Traveler appointment-monitoring category.

## Position in one sentence

> **OnAlert is the fastest, most reliable, most honestly priced way to catch a Global Entry / NEXUS / SENTRI cancellation slot before it fills — built as a production SaaS, not a Reddit side project.**

## Competitive landscape

| Alternative | Weakness | OnAlert advantage |
|-------------|----------|-------------------|
| **Manual refreshing** | Time-consuming, unreliable, cannot beat the 5–15 min fill window | 24/7 cloud monitoring, sub-minute polling tier |
| **Reddit / Twitter** | Delayed (someone has to post), noisy, no personalization, no direct booking | Personal monitor, instant delivery, deep-link booking |
| **Other monitoring SaaS** | Mostly abandoned side projects, recurring subscriptions, generic UI, no insights, partial coverage | Active development, one-time pricing, predictive insights, full coverage |
| **Browser extensions** | Require computer on, no mobile, break on every CBP UI change | Cloud-based, mobile-first PWA, server-side maintenance |
| **Appointment concierges** | $100–500+, manual, can't scale, no notification advantage | $39–79 one-time, fully automated, instant alerts |
| **Doing nothing** | Months of waiting, possible expiration of conditional approval, missed trips | Booked in days |

## The moat — five layers of defensibility

### Layer 1 — Speed (the most immediate and measurable advantage)

A slot that fills in 5 minutes means the **first** alerted user wins. Every second of latency reduces booking probability.

**What we have today:**
- Pro/Multi: 5-minute polling
- **Express: 1-minute polling** (the fastest tier in the market)
- Multi-channel simultaneous delivery: Resend email + Twilio SMS + Web Push + Supabase Realtime — all fire at once
- Parallel batched CBP API fetches (5 at a time, 10s timeout) to scale polling without rate-limit risk
- Direct edge-function-to-edge-function invocation (`poll-appointments` → `send-alert`) for sub-second internal latency

**What's next:**
- Pre-alert slot verification on Express (auto-recheck 30s before sending; further reduces false positives)
- Push notifications hardened with VAPID JWT signing (currently simplified)
- Geographic distribution of polling for further latency reduction

**Marketing line:** *"OnAlert Express polls every 60 seconds. Reddit checks once an hour. The math is in your favor."*

### Layer 2 — Data (the most defensible long-term moat)

Every poll cycle generates proprietary slot intelligence that **no new competitor can replicate on day one**. The dataset compounds with every run.

**What we have today:**
- `slot_history` table tracks every observed slot's `first_seen_at` and `gone_at` — the raw dataset
- `predict-slots` edge function computes day-of-week patterns from a 90-day rolling window
- `useLocationIntelligence` hook surfaces per-location frequency, days since last alert, average fill time
- `public-wait-times` edge function exposes aggregate stats publicly (free SEO + trust asset)

**What's next:**
- Location intelligence dashboard ("This center averages 3.2 cancellations per week, typically Tue/Wed mornings")
- Slot survival rate ("78% of JFK slots are still bookable 3 minutes after alert")
- Predictive alerts ("We expect a slot to open at LAX this week with 72% confidence")
- Wait-time index — published, citable benchmark ("Effective wait at JFK through OnAlert: 12 days; through CBP alone: 9 months")

**The compounding insight:** *every day the product runs, the next day's product is better and harder to copy.*

### Layer 3 — Trust & social proof (the conversion multiplier)

Trust converts a skeptical visitor into a paying customer in <60 seconds.

**What we have today:**
- Production-grade security: column-level RLS, signed CRON + internal-function secrets, Stripe webhook idempotency table, signed Stripe webhooks, HSTS + tight Vercel security headers
- Audit observability: admin page tracks every poll run, per-location fetch logs, anomaly flags — visible in `/app/admin/audit`
- Booking-success prompts: post-booking, users are asked to share their story (`booking_stories` table)
- Government agency logos (DHS, CBP) on the landing page for visual trust
- Privacy-first stance: minimal data collection, no data selling, RLS-enforced data isolation

**What's next:**
- Live booking counter on landing page ("3,247 appointments booked through OnAlert")
- Public success stories feed (with user permission)
- 30-day money-back guarantee ("No alert in 30 days? Full refund.") — low-risk on one-time pricing, removes the last objection
- Interview prep content (already wired at `/app/interview-prep`) extends the relationship beyond alerting

### Layer 4 — Network effects & growth loops

**Public wait-times directory** (`/locations/:locationId`)
Auto-generated SEO pages per enrollment center, fed by real slot data. Each page targets high-intent search ("Global Entry wait time at JFK") and funnels into paid monitoring. The pages get more useful (and rank higher) the longer the product runs.

**Post-booking referral**
The single highest-intent moment in the user lifecycle is right after they successfully book. We trigger a referral prompt with $10 off — self-funding given $39+ price points.

**SEO cornerstone content**
- "How to Get Your Global Entry Interview Faster — The Complete 2026 Guide"
- "Global Entry vs. NEXUS vs. SENTRI: Which Trusted Traveler Program Should You Apply For?"
- Per-location guides ("Getting a Global Entry interview at JFK")

**Free wait-times tool** (`/wait-times`)
Anyone can check current wait times at any enrollment center — no signup required. Captures massive organic traffic from "how long is the wait for Global Entry at [location]" searches. Converts a fraction into free-tier monitors and a fraction of those into paid.

### Layer 5 — Pricing innovation

OnAlert's one-time pricing is already a differentiator in a category dominated by abandoned subscriptions. We push further with **tiered urgency pricing**.

| Tier | Price | Audience | What it captures |
|------|-------|----------|------------------|
| **Free** | $0 | Curious / hesitant | Top of funnel, free → paid conversion engine |
| **Pro** | $39 | Frequent travelers | The standard purchase; covers individuals with normal urgency |
| **Multi** | $59 | Family coordinators | Bundles 5 monitors; expansion via "buy for the family" |
| **Express** | $79 | Urgent travelers (<2 weeks) | Captures peak willingness-to-pay at moment of highest need; sub-minute polling |

**B2B / employer expansion (next):** companies that sponsor Trusted Traveler enrollment for employees (consulting, finance, biotech) buy 10–50 seat licenses. One procurement decision = 50 users, much higher ACV.

**"Pay when you book" (future):** charge only after detected booking ($59–99). Ultimate alignment of incentives. Requires reliable booking detection (track booking-link clicks + slot disappearance).

## Growth roadmap (rough phasing)

### Phase A — Land paid users (now)
- [x] Multi-channel alert pipeline (email + SMS + push + realtime)
- [x] Tiered pricing (Free, Pro, Multi, Express)
- [x] Production security audit (PR #49)
- [x] Public wait-times directory
- [x] Per-page SEO meta tags (react-helmet-async)
- [ ] Live booking counter on landing page
- [ ] 30-day money-back guarantee messaging
- [ ] Post-booking referral prompt with coupon

### Phase B — Compound the data moat (3–6 months)
- [ ] Location intelligence dashboard (frequency, day-of-week, fill-time)
- [ ] Slot survival rate displayed inline on alerts
- [ ] Wait-time index published and SEO-optimized
- [ ] Predictive alerts (requires 90+ days of slot_history data)

### Phase C — Compound the trust moat (3–6 months)
- [ ] Public success stories with user permission
- [ ] 30-day money-back guarantee implementation (Stripe refunds wired)
- [ ] Pre-alert slot verification on Express
- [ ] Web push hardened with VAPID JWT signing

### Phase D — Compound the growth loops (6–12 months)
- [ ] Full referral program with credit tracking
- [ ] "Complete Guide" cornerstone SEO content
- [ ] Per-location SEO guides for top 20 enrollment centers
- [ ] Email lifecycle (post-purchase, post-booking, renewal-context-anniversary)
- [ ] Twilio SMS marketing post-booking (with explicit opt-in)

### Phase E — B2B & expansion (12+ months)
- [ ] Employer/group plans with consolidated billing
- [ ] Volume discounts at 10/25/50 seats
- [ ] Self-serve admin console for org admins
- [ ] Optional "concierge" tier for Express users

## Key insight (the strategic thesis)

**The single biggest moat is data that compounds over time.** Every poll cycle accrues slot patterns, survival rates, and per-location intelligence that cannot be replicated by a new entrant. The product gets *more valuable the longer it operates* — and customers can *see* that value as smarter predictions, higher booking success rates, and richer location intelligence.

Speed is the most marketable advantage. Trust is the highest-converting message. Data is the deepest moat. **Pricing innovation removes the #1 objection in the category.** All four reinforce each other.

Start collecting the data immediately, even before building the UI to display it. The data itself is the moat.

## What we will not do (anti-strategy)

- **Become a generic monitoring tool.** Purpose-built focus is a feature, not a bug.
- **Switch to subscriptions.** The one-time model is part of the brand promise.
- **Promise things we can't guarantee.** No "we'll get you an interview in X days" — it depends on cancellation supply at the user's chosen locations. We promise the alert speed and reliability, not the supply.
- **Spam.** Multi-channel delivery is per-user opt-in by tier. We never email about anything except the user's own alerts and explicit transactional events.
- **Sell user data.** Privacy-first stance is part of the trust moat.
