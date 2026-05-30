// Shared lifecycle -> Mindmaker OS attribution warehouse forwarder.
//
// Used by track-lifecycle (frontend landed/signed_up/activated) and stripe-webhook
// (purchased/refunded). Builds the canonical attribution.events shape and POSTs it to
// the OS ingest-attribution edge function (the single front door), guarded by
// x-attribution-secret.
//
// IMPORTANT: no-ops safely when ATTRIBUTION_INGEST_URL / ATTRIBUTION_INGEST_SECRET are
// unset, so OnAlert can ship this now and it goes live the moment the OS warehouse
// endpoint + secret exist. Per the rebuild rules, OnAlert only EMITS; it never migrates
// or reads the warehouse, and never holds the warehouse service-role key.

export type LifecycleEvent = 'landed' | 'signed_up' | 'activated' | 'purchased' | 'refunded'

export interface LifecycleInput {
  event: LifecycleEvent
  occurred_at?: string
  anonymous_id?: string | null
  user_id?: string | null
  email?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
  utm_term?: string | null
  campaign_id?: string | null
  agent?: string | null
  referrer?: string | null
  landing_path?: string | null
  ref?: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  amount_cents?: number | null
  currency?: string | null
  dedupe_key?: string | null
  metadata?: Record<string, unknown>
}

const VALID_EVENTS = new Set<LifecycleEvent>(['landed', 'signed_up', 'activated', 'purchased', 'refunded'])

export function isValidLifecycleEvent(e: unknown): e is LifecycleEvent {
  return typeof e === 'string' && VALID_EVENTS.has(e as LifecycleEvent)
}

export async function forwardLifecycle(input: LifecycleInput): Promise<{ forwarded: boolean; reason?: string }> {
  try {
    if (!isValidLifecycleEvent(input.event)) return { forwarded: false, reason: 'invalid event' }

    const url = Deno.env.get('ATTRIBUTION_INGEST_URL')
    const secret = Deno.env.get('ATTRIBUTION_INGEST_SECRET')
    if (!url || !secret) {
      console.log(`[lifecycle] ${input.event} captured; warehouse not configured (ATTRIBUTION_INGEST_URL/SECRET unset) -> no-op`)
      return { forwarded: false, reason: 'warehouse not configured' }
    }

    const now = new Date().toISOString()
    const dedupe =
      input.dedupe_key ||
      `onalert:${input.event}:${input.anonymous_id || input.user_id || 'anon'}:${input.occurred_at || now}`

    const payload = {
      app: 'onalert',
      event: input.event,
      occurred_at: input.occurred_at || now,
      received_at: now,
      anonymous_id: input.anonymous_id ?? null,
      user_id: input.user_id ?? null,
      email: input.email ?? null,
      utm_source: input.utm_source ?? null,
      utm_medium: input.utm_medium ?? null,
      utm_campaign: input.utm_campaign ?? null,
      utm_content: input.utm_content ?? null,
      utm_term: input.utm_term ?? null,
      campaign_id: input.campaign_id ?? null,
      agent: input.agent ?? null,
      referrer: input.referrer ?? null,
      landing_path: input.landing_path ?? null,
      stripe_account: 'mindmaker_llc',
      stripe_customer_id: input.stripe_customer_id ?? null,
      stripe_subscription_id: input.stripe_subscription_id ?? null,
      amount_cents: input.amount_cents ?? null,
      currency: input.currency ?? null,
      metadata: { ref: input.ref ?? null, ...(input.metadata || {}) },
      dedupe_key: dedupe,
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-attribution-secret': secret },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error(`[lifecycle] ingest returned ${res.status} for ${input.event}`)
      return { forwarded: false, reason: `ingest ${res.status}` }
    }
    return { forwarded: true }
  } catch (e) {
    console.error('[lifecycle] forward failed:', (e as Error).message)
    return { forwarded: false, reason: 'exception' }
  }
}
