import { Outlet, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BottomNav } from './BottomNav'
import { useAlerts } from '@/hooks/useAlerts'

export function AppLayout() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const { unreadCount } = useAlerts()

  useEffect(() => {
    if (!supabase) { setAuthed(false); return }

    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setAuthed(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (authed === null) {
    return <LoadingSpinner />
  }

  if (!authed) return <Navigate to="/auth" replace />

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ paddingTop: 'var(--safe-area-top)' }}
    >
      {/* Desktop top nav with logo */}
      <header className="hidden md:block border-b border-border bg-background-elevated">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center">
          <img
            src="/brand/nav-icon.svg"
            alt="OnAlert"
            className="h-9 w-9"
          />
        </div>
      </header>
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
