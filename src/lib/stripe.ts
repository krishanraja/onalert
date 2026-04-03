import { loadStripe } from '@stripe/stripe-js'
import { supabase } from './supabase'

export { PLANS } from './plans'

export const stripe = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export async function createCheckoutSession(
  plan: 'premium_monthly' | 'premium_annual'
): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { plan },
  })
  if (error || !data?.url) {
    console.error('Checkout error:', error)
    return null
  }
  return data.url
}

export async function openCustomerPortal(): Promise<void> {
  const { data, error } = await supabase.functions.invoke('customer-portal', {})
  if (error || !data?.url) {
    console.error('Portal error:', error)
    return
  }
  window.location.href = data.url
}
