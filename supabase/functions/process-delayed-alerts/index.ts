import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireCronSecret } from '../_shared/cron-auth.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const INTERNAL_SECRET = Deno.env.get('INTERNAL_FUNCTION_SECRET') || ''

// Runs on a 5-min CRON to send alerts that have passed their delay_until time.
// Free users get a 15-min delay on email alerts so slots are likely gone by the
// time they see them -- this creates conversion pressure to upgrade.

const SEND_BATCH_SIZE = 5

async function invokeSendAlert(alert: Record<string, unknown>): Promise<void> {
  // We invoke send-alert with the internal-secret header. supabase.functions.invoke
  // doesn't expose custom headers reliably across SDK versions, so call the
  // function URL directly with fetch.
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-alert`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'x-internal-secret': INTERNAL_SECRET,
    },
    body: JSON.stringify({ record: alert }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`send-alert ${res.status}: ${text}`)
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const denied = requireCronSecret(req)
  if (denied) return denied

  let sent = 0
  let failed = 0

  try {
    // Find alerts that are past their delay window and haven't been delivered yet
    const { data: pendingAlerts, error } = await supabase
      .from('alerts')
      .select('*')
      .not('delay_until', 'is', null)
      .lte('delay_until', new Date().toISOString())
      .is('delivered_at', null)
      .order('delay_until', { ascending: true })
      .limit(50)

    if (error) throw error

    if (!pendingAlerts || pendingAlerts.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parallelize in batches of 5 — limits load on send-alert (and downstream
    // Resend/Twilio) while still being substantially faster than serial.
    for (let i = 0; i < pendingAlerts.length; i += SEND_BATCH_SIZE) {
      const batch = pendingAlerts.slice(i, i + SEND_BATCH_SIZE)
      const results = await Promise.allSettled(batch.map((a) => invokeSendAlert(a)))
      for (let j = 0; j < results.length; j++) {
        const r = results[j]
        if (r.status === 'fulfilled') {
          sent++
        } else {
          failed++
          console.error(
            `Failed to send delayed alert ${batch[j].id}:`,
            r.reason instanceof Error ? r.reason.message : r.reason
          )
        }
      }
    }

    return new Response(
      JSON.stringify({ sent, failed, total_pending: pendingAlerts.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Process delayed alerts error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
