// Public front door for client-originated lifecycle events (landed / signed_up /
// activated). Receives an event from the OnAlert frontend and forwards it to the
// Mindmaker OS attribution warehouse via the shared forwarder (which no-ops until the
// warehouse ingest endpoint + secret are configured). verify_jwt=false because 'landed'
// fires before the user authenticates. The warehouse secret lives only in this server
// env, never in the client.
import { forwardLifecycle, isValidLifecycleEvent, type LifecycleInput } from '../_shared/lifecycle.ts'

const ALLOWED_ORIGINS = new Set<string>([
  'https://onalert.app',
  'http://localhost:5173',
])

function buildCors(req: Request): Record<string, string> {
  const o = req.headers.get('origin') || ''
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(o) ? o : 'https://onalert.app',
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    // sendBeacon (and any credentialed fetch) sends credentials-mode "include";
    // without this header the browser rejects the preflight and drops the event.
    'Access-Control-Allow-Credentials': 'true',
  }
}

Deno.serve(async (req) => {
  const cors = buildCors(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: cors })
  }

  let body: LifecycleInput
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ received: false, error: 'invalid json' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  if (!isValidLifecycleEvent(body?.event)) {
    return new Response(JSON.stringify({ received: false, error: 'invalid event' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  // Clients may only report top-of-funnel events; purchased/refunded are emitted
  // server-side from the signature-verified stripe-webhook.
  if (body.event === 'purchased' || body.event === 'refunded') {
    return new Response(JSON.stringify({ received: false, error: 'event not allowed from client' }), {
      status: 403,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const result = await forwardLifecycle(body)
  return new Response(JSON.stringify({ received: true, ...result }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
})
