import { createContext, useContext, type ReactNode } from 'react'
import { useAlerts } from '@/hooks/useAlerts'

type AlertsContextValue = ReturnType<typeof useAlerts>

const AlertsContext = createContext<AlertsContextValue | null>(null)

/**
 * Wraps the authenticated app shell so that the realtime alerts subscription
 * is created exactly once per tab. Multiple consumers (Dashboard, AlertsPage,
 * AlertDetailPage, layout badges) read the same data and share a single
 * Supabase channel — preventing duplicate haptics/vibrations and reducing
 * connection load.
 */
export function AlertsProvider({ children }: { children: ReactNode }) {
  const value = useAlerts()
  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}

export function useAlertsContext(): AlertsContextValue {
  const ctx = useContext(AlertsContext)
  if (!ctx) {
    throw new Error('useAlertsContext must be used within an <AlertsProvider>')
  }
  return ctx
}
