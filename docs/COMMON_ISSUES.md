# Common Issues

## Blank Screen on Load

**Symptom**: App loads but shows a blank dark screen.

**Cause**: Missing Supabase environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Previously, the app threw a fatal error at module load time. After the fix, it gracefully degrades with a console warning.

**Fix**: Ensure `.env.local` or your hosting platform has the correct environment variables. See `.env.example` for the template.

## Magic Link Not Received

**Symptom**: User submits email but no magic link arrives.

**Possible causes**:
1. Check spam/junk folder
2. Supabase email rate limit exceeded (free tier: 4 emails/hour)
3. Email provider blocking Supabase transactional emails
4. Incorrect Site URL or Redirect URL in Supabase Auth settings

**Fix**: Verify Auth settings in Supabase Dashboard → Authentication → URL Configuration.

## Alerts Not Appearing

**Symptom**: Monitor is active but no alerts arrive.

**Check**:
1. Is the CRON job running? Check `scrape_logs` table for recent entries
2. Are there actual slots available? The CBP API may return empty results
3. Is Realtime enabled for the `alerts` table?
4. Check Edge Function logs in Supabase Dashboard → Edge Functions → Logs

```sql
-- Check recent polling runs
SELECT * FROM scrape_logs ORDER BY started_at DESC LIMIT 5;
```

## Stripe Checkout Fails

**Symptom**: "Upgrade" button does nothing or shows error.

**Check**:
1. Is `VITE_STRIPE_PUBLISHABLE_KEY` set correctly?
2. Is `STRIPE_SECRET_KEY` set in Supabase Edge Function secrets?
3. Is the `create-checkout` function deployed?
4. Check function logs for specific error

## Payment Status Not Updating

**Symptom**: Paid but still shows as "Free" plan.

**Check**:
1. Is the Stripe webhook endpoint configured correctly?
2. Is `STRIPE_WEBHOOK_SECRET` correct?
3. Does the customer have `supabase_user_id` in Stripe metadata?
4. Check `stripe-webhook` function logs

## Supabase Realtime Not Working

**Symptom**: New alerts don't appear without page refresh.

**Check**:
1. Is Realtime enabled for the table? (Database → Realtime)
2. Are RLS policies allowing SELECT for the user?
3. Check browser console for WebSocket errors
4. Verify the channel subscription in browser DevTools → Network → WS

## Build Errors

### "Missing Supabase environment variables"
This is a runtime warning (not a build error). The app builds fine without env vars but will warn in the console and authenticated features won't work.

### TypeScript Errors
Run `npm run build` to see all TypeScript issues. Common fixes:
- Missing types: Check imports from `@/lib/supabase`
- Unused variables: Remove or prefix with `_`

## CBP API Issues

**429 Rate Limiting**: The CBP API may rate-limit frequent requests. The `poll-appointments` function fetches in batches of 5 with timeouts to mitigate this.

**API Unavailable**: If the CBP scheduler is down, `getSlots()` returns empty arrays and the scrape_log records the failure. Monitors will resume on the next CRON cycle.

## PWA Installation

**Not showing install prompt**:
1. Must be served over HTTPS
2. Must have a valid web manifest
3. Service worker must be registered
4. May require a second visit (Chrome requirement)
