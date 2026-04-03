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

async function getSlots(locationId: number, serviceId = 'TP'): Promise<CBPSlot[]> {
  try {
    const res = await fetch(
      `${CBP_BASE}/slots?orderBy=soonest&limit=5&locationId=${locationId}&serviceId=${serviceId}`
    )
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
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
    year: 'numeric'
  })
  
  const time = new Date(slotTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  return `${service} appointment slot opened at ${locationName}. Available ${date} at ${time}. Slots at this location typically fill within 5-10 minutes.`
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

    // Fetch slots for each unique location
    const locationSlots = new Map<number, CBPSlot[]>()
    for (const locationId of locationIds) {
      const slots = await getSlots(locationId)
      locationSlots.set(locationId, slots)
      checked++
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
          // Get location name (simplified - you'd want a proper mapping)
          const locationName = `Location ${locationId}`
          
          // Fire alerts for new slots
          for (const slotTimestamp of newSlots) {
            const narrative = generateAlertNarrative(
              locationName,
              monitor.config.service_type,
              slotTimestamp
            )

            await supabase.from('alerts').insert({
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
    })

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})