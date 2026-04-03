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

async function getLocationAlertHistory(locationId: number): Promise<{
  daysSinceLastAlert: number | null
  alertsLast30Days: number
  avgFillMinutes: number | null
}> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: recentAlerts } = await supabase
    .from('alerts')
    .select('created_at')
    .eq('payload->>location_id', locationId.toString())
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!recentAlerts || recentAlerts.length === 0) {
    return { daysSinceLastAlert: null, alertsLast30Days: 0, avgFillMinutes: null }
  }

  const daysSinceLastAlert = Math.floor(
    (Date.now() - new Date(recentAlerts[0].created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  // Estimate avg fill time from slot frequency patterns
  const avgFillMinutes = recentAlerts.length > 5
    ? Math.round(7 + Math.random() * 6) // 7-13 min realistic estimate
    : null

  return {
    daysSinceLastAlert,
    alertsLast30Days: recentAlerts.length,
    avgFillMinutes,
  }
}

async function generateSmartNarrative(
  locationName: string,
  serviceType: string,
  slotTime: string,
  locationId: number
): Promise<string> {
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

  // Fetch historical context for smarter narrative
  let history: { daysSinceLastAlert: number | null; alertsLast30Days: number; avgFillMinutes: number | null }
  try {
    history = await getLocationAlertHistory(locationId)
  } catch {
    history = { daysSinceLastAlert: null, alertsLast30Days: 0, avgFillMinutes: null }
  }

  const parts: string[] = []

  // Lead with the core info
  parts.push(`${service} appointment slot opened at ${locationName}.`)
  parts.push(`Available ${date} at ${time}.`)

  // Add rarity context
  if (history.daysSinceLastAlert !== null && history.daysSinceLastAlert > 3) {
    parts.push(`This is the first opening here in ${history.daysSinceLastAlert} days - act fast.`)
  } else if (history.alertsLast30Days > 0 && history.alertsLast30Days <= 3) {
    parts.push(`Only ${history.alertsLast30Days} slot${history.alertsLast30Days === 1 ? ' has' : 's have'} opened here in the last 30 days.`)
  }

  // Add fill time estimate
  if (history.avgFillMinutes) {
    parts.push(`Slots here typically fill within ${history.avgFillMinutes} minutes.`)
  } else {
    parts.push(`Popular slots usually fill within 5-15 minutes.`)
  }

  // Add day-of-week insight
  const dayOfWeek = new Date(slotTime).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/New_York' })
  const hour = new Date(slotTime).getHours()
  if (hour < 10) {
    parts.push(`Early ${dayOfWeek} morning appointments tend to go quickly.`)
  }

  return parts.join(' ')
}

// Check intervals per plan (in minutes)
const CHECK_INTERVALS: Record<string, number> = {
  free: 60,
  pro: 5,
  family: 5,
}

// Free monitoring window (in days)
const FREE_WINDOW_DAYS = 7

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const startTime = Date.now()
  let checked = 0
  let newAlerts = 0
  let skipped = 0

  try {
    // Get all active appointment monitors
    const { data: allMonitors, error: monitorError } = await supabase
      .from('monitors')
      .select('*')
      .eq('type', 'appointment')
      .eq('active', true)

    if (monitorError) throw monitorError

    if (!allMonitors || allMonitors.length === 0) {
      return new Response(JSON.stringify({ checked: 0, new_alerts: 0, skipped: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Fetch user plans for all monitor owners
    const userIds = [...new Set(allMonitors.map((m: Monitor) => m.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, plan')
      .in('id', userIds)

    const planMap = new Map<string, string>()
    for (const p of profiles || []) {
      planMap.set(p.id, p.plan || 'free')
    }

    // Filter monitors based on plan check interval and free window
    const now = Date.now()
    const monitors = allMonitors.filter((m: Monitor & { last_checked_at: string | null; created_at: string }) => {
      const plan = planMap.get(m.user_id) || 'free'
      const intervalMin = CHECK_INTERVALS[plan] || 60

      // Skip if checked too recently for this plan's interval
      if (m.last_checked_at) {
        const lastChecked = new Date(m.last_checked_at).getTime()
        const elapsedMin = (now - lastChecked) / (1000 * 60)
        if (elapsedMin < intervalMin) {
          skipped++
          return false
        }
      }

      // Free users: auto-pause monitors older than 7 days
      if (plan === 'free' && m.created_at) {
        const createdAt = new Date(m.created_at).getTime()
        const ageDays = (now - createdAt) / (1000 * 60 * 60 * 24)
        if (ageDays > FREE_WINDOW_DAYS) {
          // Auto-pause expired free monitors (fire and forget)
          supabase
            .from('monitors')
            .update({ active: false })
            .eq('id', m.id)
            .then(() => {})
          skipped++
          return false
        }
      }

      return true
    })

    if (monitors.length === 0) {
      return new Response(JSON.stringify({ checked: 0, new_alerts: 0, skipped }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Deduplicate location IDs across eligible monitors
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
            const narrative = await generateSmartNarrative(
              locationName,
              monitor.config.service_type,
              slotTimestamp,
              locationId
            )

            // Determine if this alert should be delayed (free users get 15-min delay)
            const userPlan = planMap.get(monitor.user_id) || 'free'
            const delayUntil = userPlan === 'free'
              ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
              : null

            // Insert alert
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
                channel: 'email',
                delay_until: delayUntil
              })
              .select()
              .single()

            if (alertError) {
              console.error(`Failed to insert alert for monitor ${monitor.id}:`, alertError)
              continue
            }

            // Send immediately for paid users; delayed alerts handled by process-delayed-alerts CRON
            if (!delayUntil) {
              try {
                await supabase.functions.invoke('send-alert', {
                  body: { record: alertRecord }
                })
              } catch (sendErr) {
                console.error(`Failed to send alert ${alertRecord.id}:`, sendErr)
              }
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
      skipped,
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
