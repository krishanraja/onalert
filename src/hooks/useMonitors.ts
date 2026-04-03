import { useState, useEffect } from 'react'
import { supabase, type Monitor } from '@/lib/supabase'

export function useMonitors() {
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

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

    load()

    const channel = supabase
      .channel('monitors')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monitors' }, load)
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  async function toggleMonitor(id: string, active: boolean) {
    await supabase.from('monitors').update({ active }).eq('id', id)
    setMonitors((prev) => prev.map((m) => m.id === id ? { ...m, active } : m))
  }

  async function deleteMonitor(id: string) {
    await supabase.from('monitors').delete().eq('id', id)
    setMonitors((prev) => prev.filter((m) => m.id !== id))
  }

  async function createMonitor(config: Monitor['config']): Promise<Monitor | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('monitors')
      .insert({ user_id: user.id, type: 'appointment', config })
      .select()
      .single()

    if (error || !data) return null
    setMonitors((prev) => [data, ...prev])
    return data
  }

  return { monitors, loading, toggleMonitor, deleteMonitor, createMonitor }
}
