# Sales Playbook

This file is the operating manual for sales and marketing AI agents selling OnAlert at scale. It consolidates positioning, qualification, channel-specific scripts, objection handling, and triggered-message templates into one reference.

> **Companion docs:** pricing and benefits in [VALUE_PROP.md](./VALUE_PROP.md), targeting and personas in [ICP.md](./ICP.md), KPIs and ROI in [OUTCOMES.md](./OUTCOMES.md), brand voice in [BRANDING.md](./BRANDING.md). When this file points to a fact or stat, the linked doc is the source of truth — pull the latest from there.

## The 30-second pitch

> *"OnAlert watches the CBP scheduler 24/7 and texts/emails you the moment a Global Entry, NEXUS, or SENTRI cancellation slot opens. Slots fill in 5–15 minutes — Pro polls every 5 minutes, Express every 1 minute. One-time payment from $39. No subscription. You only need it until you book."*

Every variation should preserve four things: **what** (slot alerts), **how fast** (5-min / 1-min polling vs. 5–15 min fill), **how much** (one-time $39), and **the freedom from subscriptions**.

## Qualification (in 3 questions)

Use this to triage inbound leads or to score outbound prospects before personalizing further.

1. **"Have you applied for Global Entry, NEXUS, or SENTRI yet?"**
   - **Yes, conditionally approved** → high-intent, sell now
   - **Yes, waiting on conditional approval** → educate, capture email, follow up when approved
   - **No, just researching** → not ICP yet, point to `/guide` and the wait-times directory

2. **"What's the current wait at your closest enrollment center?"**
   - **3+ months** → standard ICP, sell Pro
   - **6+ months** → urgent ICP, mention Express
   - **<1 month** → no real pain, free tier or no-sell

3. **"When's your next international trip?"**
   - **<2 weeks** → **Express** ($79) is the right tier
   - **<3 months** → **Pro** ($39) is the right tier
   - **No specific trip** → **Pro** for the convenience; **Free** if price-sensitive

## Tier recommendation engine

Use the strongest signal:

| Signal | Recommend |
|--------|-----------|
| User mentions multiple family members | **Multi** ($59) |
| Trip in <2 weeks, or "this is urgent" language | **Express** ($79) |
| First-time user, browsing | **Free** → **Pro** in lifecycle |
| Single applicant, normal urgency | **Pro** ($39) |
| Free user with 3 locations maxed and active checking | **Pro** upgrade prompt |
| Free user who got an alert too late (slot already gone) | **Pro** "the conversion moment" |

## Anchor stats (drop into copy verbatim)

- **3–12 months** — typical wait at high-demand enrollment centers
- **5–15 minutes** — how long a cancellation slot is bookable
- **60×** — speed advantage of Express over Free (1 min vs. 60 min)
- **12×** — speed advantage of Pro/Multi over Free (5 min vs. 60 min)
- **$39** — one-time price of Pro
- **45** — enrollment centers monitored
- **3** — Trusted Traveler programs supported (GE, NEXUS, SENTRI — each includes TSA PreCheck)
- **<30 seconds** — alert delivery latency target after detection
- **>99%** — alert delivery rate target

Pull from [VALUE_PROP.md](./VALUE_PROP.md) for the latest list.

## Channel scripts

### Reddit (r/GlobalEntry, r/awardtravel, r/TravelHacking, r/IFly)

**Tone**: helpful first, product mention second. Reddit punishes overt selling. Always answer the question even if it's not directly about OnAlert.

**Template — answering "how do I get my GE interview faster":**

