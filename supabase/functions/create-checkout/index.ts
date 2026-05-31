import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.1.0'
import { STRIPE_PLANS, type PaidPlan } from '../_shared/pricing.ts'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const APP_URL = Deno.env.get('APP_URL')

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not configured')
}
if (!APP_URL) {
  throw new Error('APP_URL is not configured')
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

// Sanitize client-supplied attribution into Stripe-safe metadata: string values only,
// keys <=40 chars, values <=500 chars, capped to a sane key count. Stripe rejects null
// values and caps metadata at 50 keys, so we defend against a malformed/oversized body.
function sanitizeAttribution(input: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (!input || typeof input !== 'object') return out
  let n = 0
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (n >= 40) break
    if (v == null) continue
    const key = String(k).slice(0, 40)
    const val = String(v).slice(0, 500)
    if (val.length === 0) continue
    out[key] = val
    n++
  }
  return out
}

// Plan prices, names, and descriptions come from the single source of truth
// (src/data/pricing.json -> generated supabase/functions/_shared/pricing.ts), so
// what we charge here can never drift from what stripe-webhook validates.
// STRIPE_PLANS is keyed by paid plan only (pro|multi|express); the legacy 'family'
// alias is intentionally not chargeable here.

// Restrict CORS to known origins only. Wildcard '*' on a credentialed
// authenticated endpoint lets any site script-call this function with the
// user's session token via XHR/fetch.
const ALLOWED_ORIGINS = new Set<string>([
  'https://onalert.app',
  'http://localhost:5173',
])

function corsOrigin(req: Request): string {
  const o = req.headers.get('origin') || ''
  return ALLOWED_ORIGINS.has(o) ? o : 'https://onalert.app'
}

function buildCors(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': corsOrigin(req),
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

Deno.serve(async (req) => {
  const corsHeaders = buildCors(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { plan, attribution } = await req.json()

    if (!plan || !(plan in STRIPE_PLANS)) {
      throw new Error('Invalid plan')
    }

    const attrMeta = sanitizeAttribution(attribution)

    // Get user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get or create customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: profile?.email || user.email!,
          metadata: { supabase_user_id: user.id, ...attrMeta },
        })
        customerId = customer.id
      } catch (err) {
        const e = err as { type?: string; message?: string }
        console.error('stripe.customers.create failed:', e.type, e.message)
        throw new Error(`Stripe customer creation failed: ${e.message}`)
      }

      // Update profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create one-time payment checkout session
    const planConfig = STRIPE_PLANS[plan as PaidPlan]
    let session
    try {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: planConfig.name,
                description: planConfig.description,
              },
              unit_amount: planConfig.priceCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${APP_URL}/app?upgraded=true`,
        cancel_url: `${APP_URL}/app/settings`,
        metadata: {
          supabase_user_id: user.id,
          plan,
          ...attrMeta,
        },
      })
    } catch (err) {
      const e = err as { type?: string; message?: string }
      console.error('stripe.checkout.sessions.create failed:', e.type, e.message)
      throw new Error(`Stripe checkout session failed: ${e.message}`)
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Checkout error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
