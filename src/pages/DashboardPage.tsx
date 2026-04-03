import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Crown, Users, Zap, Bell, ArrowRight } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { useMonitors } from '@/hooks/useMonitors'
import { useAlerts } from '@/hooks/useAlerts'
import { useInsights } from '@/hooks/useInsights'
import { MonitorCard } from '@/components/monitors/MonitorCard'
import { InsightsCard } from '@/components/dashboard/InsightsCard'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { DashboardSkeleton } from '@/components/ui/Skeleton'
import { haptic } from '@/lib/haptics'

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile, loading: profileLoading, isPaid, isFamily } = useProfile()
  const { monitors, loading: monitorsLoading, toggleMonitor, deleteMonitor } = useMonitors()
  const { alerts, loading: alertsLoading } = useAlerts()
  const [hasRedirected, setHasRedirected] = useState(false)

  // Get all location IDs across monitors for insights
  const allLocationIds = monitors.flatMap((m) => m.config.location_ids || [])
  const { insights } = useInsights(allLocationIds)

  // First-time user: redirect to add monitor
  useEffect(() => {
    if (!monitorsLoading && !profileLoading && monitors.length === 0 && profile && !hasRedirected) {
      // Small delay so the page renders briefly before redirect
      const timer = setTimeout(() => {
        setHasRedirected(true)
        navigate('/app/add', { replace: true })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [monitorsLoading, profileLoading, monitors.length, profile, hasRedirected, navigate])

  if (profileLoading || monitorsLoading) {
    return (
      <div className="min-h-full bg-background">
        <header className="bg-background-elevated border-b border-border safe-top lg:hidden">
          <div className="px-4 py-4 flex items-center justify-between">
            <img src="/brand/icon-light.svg" alt="OnAlert" className="h-8 w-8" />
            <div className="h-6 w-16 bg-surface-muted rounded-full animate-pulse" />
          </div>
        </header>
        <div className="px-4 py-6">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  const handleAddMonitor = () => {
    haptic('navigation')
    navigate('/app/add')
  }

  const planLabel = isFamily ? 'FAMILY' : isPaid ? 'PRO' : 'FREE'

  return (
    <div className="min-h-full bg-background">
      {/* Mobile Header - hidden on desktop (sidebar has logo) */}
      <header className="bg-background-elevated border-b border-border safe-top lg:hidden">
        <div className="px-4 py-4 flex items-center justify-between">
          <img
            src="/brand/icon-light.svg"
            alt="OnAlert"
            className="h-8 w-8"
          />
          <div className="flex items-center gap-2">
            {isPaid ? (
              <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-1 rounded-full">
                {isFamily ? <Users size={12} /> : <Crown size={12} />}
                <span className="text-xs font-medium">{planLabel}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-surface text-foreground-muted px-2 py-1 rounded-full border border-border">
                <span className="text-xs font-medium">FREE</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Desktop: 2-column grid layout */}
      <div className="px-4 lg:px-6 py-6 lg:py-8 max-w-6xl mx-auto">
        {/* Desktop page title */}
        <div className="hidden lg:flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-foreground-secondary mt-1">
              {monitors.length > 0
                ? `Monitoring ${allLocationIds.length} location${allLocationIds.length !== 1 ? 's' : ''} across ${monitors.length} monitor${monitors.length !== 1 ? 's' : ''}`
                : 'Set up your first monitor to get started'
              }
            </p>
          </div>
          {monitors.length > 0 && (
            <button
              onClick={handleAddMonitor}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
            >
              <Plus size={16} />
              Add Monitor
            </button>
          )}
        </div>

        {monitors.length === 0 ? (
          /* Empty state with demo preview */
          <div className="space-y-6">
            <div className="text-center py-8 lg:py-12">
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

            {/* Demo preview card */}
            <div className="max-w-md mx-auto">
              <div className="bg-surface border border-border rounded-lg p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 z-10 pointer-events-none" />
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-warning" />
                  <span className="text-xs font-medium text-foreground-muted uppercase tracking-wide">Preview</span>
                </div>
                <div className="space-y-2 opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">GE</span>
                    <span className="text-xs text-success">● Active</span>
                  </div>
                  <p className="text-sm text-foreground">JFK International Airport, NY</p>
                  <p className="text-sm text-foreground">Newark Liberty Airport, NJ</p>
                  <div className="pt-2 border-t border-border flex items-center gap-2">
                    <Bell size={11} className="text-primary" />
                    <span className="text-[11px] text-primary font-mono">Alert: Slot opened 2m ago</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-foreground-muted mt-3">
                This is what your dashboard looks like when a slot opens
              </p>
            </div>
          </div>
        ) : (
          /* Active dashboard - responsive grid */
          <div className="lg:grid lg:grid-cols-5 lg:gap-6 space-y-6 lg:space-y-0">
            {/* Left column: Stats + Monitors */}
            <div className="lg:col-span-3 space-y-4">
              {/* Quick Stats (desktop) */}
              <div className="hidden lg:block">
                <QuickStats monitors={monitors} alerts={alerts} />
              </div>

              {/* Monitors */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Your monitors</h2>
                  <button
                    onClick={handleAddMonitor}
                    className="text-sm text-primary hover:text-primary/80 transition-colors lg:hidden"
                  >
                    Add monitor
                  </button>
                </div>

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
              </div>

              {/* Upgrade prompt for free users */}
              {!isPaid && monitors.length > 0 && (
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Crown className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-1">Stop missing slots</h3>
                      <p className="text-sm text-foreground-secondary mb-3">
                        Free alerts are delayed 15 min and slots fill in under 10. Pro delivers instant alerts with 5-minute checks.
                      </p>
                      <button
                        onClick={() => navigate('/app/settings')}
                        className="text-sm text-primary hover:text-primary/80 transition-colors font-medium inline-flex items-center gap-1"
                      >
                        Upgrade for $29 (one-time) <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right column: Insights + Activity (desktop) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Quick Stats (mobile only) */}
              <div className="lg:hidden">
                <QuickStats monitors={monitors} alerts={alerts} />
              </div>

              {/* Insights */}
              <InsightsCard insights={insights} />

              {/* Activity Feed (desktop) */}
              <div className="hidden lg:block">
                <ActivityFeed alerts={alerts} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
