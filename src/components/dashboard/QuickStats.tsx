import { Activity, Bell, Clock } from 'lucide-react'
import { type Monitor, type Alert } from '@/lib/supabase'
import { formatDistanceToNow } from '@/lib/time'

interface Props {
  monitors: Monitor[]
  alerts: Alert[]
}

export function QuickStats({ monitors, alerts }: Props) {
  const activeMonitors = monitors.filter((m) => m.active).length
  const totalLocations = monitors.reduce(
    (sum, m) => sum + (m.config.location_ids?.length || 0), 0
  )

  const todayAlerts = alerts.filter(
    (a) => new Date(a.created_at).toDateString() === new Date().toDateString()
  ).length

  const lastChecked = monitors
    .filter((m) => m.last_checked_at)
    .sort((a, b) => new Date(b.last_checked_at!).getTime() - new Date(a.last_checked_at!).getTime())[0]

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-surface border border-border rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={12} className="text-success" />
          <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-wide">Active</span>
        </div>
        <p className="text-xl font-bold font-mono text-foreground">{activeMonitors}</p>
        <p className="text-[10px] text-foreground-muted">{totalLocations} locations</p>
      </div>

      <div className="bg-surface border border-border rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <Bell size={12} className="text-primary" />
          <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-wide">Today</span>
        </div>
        <p className="text-xl font-bold font-mono text-foreground">{todayAlerts}</p>
        <p className="text-[10px] text-foreground-muted">alert{todayAlerts !== 1 ? 's' : ''} fired</p>
      </div>

      <div className="bg-surface border border-border rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <Clock size={12} className="text-foreground-muted" />
          <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-wide">Last scan</span>
        </div>
        <p className="text-sm font-bold font-mono text-foreground">
          {lastChecked?.last_checked_at ? formatDistanceToNow(lastChecked.last_checked_at) : '-'}
        </p>
        <p className="text-[10px] text-foreground-muted">ago</p>
      </div>
    </div>
  )
}
