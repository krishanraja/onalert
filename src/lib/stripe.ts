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
  plan: 'pro' | 'family'
): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { plan },
  })
  if (error || !data?.url) {
    console.error('Checkout error:', error)
    return null
  }
  return data.url
}
