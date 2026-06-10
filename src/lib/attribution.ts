/**
 * Attribution: first-touch source capture -> signup metadata -> Stripe metadata ->
 * (optional) lifecycle events into the central Mindmaker OS attribution warehouse.
 *
 * The first-touch snapshot is captured by a tiny inline script in index.html (runs
 * before this bundle, so it survives an immediate bounce). This module reads that
 * snapshot and exposes it to signup, checkout, and lifecycle emission.
 *
 * Two independent layers:
 *  1. ALWAYS ON: getAttribution() feeds signup user_metadata and Stripe customer/session
 *     metadata, so every signup and dollar is self-attributing inside Supabase + Stripe,
 *     recoverable even if the warehouse is not wired yet.
 *  2. DORMANT until VITE_ATTRIBUTION_ENABLED === 'true': emitLifecycle() POSTs landed /
 *     signed_up / activated events to the OnAlert track-lifecycle edge function, which
 *     forwards them to the OS warehouse. Kept off until the warehouse ingest endpoint +
 *     secret exist, so we never fire pointless invocations.
 */

export type LifecycleEvent =
  | 'landed'
  | 'signed_up'
  | 'activated'
  | 'purchased'
  | 'refunded'

export interface AttributionSnapshot {
  anonymous_id: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  gclid: string | null
  fbclid: string | null
  ref: string | null
  agent: string | null
  campaign_id: string | null
  landing_path: string | null
  referrer: string | null
  first_seen: string | null
}

const SNAPSHOT_KEY = 'onalert_attribution'
const ANON_KEY = 'onalert_anon_id'

const EMPTY: AttributionSnapshot = {
  anonymous_id: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
  gclid: null,
  fbclid: null,
  ref: null,
  agent: null,
  campaign_id: null,
  landing_path: null,
  referrer: null,
  first_seen: null,
}

/** The first-touch attribution snapshot captured on landing (or an empty shape). */
export function getAttribution(): AttributionSnapshot {
  if (typeof window === 'undefined') return { ...EMPTY }
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY)
    const anon = window.localStorage.getItem(ANON_KEY)
    if (!raw) return { ...EMPTY, anonymous_id: anon }
    return { ...EMPTY, ...JSON.parse(raw), anonymous_id: anon ?? null }
  } catch {
    return { ...EMPTY }
  }
}

export function getAnonymousId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(ANON_KEY)
  } catch {
    return null
  }
}

/**
 * Flatten the snapshot into Stripe-safe metadata: only non-empty values, string-typed,
 * each truncated to Stripe's 500-char limit. Caller merges this with {supabase_user_id, plan}.
 */
export function toStripeMetadata(): Record<string, string> {
  const snap = getAttribution()
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(snap)) {
    if (v != null && v !== '' && k !== 'first_seen') {
      out[k] = String(v).slice(0, 500)
    }
  }
  return out
}

/**
 * Fire a lifecycle event to the warehouse (via the OnAlert track-lifecycle edge fn).
 * No-op unless VITE_ATTRIBUTION_ENABLED === 'true'. Fire-and-forget; never throws.
 */
export function emitLifecycle(
  event: LifecycleEvent,
  extra: { user_id?: string | null; email?: string | null; metadata?: Record<string, unknown> } = {}
): void {
  try {
    if (import.meta.env.VITE_ATTRIBUTION_ENABLED !== 'true') return
    const url = import.meta.env.VITE_SUPABASE_URL
    if (!url) return
    const snap = getAttribution()
    const payload = {
      event,
      occurred_at: new Date().toISOString(),
      anonymous_id: snap.anonymous_id,
      user_id: extra.user_id ?? null,
      email: extra.email ?? null,
      utm_source: snap.utm_source,
      utm_medium: snap.utm_medium,
      utm_campaign: snap.utm_campaign,
      utm_content: snap.utm_content,
      utm_term: snap.utm_term,
      campaign_id: snap.campaign_id,
      agent: snap.agent,
      referrer: snap.referrer,
      landing_path: snap.landing_path,
      ref: snap.ref,
      metadata: extra.metadata ?? {},
    }
    const body = JSON.stringify(payload)
    const endpoint = `${url}/functions/v1/track-lifecycle`
    // fetch + keepalive survives navigation like a beacon, but without sendBeacon's
    // forced credentials-include mode, which fails the edge function's CORS preflight
    // (no Access-Control-Allow-Credentials header) and silently drops every event.
    void fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // attribution must never break the app
  }
}
