# Common Issues

Troubleshooting guide for common problems during development and production.

## Blank Screen on Load

**Symptom**: App loads but shows a blank dark screen.

**Cause**: Missing Supabase environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Previously, the app threw a fatal error at module load time. After the fix, it gracefully degrades with a console warning.

**Fix**: Ensure `.env.local` or your hosting platform has the correct environment variables. See `.env.example` for the template.

## Authentication Issues

### Google OAuth Not Working

**Symptom**: Google sign-in button does nothing or shows an error.

**Check**:
1. Is Google OAuth enabled in Supabase Dashboard -> Authentication -> Providers -> Google?
2. Are the Google Client ID and Client Secret configured correctly?
3. Is the authorized redirect URI set to `https://<project-id>.supabase.co/auth/v1/callback`?
4. Is the Google Cloud Console OAuth consent screen configured (even for testing)?

### Email/Password Sign-up Fails

**Symptom**: User submits the form but sees an error.

**Check**:
1. Password must be 6+ characters
2. Email must not already be registered
3. Check Supabase Auth logs for specific error details

### Magic Link Not Received

**Symptom**: User submits email but no magic link arrives.

**Possible causes**:
1. Check spam/junk folder
2. Supabase email rate limit exceeded (free tier: 4 emails/hour)
3. Email provider blocking Supabase transactional emails
4. Incorrect Site URL or Redirect URL in Supabase Auth settings

**Fix**: Verify Auth settings in Supabase Dashboard -> Authentication -> URL Configuration.

### Auth Redirect Loop

**Symptom**: User logs in but keeps getting redirected back to `/auth`.

**Check**:
1. Is the session being persisted? Check `localStorage` for `supabase.auth.token`
2. Is `detectSessionInUrl` enabled in the Supabase client config?
3. Are the redirect URLs correctly configured in Supabase Auth settings?

## Alerts Not Appearing

**Symptom**: Monitor is active but no alerts arrive.

**Check**:
1. Is the CRON job running? Check `scrape_logs` table for recent entries
2. Are there actual slots available? The CBP API may return empty results
3. Is Realtime enabled for the `alerts` table?
4. Check Edge Function logs in Supabase Dashboard -> Edge Functions -> Logs

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
3. Does the Stripe customer have `supabase_user_id` in metadata?
4. Check `stripe-webhook` function logs for errors
5. Manually verify: `SELECT plan FROM profiles WHERE id = '<user-id>';`

## Supabase Realtime Not Working

**Symptom**: New alerts don't appear without page refresh.

**Check**:
1. Is Realtime enabled for the table? (Database -> Realtime)
2. Are RLS policies allowing SELECT for the user?
3. Check browser console for WebSocket errors
4. Verify the channel subscription in browser DevTools -> Network -> WS

## Build Errors

### "Missing Supabase environment variables"
This is a runtime warning (not a build error). The app builds fine without env vars but will warn in the console. Authenticated features won't work without them, but the landing page renders normally.

### TypeScript Errors
Run `npm run build` to see all TypeScript issues. Common fixes:
- Missing types: Check imports from `@/lib/supabase`
- Unused variables: Remove or prefix with `_`

## CBP API Issues

**429 Rate Limiting**: The CBP API may rate-limit frequent requests. The `poll-appointments` function mitigates this by fetching in batches of 5 with 10-second timeouts.

**API Unavailable**: If the CBP scheduler is down, `getSlots()` returns empty arrays and the scrape_log records the failure. Monitors will resume automatically on the next CRON cycle.

**Empty Results**: Some locations may have zero available slots for extended periods. This is normal -- the monitor will alert when a cancellation creates an opening.

## PWA Installation

**Not showing install prompt**:
1. Must be served over HTTPS (localhost is exempt)
2. Must have a valid web manifest (`/manifest.webmanifest`)
3. Service worker must be registered successfully
4. May require a second visit (Chrome requirement)
5. Check DevTools -> Application -> Manifest for validation errors
