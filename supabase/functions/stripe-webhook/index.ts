import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.1.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

// Source of truth for plan prices (in cents). Mirrors create-checkout/index.ts
// PLANS map. If they drift, refunds-via-mismatch will fire and you'll know.
const PLAN_PRICES_CENTS: Record<string, number> = {
  pro: 3900,
  multi: 5900,
  family: 5900,  // legacy alias for 'multi' — same price
  express: 7900,
}

function normalizePlan(plan: string): 'pro' | 'multi' | 'express' {
  if (plan === 'family') return 'multi'
  return plan as 'pro' | 'multi' | 'express'
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  // ============================================================
  // Idempotency: at-most-once processing per event.id
  // ============================================================
  // INSERT with ON CONFLICT DO NOTHING + RETURNING gives us a single
  // round-trip atomic check. If RETURNING gives back a row, we're the first
  // to claim this event; if not, another invocation already processed it
  // (Stripe retries are common — this is mandatory for correctness).
  const { data: claimed, error: claimErr } = await supabase
    .from('stripe_events')
    .upsert(
      { event_id: event.id, type: event.type },
      { onConflict: 'event_id', ignoreDuplicates: true }
    )
    .select('event_id')

  if (claimErr) {
    // If the idempotency table isn't reachable, fail loudly so Stripe retries.
    console.error('stripe_events upsert failed:', claimErr)
    return new Response(JSON.stringify({ error: 'idempotency check failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (!claimed || claimed.length === 0) {
    // Already processed.
    console.log(`Event ${event.id} already processed — skipping`)
    return new Response(JSON.stringify({ received: true, deduplicated: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Only handle one-time payments (not subscriptions)
        if (session.mode !== 'payment') break

        const userId = session.metadata?.supabase_user_id
        const plan = session.metadata?.plan

        if (!userId || !plan) {
          console.error('Missing metadata in checkout session:', session.id)
          break
        }

        // Validate plan value (accept 'family' for backwards compatibility)
        if (plan !== 'pro' && plan !== 'multi' && plan !== 'family' && plan !== 'express') {
          console.error('Invalid plan in metadata:', plan)
          return new Response(JSON.stringify({ error: 'invalid plan' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        // Validate amount_total matches expected price for the plan. Defends
        // against an attacker constructing a session with metadata.plan=express
        // but only paying the 'pro' price.
        const expectedCents = PLAN_PRICES_CENTS[plan]
        if (session.amount_total !== expectedCents) {
          console.error(
            `Amount mismatch for session ${session.id}: plan=${plan} expected=${expectedCents} got=${session.amount_total}`
          )
          return new Response(JSON.stringify({
            error: 'amount mismatch',
            expected: expectedCents,
            actual: session.amount_total,
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        const normalizedPlan = normalizePlan(plan)

        // Upgrade user plan (permanent -- one-time purchase). MUST await
        // and check the error so a DB outage causes Stripe to retry.
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ plan: normalizedPlan })
          .eq('id', userId)

        if (updateErr) {
          throw new Error(`profiles update failed for ${userId}: ${updateErr.message}`)
        }

        console.log(`Upgraded user ${userId} to ${normalizedPlan} plan`)
        break
      }

      case 'charge.refunded':
      case 'charge.dispute.created': {
        // Downgrade user back to free. We look up by stripe_customer_id
        // because metadata may not be on the refund/dispute event.
        const charge = event.data.object as Stripe.Charge | (Stripe.Dispute & { customer?: string })
        // Refund event delivers a Charge; dispute delivers a Dispute (which
        // also has .customer). Both expose .customer at the top level.
        const customerId = (charge as { customer?: string | null }).customer

        if (!customerId) {
          console.warn(`Refund/dispute event ${event.id} has no customer — skipping`)
          break
        }

        const { error: downgradeErr } = await supabase
          .from('profiles')
          .update({ plan: 'free' })
          .eq('stripe_customer_id', customerId)

        if (downgradeErr) {
          throw new Error(`profiles downgrade failed for customer ${customerId}: ${downgradeErr.message}`)
        }

        console.log(`Downgraded customer ${customerId} to free (event=${event.type})`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    // Return 500 so Stripe retries this event. Because we recorded the
    // event_id BEFORE the handler ran, the retry will skip — which is bad.
    // Fix: roll back the idempotency claim on failure so the retry can run.
    await supabase.from('stripe_events').delete().eq('event_id', event.id)
      .then(() => {}, (delErr: { message: string }) => {
        console.error('Failed to roll back stripe_events claim:', delErr.message)
      })

    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
