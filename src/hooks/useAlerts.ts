import { useState, useEffect, useCallback } from 'react'
import { supabase, type Alert } from '@/lib/supabase'

export function useAlerts(limit = 50) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let mounted = true

    async function load() {
      if (!supabase) { setLoading(false); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

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

    load()

    if (!supabase) return

    const channel = supabase
      .channel('alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, (payload) => {
        const newAlert = payload.new as Alert
        setAlerts((prev) => [newAlert, ...prev])
        setUnreadCount((c) => c + 1)
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100])
      })
      .subscribe()

    return () => {
      mounted = false
      supabase!.removeChannel(channel)
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

  return { alerts, loading, unreadCount, markRead }
}
