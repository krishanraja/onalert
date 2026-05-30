import { loadStripe } from '@stripe/stripe-js/pure'
import { supabase } from './supabase'
import { toStripeMetadata } from './attribution'

export { PLANS } from './plans'

let stripePromise: ReturnType<typeof loadStripe> | null = null

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? null)
  }
  return stripePromise
}

// Only chargeable plans. 'family' is a legacy alias the webhook still accepts for
// historical sessions, but create-checkout has no 'family' price and would reject it,
// so it is intentionally NOT in this union.
export async function createCheckoutSession(
  plan: 'pro' | 'multi' | 'express'
): Promise<string> {
  if (!supabase) throw new Error('Not connected. Please refresh and try again.')
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { plan, attribution: toStripeMetadata() },
  })
  if (error) {
    console.error('Checkout error:', error)
    // FunctionsHttpError stores the actual response body in error.context
    // error.message is always the generic "Edge Function returned a non-2xx status code"
    let detail = ''
    try {
      const ctx = error.context
      if (ctx && typeof ctx.json === 'function') {
        const body = await ctx.json()
        detail = body?.error || ''
      } else if (ctx && typeof ctx === 'object') {
        detail = ctx.error || ''
      }
    } catch {
      // extraction failed, fall through to generic message
    }
    throw new Error(detail || 'Payment service unavailable. Please try again in a moment.')
  }
  if (!data?.url) {
    throw new Error('Could not create checkout session. Please try again.')
  }
  return data.url
}

export async function createPortalSession(): Promise<string> {
  if (!supabase) throw new Error('Not connected. Please refresh and try again.')
  const { data, error } = await supabase.functions.invoke('customer-portal')
  if (error) {
    console.error('Portal error:', error)
    let detail = ''
    try {
      const ctx = error.context
      if (ctx && typeof ctx.json === 'function') {
        const body = await ctx.json()
        detail = body?.error || ''
      } else if (ctx && typeof ctx === 'object') {
        detail = ctx.error || ''
      }
    } catch {
      // extraction failed
    }
    throw new Error(detail || 'Could not open billing portal. Please try again.')
  }
  if (!data?.url) {
    throw new Error('Could not create billing session. Please try again.')
  }
  return data.url
}
