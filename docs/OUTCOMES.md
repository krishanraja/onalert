# Outcomes & Success Metrics

## North Star Metric

**Alerts that lead to bookings**: The number of alerts where the user successfully books the appointment. (Proxy: clicks on the booking CTA within 15 minutes of alert delivery.)

## Key Performance Indicators

### Product Health

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Alert delivery rate | >99% | `alerts WHERE delivered_at IS NOT NULL / total alerts` |
| Alert latency | <30s | `delivered_at - created_at` average |
| Polling success rate | >98% | `scrape_logs WHERE error IS NULL / total runs` |
| App uptime | 99.9% | Vercel + Supabase status |
| Realtime delivery | <2s | Client-side measurement |

### User Engagement

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Active monitors | Growing | `COUNT(monitors WHERE active = true)` |
| Alert read rate | >70% | `alerts WHERE read_at IS NOT NULL / delivered alerts` |
| Booking click-through | >50% | Email CTA click tracking (Resend) |
| Daily active users | Growing | Supabase Auth sessions |
| Session duration | >30s | Client analytics |

### Business

| Metric | Target | How to Measure |
|--------|--------|----------------|
| MRR | Growing | Stripe Dashboard |
| Free-to-premium conversion | >5% | Profiles with plan='premium' / total |
| Churn rate | <10%/month | Stripe subscription cancellations |
| ARPU | $19 | MRR / paying customers |
| LTV | >$100 | ARPU / churn rate |

## Quality Gates

Before each release:

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Landing page renders without env vars
- [ ] Auth flow works end-to-end
- [ ] Monitor creation wizard completes
- [ ] Alert delivery (email) works
- [ ] Stripe checkout creates subscription
- [ ] Webhook updates plan correctly
- [ ] ErrorBoundary catches and displays errors gracefully
