import { useState, useEffect, useCallback } from 'react'
import { supabase, type Monitor } from '@/lib/supabase'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'

const COOLDOWN_HOURS = 24

export function useMonitors() {
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [loading, setLoading] = useState(true)
  const [cooldownExpiry, setCooldownExpiry] = useState<Date | null>(null)

  useEffect(() => {
    let mounted = true
    let userId: string | null = null

    async function load() {
      if (!supabase) { setLoading(false); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      userId = user.id

      const { data } = await supabase
        .from('monitors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (mounted) {
        setMonitors(data || [])
        setLoading(false)
      }
    }

    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null

    load().then(() => {
      if (!supabase || !userId || !mounted) return

      channel = supabase
        .channel(`monitors:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'monitors',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            // For UPDATE events scoped to this user, merge into local state
            // instead of refetching the entire list.
            if (
              payload.eventType === 'UPDATE' &&
              payload.new &&
              (payload.new as Monitor).user_id === userId
            ) {
              const updated = payload.new as Monitor
              setMonitors((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
              return
            }
            // INSERT/DELETE: full refetch is simplest and correct.
            load()
          }
        )
        .subscribe()
    })

    return () => {
      mounted = false
      if (channel && supabase) supabase.removeChannel(channel)
    }
  }, [])

  const refreshCooldown = useCallback(async () => {
    if (!supabase) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('monitor_changes')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('action', 'deleted')
      .order('created_at', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      const deletedAt = new Date(data[0].created_at)
      const expiry = new Date(deletedAt.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000)
      if (expiry > new Date()) {
        setCooldownExpiry(expiry)
      } else {
        setCooldownExpiry(null)
      }
    } else {
      setCooldownExpiry(null)
    }
  }, [])

  async function toggleMonitor(id: string, active: boolean) {
    if (!supabase) return

    const previous = monitors
    setMonitors((prev) => prev.map((m) => m.id === id ? { ...m, active } : m))

    const { error } = await supabase.from('monitors').update({ active }).eq('id', id)
    if (error) {
      setMonitors(previous)
      throw error
    }
  }

  async function deleteMonitor(id: string) {
    if (!supabase) return

    const monitor = monitors.find((m) => m.id === id)
    const previous = monitors
    setMonitors((prev) => prev.filter((m) => m.id !== id))

    const { error } = await supabase.from('monitors').delete().eq('id', id)
    if (error) {
      setMonitors(previous)
      throw error
    }

    // Log the deletion for cooldown tracking
    const { data: { user } } = await supabase.auth.getUser()
    if (user && monitor) {
      await supabase.from('monitor_changes').insert({
        user_id: user.id,
        action: 'deleted',
        monitor_config: monitor.config,
      })
      // Refresh cooldown state
      await refreshCooldown()
    }
  }

  async function createMonitor(config: Monitor['config']): Promise<Monitor | null> {
    if (!supabase) return null

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('monitors')
      .insert({ user_id: user.id, type: 'appointment', config })
      .select()
      .single()

    if (error) throw error
    if (!data) return null

    setMonitors((prev) => [data, ...prev])

    // Track monitor creation
    trackEvent(AnalyticsEvents.MONITOR_CREATED, {
      service_type: config.service_type,
      location_count: config.location_ids?.length || 0,
    })

    return data
  }

  return { monitors, loading, toggleMonitor, deleteMonitor, createMonitor, cooldownExpiry, refreshCooldown }
}
