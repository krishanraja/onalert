# Ideal Customer Profile

This file defines who OnAlert is for. Sales/marketing AI agents should use this to segment audiences, target campaigns, and pick the right persona script in [SALES_PLAYBOOK.md](./SALES_PLAYBOOK.md).

## The qualifying signal

A user is in the OnAlert ICP if **all three** of these are true:

1. They have applied (or intend to apply) for a CBP Trusted Traveler Program — Global Entry, NEXUS, or SENTRI
2. They are conditionally approved (or about to be), meaning the only thing standing between them and the benefit is an in-person enrollment interview
3. The earliest available interview at their preferred enrollment center is weeks or months away

Anyone matching all three is a high-intent buyer. The question is just which tier they fit.

## Primary persona — *The Frequent Traveler* (target: Pro $39)

### Demographics
- **Age**: 28–55
- **Income**: $90K+ household
- **Location**: Major US metro (within 1–2 hours of a high-demand enrollment center)
- **Travel**: 3+ international trips per year (or 1 trip per quarter for business)
- **Tech comfort**: Uses 5+ SaaS tools weekly, comfortable with mobile apps and web payments

### Psychographics
- Values time over cost ("if a $39 tool saves me 10 hours of refreshing, that's a no-brainer")
- Active in travel communities (Reddit r/GlobalEntry, r/awardtravel, points-and-miles blogs, FlyerTalk)
- Has tried at least one workaround (manual checking, browser bookmark, friend who got lucky)
- Researches before purchasing; reads reviews; checks Trustpilot/Reddit
- Prefers one-time purchases over subscriptions

### Situation
- Conditionally approved for Global Entry, NEXUS, or SENTRI (TSA PreCheck is bundled in all three)
- Looking at a 3–9 month wait at their preferred enrollment center
- Has at least one specific upcoming trip that motivates the urgency
- Has likely already missed at least one cancellation slot by minutes

### Pain points (rank-ordered)
1. **Time sink** — refreshing the CBP scheduler 3–10× per day
2. **Missed slots** — caught one once, was 2 minutes late, gone
3. **Trip anxiety** — flying internationally without GE means standard immigration lines (45+ minutes vs. 5)
4. **No alternatives** — every other tool they've found is abandoned, sketchy, or subscription-only
5. **Conditional approval clock** — the slow ticking sense that the approval might expire if they don't book

### Decision triggers (use these in copy and ads)
- "My trip is in 6 weeks and the next interview is in 9 months"
- "I just got conditionally approved and the wait times are insane"
- "I keep missing cancellation slots — there has to be a better way"
- "A friend got their interview through a slot alert"
- "I saw an OnAlert post on r/GlobalEntry"
- "I'm tired of refreshing the CBP site"

### Willingness to pay
- **High.** $39 one-time is trivially small compared to the perceived value of getting GE 6+ months sooner.
- **Clear ROI.** A single caught appointment justifies the entire cost.
- **Zero subscription friction.** "I never have to think about this again after I book" is itself a selling point.

### Channel fit
- Reddit (r/GlobalEntry, r/awardtravel, r/TravelHacking, r/IFly)
- SEO ("global entry appointment alert", "CBP slot monitor", "global entry cancellation notifier")
- Travel blogs (The Points Guy, One Mile at a Time, View from the Wing, Doctor of Credit)
- Word-of-mouth from successful bookings

## Secondary persona — *The Family Coordinator* (target: Multi $59)

### Profile
- One adult coordinating Trusted Traveler applications for **2–4 family members** (spouse + kids, parents + adult children, etc.)
- Often the household's "logistics person" — owns the calendar, books the trips, manages renewals
- Values bundling and simplicity — doesn't want 4 separate accounts or 4 separate purchases

### Pain extension
- Manual refreshing for 4 people across 4 different programs/locations is literally impossible
- Children's interview slots are even harder to catch (often need a specific time window for school)
- Coordinating multiple family members at the same enrollment center on the same day is its own optimization problem

### Why they buy Multi
- **5 monitors** = entire household covered
- **Unlimited locations per monitor** = optimize across multiple cities, multiple programs simultaneously
- **No cooldown on monitor changes** = adjust as plans evolve
- $59 once for the whole family is obviously cheaper than 4× $39

### Channel fit
- Family-travel blogs (Points with a Crew, Mommy Points, Family Travel Magazine)
- Facebook travel groups (especially expat parent groups)
- Referrals from satisfied Pro users ("I bought Multi for my whole family")

