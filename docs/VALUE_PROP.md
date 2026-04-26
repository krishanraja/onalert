# Value Proposition

This is the source-of-truth for OnAlert's positioning. Sales/marketing AI agents should pull from this file directly when crafting copy, ads, outreach, or landing-page experiments.

## One-liners (drop-in copy)

- **Primary**: *Stop checking. Start knowing.* OnAlert watches the CBP Trusted Traveler scheduler 24/7 and alerts you within minutes when an interview slot opens.
- **Benefit-led**: Get your Global Entry / NEXUS / SENTRI interview months sooner — without ever refreshing the CBP site again.
- **Speed-led**: We poll every 1 minute. Slots fill in 5–15. The math is in your favor.
- **Pricing-led**: One $39 payment. No subscription. You only need it until you book.
- **Outcome-led**: Travelers who use OnAlert book interviews in **days, not months**.

## The problem (in the customer's words)

> "I was conditionally approved for Global Entry 3 months ago. The nearest appointment is 8 months out. I've been refreshing the CBP scheduler every day and still keep missing slots by minutes."

This is the reality for the 4M+ conditionally approved Trusted Traveler applicants in the US:

- **3–12 month wait** at high-demand centers (JFK, LAX, SFO, ORD, EWR, DFW, BOS, MIA, SEA)
- **Cancellations are invisible** — the CBP scheduler offers zero notification capability
- **Slots fill in 5–15 minutes** — manual refreshing is a losing game by design
- **Trip pressure is real** — every week without an interview is a week closer to traveling without expedited processing
- **Conditional approvals expire** — applicants who don't book within ~12 months may have to re-apply
- **High opportunity cost** — hours of refresh-anxiety vs. literally any other use of your time

## The solution

OnAlert turns months of anxious refreshing into a 2-minute setup:

1. **Set it once** — pick your program (GE, NEXUS, SENTRI) and the locations you'd accept
2. **We watch 24/7** — Pro/Multi check every 5 min, Express every 1 min, Free every 60 min
3. **You get an alert in seconds** — branded email + optional SMS + web push + in-app realtime feed with haptic feedback on mobile
4. **You book in one tap** — deep-link straight into the CBP scheduler at the right location
5. **You're done** — one-time payment, no subscription to cancel

## Benefits, by who's buying

### For the individual applicant (Pro — $39)
- Get your interview in **days instead of months**
- Stop refreshing the CBP site forever — give 30 minutes of your life back, daily
- Sleep through the night knowing OnAlert is watching at 3am too
- Catch the slot before the next person on Reddit catches it
- One-time $39 — less than a single airport meal, no recurring charge

### For the family coordinator (Multi — $59)
- Cover **everyone in the household at once** — up to 5 monitors, unlimited locations
- One purchase, one email thread, one set of alerts for the whole family
- No cooldown on monitor changes — adjust as you go
- $59 once for an entire family is dramatically less than four people manually refreshing for months

### For the urgent traveler (Express — $79)
- **1-minute polling** — the fastest interval we offer; mathematically the best chance to win a slot
- Pre-verified slots — fewer false positives, near-zero wasted clicks
- Priority alert pipeline — when a slot opens, Express users are notified first
- For travelers with a confirmed trip in the next 1–2 weeks who absolutely need expedited processing

### For the curious / hesitant (Free)
- Prove the product works on a real monitor before you spend a dime
- Catches the *easy* slots (low-demand centers) and shows you what alerts feel like
- Natural upgrade path — most free users hit the "alert was sent but slot was already gone" wall and convert to Pro within their first week

## Why users pay (the conversion lens)

| | Free | Pro ($39) | Multi ($59) | Express ($79) |
|---|------|-----------|-------------|----------------|
| Active monitors | 1 | 1 | **5** | 1 |
| Locations per monitor | 3 | 10 | **Unlimited** | **Unlimited** |
| Check interval | 60 min | 5 min (12× faster) | 5 min (12× faster) | **1 min (60× faster)** |
| Email delivery | Delayed 15 min | Instant | Instant | **Priority instant** |
| SMS alerts | — | Yes | Yes | Yes |
| Web push | — | Yes | Yes | Yes |
| Real-time in-app alerts | Yes | Yes | Yes | Yes |
| Direct booking links | Yes | Yes | Yes | Yes |
| Deadline date filter | — | Yes | Yes | Yes |
| Smart digest alerts | — | Yes | Yes | Yes |
| Advanced location insights | — | Yes | Yes | Yes |
| Slot re-check / pre-verification | — | Yes | Yes | **Auto-verified** |
| Monitor change cooldown | — | 24h | None | None |
| Monitoring window | 7 days | **Forever** | **Forever** | **Forever** |
| Payment | Free forever | One-time | One-time | One-time |

