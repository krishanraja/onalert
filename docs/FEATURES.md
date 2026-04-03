# Features

## Core Features

### Monitor Management
- **Create monitors**: 3-step wizard (service type → locations → confirm)
- **Pause/resume**: Toggle monitor active state without deleting
- **Delete**: Confirmation step before permanent deletion
- **Location search**: Filter 50 top CBP enrollment centers by name/city/state
- **Plan limits**: Free = 1 monitor, Premium = unlimited

### Alert System
- **Real-time detection**: Polls CBP API every 10min (premium) or 60min (free)
- **New slot detection**: Compares current slots against last-known state
- **Alert feed**: Reverse-chronological list with unread indicators
- **Alert detail**: Full slot info, location, booking link, time-sensitive warning
- **Mark as read**: Automatic on view, manual via alert detail
- **Haptic feedback**: Vibration on new alert (mobile devices)
- **Realtime push**: Supabase Realtime delivers alerts without page refresh

### Notifications
- **Email**: Branded HTML email with slot time, location, booking CTA
- **Delivery tracking**: `delivered_at` timestamp per alert
- **Urgency messaging**: "Slots typically fill within 5–15 minutes"

### Authentication
- **Magic link**: Passwordless email OTP via Supabase Auth
- **Session persistence**: Auto-refresh tokens, detect session in URL
- **Auth guard**: Protected `/app` routes redirect to `/auth`

### Payments
- **Stripe Checkout**: Hosted payment page for subscriptions
- **Plans**: Monthly ($19) and Annual ($149, saves $79)
- **Customer portal**: Self-service billing management
- **Webhook handling**: Auto-upgrade/downgrade on subscription events
- **Payment failure handling**: Logged for monitoring

### PWA
- **Installable**: Add to home screen on iOS/Android
- **Service worker**: Offline caching via Workbox
- **Manifest**: App icons, standalone display, portrait orientation

## Feature Matrix

| Feature | Free | Premium |
|---------|------|---------|
| Active monitors | 1 | Unlimited |
| Check interval | 60 min | 10 min |
| Email alerts | Yes | Yes |
| SMS alerts | No | Yes (planned) |
| Locations per monitor | 3 | Unlimited |
| Realtime push | Yes | Yes |

## Planned Features

- [ ] SMS notifications via Twilio
- [ ] Appointment enrollment for additional CBP programs
- [ ] Slack/Discord webhook integration
- [ ] Custom check intervals
- [ ] Multi-language support
