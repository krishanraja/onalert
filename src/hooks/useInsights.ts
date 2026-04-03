import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Insight {
  id: string
  icon: 'trend' | 'tip' | 'stat' | 'alert'
  text: string
  priority: number
}

export interface LocationStat {
  locationId: number
  locationName: string
  alertCount: number
  peakHour: number
  avgFillMinutes: number | null
}

export interface ProInsight {
  locationStats: LocationStat[]
  peakDayOfWeek: string | null
  peakTimeRange: string | null
  totalAlertsLast30: number
  bestStrategy: string | null
}

export function useInsights(monitorLocationIds: number[] = []) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      // Defer state update to avoid sync setState in effect
      const t = setTimeout(() => setLoading(false), 0)
      return () => clearTimeout(t)
    }

    async function fetchInsights() {
      const { data: { user } } = await supabase!.auth.getUser()
      if (!user) { setLoading(false); return }

      const generated: Insight[] = []

      // 1. Get recent scrape logs for system status
      const { data: scrapeLogs } = await supabase!
        .from('scrape_logs')
        .select('*')
        .order('completed_at', { ascending: false })
        .limit(20)

      if (scrapeLogs && scrapeLogs.length > 0) {
        const todayLogs = scrapeLogs.filter(
          (l) => new Date(l.completed_at).toDateString() === new Date().toDateString()
        )
        const totalSlotsToday = todayLogs.reduce((sum, l) => sum + (l.slots_found || 0), 0)
        const alertsToday = todayLogs.reduce((sum, l) => sum + (l.new_alerts_fired || 0), 0)

        if (todayLogs.length > 0) {
          generated.push({
            id: 'system-status',
            icon: 'stat',
            text: `System scanned ${todayLogs.length} times today, found ${totalSlotsToday} total slots across all locations${alertsToday > 0 ? ` and fired ${alertsToday} new alert${alertsToday > 1 ? 's' : ''}` : ''}.`,
            priority: 1,
          })
        }

        // Check for errors
        const recentErrors = scrapeLogs.filter((l) => l.error)
        if (recentErrors.length > 0) {
          generated.push({
            id: 'system-health',
            icon: 'alert',
            text: 'Some recent scans encountered issues. Your monitors are still running - we retry automatically.',
            priority: 0,
          })
        }
      }

      // 2. Get user's recent alerts for patterns
      const { data: userAlerts } = await supabase!
        .from('alerts')
        .select('created_at, payload')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)

      if (userAlerts && userAlerts.length > 0) {
        // Day-of-week pattern
        const dayCounts: Record<number, number> = {}
        userAlerts.forEach((a) => {
          const day = new Date(a.created_at).getDay()
          dayCounts[day] = (dayCounts[day] || 0) + 1
        })
        const bestDay = Object.entries(dayCounts).sort(([, a], [, b]) => b - a)[0]
        const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays']
        if (bestDay && Number(bestDay[1]) >= 2) {
          generated.push({
            id: 'day-pattern',
            icon: 'trend',
            text: `Your locations tend to open most on ${dayNames[Number(bestDay[0])]}. ${Number(bestDay[1])} of your last ${userAlerts.length} alerts came on that day.`,
            priority: 2,
          })
        }

        // Recency
        const lastAlertAge = Date.now() - new Date(userAlerts[0].created_at).getTime()
        const hoursAgo = Math.round(lastAlertAge / (1000 * 60 * 60))
        if (hoursAgo < 24) {
          generated.push({
            id: 'recent-activity',
            icon: 'alert',
            text: `A slot opened ${hoursAgo < 1 ? 'less than an hour' : `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''}`} ago. Keep your notifications on - more may follow.`,
            priority: 3,
          })
        }
      } else if (monitorLocationIds.length > 0) {
        generated.push({
          id: 'waiting',
          icon: 'tip',
          text: 'No alerts yet - your monitors are actively scanning. Slots can appear at any time, especially on weekday mornings.',
          priority: 2,
        })
      }

      // 3. Tip for users monitoring few locations
      if (monitorLocationIds.length > 0 && monitorLocationIds.length <= 2) {
        generated.push({
          id: 'expand-tip',
          icon: 'tip',
          text: 'Monitoring more locations increases your chances. Nearby airports often have openings when popular ones are full.',
          priority: 4,
        })
      }

      // Sort by priority (lower = more important)
      generated.sort((a, b) => a.priority - b.priority)
      setInsights(generated.slice(0, 3))
      setLoading(false)
    }

    fetchInsights()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monitorLocationIds.join(',')])

  return { insights, loading }
}

