# OnAlert

Real-time government appointment slot monitoring.

**[onalert.app](https://onalert.app)** — Stop checking. Start knowing.

OnAlert monitors CBP Trusted Traveler Program schedulers (Global Entry, TSA PreCheck, NEXUS, SENTRI) and alerts you within minutes when appointment slots open from cancellations.

## How It Works

1. **Create a monitor** — choose your program and enrollment centers
2. **We poll the CBP API** — every 10 min (premium) or 60 min (free)
3. **Get alerted instantly** — email notification with direct booking link
4. **Book before it fills** — slots typically fill in 5–15 minutes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, Realtime) |
| Payments | Stripe (subscriptions via Checkout) |
| Email | Resend (transactional alerts) |
| Hosting | Vercel (static SPA + CDN) |
| PWA | Workbox service worker, installable |

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
# Required — Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Required — Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optional — App URL (for auth redirects)
VITE_APP_URL=http://localhost:5173
```

See [docs/REPLICATION_GUIDE.md](docs/REPLICATION_GUIDE.md) for full setup instructions including Supabase, Stripe, and Resend configuration.

## Project Structure

```
src/
├── pages/          # 7 page components (Landing, Auth, Dashboard, etc.)
├── components/     # UI components (layout, monitors, alerts, ui/)
├── hooks/          # useProfile, useMonitors, useAlerts
├── lib/            # supabase, stripe, plans, cbpApi, locations, time, utils
├── App.tsx         # Router
├── main.tsx        # Entry point + ErrorBoundary
└── index.css       # Design system (CSS custom properties)

supabase/
├── functions/      # 5 edge functions (Deno)
│   ├── poll-appointments/   # CRON: check CBP API for new slots
│   ├── send-alert/          # Deliver email notifications
│   ├── create-checkout/     # Stripe checkout session
│   ├── customer-portal/     # Stripe billing portal
│   └── stripe-webhook/      # Handle subscription events
└── migrations/     # Database schema + RLS policies

docs/               # Comprehensive project documentation
```

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Type check + production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

## Documentation

Full documentation is in the [`docs/`](docs/) directory:

- **[Executive Summary](docs/EXECUTIVE_SUMMARY.md)** — High-level overview
- **[Architecture](docs/ARCHITECTURE.md)** — System design and data flow
- **[Features](docs/FEATURES.md)** — Complete feature inventory
- **[Deployment](docs/DEPLOYMENT.md)** — Production deployment guide
- **[Replication Guide](docs/REPLICATION_GUIDE.md)** — Set up from scratch
- **[Common Issues](docs/COMMON_ISSUES.md)** — Troubleshooting
- **[Design System](docs/DESIGN_SYSTEM.md)** — Colors, typography, components
- **[Decisions Log](docs/DECISIONS_LOG.md)** — Technical decision rationale

See [docs/README.md](docs/README.md) for the full documentation index.

## License

Proprietary. All rights reserved.
