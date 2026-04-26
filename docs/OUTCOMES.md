# Outcomes & Success Metrics

This file tracks what success looks like for OnAlert — both for the customer (the outcome they buy) and for the business (the metrics we manage).

## Customer outcome (the thing they're paying for)

> *A confirmed CBP enrollment interview, weeks or months sooner than they would have gotten one by manually refreshing the scheduler.*

Everything we build, write, and ship serves this single outcome. If a feature doesn't make it more likely a user catches a slot before it fills, it isn't a priority.

### How customers describe success

- *"I had been waiting 6 months. OnAlert got me an interview in 3 days."*
- *"My trip was in 4 weeks. I bought Express on a Friday and was scheduled at JFK by Sunday."*
- *"Bought Multi for the whole family. We all got interviews at the same enrollment center within 10 days."*
- *"I was about to give up and travel without Global Entry. OnAlert alerted me at 11pm on a Tuesday and I booked it on my phone."*

These are the testimonials we ask for at the post-booking moment. They become marketing copy, social proof, and the source content for sales scripts.

## North star metric

**Successful bookings attributed to OnAlert** — alerts where the user clicked the booking CTA within 15 minutes of delivery and the slot subsequently disappeared from the CBP API (strong proxy for "they booked it").

Tracked via `track-booking-click` edge function joined against `slot_history.gone_at`.

## Customer-outcome KPIs

| Metric | Target | How to measure |
|--------|--------|----------------|
| Time from signup to first alert | <24 hours (Pro), <72 hours (Free) | `MIN(alerts.created_at) - profiles.created_at` per user |
| Time from first alert to first booking click | <2 minutes | `MIN(booking_clicks.clicked_at) - alerts.delivered_at` |
| Booking click → slot-gone correlation rate | >70% (Pro), >85% (Express) | Click within 15 min of alert + slot disappears within 30 min |
| Self-reported "got my interview" rate | >40% of paid users within 30 days | Post-booking story prompts captured in `booking_stories` |
| NPS (post-booking) | >50 | Asked in the success-story prompt |

## Product-health KPIs

| Metric | Target | How to measure |
|--------|--------|----------------|
| Slot detection latency | <5 min (Pro/Multi), <1 min (Express), <60 min (Free) | `slot_history.first_seen_at - actual CBP open time` (estimated) |
| Alert delivery latency (detection → email) | <30s | `alerts.delivered_at - alerts.created_at` |
| Alert delivery rate | >99% | `alerts WHERE delivered_at IS NOT NULL / total` |
| Polling success rate | >98% | `scrape_logs WHERE error IS NULL / total` |
| Edge-function p95 latency | <2s | Supabase edge function logs |
| Realtime in-app delivery latency | <2s | Client-side timestamp from Supabase Realtime event |
| App uptime | 99.9% | Vercel + Supabase status monitoring |
| Landing page LCP | <2.0s | Vercel Analytics |
| CBP API rate-limit (429) rate | <0.5% of fetches | `location_fetch_logs WHERE status = 429` |

## Engagement KPIs

| Metric | Target | How to measure |
|--------|--------|----------------|
| Signup → first monitor | >75% | `profiles WITH monitor / total profiles` |
| Time to first monitor | <5 min | `MIN(monitors.created_at) - profiles.created_at` |
| Daily active users (alerts feed visits) | Growing week-over-week | Distinct users hitting `/app/alerts` |
| Alert read rate | >70% | `alerts WHERE read_at IS NOT NULL / delivered` |
| Booking CTA click-through rate | >50% (paid), >25% (free) | `booking_clicks / alerts.delivered` |
| Active-monitor count | Growing month-over-month | `COUNT(monitors WHERE active)` |
| PWA install rate (mobile) | >15% | `beforeinstallprompt` accept rate |

## Business KPIs