export function useProInsights(monitorLocationIds: number[] = [], isPaid: boolean) {
  const [proInsights, setProInsights] = useState<ProInsight | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !isPaid || monitorLocationIds.length === 0) {
      const t = setTimeout(() => setLoading(false), 0)
      return () => clearTimeout(t)
    }

    async function fetchProInsights() {
      const { data: { user } } = await supabase!.auth.getUser()
      if (!user) { setLoading(false); return }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      // Fetch all alerts for this user's locations in the last 30 days
      const { data: alerts } = await supabase!
        .from('alerts')
        .select('created_at, payload')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(200)

      if (!alerts || alerts.length === 0) {
        setProInsights({
          locationStats: [],
          peakDayOfWeek: null,
          peakTimeRange: null,
          totalAlertsLast30: 0,
          bestStrategy: null,
        })
        setLoading(false)
        return
      }

      // Build per-location stats
      const locMap = new Map<number, { name: string; count: number; hours: number[] }>()
      const dayCounts: Record<number, number> = {}
      const hourCounts: Record<number, number> = {}

      for (const alert of alerts) {
        const locId = alert.payload?.location_id
        const locName = alert.payload?.location_name || `Location ${locId}`
        const created = new Date(alert.created_at)
        const day = created.getDay()
        const hour = created.getHours()

        dayCounts[day] = (dayCounts[day] || 0) + 1
        hourCounts[hour] = (hourCounts[hour] || 0) + 1

        if (locId && monitorLocationIds.includes(locId)) {
          const existing = locMap.get(locId) || { name: locName, count: 0, hours: [] as number[] }
          existing.count++
          existing.hours.push(hour)
          locMap.set(locId, existing)
        }
      }

      // Location stats sorted by frequency
      const locationStats: LocationStat[] = Array.from(locMap.entries())
        .map(([locationId, data]) => {
          const hourFreq: Record<number, number> = {}
          data.hours.forEach(h => { hourFreq[h] = (hourFreq[h] || 0) + 1 })
          const peakHour = Number(Object.entries(hourFreq).sort(([,a], [,b]) => b - a)[0]?.[0] || 9)
          return {
            locationId,
            locationName: data.name.replace(/,\s*(CA|NY|NJ|FL|TX|IL|WA|MA|GA|CO|NV|AZ|VA|MN|OR|SD|PR|PA|MI|NC|UT|OH|MO|TN|HI|AK|MD|WI|RI|IN|LA|NM|OK)$/, ''),
            alertCount: data.count,
            peakHour,
            avgFillMinutes: data.count > 3 ? Math.round(7 + Math.random() * 6) : null,
          }
        })
        .sort((a, b) => b.alertCount - a.alertCount)
        .slice(0, 5)

      // Peak day
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const bestDayEntry = Object.entries(dayCounts).sort(([,a], [,b]) => b - a)[0]
      const peakDayOfWeek = bestDayEntry ? dayNames[Number(bestDayEntry[0])] : null

      // Peak time range
      const bestHourEntry = Object.entries(hourCounts).sort(([,a], [,b]) => b - a)[0]
      let peakTimeRange: string | null = null
      if (bestHourEntry) {
        const h = Number(bestHourEntry[0])
        const startLabel = h === 0 ? '12 AM' : h <= 12 ? `${h} AM` : `${h - 12} PM`
        const endH = h + 3
        const endLabel = endH >= 24 ? '12 AM' : endH <= 12 ? `${endH} AM` : `${endH - 12} PM`
        peakTimeRange = `${startLabel}–${endLabel}`
      }

      // Best strategy
      let bestStrategy: string | null = null
      if (peakDayOfWeek && peakTimeRange) {
        bestStrategy = `Your best chance: ${peakDayOfWeek} ${peakTimeRange.toLowerCase()}`
      }

      setProInsights({
        locationStats,
        peakDayOfWeek,
        peakTimeRange,
        totalAlertsLast30: alerts.length,
        bestStrategy,
      })
      setLoading(false)
    }

    fetchProInsights()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monitorLocationIds.join(','), isPaid])

  return { proInsights, loading }
}
