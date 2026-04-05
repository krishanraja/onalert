import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || ''
const VAPID_SUBJECT = 'mailto:support@onalert.app'

async function sendWebPush(subscription: { endpoint: string; p256dh: string; auth: string }, payload: string) {
  // Web Push using the standard protocol
  // For production, use a proper web-push library
  // This is a simplified implementation that sends via the push endpoint
  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'TTL': '86400',
    },
    body: payload,
  })

  if (!res.ok && res.status === 410) {
    // Subscription expired, clean up
    return { expired: true }
  }

  return { expired: false, status: res.status }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { user_id, title, body, url } = await req.json()

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(JSON.stringify({ skipped: true, reason: 'VAPID not configured' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', user_id)
      .eq('is_active', true)

    if (!subscriptions?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const payload = JSON.stringify({ title, body, url })
    let sent = 0

    for (const sub of subscriptions) {
      const result = await sendWebPush(sub, payload)
      if (result.expired) {
        await supabase.from('push_subscriptions').update({ is_active: false }).eq('id', sub.id)
      } else {
        sent++
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Push notification error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
