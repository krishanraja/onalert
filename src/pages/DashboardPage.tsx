import { useNavigate } from 'react-router-dom'
import { Plus, Crown } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useProfile } from '@/hooks/useProfile'
import { useMonitors } from '@/hooks/useMonitors'
import { MonitorCard } from '@/components/monitors/MonitorCard'

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile, loading: profileLoading, isPremium } = useProfile()
  const { monitors, loading: monitorsLoading, toggleMonitor, deleteMonitor } = useMonitors()

  if (profileLoading || monitorsLoading) {
    return <LoadingSpinner />
  }

  const handleAddMonitor = () => {
    if ('vibrate' in navigator) navigator.vibrate([30])
    navigate('/app/add')
  }

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <header className="bg-background-elevated border-b border-border safe-top">
        <div className="px-4 py-4 flex items-center justify-between">
          <img
            src="/brand/icon-192.png"
            alt="OnAlert"
            className="h-7 w-7 rounded"
          />
          <div className="flex items-center gap-2">
            {isPremium ? (
              <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-1 rounded-full">
                <Crown size={12} />
                <span className="text-xs font-medium">PREMIUM</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-surface text-foreground-muted px-2 py-1 rounded-full border border-border">
                <span className="text-xs font-medium">FREE</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Monitors */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Your monitors</h2>
            {monitors.length > 0 && (
              <button
                onClick={handleAddMonitor}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Add monitor
              </button>
            )}
          </div>

          {monitors.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-surface border-2 border-dashed border-border rounded-lg flex items-center justify-center mx-auto mb-4">
                <Plus className="w-6 h-6 text-foreground-muted" />
              </div>
              <h3 className="font-medium text-foreground mb-2">No monitors yet</h3>
              <p className="text-sm text-foreground-secondary mb-6 max-w-sm mx-auto">
                Set up your first monitor to get alerts when government appointment slots become available.
              </p>
              <button
                onClick={handleAddMonitor}
                className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Add your first monitor
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {monitors.map((monitor) => (
                <MonitorCard
                  key={monitor.id}
                  monitor={monitor}
                  onToggle={toggleMonitor}
                  onDelete={deleteMonitor}
                />
              ))}
            </div>
          )}
        </div>

        {/* Upgrade prompt for free users */}
        {!isPremium && monitors.length > 0 && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-foreground mb-1">Upgrade to Premium</h3>
                <p className="text-sm text-foreground-secondary mb-3">
                  Get unlimited monitors, SMS alerts, and checks every 10 minutes.
                </p>
                <button
                  onClick={() => navigate('/app/settings')}
                  className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Upgrade for $19/month →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}