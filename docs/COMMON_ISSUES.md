# Common Issues

Troubleshooting guide for the most likely failure modes during development and production.

## Alerts have stopped flowing — START HERE

This is the #1 highest-severity production issue (we've already had one 3-week silent outage). Diagnose in this order:

### 1. Is pg_cron actually firing?

```sql
SELECT id, status_code, created
FROM net._http_response
WHERE created > now() - interval '1 hour'
ORDER BY created DESC LIMIT 20;
```

- **No rows in the last 5 minutes** → cron jobs aren't running. Check `cron.job` and re-create them if missing.
- **Rows present but `status_code = 401`** → `CRON_SECRET` is mismatched. The secret in `cron.job.command` must match the function-side `CRON_SECRET`. Re-create the cron jobs with the current secret value in the same SQL transaction. (April 2026 incident.)
- **Rows present but `status_code = 500`** → the function itself is throwing. Check edge function logs for the actual error.

### 2. Is the audit dashboard healthy?

`/app/admin/audit` shows recent poll-run history, anomaly flags, and per-location fetch outcomes. If the last successful run is more than 5 minutes ago, treat as a P1.

### 3. Is the CBP API up?

Try a manual fetch: `curl 'https://ttp.cbp.dhs.gov/schedulerapi/slots?locationId=5140&serviceId=TP'`. The CBP API has no SLA and occasionally rate-limits or 503s — this is normal short-term, abnormal if it persists past an hour.

### 4. Are alerts being created but not delivered?

```sql
SELECT id, delivered_at, created_at, payload->>'location_name'
FROM alerts
WHERE delivered_at IS NULL
  AND created_at > now() - interval '1 hour';
```

Undelivered alerts mean the `send-alert` invocation failed. Check:
- `INTERNAL_FUNCTION_SECRET` matches between `poll-appointments` and `send-alert`
- Resend API key is valid
- Twilio credentials are valid (only matters for paid users with phone numbers)

## Blank screen on load

**Symptom**: app loads but shows a blank dark screen.

**Cause**: missing Supabase env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). The app degrades gracefully (the landing page still renders) but auth-dependent surfaces fail. This was a hard-won fix — see decision D010.

**Fix**: ensure `.env.local` (dev) or Vercel project env (prod) has the right values. Check the browser console for the warning emitted by `src/lib/supabase.ts`.

## Authentication issues

### Google OAuth not working
1. Is Google enabled in Supabase Dashboard → Authentication → Providers → Google?
2. Are Google Client ID and Secret correct?
3. Is the authorized redirect URI `https://<project-id>.supabase.co/auth/v1/callback`?
4. Is the Google Cloud Console OAuth consent screen configured (even for testing)?

### Email/password sign-up fails
- Password must be 6+ characters
- Email must not already be registered
- Check Supabase Auth logs for the specific error

### Magic link not received
1. Check spam/junk folder
2. Supabase email rate limit (free tier: 4 emails/hour) may be exhausted
3. Email provider blocking Supabase transactional emails
4. Auth → URL Configuration: Site URL and redirect URLs must include your domain

### Magic link opens `/auth` instead of `/app`
This was a regression that was fixed in commit `a888fb3`. The deep-link must preserve the destination through the auth callback. If it breaks again:
1. Verify the redirect URLs in Supabase include `https://onalert.app/app`
2. Verify `detectSessionInUrl` is enabled in the Supabase client config
3. Check the `AppLayout` auth guard preserves the original location via `useLocation` before redirecting

### Auth redirect loop
1. Is the session being persisted? Check `localStorage` for `supabase.auth.token`
2. `detectSessionInUrl` must be enabled
3. Redirect URLs must be correctly listed in Supabase Auth settings

## Stripe checkout fails

**Symptom**: "Upgrade" button errors or does nothing.

**Diagnostic**: the create-checkout function now surfaces the actual Stripe error string instead of a generic message (regression fix `197e4a1`). Read it in the toast or browser console.

Common causes:
1. `VITE_STRIPE_PUBLISHABLE_KEY` not set or wrong environment (test vs. live)
2. `STRIPE_SECRET_KEY` not set in Supabase function secrets
3. `create-checkout` function not deployed
4. CORS — `create-checkout` only allows `onalert.app` and `localhost:5173`; if you're on a different host, update the allowlist

