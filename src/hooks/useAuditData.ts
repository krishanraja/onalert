import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, type ScrapeLog, type LocationFetchLog, type Alert } from '@/lib/supabase'

export interface HealthCheck {
  name: string
  status: 'ok' | 'warning' | 'critical'
  message: string
}

export type PipelineStatus = 'healthy' | 'degraded' | 'down'

export function useAuditData() {
  const [pollRuns, setPollRuns] = useState<ScrapeLog[]>([])
  const [locationFetches, setLocationFetches] = useState<LocationFetchLog[]>([])
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!supabase) return

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const [runsRes, fetchesRes, alertsRes] = await Promise.all([
      supabase
        .from('scrape_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50),
      supabase
        .from('location_fetch_logs')
        .select('*')
        .gte('fetched_at', twentyFourHoursAgo)
        .order('fetched_at', { ascending: false }),
      supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
    ])

    setPollRuns((runsRes.data as ScrapeLog[]) || [])
    setLocationFetches((fetchesRes.data as LocationFetchLog[]) || [])
    setRecentAlerts((alertsRes.data as Alert[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60_000)
    return () => clearInterval(interval)
  }, [fetchData])

  // --- Health Checks ---
  const healthChecks = useMemo((): HealthCheck[] => {
    const checks: HealthCheck[] = []

    // 1. Missed CRON detection
    if (pollRuns.length >= 2) {
      let worstGapMin = 0
      for (let i = 0; i < pollRuns.length - 1; i++) {
        const gap = new Date(pollRuns[i].started_at).getTime() - new Date(pollRuns[i + 1].started_at).getTime()
        const gapMin = gap / 60_000
        if (gapMin > worstGapMin) worstGapMin = gapMin
      }
      if (worstGapMin > 15) {
        checks.push({
          name: 'CRON Schedule',
          status: worstGapMin > 25 ? 'critical' : 'warning',
          message: `Detected ${Math.round(worstGapMin)}min gap between polls (expected ~10min)`,
        })
      } else {
        checks.push({ name: 'CRON Schedule', status: 'ok', message: 'Polls running on schedule' })
      }
    }

    // 2. CBP API degradation (last hour of location fetches)
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    const recentFetches = locationFetches.filter(f => new Date(f.fetched_at).getTime() > oneHourAgo)
    if (recentFetches.length > 0) {
      const failures = recentFetches.filter(f => f.error !== null).length
      const failureRate = failures / recentFetches.length
      const avgLatency = recentFetches.reduce((sum, f) => sum + (f.latency_ms || 0), 0) / recentFetches.length

      if (failureRate > 0.2 || avgLatency > 5000) {
        checks.push({
          name: 'CBP API',
          status: failureRate > 0.5 ? 'critical' : 'warning',
          message: `${Math.round(failureRate * 100)}% failure rate, ${Math.round(avgLatency)}ms avg latency (last hour)`,
        })
      } else {
        checks.push({ name: 'CBP API', status: 'ok', message: `${Math.round(avgLatency)}ms avg latency, ${failures} failures (last hour)` })
      }
    }

    // 3. Alert delivery failures
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const stuckAlerts = recentAlerts.filter(a =>
      a.created_at < fiveMinAgo &&
      !a.delivered_at &&
      (!a.delay_until || a.delay_until < new Date().toISOString())
    )
    if (stuckAlerts.length > 0) {
      checks.push({
        name: 'Alert Delivery',
        status: stuckAlerts.length > 5 ? 'critical' : 'warning',
        message: `${stuckAlerts.length} alert(s) created but not delivered`,
      })
    } else {
      checks.push({ name: 'Alert Delivery', status: 'ok', message: 'All alerts delivered' })
    }

    // 4. Last poll recency
    if (pollRuns.length > 0) {
      const lastPoll = pollRuns[0]
      const minsSince = (Date.now() - new Date(lastPoll.started_at).getTime()) / 60_000
      if (minsSince > 20) {
        checks.push({ name: 'Last Poll', status: 'critical', message: `Last poll was ${Math.round(minsSince)} minutes ago` })
      } else if (minsSince > 12) {
        checks.push({ name: 'Last Poll', status: 'warning', message: `Last poll was ${Math.round(minsSince)} minutes ago` })
      } else {
        checks.push({ name: 'Last Poll', status: 'ok', message: `${Math.round(minsSince)} minutes ago` })
      }

      // Check for anomalies on latest run
      if (lastPoll.anomaly_flags && lastPoll.anomaly_flags.length > 0) {
        checks.push({
          name: 'Anomalies',
          status: 'warning',
          message: `Latest run flagged: ${lastPoll.anomaly_flags.join(', ')}`,
        })
      }
    }

    return checks
  }, [pollRuns, locationFetches, recentAlerts])

  // --- Pipeline status ---
  const pipelineStatus = useMemo((): PipelineStatus => {
    if (healthChecks.some(c => c.status === 'critical')) return 'down'
    if (healthChecks.some(c => c.status === 'warning')) return 'degraded'
    return 'healthy'
  }, [healthChecks])

  // --- Alert pipeline stats (last 24h) ---
  const alertPipelineStats = useMemo(() => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000
    const last24h = recentAlerts.filter(a => new Date(a.created_at).getTime() > twentyFourHoursAgo)
    const created = last24h.length
    const delivered = last24h.filter(a => a.delivered_at).length
    const read = last24h.filter(a => a.read_at).length
    const stuck = last24h.filter(a => !a.delivered_at && (!a.delay_until || a.delay_until < new Date().toISOString())).length
    return { created, delivered, read, stuck }
  }, [recentAlerts])

  // --- Per-location health (last 24h) ---
  const locationHealth = useMemo(() => {
    const byLocation = new Map<number, LocationFetchLog[]>()
    for (const f of locationFetches) {
      const existing = byLocation.get(f.location_id) || []
      existing.push(f)
      byLocation.set(f.location_id, existing)
    }

    return Array.from(byLocation.entries()).map(([locationId, fetches]) => {
      const failures = fetches.filter(f => f.error !== null).length
      const avgLatency = Math.round(fetches.reduce((s, f) => s + (f.latency_ms || 0), 0) / fetches.length)
      const avgSlots = Math.round((fetches.reduce((s, f) => s + f.slots_returned, 0) / fetches.length) * 10) / 10
      const lastSeen = fetches[0]?.fetched_at || ''
      return {
        locationId,
        totalFetches: fetches.length,
        failures,
        failureRate: Math.round((failures / fetches.length) * 100),
        avgLatency,
        avgSlots,
        lastSeen,
      }
    }).sort((a, b) => b.failures - a.failures)
  }, [locationFetches])

  return {
    pollRuns,
    locationFetches,
    recentAlerts,
    loading,
    healthChecks,
    pipelineStatus,
    alertPipelineStats,
    locationHealth,
    refetch: fetchData,
  }
}
