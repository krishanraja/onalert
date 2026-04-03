import { Outlet, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { Toaster } from '@/components/ui/Toaster'
import { useAlerts } from '@/hooks/useAlerts'
import { useKeyboardShortcuts, SHORTCUTS } from '@/hooks/useKeyboardShortcuts'

export function AppLayout() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const { unreadCount } = useAlerts()
  const { showHelp, setShowHelp } = useKeyboardShortcuts()

  useEffect(() => {
    if (!supabase) {
      const t = setTimeout(() => setAuthed(false), 0)
      return () => clearTimeout(t)
    }

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
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <Sidebar unreadCount={unreadCount} />

      {/* Main content */}
      <div
        className="flex-1 flex flex-col min-h-screen"
        style={{ paddingTop: 'var(--safe-area-top)' }}
      >
        <main
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: 'calc(var(--bottom-nav-height) + var(--safe-area-bottom))' }}
        >
          <Outlet />
        </main>

        {/* Mobile bottom nav - hidden on desktop */}
        <BottomNav unreadCount={unreadCount} />
      </div>

      {/* Toast notifications */}
      <Toaster />

      {/* Keyboard shortcuts help modal (desktop only) */}
      {showHelp && (
        <div
          className="hidden lg:flex fixed inset-0 bg-black/60 z-[200] items-center justify-center"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-background-elevated border border-border rounded-xl p-6 max-w-sm w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">Keyboard Shortcuts</h2>
            <div className="space-y-3">
              {SHORTCUTS.map((s) => (
                <div key={s.description} className="flex items-center justify-between">
                  <span className="text-sm text-foreground-secondary">{s.description}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((key) => (
                      <kbd
                        key={key}
                        className="text-xs font-mono bg-surface border border-border px-2 py-1 rounded text-foreground-muted"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full border border-border text-foreground py-2 rounded-lg text-sm hover:bg-surface-muted transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
