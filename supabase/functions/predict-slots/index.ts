import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Get slot history from last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

    const { data: slots } = await supabase
      .from('slot_history')
      .select('location_id, service_type, first_seen_at')
      .gte('first_seen_at', ninetyDaysAgo)

    if (!slots?.length) {
      return new Response(JSON.stringify({ predictions: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Count slots per location per day-of-week with recency weighting
    const locationDayMap = new Map<string, { count: number; weighted: number }>()

    const now = Date.now()
    for (const slot of slots) {
      const date = new Date(slot.first_seen_at)
      const dayOfWeek = DAYS[date.getDay()]
      const key = `${slot.location_id}:${slot.service_type}:${dayOfWeek}`

      const existing = locationDayMap.get(key) || { count: 0, weighted: 0 }
      existing.count++

      // Exponential decay: recent slots weighted more heavily
      const ageWeeks = (now - date.getTime()) / (7 * 24 * 60 * 60 * 1000)
      const weight = Math.exp(-0.1 * ageWeeks) // decay factor
      existing.weighted += weight

      locationDayMap.set(key, existing)
    }

    // Calculate probability per location-day
    // Group by location to find max weighted count for normalization
    const predictions: Array<{
      location_id: number
      service_type: string
      predicted_day: string
      probability: number
    }> = []

    const locationGroups = new Map<string, typeof predictions>()
    for (const [key, value] of locationDayMap) {
      const [locationId, serviceType, day] = key.split(':')
      const locKey = `${locationId}:${serviceType}`

      if (!locationGroups.has(locKey)) locationGroups.set(locKey, [])
      locationGroups.get(locKey)!.push({
        location_id: parseInt(locationId),
        service_type: serviceType,
        predicted_day: day,
        probability: value.weighted,
      })
    }

    // Normalize probabilities within each location and keep top days
    for (const [, preds] of locationGroups) {
      const maxWeight = Math.max(...preds.map(p => p.probability))
      if (maxWeight === 0) continue

      for (const pred of preds) {
        pred.probability = Math.round((pred.probability / maxWeight) * 100) / 100
      }

      // Keep only days with >30% probability
      predictions.push(...preds.filter(p => p.probability > 0.3))
    }

    // Upsert predictions
    if (predictions.length > 0) {
      // Clear old predictions
      await supabase.from('slot_predictions').delete().lt(
        'calculated_at',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      )

      // Insert new
      await supabase.from('slot_predictions').insert(
        predictions.map(p => ({
          location_id: p.location_id,
          service_type: p.service_type,
          predicted_day: p.predicted_day,
          probability: p.probability,
        }))
      )
    }

    return new Response(JSON.stringify({ predictions: predictions.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Prediction error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
