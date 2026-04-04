import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

interface DigestSlot {
  location_id: number
  location_name: string
  slot_timestamp: string
  book_url: string
  narrative?: string
}

function generateDigestEmailHTML(slots: DigestSlot[], serviceType: string): string {
  const serviceEmoji = serviceType === 'GE' ? '✈️' :
                       serviceType === 'TSA' ? '🛂' :
                       serviceType === 'NEXUS' ? '🇨🇦' : '🇲🇽'

  const slotRows = slots.map((slot) => {
    const date = new Date(slot.slot_timestamp).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      timeZone: 'America/New_York',
    })
    const time = new Date(slot.slot_timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
      timeZone: 'America/New_York', timeZoneName: 'short',
    })

    return `
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #2A2A2A;">
          <div style="color: #888888; font-size: 13px; margin-bottom: 4px;">${slot.location_name}</div>
          <div style="font-family: 'Fira Code', monospace; font-size: 18px; font-weight: bold; color: #9F0506;">${time}</div>
          <div style="font-size: 14px; color: #F5F5F5;">${date}</div>
          ${slot.narrative ? `<div style="font-size: 12px; color: #666; margin-top: 6px;">${slot.narrative}</div>` : ''}
        </td>
        <td style="padding: 16px; border-bottom: 1px solid #2A2A2A; text-align: right; vertical-align: middle;">
          <a href="${slot.book_url}" style="background: #9F0506; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 13px; display: inline-block;">Book →</a>
        </td>
      </tr>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Multiple Slots Available</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #0A0A0A; color: #F5F5F5; }
        .container { max-width: 600px; margin: 0 auto; background: #111111; border-radius: 12px; overflow: hidden; }
        .header { background: #9F0506; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; }
        .header .count { font-size: 36px; font-weight: bold; margin: 8px 0; }
        .content { padding: 0; }
        .urgency { color: #FF6B35; font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .footer { text-align: center; padding: 20px; color: #666666; font-size: 12px; border-top: 1px solid #2A2A2A; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="urgency">Time-sensitive digest</div>
          <div class="count">${serviceEmoji} ${slots.length}</div>
          <h1>Slots Just Opened</h1>
          <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Sorted by soonest appointment</p>
        </div>

        <div class="content">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            ${slotRows}
          </table>

          <div style="padding: 20px; background: #1A1A1A; margin: 16px; border-radius: 8px; font-size: 13px; color: #888888;">
            <strong>Act fast:</strong> Slots typically fill within 5-15 minutes.
            Book the one that works best for you.
          </div>
        </div>

        <div class="footer">
          <p>You're receiving this because you have an active monitor for ${serviceType} appointments.</p>
          <p><a href="https://onalert.app/app/settings" style="color: #9F0506;">Manage notifications</a> |
             <a href="https://onalert.app" style="color: #9F0506;">OnAlert</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { record } = await req.json()
    const alertId = record.id
    const userId = record.user_id
    const payload = record.payload
    const slots: DigestSlot[] = payload.slots || []

    if (slots.length === 0) {
      return new Response(JSON.stringify({ error: 'No slots in digest' }), { status: 400 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, plan')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      throw new Error(`User not found: ${profileError?.message || 'no profile'}`)
    }

    const locationCount = new Set(slots.map(s => s.location_id)).size
    const subject = `🚨 ${slots.length} ${payload.service_type} slots available across ${locationCount} location${locationCount > 1 ? 's' : ''}`
    const html = generateDigestEmailHTML(slots, payload.service_type)

    // Send email
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'OnAlert <onboarding@resend.dev>',
        to: [profile.email],
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Email send failed (${res.status}): ${error}`)
    }

    // Mark as delivered
    await supabase
      .from('alerts')
      .update({
        delivered_at: new Date().toISOString(),
        channel: 'email',
      })
      .eq('id', alertId)

    return new Response(JSON.stringify({
      success: true,
      alert_id: alertId,
      slots_count: slots.length,
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Send digest alert error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
