import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'public, max-age=300', // 5-min cache
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Get slot history stats per location (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

    const { data: slots } = await supabase
      .from('slot_history')
      .select('location_id, service_type, first_seen_at, gone_at')
      .gte('first_seen_at', ninetyDaysAgo)

    if (!slots?.length) {
      return new Response(JSON.stringify({ locations: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Aggregate per location
    const locationMap = new Map<number, {
      location_id: number
      total_slots: number
      avg_fill_minutes: number | null
      last_slot_seen: string
      slots_per_week: number
    }>()

    for (const slot of slots) {
      const existing = locationMap.get(slot.location_id) || {
        location_id: slot.location_id,
        total_slots: 0,
        avg_fill_minutes: null,
        last_slot_seen: slot.first_seen_at,
        slots_per_week: 0,
      }

      existing.total_slots++

      if (slot.first_seen_at > existing.last_slot_seen) {
        existing.last_slot_seen = slot.first_seen_at
      }

      if (slot.gone_at) {
        const fillMs = new Date(slot.gone_at).getTime() - new Date(slot.first_seen_at).getTime()
        const fillMin = fillMs / 60000
        if (existing.avg_fill_minutes === null) {
          existing.avg_fill_minutes = fillMin
        } else {
          existing.avg_fill_minutes = (existing.avg_fill_minutes + fillMin) / 2
        }
      }

      locationMap.set(slot.location_id, existing)
    }

    // Calculate slots per week
    const weeksInRange = 90 / 7
    for (const loc of locationMap.values()) {
      loc.slots_per_week = Math.round((loc.total_slots / weeksInRange) * 10) / 10
    }

    const locations = Array.from(locationMap.values())
      .sort((a, b) => b.total_slots - a.total_slots)

    return new Response(JSON.stringify({ locations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Wait times error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
