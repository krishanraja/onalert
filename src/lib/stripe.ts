import { loadStripe } from '@stripe/stripe-js'
import { supabase } from './supabase'

export const stripe = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    interval: null,
    monitors: 1,
    checkInterval: 60,
    channels: ['email'],
    features: [
      '1 active monitor',
      'Email alerts',
      'Checked every 60 minutes',
    ],
  },
  premium_monthly: {
    name: 'Premium',
    price: 19,
    interval: 'month' as const,
    monitors: Infinity,
    checkInterval: 10,
    channels: ['email', 'sms'],
    features: [
      'Unlimited monitors',
      'Email + SMS alerts',
      'Checked every 10 minutes',
      'Priority support',
    ],
  },
  premium_annual: {
    name: 'Premium Annual',
    price: 149,
    interval: 'year' as const,
    monitors: Infinity,
    checkInterval: 10,
    channels: ['email', 'sms'],
    features: [
      'Everything in Premium',
      'Save $79 vs monthly',
      '2 months free',
    ],
  },
}

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
