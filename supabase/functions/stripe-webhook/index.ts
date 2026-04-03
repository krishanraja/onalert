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
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        // Get user ID from customer metadata
        const customer = await stripe.customers.retrieve(customerId)
        const userId = (customer as any).metadata?.supabase_user_id
        
        if (!userId) {
          console.error('No supabase_user_id in customer metadata')
          break
        }

        // Update user plan
        const plan = subscription.status === 'active' ? 'premium' : 'free'
        await supabase
          .from('profiles')
          .update({ plan })
          .eq('id', userId)
        
        console.log(`Updated user ${userId} plan to ${plan}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        // Get user ID from customer metadata
        const customer = await stripe.customers.retrieve(customerId)
        const userId = (customer as any).metadata?.supabase_user_id
        
        if (!userId) {
          console.error('No supabase_user_id in customer metadata')
          break
        }

        // Downgrade to free
        await supabase
          .from('profiles')
          .update({ plan: 'free' })
          .eq('id', userId)
        
        console.log(`Downgraded user ${userId} to free plan`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`Payment failed for customer ${invoice.customer}`)
        // Could send an email notification here
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