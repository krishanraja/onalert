# Features

## Core Features

### Monitor Management
- **Create monitors**: Guided 3-step wizard (service type -> locations -> confirm)
- **Four programs supported**: Global Entry, TSA PreCheck, NEXUS, SENTRI
- **50+ enrollment centers**: Searchable by name, city, or state
- **Pause/resume**: Toggle monitor active state without deleting configuration
- **Delete**: Confirmation dialog before permanent removal
- **Plan-based limits**: Free = 1 monitor (3 locations), Premium = unlimited

### Alert System
- **Real-time detection**: Polls CBP API every 10min (premium) or 60min (free)
- **Intelligent comparison**: Detects new slots by comparing current state against last-known slots
- **Alert feed**: Reverse-chronological list with unread indicators and badge count
- **Alert detail view**: Full slot info, location, date/time, time-sensitive warning, and direct booking link
- **Auto mark-as-read**: Alerts marked read on view
- **Haptic feedback**: Vibration pattern on new alert arrival (mobile devices)
- **Realtime push**: Supabase Realtime delivers alerts to the browser without page refresh
- **Narrative descriptions**: Human-readable alert text (e.g., "Global Entry slot at JFK on Monday, April 5 at 2:30 PM")

### Notifications
- **Branded HTML email**: Dark-themed email with slot time, location, service badge, and booking CTA
- **Delivery tracking**: `delivered_at` timestamp per alert for monitoring delivery health
- **Urgency messaging**: "Slots typically fill within 5-15 minutes" prominently displayed
- **SMS ready**: Infrastructure in place for Twilio/SNS integration (premium feature)

### Authentication
- **Google OAuth**: One-tap sign-in via Google account
- **Email + password**: Traditional sign-up and sign-in with 6+ character passwords
- **Magic link**: Passwordless email-based sign-in via Supabase Auth
- **Session persistence**: Auto-refresh tokens, detect session in URL
- **Auth guard**: Protected `/app` routes redirect unauthenticated users to `/auth`

### Payments & Billing
- **Stripe Checkout**: Hosted payment page for frictionless subscription signup
- **Two plans**: Monthly ($19/mo) and Annual ($149/yr, saves $79)
- **Customer portal**: Self-service billing management (update payment, cancel, view invoices)
- **Webhook-driven sync**: Auto-upgrade on payment, auto-downgrade on cancellation
- **Payment failure logging**: Failed invoices tracked for monitoring

### Progressive Web App (PWA)
- **Installable**: Add to home screen on iOS, Android, and desktop
- **Service worker**: Offline caching via Workbox for instant loads
- **App manifest**: Custom icons (192px, 512px), standalone display, portrait orientation
- **Native feel**: Full-screen mode, custom theme color, splash screen

### Landing Page
- **Hero section**: Clear value proposition with program badges
- **Feature highlights**: Three key benefits with icons
- **Pricing display**: Side-by-side free vs premium comparison
- **Social proof ready**: Infrastructure for testimonials and metrics

## Feature Matrix

| Feature | Free | Premium |
|---------|------|---------|
| Active monitors | 1 | Unlimited |
| Locations per monitor | 3 | Unlimited |
| Check interval | 60 min | 10 min (6x faster) |
| Email alerts | Yes | Yes |
| SMS alerts | -- | Yes (planned) |
| Real-time in-app alerts | Yes | Yes |
| Direct booking links | Yes | Yes |
| Haptic feedback | Yes | Yes |
| Customer portal | -- | Yes |
| Priority support | -- | Yes |

## Planned Features

- [ ] SMS notifications via Twilio (premium)
- [ ] Push notifications via Web Push API
- [ ] Slack/Discord webhook integration
- [ ] Custom check intervals
- [ ] Historical slot availability charts
- [ ] Multi-language support (Spanish, French)
- [ ] Email delivery status tracking via Resend webhooks
- [ ] Alert retry mechanism for failed deliveries
