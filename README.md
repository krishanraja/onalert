# OnAlert

**Real-time government appointment slot monitoring.**

**[onalert.app](https://onalert.app)** -- Stop checking. Start knowing.

OnAlert monitors CBP Trusted Traveler Program schedulers (Global Entry, TSA PreCheck, NEXUS, SENTRI) and alerts you within minutes when appointment slots open from cancellations. Set up a monitor once, and OnAlert watches 24/7 so you don't have to.

## The Problem

Millions of conditionally approved travelers wait 3-12 months for enrollment interviews at popular locations. The CBP scheduler has no notification system -- slots from cancellations appear and fill within 5-15 minutes. Manual checking is time-consuming and unreliable.

## How It Works

1. **Create a monitor** -- choose your program (GE, TSA, NEXUS, SENTRI) and enrollment centers
2. **We poll the CBP API** -- every 10 min (premium) or 60 min (free), 24/7
3. **Get alerted instantly** -- branded email notification with slot details and direct booking link
4. **Book before it fills** -- slots typically fill in 5-15 minutes, so speed matters

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, Realtime) |
| Payments | Stripe (subscriptions via Checkout + Customer Portal) |
| Email | Resend (transactional alerts) |
| Hosting | Vercel (static SPA + global CDN) |
| PWA | Workbox service worker, installable on mobile |

## Quick Start

```bash
# Clone
git clone https://github.com/krishanraja/onalert.git
cd onalert

# Install
npm install

# Configure (copy and fill in your keys)
cp .env.example .env.local

# Run
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment Variables

```bash
# Required -- Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Required -- Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optional -- App URL (for auth redirects)
VITE_APP_URL=http://localhost:5173
```

See [docs/REPLICATION_GUIDE.md](docs/REPLICATION_GUIDE.md) for full setup instructions including Supabase, Stripe, Google OAuth, and Resend configuration.

## Project Structure

```
src/
  pages/          # 9 page components (Landing, Auth, Dashboard, Alerts, etc.)
  components/     # UI components (layout, monitors, alerts, ui/)
  hooks/          # useProfile, useMonitors, useAlerts
  lib/            # supabase, stripe, plans, cbpApi, locations, time, utils
  App.tsx         # Router with public and protected routes
  main.tsx        # Entry point + ErrorBoundary
  index.css       # Design system (CSS custom properties)

supabase/
  functions/      # 5 edge functions (Deno)
    poll-appointments/   # CRON: poll CBP API for new slots
    send-alert/          # Deliver email notifications via Resend
    create-checkout/     # Create Stripe checkout session
    customer-portal/     # Stripe billing portal
    stripe-webhook/      # Handle subscription lifecycle events
  migrations/     # Database schema + RLS policies

docs/             # Comprehensive project documentation (17 documents)
```

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # TypeScript check + production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

## Features

- **Multi-method auth**: Google OAuth, email/password, and magic link
- **4 programs**: Global Entry, TSA PreCheck, NEXUS, SENTRI
- **50+ locations**: Searchable enrollment centers across the US
- **Real-time alerts**: Email notifications + in-app realtime feed
- **Freemium model**: Free tier (1 monitor, 60min) + Premium ($19/mo, unlimited, 10min)
- **Stripe billing**: Checkout, customer portal, webhook-driven plan sync
- **PWA**: Installable on mobile, offline-capable
- **Dark terminal UI**: Bloomberg-inspired design with crimson accents

## Documentation

Full documentation is in the [`docs/`](docs/) directory:

### Business & Strategy
- **[Executive Summary](docs/EXECUTIVE_SUMMARY.md)** -- High-level overview for stakeholders
- **[Purpose](docs/PURPOSE.md)** -- Why OnAlert exists
- **[Value Proposition](docs/VALUE_PROP.md)** -- Market positioning and competitive advantage
- **[Ideal Customer Profile](docs/ICP.md)** -- Target users and acquisition channels
- **[Outcomes](docs/OUTCOMES.md)** -- Success metrics and KPIs

### Product & Design
- **[Features](docs/FEATURES.md)** -- Complete feature inventory
- **[Branding](docs/BRANDING.md)** -- Brand identity and assets
- **[Design System](docs/DESIGN_SYSTEM.md)** -- Colors, typography, components
- **[Visual Guidelines](docs/VISUAL_GUIDELINES.md)** -- Layout and responsive patterns

### Technical
- **[Architecture](docs/ARCHITECTURE.md)** -- System design and data flow
- **[Deployment](docs/DEPLOYMENT.md)** -- Production deployment guide
- **[Replication Guide](docs/REPLICATION_GUIDE.md)** -- Set up from scratch
- **[Common Issues](docs/COMMON_ISSUES.md)** -- Troubleshooting
- **[Decisions Log](docs/DECISIONS_LOG.md)** -- Technical decision rationale
- **[LLM Training](docs/LLM_CRITICAL_THINKING_TRAINING.md)** -- AI assistant guidelines

### Project Management
- **[History](docs/HISTORY.md)** -- Project timeline and changelog
- **[Sprints](docs/SPRINTS.md)** -- Roadmap and backlog

See [docs/README.md](docs/README.md) for the full documentation index.

## License

Proprietary. All rights reserved.
