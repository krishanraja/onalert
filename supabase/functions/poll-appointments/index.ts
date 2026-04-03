import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const CBP_BASE = 'https://ttp.cbp.dhs.gov/schedulerapi'

interface CBPSlot {
  locationId: number
  startTimestamp: string
  endTimestamp: string
  active: boolean
}

interface Monitor {
  id: string
  user_id: string
  config: {
    location_ids: number[]
    service_type: string
    last_known_slots?: Record<string, string[]>
  }
}

// Location name mapping for alert payloads
const LOCATION_NAMES: Record<number, string> = {
  5140: 'JFK International Airport, NY',
  5446: '26 Federal Plaza, New York, NY',
  5447: 'Newark Liberty International Airport, NJ',
  5003: 'Los Angeles International Airport, CA',
  5006: 'San Francisco International Airport, CA',
  5002: "Chicago O'Hare International Airport, IL",
  5007: 'Miami International Airport, FL',
  5023: 'Seattle-Tacoma International Airport, WA',
  5021: 'Boston Logan International Airport, MA',
  5004: 'Hartsfield-Jackson Airport, Atlanta, GA',
  5030: 'Dallas/Fort Worth International Airport, TX',
  5011: 'Denver International Airport, CO',
  5009: 'Harry Reid International Airport, Las Vegas, NV',
  5013: 'Phoenix Sky Harbor International Airport, AZ',
  5008: 'Washington Dulles International Airport, VA',
  5010: 'George Bush Intercontinental, Houston, TX',
  5012: 'Minneapolis-St. Paul International Airport, MN',
  5014: 'Portland International Airport, OR',
  5015: 'San Diego International Airport, CA',
  5016: 'Luis Muñoz Marín International, San Juan, PR',
  5017: 'Philadelphia International Airport, PA',
  5018: 'Detroit Metro Wayne County Airport, MI',
  5019: 'Charlotte Douglas International Airport, NC',
  5020: 'Salt Lake City International Airport, UT',
  5022: 'Tampa International Airport, FL',
  5024: 'Orlando International Airport, FL',
  5025: 'Kansas City International Airport, MO',
  5026: 'Sacramento International Airport, CA',
  5027: 'Raleigh-Durham International Airport, NC',
  5028: 'Indianapolis International Airport, IN',
  5029: 'Pittsburgh International Airport, PA',
  5031: 'New Orleans International Airport, LA',
  5032: 'Memphis International Airport, TN',
  5033: 'Nashville International Airport, TN',
  5034: 'Austin-Bergstrom International Airport, TX',
  5035: 'San Antonio International Airport, TX',
  5036: 'El Paso International Airport, TX',
  5037: 'Daniel K. Inouye International, Honolulu, HI',
  5038: 'Ted Stevens International, Anchorage, AK',
  5039: 'Baltimore/Washington International Airport, MD',
  5040: 'Columbus International Airport, OH',
  5041: 'Cleveland Hopkins International Airport, OH',
  5042: 'St. Louis Lambert International Airport, MO',
  5043: 'Cincinnati/Northern Kentucky International, OH',
  5044: 'Milwaukee Mitchell International Airport, WI',
  5045: 'Richmond International Airport, VA',
  5046: 'Jacksonville International Airport, FL',
  5047: 'Tucson International Airport, AZ',
  5048: 'Albuquerque International Airport, NM',
  5049: 'Will Rogers World Airport, Oklahoma City, OK',
}

function getLocationName(locationId: number): string {
  return LOCATION_NAMES[locationId] || `CBP Location ${locationId}`
}

