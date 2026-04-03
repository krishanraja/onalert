# Features

## Core Features

### Monitor Management
- **Create monitors**: Guided 3-step wizard (service type -> locations -> confirm)
- **Four programs supported**: Global Entry, TSA PreCheck, NEXUS, SENTRI
- **50+ enrollment centers**: Searchable by name, city, or state
- **Pause/resume**: Toggle monitor active state without deleting configuration
- **Delete**: Confirmation dialog before permanent removal
- **Plan-based limits**: Free = 1 monitor (3 locations), Pro = 1 monitor (unlimited locations), Family = 5 monitors (unlimited locations)

### Alert System
- **Real-time detection**: Polls CBP API every 5min (paid) or 60min (free)
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
- **SMS ready**: Infrastructure in place for Twilio/SNS integration (paid feature)

### Authentication
- **Google OAuth**: One-tap sign-in via Google account
- **Email + password**: Traditional sign-up and sign-in with 6+ character passwords
- **Magic link**: Passwordless email-based sign-in via Supabase Auth
- **Session persistence**: Auto-refresh tokens, detect session in URL
- **Auth guard**: Protected `/app` routes redirect unauthenticated users to `/auth`

### Payments & Billing
- **Stripe Checkout**: Hosted payment page for one-time purchase
- **Three plans**: Free, Pro ($29 one-time), Family ($49 one-time)
- **Webhook-driven sync**: Auto-upgrade on successful payment
- **No subscription management needed**: One-time purchase model eliminates cancellation friction

### Progressive Web App (PWA)
- **Installable**: Add to home screen on iOS, Android, and desktop
- **Service worker**: Offline caching via Workbox for instant loads
- **App manifest**: Custom icons (192px, 512px), standalone display, portrait orientation
- **Native feel**: Full-screen mode, custom theme color, splash screen

### Landing Page
- **Hero section**: Clear value proposition with program badges
- **Feature highlights**: Three key benefits with icons
- **Pricing display**: Three-tier comparison (Free, Pro, Family) with one-time pricing
- **Social proof ready**: Infrastructure for testimonials and metrics

## Feature Matrix

| Feature | Free | Pro ($29) | Family ($49) |
|---------|------|-----------|--------------|
| Active monitors | 1 | 1 | Up to 5 |
| Locations per monitor | 3 | Unlimited | Unlimited |
| Check interval | 60 min (enforced) | 5 min (12x faster) | 5 min (12x faster) |
| Email alert delivery | Delayed 15 min | Instant | Instant |
| SMS alerts | -- | Yes (planned) | Yes (planned) |
| Real-time in-app alerts | Yes | Yes | Yes |
| Direct booking links | Yes | Yes | Yes |
| Monitoring window | 7 days | Never expires | Never expires |
| Payment model | Free forever | One-time | One-time |

## Planned Features

- [ ] SMS notifications via Twilio (paid)
- [ ] Push notifications via Web Push API
- [ ] Slack/Discord webhook integration
- [ ] Custom check intervals
- [ ] Historical slot availability charts
- [ ] Multi-language support (Spanish, French)
- [ ] Email delivery status tracking via Resend webhooks
- [ ] Alert retry mechanism for failed deliveries
- [ ] Referral program (share success, earn credits)
