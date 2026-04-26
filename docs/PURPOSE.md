# Purpose

## Why OnAlert exists

The U.S. Customs and Border Protection (CBP) Trusted Traveler Programs — Global Entry, NEXUS, and SENTRI — require an in-person enrollment interview at a designated center after conditional approval. *(TSA PreCheck is a benefit included in all three programs and does not have its own monitor in OnAlert.)*

After conditional approval, applicants routinely face wait times of 3–12 months at popular locations because:

1. **Limited capacity** — high-demand airports (JFK, LAX, SFO, ORD, EWR, DFW) have very few interview slots per day relative to demand
2. **Cancellation churn** — slots open unpredictably when other travelers cancel or reschedule
3. **No native notifications** — the CBP scheduler offers zero alerting capability; users must manually check
4. **Fill-time arithmetic** — when a cancellation slot does open, it typically fills in 5–15 minutes

The result is a painful and structurally inequitable situation: the travelers who happen to be refreshing the page at the right moment win an early appointment; everyone else keeps waiting.

## What OnAlert does

OnAlert automates the manual checking process and levels the playing field:

1. **Monitors** the CBP scheduler API at configurable intervals — every 1 min (Express), 5 min (Pro/Multi), or 60 min (Free)
2. **Detects** newly available slots by comparing each polling cycle's response against the last-known state per monitor
3. **Alerts** users within seconds via branded HTML email, optional SMS, web push, and an in-app realtime feed
4. **Links** directly into the CBP scheduler at the right location and service so the user can book immediately

One setup. Always watching. No more manual refreshing.

## Who it's for

- **Conditionally approved applicants** for Global Entry, NEXUS, or SENTRI
- **Frequent international travelers** who need an interview before an upcoming trip
- **Family coordinators** managing 2–4 applications across multiple programs and locations
- **Urgent travelers** with a confirmed trip in the next 1–2 weeks who need expedited processing fast
- **Anyone** tired of refreshing the CBP scheduler and missing slots by minutes

See [ICP.md](./ICP.md) for full personas and acquisition channels.

## Design philosophy

- **Mobile-first.** Designed as an installable PWA — most users will receive alerts and book on their phone in any context
- **Urgency-driven.** Alert UI emphasizes speed: time-since-alert, slot expiry warning, one-tap booking
- **Low-friction onboarding.** Google OAuth, email + password, or magic link — pick whichever
- **Bloomberg-terminal aesthetic.** Dark surfaces, monospace data, crimson accents — conveys precision, reliability, and authority. Avoids the generic "consumer SaaS" look that the rest of the category wears
- **Privacy-first.** Minimal data collection, no data selling, row-level security on every user-owned table, column-level grants preventing self-elevation
- **Honest pricing.** One-time payment aligned with how customers actually use the product (until they book), not how many months we can charge them

## What OnAlert is *not*

- Not a generic "monitor any URL" tool — it is purpose-built for CBP Trusted Traveler appointments, and that focus is the product
- Not a subscription — every paid tier is a one-time purchase
- Not a guarantee of an appointment — slot availability depends on cancellations at the user's chosen locations; what we guarantee is the alert speed and reliability
- Not a TSA PreCheck monitor — TSA PreCheck is bundled with all three programs we cover; if you only want PreCheck, the right move is to apply for Global Entry directly
