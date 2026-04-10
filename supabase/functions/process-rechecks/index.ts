import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildBookUrl } from '../_shared/buildBookUrl.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const CBP_BASE = 'https://ttp.cbp.dhs.gov/schedulerapi'

interface CBPSlot {
  locationId: number
  startTimestamp: string
  endTimestamp: string
  active: boolean
}

async function getSlots(locationId: number): Promise<CBPSlot[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(
      `${CBP_BASE}/slots?orderBy=soonest&limit=10&locationId=${locationId}&serviceId=TP`,
      { signal: controller.signal }
    )
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}

async function sendRecheckEmail(to: string, available: boolean, locationName: string, slotTime: string, locationId?: number, serviceType?: string) {
  const date = new Date(slotTime).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    timeZone: 'America/New_York',
  })
  const time = new Date(slotTime).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/New_York', timeZoneName: 'short',
  })

  const subject = available
    ? `✅ Still available — ${locationName} slot on ${date}`
    : `❌ Slot taken — ${locationName}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #0A0A0A; color: #F5F5F5; }
        .container { max-width: 600px; margin: 0 auto; background: #111111; border-radius: 12px; overflow: hidden; }
        .header { background: ${available ? '#16a34a' : '#666666'}; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; }
        .content { padding: 24px; text-align: center; }
        .slot-info { background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .cta { background: #9F0506; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; display: inline-block; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666666; font-size: 12px; border-top: 1px solid #2A2A2A; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${available ? '✅ Slot Still Available!' : '❌ Slot Was Taken'}</h1>
        </div>
        <div class="content">
          <div class="slot-info">
            <p style="color: #888; margin: 0 0 8px 0;">${locationName}</p>
            <p style="font-size: 18px; margin: 0;">${date} at ${time}</p>
          </div>
          ${available
            ? `<p>The slot is still open — book it now before someone else does!</p>
               <a href="${buildBookUrl(locationId, serviceType)}" class="cta">Book Now →</a>`
            : `<p style="color: #888;">This slot has been taken. Don't worry — we'll keep monitoring and alert you when the next one opens.</p>`
          }
        </div>
        <div class="footer">
          <p>Re-check result from <a href="https://onalert.app" style="color: #9F0506;">OnAlert</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'OnAlert <alerts@onalert.app>',
      to: [to],
      subject,
      html,
    }),
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let processed = 0
  let available = 0

  try {
    // Get all pending recheck requests older than 2 minutes
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

    const { data: requests, error } = await supabase
      .from('recheck_requests')
      .select('*')
      .eq('status', 'pending')
      .lte('created_at', twoMinAgo)
      .limit(20)

    if (error) throw error
    if (!requests || requests.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    for (const request of requests) {
      try {
        const slots = await getSlots(request.location_id)
        const stillAvailable = slots.some(s => s.startTimestamp === request.slot_timestamp)

        // Get user email
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', request.user_id)
          .single()

        // Get location name from the original alert
        const { data: alert } = await supabase
          .from('alerts')
          .select('payload')
          .eq('id', request.alert_id)
          .single()

        const locationName = alert?.payload?.location_name || `Location ${request.location_id}`

        // Update recheck status
        await supabase
          .from('recheck_requests')
          .update({
            status: stillAvailable ? 'available' : 'gone',
            checked_at: new Date().toISOString(),
          })
          .eq('id', request.id)

        // Send email notification
        if (profile?.email) {
          await sendRecheckEmail(
            profile.email,
            stillAvailable,
            locationName,
            request.slot_timestamp,
            request.location_id,
            alert?.payload?.service_type
          )
        }

        processed++
        if (stillAvailable) available++
      } catch (err) {
        console.error(`Failed to process recheck ${request.id}:`, err)
        await supabase
          .from('recheck_requests')
          .update({ status: 'error', checked_at: new Date().toISOString() })
          .eq('id', request.id)
      }
    }

    return new Response(JSON.stringify({ processed, available }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Process rechecks error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