## Tertiary persona — *The Urgent Traveler* (target: Express $79)

### Profile
- Has a confirmed international trip in the **next 1–2 weeks**
- Just realized they need Global Entry / NEXUS / SENTRI for it
- Already conditionally approved but didn't book the interview in time
- Will pay almost any reasonable price for the highest-probability solution

### Why Express
- **1-minute polling** — by the math of slot fill times, this is the only tier that gets a real shot at slots that fill in 5 minutes
- **Pre-verified slots** — fewer false positives means every alert is worth acting on
- **Priority alert pipeline** — when capacity is constrained, Express users go first

### Conversion notes
- These users are the most price-insensitive in the funnel
- They convert fast (often within minutes of landing on the site) — surface Express prominently when intent signals are strong (e.g., "leaving in 2 weeks" in onboarding)
- They are the most likely to leave a 5-star review *if it works*, and the most likely to chargeback *if it doesn't* — Express SLAs and trust messaging are critical

## Tertiary persona — *The Business Traveler* (target: Pro or Express, employer-reimbursed)

### Profile
- Frequent international flyer for work (consultants, sales, finance, biotech, NGO)
- Employer reimburses CBP enrollment fees and may reimburse third-party tools as a productivity expense
- Less price-sensitive, more outcome-focused
- Often the loudest organic advocate inside their company

### Notes
- B2B/employer expansion path: see [STRATEGY.md](./STRATEGY.md) Layer 5 (group plans)
- Easy expansion product is "team / employer-sponsored license" with consolidated billing

## Quaternary persona — *The Anxious First-Timer*

### Profile
- Just got conditionally approved for the first time
- Doesn't know how bad the wait actually is yet — will discover it in a few days when they realize all the local appointments are 9 months out
- Currently in the "Googling 'how long does global entry take'" phase

### Channel fit
- SEO content targeting "how long is the wait for Global Entry at [city]"
- Public wait-times directory (`/locations/:locationId`) is purpose-built for this audience
- Free wait-times tool (`/wait-times`) provides real value without signup, then converts a fraction

## Anti-personas (NOT our customer)

- People who haven't started the Trusted Traveler application process yet (educate them, don't sell to them)
- Users in countries where these programs don't apply
- Users who already have their interview scheduled (we have nothing to sell them)
- Free-tier-only users who explicitly state they will never pay (don't waste paid acquisition on them)
- "Generic appointment monitoring" buyers — we are not that product

## Acquisition channels (rank-ordered by efficiency)

| Channel | Strategy | Tier focus | Priority |
|---------|----------|------------|----------|
| **Reddit** | Helpful answers in r/GlobalEntry, r/awardtravel, r/TravelHacking, r/IFly with clear product mention | Pro, Multi | Highest |
| **SEO — high-intent keywords** | "Global Entry appointment alert", "CBP slot monitor", "trusted traveler appointment notification", "global entry cancellation" | All tiers | Highest |
| **SEO — wait-time pages** | Auto-generated pages per enrollment center: "Global Entry wait time at JFK" | Free → Pro | High |
| **Travel blogs** | Guest posts / sponsored mentions in The Points Guy, One Mile at a Time, View from the Wing, Doctor of Credit, Frequent Miler | Pro, Multi | High |
| **Word of mouth** | Post-booking referral prompt with $10 off coupon | Pro, Multi | High |
| **Twitter/X** | Travel influencers, frequent flyer accounts, thread replies in CBP discussions | Pro | Medium |
| **Family travel communities** | Facebook groups, parent-focused travel blogs | Multi | Medium |
| **Google Ads** | Target high-intent: "global entry appointment checker", "[city] global entry availability" | Express, Pro | Medium |
| **Employer partnerships** | Direct outreach to consulting/sales/finance HR teams for group plans | B2B | Future |

## Intent signals (use these for personalization and triggered campaigns)

A user shows high purchase intent when they:

- Land on the site from a search containing a specific city or airport (LAX, JFK, etc.)
- Visit a specific `/locations/:locationId` page
- Sign up for the free tier (most predictive signal — see "Free → Pro" funnel)
- Add 3+ locations to a free monitor (signals they're hedging — Multi candidate)
- Mention "trip in [N] weeks" in onboarding or settings (Express trigger)
- Visit `/app/settings` and view the upgrade overlay (warm conversion moment)
- Have an alert fire for a slot that already filled before they could book (the highest-converting "moment of pain")

See [SALES_PLAYBOOK.md](./SALES_PLAYBOOK.md) for triggered-message scripts on each signal.