## Payment status not updating after successful purchase

**Symptom**: user paid but plan still shows as "free".

**Diagnostic order**:
1. Stripe Dashboard → Webhooks → click your endpoint → recent deliveries — was the event delivered?
2. Supabase function logs for `stripe-webhook` — is signature verification passing?
3. `stripe_events` table — was the event ID recorded? (idempotency check)
4. Did the webhook reject due to price tampering? (`amount_total` mismatched the expected plan price)
5. Manual verification: `SELECT plan, stripe_customer_id FROM profiles WHERE id = '<user-id>'`

If `stripe_events` shows the event was claimed but the profile wasn't updated, the handler errored mid-way and rolled back the claim — Stripe will retry. Check function logs for the original error.

## Stripe webhook 401 / invalid signature

The webhook validates the `stripe-signature` header against `STRIPE_WEBHOOK_SECRET`. Common causes:
- `STRIPE_WEBHOOK_SECRET` is for a different webhook endpoint
- Test-mode secret in production (or vice versa)
- The endpoint URL in Stripe is pointing at a stale function version

## Edge function 401 / forbidden

Each function checks a specific header **before** any business logic:

| Function tier | Required header | Set by |
|---------------|----------------|--------|
| `poll-appointments`, `process-delayed-alerts`, `process-rechecks`, `predict-slots` | `x-cron-secret: <CRON_SECRET>` | The cron job's inline command |
| `send-alert`, `send-digest-alert`, `send-push` | `x-internal-secret: <INTERNAL_FUNCTION_SECRET>` | The invoking edge function |
| `create-checkout`, `customer-portal`, `track-booking-click` | `Authorization: Bearer <user-jwt>` | Frontend Supabase client |
| `stripe-webhook` | `stripe-signature: t=...,v1=...` | Stripe |

If you're getting 401s, check the header your caller is actually sending and confirm the secret on the function side.

## Supabase Realtime not working

**Symptom**: new alerts don't appear without a page refresh.

1. Realtime must be enabled for the `alerts` table (Database → Realtime)
2. RLS must allow SELECT for the user (`alerts` policies — own records)
3. WebSocket errors in browser console?
4. Verify the channel subscription in DevTools → Network → WS

## Build errors

### "Missing Supabase environment variables"
Runtime warning, not a build error. The build succeeds without env vars; the public landing page still renders. Authenticated features just won't work.

### TypeScript errors
Run `npm run build` for the full list. Common fixes:
- Missing types: check imports from `@/lib/supabase`
- Unused variables: remove or prefix with `_`
- New table: regenerate types via `supabase gen types typescript`

### ESLint errors
The project enabled stricter lint rules in `8ce4155`. If you bumped a lint rule, expect to fix existing violations as part of the change.

## CBP API issues

- **429 rate limiting**: `poll-appointments` mitigates this with parallel batches of 5 and 10s timeouts. Persistent 429s suggest dropping the cadence or shrinking batch size.
- **API unavailable**: when the CBP scheduler is down, `getSlots()` returns empty arrays and the run is logged in `scrape_logs`. Monitors resume on the next cycle.
- **Empty results forever**: some locations genuinely have no available slots for long periods. Verify by manually checking the CBP scheduler in a browser.

## Migration push fails ("phantom 006 entry")

`supabase db push` fails on the production project (`zcreubinittdqyoxxwtp`) because of a phantom `006` history entry from an early manual SQL run.

**Workaround**: use the Supabase Management API pattern documented in `reference_supabase_management_api.md` for any future migration on this project. Long-term fix: reconcile the migration history table by hand, or rename future migrations to versions that don't conflict.

## PWA install prompt missing

1. Must be served over HTTPS (localhost is exempt)
2. Must have a valid web manifest (`/manifest.webmanifest`)
3. Service worker must be registered successfully
4. Chrome may require a second visit before showing the prompt
5. Check DevTools → Application → Manifest for validation errors

## Mobile layout breaks at 375px

If a page allows scroll on mobile and has the bottom nav overlapping content, it's missing the `overflow-hidden` enforcement (regression fix `01b43f0`). Most app pages should be no-scroll at the page level, with scroll inside specific containers (alerts feed, locations list).
