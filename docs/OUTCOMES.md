# Outcomes & Success Metrics

## North Star Metric

**Alerts that lead to bookings**: The number of alerts where the user successfully books the appointment slot.

**Proxy metric**: Clicks on the booking CTA within 15 minutes of alert delivery (tracked via Resend email analytics).

## Key Performance Indicators

### Product Health

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Alert delivery rate | >99% | `alerts WHERE delivered_at IS NOT NULL / total alerts` |
| Alert latency (detection to email) | <30s | `delivered_at - created_at` average |
| Polling success rate | >98% | `scrape_logs WHERE error IS NULL / total runs` |
| App uptime | 99.9% | Vercel + Supabase status monitoring |
| Realtime delivery latency | <2s | Client-side timestamp measurement |
| Landing page load time | <2s | Vercel analytics (LCP) |

### User Engagement

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Active monitors | Growing month-over-month | `COUNT(monitors WHERE active = true)` |
| Alert read rate | >70% | `alerts WHERE read_at IS NOT NULL / delivered alerts` |
| Booking click-through rate | >50% | Resend email CTA click tracking |
| Daily active users | Growing | Supabase Auth session count |
| Monitor creation rate | >60% of signups | `profiles WITH >= 1 monitor / total profiles` |
| Time to first monitor | <5 minutes | Auth timestamp to first monitor created_at |

### Business

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Monthly Recurring Revenue (MRR) | Growing | Stripe Dashboard |
| Free-to-premium conversion | >5% | `profiles WHERE plan='premium' / total profiles` |
| Monthly churn rate | <10% | Stripe subscription cancellations / active subscribers |
| ARPU (monthly) | $19 | MRR / paying customers |
| Customer LTV | >$100 | ARPU / monthly churn rate |
| Annual plan adoption | >30% of premium | Annual subscriptions / total premium subscribers |
| Payback period | <1 month | Acquisition cost / ARPU |

### Growth Indicators

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Organic signup rate | Growing weekly | New profiles per week |
| Referral signups | >10% of total | UTM tracking or referral codes (future) |
| Search rankings | Top 5 for key terms | Google Search Console |
| Reddit/social mentions | Growing | Manual monitoring / alerts |

## Quality Gates

Before each release:

- [ ] `npm run build` passes with zero TypeScript errors
- [ ] `npm run lint` passes with zero ESLint errors
- [ ] Landing page renders without env vars (graceful degradation)
- [ ] All auth flows work end-to-end (Google OAuth, email/password, magic link)
- [ ] Monitor creation wizard completes successfully
- [ ] Alert email delivery works (Resend sends correctly)
- [ ] Stripe checkout creates subscription and upgrades plan
- [ ] Stripe webhook correctly handles subscription lifecycle events
- [ ] Customer portal opens and loads billing info
- [ ] ErrorBoundary catches and displays errors gracefully
- [ ] PWA manifest validates in Chrome DevTools
- [ ] Mobile layout renders correctly at 375px viewport

## Revenue Milestones

| Milestone | MRR | Significance |
|-----------|-----|-------------|
| First paying customer | $19 | Product-market signal |
| Break even (hosting costs) | ~$50 | Self-sustaining infrastructure |
| 50 premium users | $950 | Validates pricing model |
| $5K MRR | $5,000 | Meaningful recurring revenue |
| $10K MRR | $10,000 | Full-time viable |
