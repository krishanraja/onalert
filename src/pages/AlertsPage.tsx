import { Bell } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAlerts } from '@/hooks/useAlerts'
import { AlertCard } from '@/components/alerts/AlertCard'

export function AlertsPage() {
  const { alerts, loading } = useAlerts()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <header className="bg-background-elevated border-b border-border safe-top">
        <div className="px-4 py-4">
          <h1 className="text-lg font-semibold text-foreground">Alerts</h1>
        </div>
      </header>

      <div className="px-4 py-6">
        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-surface border-2 border-dashed border-border rounded-lg flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-foreground-muted" />
            </div>
            <h3 className="font-medium text-foreground mb-2">No alerts yet</h3>
            <p className="text-sm text-foreground-secondary max-w-sm mx-auto">
              Your alerts will appear here when appointment slots become available.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}