| Metric | Target | How to measure |
|--------|--------|----------------|
| Total revenue | Growing month-over-month | Stripe dashboard (sum of one-time charges) |
| Paid users | Growing | `profiles WHERE plan IN ('pro', 'multi', 'express')` |
| Free → Paid conversion | >5% within 30 days, >8% within 90 days | Cohort by `profiles.created_at` |
| Avg revenue per paid user (ARPU) | $42–$48 (weighted across tiers) | Total revenue / paid users |
| Multi share of paid revenue | >30% | Multi revenue / total paid revenue |
| Express share of paid revenue | >10% | Express revenue / total paid revenue |
| Refund rate | <2% | Stripe refunds / total paid |
| Chargeback / dispute rate | <0.5% | Stripe disputes / total paid |
| Payback period (CAC) | <30 days | Acquisition spend / new paid revenue |

## Growth KPIs

| Metric | Target | How to measure |
|--------|--------|----------------|
| Organic signup rate | Growing weekly | New profiles per week with no UTM |
| Referral signups | >10% of new signups | `profiles.referred_by IS NOT NULL` |
| SEO rankings (priority terms) | Top 5 for 10+ priority keywords | Google Search Console |
| Wait-times page traffic | Growing month-over-month | Sessions to `/locations/*` |
| Wait-times → signup conversion | >2% | Sessions on `/locations/*` that result in signup |
| Reddit / social mentions | Growing | Manual tracking + Brand24 / equivalent |
| Backlinks from travel blogs | Growing | Ahrefs / Search Console |

## ROI math (for sales copy)

> "Slots fill in 5–15 minutes. Free checks every 60 and delays delivery 15 more — by design, free almost never catches a slot. $39 once gets you 5-minute polling and instant delivery. That single difference is the difference between getting an alert and actually booking."

For Pro ($39):
- Estimated user value of a caught GE interview 6 months sooner: **easily $200+** (saved time at the airport over 5 years × frequency of travel)
- Cost: $39 once
- Expected ROI: **5–10×** for a single trip; vastly more for repeat travelers

For Express ($79):
- Use case: confirmed trip in <2 weeks; no expedited processing means missing TSA PreCheck and the GE customs lane
- Cost of failure (manual): rebooking the trip, paying full-fare flexibility, or traveling without expedited processing
- Cost of Express: $79 once
- Expected ROI: typically **>10×**

## Quality gates (every release)

- [ ] `npm run build` passes with zero TypeScript errors
- [ ] `npm run lint` passes with zero ESLint errors
- [ ] Landing page renders without env vars (graceful degradation)
- [ ] All three auth flows work end-to-end (Google OAuth, email + password, magic link)
- [ ] Magic-link deep-link from email opens authenticated `/app` (regression: this broke once)
- [ ] Monitor creation wizard completes for free, Pro, Multi, Express plans (limits enforced both client + server)
- [ ] Alert email delivery works (Resend) and is HTML-escaped
- [ ] Stripe checkout creates a one-time charge and upgrades the user plan
- [ ] Stripe webhook is signature-verified, idempotent against `stripe_events`, and rejects price tampering
- [ ] Edge functions reject requests missing `x-cron-secret` (cron tier) or `x-internal-secret` (internal tier)
- [ ] Customer portal opens and loads billing info
- [ ] ErrorBoundary catches and displays errors gracefully
- [ ] PWA manifest validates in Chrome DevTools
- [ ] Mobile layout renders correctly at 375px viewport with no scroll on enforced pages
- [ ] Public wait-times page loads and is indexable; `/app/*` is correctly noindex/nofollow

## Revenue milestones (motivation, not a forecast)

| Milestone | Cumulative revenue | Significance |
|-----------|-------------------|--------------|
| First paying customer | $39 | Product-market signal |
| Break-even on hosting | ~$100 | Self-sustaining infrastructure |
| 50 paid users | ~$2,400 | Validates pricing model |
| 100 paid users | ~$5,000 | Strong PMF signal |
| 500 paid users | ~$25,000 | Meaningful one-time revenue |
| 1,000 paid users | ~$50,000 | Full-time viable for a solo founder |
| 5,000 paid users | ~$250,000 | Category leadership in this niche |
| Multi share >30% of revenue | n/a | Family expansion playing out as designed |
| Express share >10% of revenue | n/a | Urgency-tier capturing willingness-to-pay |
