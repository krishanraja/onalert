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
| Total revenue | Growing | Stripe Dashboard (cumulative one-time payments) |
| Paid users | Growing monthly | `profiles WHERE plan IN ('pro', 'multi')` |
| Free-to-paid conversion | >5% | Paid users / total profiles |
| Revenue per paid user | $39-$59 | Total revenue / paid users |
| Multi plan adoption | >20% of paid | Multi users / total paid users |
| Payback period | <1 month | Acquisition cost / average revenue per user |

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
- [ ] Stripe checkout creates one-time payment and upgrades plan
- [ ] Stripe webhook correctly handles `checkout.session.completed`
- [ ] Customer portal opens and loads billing info
- [ ] ErrorBoundary catches and displays errors gracefully
- [ ] PWA manifest validates in Chrome DevTools
- [ ] Mobile layout renders correctly at 375px viewport

## Revenue Milestones

| Milestone | Revenue | Significance |
|-----------|---------|-------------|
| First paying customer | $39 | Product-market signal |
| Break even (hosting costs) | ~$100 | Self-sustaining infrastructure |
| 50 paid users | ~$2,450 | Validates pricing model |
| 100 paid users | ~$4,900 | Strong product-market fit |
| 500 paid users | ~$24,500 | Meaningful one-time revenue |
| 1,000 paid users | ~$49,000 | Full-time viable |
