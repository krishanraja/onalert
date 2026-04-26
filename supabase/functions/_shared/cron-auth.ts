// Shared shared-secret authentication helpers for cron-only and
// internal-only Edge Functions.
//
// Background: We removed JWT verification (`verify_jwt = false`) from cron
// and internal functions because:
//   - pg_cron sends the service-role JWT, which we don't want to be the
//     trust boundary (a leaked schedule script == full DB access).
//   - supabase.functions.invoke() between functions doesn't carry a user JWT.
//
// Instead, callers must present a shared secret in a header.
// Set in `supabase secrets set CRON_SECRET=...` and `INTERNAL_FUNCTION_SECRET=...`.

export function requireCronSecret(req: Request): Response | null {
  const expected = Deno.env.get('CRON_SECRET')
  const got = req.headers.get('x-cron-secret')
  if (!expected || got !== expected) {
    return new Response('Unauthorized', { status: 401 })
  }
  return null
}

export function requireInternalSecret(req: Request): Response | null {
  const expected = Deno.env.get('INTERNAL_FUNCTION_SECRET')
  const got = req.headers.get('x-internal-secret')
  if (!expected || got !== expected) {
    return new Response('Unauthorized', { status: 401 })
  }
  return null
}

// Minimal HTML escape for safe interpolation into email templates.
// Covers the OWASP "Output Encoding for HTML Element Content" rule set.
export function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
