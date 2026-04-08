import { loadStripe } from '@stripe/stripe-js/pure'
import { supabase } from './supabase'

export { PLANS } from './plans'

let stripePromise: ReturnType<typeof loadStripe> | null = null

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? null)
  }
  return stripePromise
}

export async function createCheckoutSession(
  plan: 'pro' | 'family' | 'multi' | 'express'
): Promise<string> {
  if (!supabase) throw new Error('Not connected. Please refresh and try again.')
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { plan },
  })
  if (error) {
    console.error('Checkout error:', error)
    const detail = typeof error === 'object' && error.message ? `: ${error.message}` : ''
    throw new Error(`Payment service unavailable${detail}. Please try again in a moment.`)
  }
  if (!data?.url) {
    throw new Error('Could not create checkout session. Please try again.')
  }
  return data.url
}