> *Honestly, the only thing that actually works is monitoring for cancellation slots — they fill in 5–15 minutes so manual refreshing is mostly luck. I built [OnAlert](https://onalert.app) to do this automatically. It polls the CBP API every 5 minutes (1 min on Express) and emails/texts you the moment a slot opens. $39 one-time, no subscription, you only need it until you book. The wait-times tool at /wait-times is free if you just want to see what the current backlog looks like at your locations.*

**Template — replying to "is X service legit":**

> *I've used [comparable] before and it was [honest answer]. If you want something with active development and proper security (column-level RLS, signed webhooks, all that), [OnAlert](https://onalert.app) is what I'd point you at. It's $39 one-time for 5-min polling. The free tier exists if you want to test it on a real monitor first.*

**Disclosure**: always disclose if you built / are affiliated with the product. Reddit will downvote and ban for hidden promotion.

### SEO (high-intent landing pages)

Target pages should match the searcher's exact phrasing in H1, then deliver the answer in the first 100 words. Examples:

- "How long is the wait for Global Entry at JFK in 2026?" → wait-times page for JFK
- "Is there a Global Entry appointment alert app?" → comparison-style landing page
- "How do I get a Global Entry interview faster?" → cornerstone guide

**Default H1 / lede pattern:**

> # How to Get Your Global Entry Interview Faster (2026)
> 
> The CBP scheduler doesn't notify you when a cancellation opens. Slots fill in 5–15 minutes. The only practical way to catch one is to monitor the API continuously — which is exactly what OnAlert does. **Pro: $39 one-time, no subscription.** Here's how it works.

### Twitter / X

Threads work better than single tweets for this audience. Lead with the painful stat, then the unlock.

**Template — pain-led thread:**

1. *"The CBP scheduler has no notification system. Cancellation slots open and refill in 5–15 minutes. If you're not refreshing at the exact right moment, you wait another month. 🧵"*
2. *"I built OnAlert to fix this. It polls the CBP API every 5 minutes (1 min on Express) and texts/emails you the moment a slot opens for the locations you care about."*
3. *"Pro is $39 once. No subscription — you only need it until you book your interview. Multi ($59) covers 5 monitors for families. Express ($79) is for trips in the next 2 weeks."*
4. *"Free tier exists if you want to try it. We watch 24/7 — onalert.app"*

### Travel-blog outreach

**Template — pitching a sponsored mention or guest post:**

> Subject: Tool that actually solves the Global Entry appointment wait
> 
> Hi [name],
> 
> Big fan of [specific recent post]. Quick pitch: I run OnAlert (onalert.app), which monitors the CBP scheduler 24/7 and alerts users when a cancellation opens. The category is mostly abandoned subscription tools — we're a one-time payment, production SaaS, with sub-minute polling on the Express tier and full coverage of all 45 enrollment centers.
> 
> A lot of your readers are probably stuck on the 6-month interview wait. I'd love to write a guest post on getting through it, or sponsor a "how to get Global Entry faster" piece if that's a fit.
> 
> Anchor stats I can back up with data: slots fill in 5–15 min, our Pro tier polls every 5 min, Express every 1 min, alert delivery <30s after detection.
> 
> Worth a conversation?
> 
> [signature]

### Cold email (B2B / employer expansion)

Target audience: HR or T&E managers at consulting / finance / biotech firms that reimburse Global Entry.

**Template — B2B outbound:**

> Subject: Cut your team's Global Entry interview wait from months to days
> 
> Hi [name],
> 
> [Company] reimburses Global Entry enrollment for frequent international flyers. The benefit is great — but the catch is that interview wait times at [their HQ city] run 6–9 months, and the CBP scheduler has no notification system for cancellations.
> 
> OnAlert solves that. We monitor the CBP API 24/7 and alert your travelers within minutes when a slot opens at their preferred enrollment center. We're working on group plans starting at $25/seat for 10+ employees — meaningfully cheaper than the $39 retail and consolidated billing.
> 
> Worth a 15-minute call to see if it fits?
> 
> [signature]

## Triggered messages (in-product lifecycle)

These fire on specific user behavior signals from [ICP.md](./ICP.md).

### Signal: free user adds 3+ locations to a single monitor (hedging behavior)
**Subject**: *Watching multiple locations? Here's how to do it without the cap*
> *You're maxed out on the free tier (3 locations). The math is simple: more locations = more chances to catch a cancellation. **Multi** ($59 once) lets you watch unlimited locations across 5 monitors. **Pro** ($39 once) keeps you at 1 monitor but bumps you to 10 locations and 5-min polling. Both are one-time. — OnAlert*

### Signal: free user got an alert >15 min after slot first appeared (the painful moment)
**Subject**: *That slot was already gone, wasn't it?*
> *Free polls every 60 minutes and adds a 15-min delivery delay — by design, it almost never catches slots. **Pro** is $39 once for 5-min polling and instant delivery. That's the difference between getting an alert and actually booking. — OnAlert*

### Signal: user mentions "trip in [N] weeks" in onboarding
**Subject**: *Trip in <2 weeks? Look at Express*
> *Slots fill in 5–15 minutes. If your trip is in the next 2 weeks, Pro's 5-min polling may still miss the fastest-moving slots. **Express** ($79 once) polls every 60 seconds and pre-verifies every slot before sending. It's the highest-probability tier we offer. — OnAlert*

### Signal: post-booking success
**Subject**: *Got your interview? Help a friend get theirs.*
> *Glad we could help! If you know someone else stuck on the wait, here's $10 off OnAlert for them: [coupon]. We'll send you $10 too once they sign up. — OnAlert*

### Signal: free user has had a monitor active for 7+ days but no alerts
**Subject**: *Quick reality check on your free monitor*
> *Your monitor's been active for a week with no slots. Two things may be happening: (1) your locations genuinely have no cancellations right now, or (2) free polling (every 60 min) is missing them — slots fill in 5–15. Pro upgrades you to 5-min polling for $39 once. Free tier auto-pauses at 14 days, FYI. — OnAlert*

## Objection handling

### "How is this different from [other monitoring tool / Reddit]?"
> *Reddit is delayed (someone has to post the slot first), and most other monitoring tools are abandoned subscription products. We're an actively developed SaaS with one-time pricing, sub-minute polling on Express, and production-grade security (column-level RLS, signed webhooks, idempotent payments). The wait-times directory and per-location intelligence are unique to us — we have the dataset.*

### "Why one-time and not a subscription?"
> *Because that's how you actually use it. You need monitoring until you book the interview. After that, you're done. Charging you forever doesn't match the use case. Pro is $39 once — buy it, book your interview, never think about it again.*

### "$39 feels expensive for an alert tool."
> *Compared to what? Conditional approval expires after about a year — re-applying is another $100 fee plus another wait. A trip without expedited processing means 30–60 extra minutes per international leg, every leg, for 5 years. Or compare to manually refreshing the CBP scheduler 5 times a day for 6 months — that's literal hours of your life. $39 once buys back all of it.*

### "How do I know it actually works?"
> *Try the free tier. It catches the easy slots and shows you what alerts feel like. Most users hit the "got the alert too late" wall within a week and convert because the math is unforgiving. We also publish per-location wait-time data publicly at /wait-times — that data comes from real polling. If you want to see the alert pipeline working before you pay, the free tier is built for exactly that.*

### "Is this legal? Are you scraping?"
> *We poll the same public CBP scheduler API your browser uses when you check manually. We're not scraping behind authentication, we don't bypass any rate limits, we don't impersonate anyone. The API is public.*

### "What if I don't catch a slot?"
> *Money-back guarantee on the way (30 days). In the meantime: Pro covers 10 locations on 5-min polling — if you have flexibility on location, you'll catch a slot. Express covers unlimited locations on 1-min polling for the most urgent cases. The thing OnAlert can't control is whether anyone in your area cancels their interview — that's a supply problem. We control the speed and reliability of the alert.*

### "I'm worried about my data / privacy."
> *We collect the minimum to run the product: email, plan, monitor configuration, alert history. We don't sell data. Every user-owned row is locked down with row-level security in Postgres, plus column-level grants that prevent even an attacker with your session token from changing your plan or admin status. Stripe handles payment data — we never see your card.*

### "Will my monitor still work after the trip / once I book?"
> *Pro/Multi/Express monitors never expire. You can pause or delete them whenever. Free monitors auto-pause after 7 days because they're meant for short-term trial use.*

### "Why can't I monitor TSA PreCheck directly?"
> *TSA PreCheck enrollment uses a different scheduling system that we don't currently monitor. The good news: TSA PreCheck is included as a benefit in all three programs we do cover — Global Entry, NEXUS, and SENTRI. If PreCheck is your goal, applying for Global Entry gets you both for the same fee.*

## Persona-specific framing

For full persona detail, see [ICP.md](./ICP.md).

### Frequent Traveler (Pro)
- Lead with: time saved, missed-slot frustration, one-time pricing
- Anchor stat: "12× faster than free"
- Avoid: enterprise / family framing (wrong target)

### Family Coordinator (Multi)
- Lead with: cover the whole household in one purchase
- Anchor stat: "$59 once for up to 5 family members"
- Avoid: language that implies a single applicant

### Urgent Traveler (Express)
- Lead with: trip date pressure, the math of 1-min polling
- Anchor stat: "60× faster than free, with pre-verified slots"
- Avoid: long deliberation copy — these users decide in minutes

### Business Traveler (Pro or Express, employer-reimbursed)
- Lead with: productivity reframing, employer reimbursement angle
- Anchor stat: TBD on group pricing once GA
- Avoid: consumer-mom framing

### Anxious First-Timer (Free → Pro)
- Lead with: education, "here's what the wait actually looks like"
- Anchor stat: per-location wait time at their closest center (pull from `/wait-times`)
- Avoid: heavy upsell on first touch — let the free tier do the conversion work

## Channel-specific guardrails (do not violate)

- **Email**: every marketing email needs an unsubscribe link. Transactional alerts (the actual slot notifications) are exempt and must always send.
- **SMS**: Twilio messages must include the brand and an opt-out keyword. Never SMS users without explicit opt-in via the settings page (`sms_alerts_enabled` + `phone_number`).
- **Push**: web push requires browser-level subscription consent. Never trigger a permission prompt on first page load.
- **Reddit**: always disclose affiliation. Comply with subreddit self-promotion rules (most allow ~1 in 10 comments to be promotional).
- **Cold email**: comply with CAN-SPAM (US), GDPR (EU), CASL (Canada). Always include a physical mailing address and unsubscribe path.
- **Don't impersonate users.** Never write "I used OnAlert" copy as if from a customer unless it's an actual customer testimonial with permission.
- **Don't promise an interview.** We promise alert speed and reliability. We can't guarantee CBP cancellations at the user's chosen locations.

## When in doubt

- Pull facts from [VALUE_PROP.md](./VALUE_PROP.md), [ICP.md](./ICP.md), and [OUTCOMES.md](./OUTCOMES.md) — those files are the source of truth
- Match the brand voice in [BRANDING.md](./BRANDING.md): urgent but never alarmist, confident and precise, helpful not pushy
- Lead with the customer's pain, not our features
- Quote a number, not an adjective
- One-time pricing is part of the brand promise — never imply a subscription
