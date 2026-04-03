import { Outlet, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BottomNav } from './BottomNav'
import { useAlerts } from '@/hooks/useAlerts'

export function AppLayout() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const { unreadCount } = useAlerts()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setAuthed(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (authed === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-1 h-1 rounded-full bg-primary animate-ping" />
      </div>
    )
  }

  if (!authed) return <Navigate to="/auth" replace />

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ paddingTop: 'var(--safe-area-top)' }}
    >
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: 'calc(var(--bottom-nav-height) + var(--safe-area-bottom))' }}
      >
        <Outlet />
      </main>
      <BottomNav unreadCount={unreadCount} />
    </div>
  )
}
