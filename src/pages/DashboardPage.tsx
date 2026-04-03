import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Crown, Users, Zap, Bell, ArrowRight, Activity, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useProfile } from '@/hooks/useProfile'
import { useMonitors } from '@/hooks/useMonitors'
import { useAlerts } from '@/hooks/useAlerts'
import { useInsights } from '@/hooks/useInsights'
import { MonitorCard } from '@/components/monitors/MonitorCard'
import { MonitorChip } from '@/components/dashboard/MonitorChip'
import { HeroAlertCard } from '@/components/dashboard/HeroAlertCard'
import { AllClearCard } from '@/components/dashboard/AllClearCard'
import { InsightsCard } from '@/components/dashboard/InsightsCard'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { DashboardSkeleton } from '@/components/ui/Skeleton'
import { haptic } from '@/lib/haptics'
import { formatDistanceToNow } from '@/lib/time'

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile, loading: profileLoading, isPaid, isFamily } = useProfile()
  const { monitors, loading: monitorsLoading, toggleMonitor, deleteMonitor } = useMonitors()
  const { alerts, loading: alertsLoading, connected } = useAlerts()
  const [hasRedirected, setHasRedirected] = useState(false)

  // Get all location IDs across monitors for insights
  const allLocationIds = monitors.flatMap((m) => m.config.location_ids || [])
  const { insights } = useInsights(allLocationIds)

  // First-time user: redirect to add monitor
  useEffect(() => {
    if (!monitorsLoading && !profileLoading && monitors.length === 0 && profile && !hasRedirected) {
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

  // Get latest unread alert for the hero card
  const unreadAlerts = alerts.filter((a) => !a.read_at)
  const latestUnread = unreadAlerts[0] ?? null

  // Stats
  const activeMonitors = monitors.filter((m) => m.active).length
  const todayAlerts = alerts.filter(
    (a) => new Date(a.created_at).toDateString() === new Date().toDateString()
  ).length
  const lastChecked = monitors
    .filter((m) => m.last_checked_at)
    .sort((a, b) => new Date(b.last_checked_at!).getTime() - new Date(a.last_checked_at!).getTime())[0]

  return (
    <div className="min-h-full bg-background">
      {/* ============ MOBILE LAYOUT - No scroll, viewport fit ============ */}
      <div className="lg:hidden flex flex-col" style={{ height: 'calc(100dvh - var(--bottom-nav-height) - var(--safe-area-bottom))' }}>
        {/* Header */}
        <header className="bg-background-elevated border-b border-border safe-top shrink-0">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/brand/icon-light.svg" alt="OnAlert" className="h-7 w-7" />
              {/* Connection status dot */}
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success' : 'bg-warning'}`} />
            </div>
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

        {monitors.length === 0 ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-surface border-2 border-dashed border-border rounded-lg flex items-center justify-center mx-auto mb-4">
                <Plus className="w-6 h-6 text-foreground-muted" />
              </div>
              <h3 className="font-medium text-foreground mb-2">No monitors yet</h3>
              <p className="text-sm text-foreground-secondary mb-6 max-w-sm mx-auto">
                Set up your first monitor to get alerts when appointment slots open.
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddMonitor}
                className="bg-primary text-white px-6 py-3 rounded-lg font-medium"
              >
                Add your first monitor
              </motion.button>
            </motion.div>
          </div>
        ) : (
          /* Active dashboard - no-scroll layout */
          <div className="flex-1 flex flex-col p-4 gap-3 min-h-0">
            {/* Compact stats row */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 shrink-0"
            >
              <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-3 py-2">
                <Activity size={12} className="text-success" />
                <span className="text-xs font-mono text-foreground font-semibold">{activeMonitors}</span>
                <span className="text-[10px] text-foreground-muted">active</span>
              </div>
              <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-3 py-2">
                <Bell size={12} className="text-primary" />
                <span className="text-xs font-mono text-foreground font-semibold">{todayAlerts}</span>
                <span className="text-[10px] text-foreground-muted">today</span>
              </div>
              <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-3 py-2 ml-auto">
                <Clock size={12} className="text-foreground-muted" />
                <span className="text-[10px] font-mono text-foreground-muted">
                  {lastChecked?.last_checked_at ? formatDistanceToNow(lastChecked.last_checked_at) : '-'}
                </span>
              </div>
            </motion.div>

            {/* Hero card - fills available space */}
            <div className="flex-1 flex flex-col justify-center min-h-0">
              {latestUnread ? (
                <HeroAlertCard alert={latestUnread} />
              ) : (
                <AllClearCard monitors={monitors} />
              )}
            </div>

            {/* Monitor chips - horizontal scroll */}
            <div className="shrink-0">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
                {monitors.map((monitor, i) => (
                  <motion.div
                    key={monitor.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="snap-start"
                  >
                    <MonitorChip monitor={monitor} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Upgrade prompt for free users - compact */}
            {!isPaid && monitors.length > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/app/settings')}
                className="shrink-0 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <Crown className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs text-foreground-secondary flex-1 text-left">
                  <span className="text-primary font-semibold">Stop missing slots</span> — instant alerts, $29 one-time
                </span>
                <ArrowRight size={14} className="text-primary shrink-0" />
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* ============ DESKTOP LAYOUT - Unchanged ============ */}
      <div className="hidden lg:block">
        <div className="px-4 lg:px-6 py-6 lg:py-8 max-w-6xl mx-auto">
          {/* Desktop page title */}
          <div className="flex items-center justify-between mb-6">
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
            <div className="lg:grid lg:grid-cols-5 lg:gap-6 space-y-6 lg:space-y-0">
              <div className="lg:col-span-3 space-y-4">
                <QuickStats monitors={monitors} alerts={alerts} />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">Your monitors</h2>
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

              <div className="lg:col-span-2 space-y-4">
                <InsightsCard insights={insights} />
                <ActivityFeed alerts={alerts} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