async function getSlots(locationId: number): Promise<CBPSlot[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(
      `${CBP_BASE}/slots?orderBy=soonest&limit=5&locationId=${locationId}&serviceId=TP`,
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

function generateAlertNarrative(
  locationName: string,
  serviceType: string,
  slotTime: string
): string {
  const service = serviceType === 'GE' ? 'Global Entry' :
                  serviceType === 'TSA' ? 'TSA PreCheck' :
                  serviceType === 'NEXUS' ? 'NEXUS' : 'SENTRI'

  const date = new Date(slotTime).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  })

  const time = new Date(slotTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  })

  return `${service} appointment slot opened at ${locationName}. Available ${date} at ${time}. Slots at this location typically fill within 5–10 minutes.`
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const startTime = Date.now()
  let checked = 0
  let newAlerts = 0

  try {
    // Get all active appointment monitors
    const { data: monitors, error: monitorError } = await supabase
      .from('monitors')
      .select('*')
      .eq('type', 'appointment')
      .eq('active', true)

    if (monitorError) throw monitorError

    if (!monitors || monitors.length === 0) {
      return new Response(JSON.stringify({ checked: 0, new_alerts: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Deduplicate location IDs across all monitors
    const locationIds = new Set<number>()
    monitors.forEach((m: Monitor) => {
      m.config.location_ids.forEach(id => locationIds.add(id))
    })

    // Fetch slots for each unique location in parallel (batches of 5 to avoid rate limiting)
    const locationSlots = new Map<number, CBPSlot[]>()
    const locationArray = Array.from(locationIds)
    const BATCH_SIZE = 5

    for (let i = 0; i < locationArray.length; i += BATCH_SIZE) {
      const batch = locationArray.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(
        batch.map(async (locationId) => {
          const slots = await getSlots(locationId)
          return { locationId, slots }
        })
      )

      for (const result of results) {
        if (result.status === 'fulfilled') {
          locationSlots.set(result.value.locationId, result.value.slots)
        }
        checked++
      }
    }

    // Check each monitor for new slots
    for (const monitor of monitors as Monitor[]) {
      const lastKnownSlots = monitor.config.last_known_slots || {}
      const newKnownSlots: Record<string, string[]> = {}

      for (const locationId of monitor.config.location_ids) {
        const slots = locationSlots.get(locationId) || []
        const slotTimestamps = slots.map(s => s.startTimestamp).sort()
        const lastSlotTimestamps = lastKnownSlots[locationId.toString()] || []

        // Find new slots (slots that weren't there before)
        const newSlots = slotTimestamps.filter(ts => !lastSlotTimestamps.includes(ts))

        if (newSlots.length > 0) {
          const locationName = getLocationName(locationId)

          // Create alert records and trigger notifications for each new slot
          for (const slotTimestamp of newSlots) {
            const narrative = generateAlertNarrative(
              locationName,
              monitor.config.service_type,
              slotTimestamp
            )

            // Insert alert  - this is picked up by the send-alert function
            const { data: alertRecord, error: alertError } = await supabase
              .from('alerts')
              .insert({
                monitor_id: monitor.id,
                user_id: monitor.user_id,
                payload: {
                  location_id: locationId,
                  location_name: locationName,
                  slot_timestamp: slotTimestamp,
                  book_url: 'https://ttp.cbp.dhs.gov/',
                  service_type: monitor.config.service_type,
                  narrative
                },
                channel: 'email'
              })
              .select()
              .single()

            if (alertError) {
              console.error(`Failed to insert alert for monitor ${monitor.id}:`, alertError)
              continue
            }

            // Immediately invoke send-alert to deliver notification
            try {
              await supabase.functions.invoke('send-alert', {
                body: { record: alertRecord }
              })
            } catch (sendErr) {
              console.error(`Failed to send alert ${alertRecord.id}:`, sendErr)
              // Alert is still in DB; can be retried later
            }

            newAlerts++
          }

          // Update last_alert_at
          await supabase
            .from('monitors')
            .update({ last_alert_at: new Date().toISOString() })
            .eq('id', monitor.id)
        }

        // Update known slots for this location
        newKnownSlots[locationId.toString()] = slotTimestamps
      }

      // Update monitor with new known slots and last_checked_at
      await supabase
        .from('monitors')
        .update({
          config: { ...monitor.config, last_known_slots: newKnownSlots },
          last_checked_at: new Date().toISOString()
        })
        .eq('id', monitor.id)
    }

    // Log the scrape run
    await supabase.from('scrape_logs').insert({
      location_id: null,
      service_type: 'all',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      slots_found: Array.from(locationSlots.values()).flat().length,
      new_alerts_fired: newAlerts,
      error: null
    })

    return new Response(JSON.stringify({
      checked,
      new_alerts: newAlerts,
      duration_ms: Date.now() - startTime
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Polling error:', error)

    // Log the error
    await supabase.from('scrape_logs').insert({
      location_id: null,
      service_type: 'all',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      slots_found: 0,
      new_alerts_fired: 0,
      error: error.message
    }).catch(() => {}) // Don't fail if logging itself fails

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
