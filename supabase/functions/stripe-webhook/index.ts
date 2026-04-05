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

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const signature = req.headers.get('stripe-signature')!
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return new Response('Webhook signature verification failed', { status: 400 })
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
          break
        }

        // Normalize legacy 'family' to 'multi'
        const normalizedPlan = plan === 'family' ? 'multi' : plan

        // Upgrade user plan (permanent -- one-time purchase)
        await supabase
          .from('profiles')
          .update({ plan: normalizedPlan })
          .eq('id', userId)

        console.log(`Upgraded user ${userId} to ${normalizedPlan} plan`)
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
