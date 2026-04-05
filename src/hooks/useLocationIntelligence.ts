import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface LocationStat {
  locationId: number
  cancellationsPerWeek: number
  peakDays: { day: string; count: number }[]
  avgFillMinutes: number | null
  totalSlots: number
}

export function useLocationIntelligence(locationIds: number[]) {
  const [stats, setStats] = useState<LocationStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !locationIds.length) {
      setLoading(false)
      return
    }

    async function load() {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

      const { data: slots } = await supabase!
        .from('slot_history')
        .select('location_id, first_seen_at, gone_at')
        .in('location_id', locationIds)
        .gte('first_seen_at', ninetyDaysAgo)

      if (!slots?.length) {
        setStats([])
        setLoading(false)
        return
      }

      const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const locationMap = new Map<number, { dayCounts: number[]; fillTimes: number[]; total: number }>()

      for (const slot of slots) {
        const existing = locationMap.get(slot.location_id) || {
          dayCounts: [0, 0, 0, 0, 0, 0, 0],
          fillTimes: [],
          total: 0,
        }

        existing.total++
        const dayIndex = new Date(slot.first_seen_at).getDay()
        existing.dayCounts[dayIndex]++

        if (slot.gone_at) {
          const fillMin = (new Date(slot.gone_at).getTime() - new Date(slot.first_seen_at).getTime()) / 60000
          if (fillMin > 0 && fillMin < 1440) existing.fillTimes.push(fillMin)
        }

        locationMap.set(slot.location_id, existing)
      }

      const weeksInRange = 90 / 7
      const result: LocationStat[] = []

      for (const [locationId, data] of locationMap) {
        const peakDays = data.dayCounts
          .map((count, i) => ({ day: DAYS[i], count }))
          .sort((a, b) => b.count - a.count)

        const avgFill = data.fillTimes.length > 0
          ? Math.round((data.fillTimes.reduce((a, b) => a + b, 0) / data.fillTimes.length) * 10) / 10
          : null

        result.push({
          locationId,
          cancellationsPerWeek: Math.round((data.total / weeksInRange) * 10) / 10,
          peakDays,
          avgFillMinutes: avgFill,
          totalSlots: data.total,
        })
      }

      setStats(result.sort((a, b) => b.totalSlots - a.totalSlots))
      setLoading(false)
    }

    load()
  }, [locationIds.join(',')])

  return { stats, loading }
}
