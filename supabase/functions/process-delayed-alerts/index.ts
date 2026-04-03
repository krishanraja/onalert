import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Runs on a 5-min CRON to send alerts that have passed their delay_until time.
// Free users get a 15-min delay on email alerts so slots are likely gone by the
// time they see them -- this creates conversion pressure to upgrade.

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let sent = 0

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

    // Send each delayed alert
    for (const alert of pendingAlerts) {
      try {
        await supabase.functions.invoke('send-alert', {
          body: { record: alert }
        })
        sent++
      } catch (sendErr) {
        console.error(`Failed to send delayed alert ${alert.id}:`, sendErr)
      }
    }

    return new Response(JSON.stringify({ sent, total_pending: pendingAlerts.length }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Process delayed alerts error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