**The core conversion line:** *"Slots fill in 5–15 minutes. Free checks every 60 and delays delivery 15 more — by design, free almost never catches a slot. $39 once gets you 5-minute polling and instant delivery. That's the difference between seeing alerts and actually booking."*

## Anchor stats (use freely in copy)

- **3–12 months** — typical wait time at high-demand enrollment centers
- **5–15 minutes** — how long a cancellation slot is bookable
- **60×** — speed advantage of Express (1 min) over Free (60 min)
- **12×** — speed advantage of Pro/Multi (5 min) over Free
- **$39** — one-time price of Pro; no subscription
- **45** — enrollment centers we monitor
- **3** — Trusted Traveler programs supported (GE, NEXUS, SENTRI — each includes TSA PreCheck)
- **<30 seconds** — alert delivery latency target after detection
- **>99%** — alert delivery rate target

## Competitive landscape

| Alternative | What's wrong with it | What OnAlert does instead |
|-------------|----------------------|---------------------------|
| **Manual refreshing** | Time-consuming, unreliable, cannot beat the 5–15 min window | 24/7 cloud monitoring with sub-minute polling |
| **Reddit / Twitter / r/GlobalEntry** | Delayed (someone has to post), noisy, no personalization, no direct link | Personal monitor for the locations *you* care about, instant delivery, deep-link booking |
| **Other monitoring services** | Mostly abandoned side projects, recurring subscriptions, generic branding, no insights, limited locations | Active development, one-time pricing, production-grade security and observability, predictive insights, full location coverage |
| **Browser extensions** | Require your computer to be on, no mobile, break on every CBP site change | Cloud-based, mobile-first PWA, maintained server-side |
| **Appointment concierges** | $100–500+, manual, can't scale, no notification advantage | $39–79 one-time, fully automated, instant alerts |
| **Doing nothing** | Months of waiting, possible expiration of conditional approval, missed trips | Interview booked in days |

## Key differentiators (the moat)

1. **Purpose-built** — focused exclusively on CBP Trusted Traveler appointments; not a generic "monitor any URL" tool
2. **Real-time API integration** — direct calls to the CBP scheduler API with parallel batched fetching, not page scraping
3. **Multi-channel simultaneous delivery** — email + SMS + web push + in-app realtime, all firing at once; the first channel to reach you wins the slot
4. **Sub-minute polling tier** — Express checks every 60 seconds; this is the fastest legitimate option in the market
5. **Predictive insights and slot history** — proprietary slot-history dataset powers per-location frequency, day-of-week patterns, and average fill time (only Pro+); the dataset compounds with every poll
6. **Public wait-times directory** — every enrollment center has an indexable, SEO-friendly public page fed by real slot data; this is both an organic acquisition channel and a free, trust-building tool
7. **Production-grade security** — column-level RLS, signed CRON + internal-function secrets, Stripe webhook idempotency table, signed Stripe webhooks, HSTS + tight Vercel security headers, RLS-enforced user data
8. **Honest pricing** — one-time payment aligned with how customers actually use the product; no subscription trap, no auto-renewal, no cancellation friction
9. **Mobile-first PWA** — installable on iOS/Android home screen with haptic feedback and dark Bloomberg-terminal aesthetic
10. **Multi-method auth** — Google OAuth, email + password, magic link; zero friction at sign-up

## Brand voice (when writing as OnAlert)

- **Urgent but never alarmist.** "Slot available at JFK" — not "URGENT!! BOOK NOW!!!"
- **Confident and precise.** Short declarative sentences. Numbers, not adjectives.
- **Helpful, not pushy.** Guide users to act. Never guilt or FOMO.
- **Bloomberg-terminal calm.** Dark surfaces, monospace data, crimson only for what matters.

See [BRANDING.md](./BRANDING.md) for the full voice guide and [SALES_PLAYBOOK.md](./SALES_PLAYBOOK.md) for channel-specific scripts.
