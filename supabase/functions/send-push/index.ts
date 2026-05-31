import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireInternalSecret } from '../_shared/cron-auth.ts'
import { sendWebPush } from '../_shared/webpush.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// VAPID keypair from `npx web-push generate-vapid-keys` (set as edge secrets).
// VAPID_PUBLIC_KEY must equal the applicationServerKey the client subscribes
// with (VITE_VAPID_PUBLIC_KEY) — they are the same key, two surfaces.
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@onalert.app'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const denied = requireInternalSecret(req)
  if (denied) return denied

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

    // The SW push handler reads {title, body, url}; default the deep link to /app.
    const payload = { title: title || 'OnAlert', body, url: url || '/app' }
    const vapid = { publicKey: VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY, subject: VAPID_SUBJECT }

    let sent = 0
    let expired = 0
    let failed = 0

    // Each push is encrypted per-subscription (RFC 8291) and VAPID-signed per
    // endpoint (RFC 8292). Failures are isolated so one dead endpoint can't
    // block the rest.
    for (const sub of subscriptions) {
      try {
        const result = await sendWebPush(sub, payload, vapid)
        if (result.expired) {
          expired++
          await supabase.from('push_subscriptions').update({ is_active: false }).eq('id', sub.id)
        } else if (result.status >= 200 && result.status < 300) {
          sent++
        } else {
          failed++
          console.error(`push ${sub.id}: HTTP ${result.status}`)
        }
      } catch (err) {
        failed++
        console.error(`push ${sub.id} error:`, (err as Error).message)
      }
    }

    return new Response(JSON.stringify({ sent, expired, failed }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Push notification error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
