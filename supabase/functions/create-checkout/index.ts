import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.1.0'

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

const PLANS = {
  pro: {
    price: 3900, // $39.00 one-time
    name: 'OnAlert Pro',
    description: '1 monitor, SMS alerts, 5-minute checks, unlimited locations',
  },
  multi: {
    price: 5900, // $59.00 one-time
    name: 'OnAlert Multi',
    description: 'Up to 5 monitors, SMS alerts, 5-minute checks, unlimited locations',
  },
  express: {
    price: 7900, // $79.00 one-time
    name: 'OnAlert Express',
    description: '1-minute checks, pre-verified slots, priority alerts, unlimited locations',
  },
}

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
    const { plan } = await req.json()

    if (!plan || !PLANS[plan as keyof typeof PLANS]) {
      throw new Error('Invalid plan')
    }

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
          metadata: { supabase_user_id: user.id },
        })
        customerId = customer.id
      } catch (err) {
        console.error('stripe.customers.create failed:', err.type, err.message)
        throw new Error(`Stripe customer creation failed: ${err.message}`)
      }

      // Update profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create one-time payment checkout session
    const planConfig = PLANS[plan as keyof typeof PLANS]
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
              unit_amount: planConfig.price,
            },
            quantity: 1,
          },
        ],
        success_url: `${APP_URL}/app?upgraded=true`,
        cancel_url: `${APP_URL}/app/settings`,
        metadata: {
          supabase_user_id: user.id,
          plan,
        },
      })
    } catch (err) {
      console.error('stripe.checkout.sessions.create failed:', err.type, err.message)
      throw new Error(`Stripe checkout session failed: ${err.message}`)
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
