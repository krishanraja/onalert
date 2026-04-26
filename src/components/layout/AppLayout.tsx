import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PageTransition } from './PageTransition'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { Toaster } from '@/components/ui/Toaster'
import { AlertsProvider, useAlertsContext } from '@/contexts/AlertsProvider'
import { useKeyboardShortcuts, SHORTCUTS } from '@/hooks/useKeyboardShortcuts'

const TAB_INDEX: Record<string, number> = {
  '/app': 0,
  '/app/alerts': 1,
  '/app/add': 2,
  '/app/settings': 3,
}

function getDirection(from: string, to: string): 'left' | 'right' | 'up' | 'fade' {
  // Add monitor gets scale-up (it's the FAB)
  if (to === '/app/add') return 'up'
  if (from === '/app/add') return 'up'

  const fromIdx = TAB_INDEX[from] ?? -1
  const toIdx = TAB_INDEX[to] ?? -1

  // Alert detail pages slide from the right
  if (to.startsWith('/app/alerts/')) return 'left'
  if (from.startsWith('/app/alerts/')) return 'right'

  if (fromIdx < 0 || toIdx < 0) return 'fade'
  return toIdx > fromIdx ? 'left' : 'right'
}

function AuthenticatedShell() {
  const { unreadCount } = useAlertsContext()
  const { showHelp, setShowHelp } = useKeyboardShortcuts()
  const location = useLocation()
  const [direction, setDirection] = useState<'left' | 'right' | 'up' | 'fade'>('fade')
  const prevPath = useRef(location.pathname)

  useEffect(() => {
    setDirection(getDirection(prevPath.current, location.pathname))
    prevPath.current = location.pathname
  }, [location.pathname])

  return (
    <div className="h-[100dvh] bg-background flex overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar unreadCount={unreadCount} />

      {/* Main content */}
      <div
        className="flex-1 flex flex-col h-full overflow-hidden"
        style={{ paddingTop: 'var(--safe-area-top)' }}
      >
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname} direction={direction}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
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

export function AppLayout() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const location = useLocation()

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

  if (!authed) {
    // Preserve where the user was trying to go so AuthPage can return them.
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  return (
    <AlertsProvider>
      <AuthenticatedShell />
    </AlertsProvider>
  )
}
