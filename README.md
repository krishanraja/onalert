# OnAlert

Real-time government appointment slot monitoring.

**onalert.app** — Stop checking. Start knowing.

## Stack

- React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- Supabase (auth, database, edge functions)
- Stripe (subscriptions)
- Resend (email alerts)
- Vercel (hosting)

## Development

```bash
npm install
npm run dev
```

## Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_APP_URL=
```
