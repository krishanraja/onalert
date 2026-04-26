import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireInternalSecret, escapeHtml } from '../_shared/cron-auth.ts'
import { buildBookUrl } from '../_shared/buildBookUrl.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || ''
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') || ''
const TWILIO_FROM_NUMBER = Deno.env.get('TWILIO_FROM_NUMBER') || ''

interface AlertPayload {
  location_id: number
  location_name: string
  slot_timestamp: string
  book_url: string
  service_type: string
  narrative?: string
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
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

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Email send failed (${res.status}): ${error}`)
  }

  return res.json()
}

async function sendSMS(to: string, body: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: TWILIO_FROM_NUMBER, Body: body }),
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`SMS send failed (${res.status}): ${error}`)
  }
  return res.json()
}

function generateEmailHTML(payload: AlertPayload, safeBookUrl: string): string {
  const date = new Date(payload.slot_timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  })

  const time = new Date(payload.slot_timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  })

  // Service emoji is internally-derived (whitelist via switch), no need to
  // escape — but treat unknowns conservatively.
  const serviceEmoji = payload.service_type === 'GE' ? '✈️' :
                       payload.service_type === 'NEXUS' ? '🇨🇦' :
                       payload.service_type === 'SENTRI' ? '🇲🇽' : '📅'

  // Every interpolated value below originates from `payload`, which comes
  // from a CBP API response (untrusted) and from user-configured monitors.
  // HTML-escape all of them. The `book_url` is rebuilt server-side from a
  // whitelisted helper so we don't escape it (HTML-escaping a URL would
  // break the &amp; encoding inside query strings — the helper already
  // emits a safe URL).
  const safeServiceType = escapeHtml(payload.service_type)
  const safeLocationName = escapeHtml(payload.location_name)
  const safeNarrative = payload.narrative ? escapeHtml(payload.narrative) : ''
  const safeDate = escapeHtml(date)
  const safeTime = escapeHtml(time)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Slot Available</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #0A0A0A; color: #F5F5F5; }
        .container { max-width: 600px; margin: 0 auto; background: #111111; border-radius: 12px; overflow: hidden; }
        .header { background: #9F0506; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
        .content { padding: 24px; }
        .slot-info { background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .slot-time { font-family: 'Fira Code', monospace; font-size: 24px; font-weight: bold; color: #9F0506; margin: 8px 0; }
        .slot-date { font-size: 18px; font-weight: 500; margin: 4px 0; }
        .location { color: #888888; font-size: 14px; margin: 12px 0; }
        .cta { background: #9F0506; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; display: inline-block; font-weight: 600; margin: 20px 0; }
        .narrative { background: #1A1A1A; border-left: 3px solid #9F0506; padding: 16px; margin: 20px 0; font-size: 14px; line-height: 1.5; color: #CCCCCC; }
        .footer { text-align: center; padding: 20px; color: #666666; font-size: 12px; border-top: 1px solid #2A2A2A; }
        .urgency { color: #FF6B35; font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${serviceEmoji} Appointment Slot Available</h1>
          <div class="urgency">Time-sensitive alert</div>
        </div>

        <div class="content">
          <div class="slot-info">
            <div class="location">${safeLocationName}</div>
            <div class="slot-date">${safeDate}</div>
            <div class="slot-time">${safeTime}</div>
          </div>

          ${safeNarrative ? `<div class="narrative">${safeNarrative}</div>` : ''}

          <div style="text-align: center;">
            <a href="${safeBookUrl}" class="cta">Book This Slot →</a>
          </div>

          <div style="margin-top: 24px; padding: 16px; background: #1A1A1A; border-radius: 8px; font-size: 13px; color: #888888;">
            <strong>Action required:</strong> Appointment slots typically fill within 5-15 minutes.
            Book immediately if this time works for you.
          </div>
        </div>

        <div class="footer">
          <p>You're receiving this because you have an active monitor for ${safeServiceType} appointments.</p>
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

  const denied = requireInternalSecret(req)
  if (denied) return denied

  try {
    const { record } = await req.json()
    const alertId = record.id
    const userId = record.user_id
    const payload: AlertPayload = record.payload

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, plan, email_alerts_enabled, sms_alerts_enabled, phone_number')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      throw new Error(`User not found: ${profileError?.message || 'no profile'}`)
    }

    if (profile.email_alerts_enabled === false) {
      await supabase
        .from('alerts')
        .update({ delivered_at: new Date().toISOString(), channel: 'suppressed' })
        .eq('id', alertId)

      return new Response(JSON.stringify({
        success: true,
        suppressed: true,
        reason: 'email_alerts_disabled',
        alert_id: alertId,
      }), { headers: { 'Content-Type': 'application/json' } })
    }

    // Rebuild book_url from a whitelisted helper. Never trust payload.book_url
    // — it could be tampered with via the alerts INSERT path or via a
    // compromised CBP response field if upstream code ever copied raw data.
    const safeBookUrl = buildBookUrl(payload.location_id, payload.service_type)

    const channels: string[] = []
    const subject = `🚨 ${payload.service_type} slot available - ${payload.location_name}`
    const html = generateEmailHTML(payload, safeBookUrl)

    await sendEmail(profile.email, subject, html)
    channels.push('email')

    // 2. Send SMS for paid users (if Twilio is configured)
    if (
      TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER &&
      profile.sms_alerts_enabled && profile.phone_number &&
      (profile.plan === 'pro' || profile.plan === 'multi' || profile.plan === 'family' || profile.plan === 'express')
    ) {
      try {
        // SMS body is plain text — no HTML escaping needed, but still avoid
        // letting payload control message structure beyond the substituted values.
        const smsBody = `OnAlert: ${payload.service_type} slot at ${payload.location_name}. Book now: ${safeBookUrl}`
        await sendSMS(profile.phone_number, smsBody)
        channels.push('sms')
      } catch (smsErr) {
        console.error('SMS send failed:', smsErr)
      }
    }

    // 3. Mark alert as delivered with channel info
    await supabase
      .from('alerts')
      .update({
        delivered_at: new Date().toISOString(),
        channel: channels.join(',')
      })
      .eq('id', alertId)

    return new Response(JSON.stringify({
      success: true,
      channels,
      alert_id: alertId,
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Send alert error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
