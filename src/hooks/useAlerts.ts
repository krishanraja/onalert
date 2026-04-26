import { useState, useEffect, useCallback } from 'react'
import { supabase, type Alert } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { haptic } from '@/lib/haptics'
import { minutesSince } from '@/lib/time'

export function useAlerts(limit = 50) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [connected, setConnected] = useState(true)

  useEffect(() => {
    let mounted = true
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let retryCount = 0
    let currentChannel: RealtimeChannel | null = null
    let currentUserId: string | null = null

    async function load() {
      if (!supabase) { setLoading(false); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      currentUserId = user.id

      const { data } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (mounted) {
        setAlerts(data || [])
        setUnreadCount((data || []).filter((a: Alert) => !a.read_at).length)
        setLoading(false)
      }
    }

    function subscribe() {
      if (!supabase || !currentUserId || !mounted) return

      const channel = supabase
        .channel(`alerts:${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'alerts',
            filter: `user_id=eq.${currentUserId}`,
          },
          (payload) => {
            const newAlert = payload.new as Alert
            setAlerts((prev) => [newAlert, ...prev])
            setUnreadCount((c) => c + 1)

            // Smart haptic based on urgency
            const age = minutesSince(newAlert.created_at)
            if (age <= 2) {
              haptic('urgentAlert')
            } else {
              haptic('alertArrival')
            }

            setConnected(true)
            retryCount = 0
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnected(true)
            retryCount = 0
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setConnected(false)
            // Exponential backoff reconnection — tear down stale channel and rebuild
            const delay = Math.min(1000 * Math.pow(2, retryCount), 30000)
            retryCount++
            retryTimeout = setTimeout(() => {
              if (!mounted) return
              if (currentChannel && supabase) {
                supabase.removeChannel(currentChannel)
                currentChannel = null
              }
              // Refresh data and re-subscribe
              load().then(() => {
                if (mounted) subscribe()
              })
            }, delay)
          }
        })

      currentChannel = channel
    }

    load().then(() => {
      if (mounted) subscribe()
    })

    return () => {
      mounted = false
      if (retryTimeout) clearTimeout(retryTimeout)
      if (currentChannel && supabase) supabase.removeChannel(currentChannel)
    }
  }, [limit])

  const markRead = useCallback(async (id: string) => {
    if (!supabase) return

    const readAt = new Date().toISOString()
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, read_at: readAt } : a))
    setUnreadCount((c) => Math.max(0, c - 1))

    const { error } = await supabase
      .from('alerts')
      .update({ read_at: readAt })
      .eq('id', id)

    if (error) {
      // Rollback on failure
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, read_at: null } : a))
      setUnreadCount((c) => c + 1)
    }
  }, [])

  const toggleStar = useCallback(async (id: string) => {
    if (!supabase) return

    const alert = alerts.find((a) => a.id === id)
    if (!alert) return

    const isStarred = !!alert.starred_at
    const newValue = isStarred ? null : new Date().toISOString()

    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, starred_at: newValue } : a))

    const { error } = await supabase
      .from('alerts')
      .update({ starred_at: newValue })
      .eq('id', id)

    if (error) {
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, starred_at: alert.starred_at } : a))
    }
  }, [alerts])

  return { alerts, loading, unreadCount, markRead, toggleStar, connected }
}
