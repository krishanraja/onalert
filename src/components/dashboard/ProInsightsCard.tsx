import { TrendingUp, Clock, MapPin, Zap } from 'lucide-react'
import { type ProInsight } from '@/hooks/useInsights'

interface Props {
  proInsights: ProInsight
}

function HourLabel({ hour }: { hour: number }) {
  const label = hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`
  return <span>{label}</span>
}

export function ProInsightsCard({ proInsights }: Props) {
  const { locationStats, peakDayOfWeek, peakTimeRange, totalAlertsLast30, bestStrategy } = proInsights

  if (totalAlertsLast30 === 0 && locationStats.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <TrendingUp size={14} className="text-primary" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Pro Insights</h3>
        </div>
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-foreground-secondary">
            Insights will appear once your monitors detect slots. Keep monitoring!
          </p>
        </div>
      </div>
    )
  }

  const maxCount = locationStats.length > 0 ? locationStats[0].alertCount : 1

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-primary" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Pro Insights</h3>
        </div>
        <span className="text-[10px] font-mono text-foreground-muted">Last 30 days</span>
      </div>

      <div className="divide-y divide-border">
        {/* Summary stats */}
        <div className="px-4 py-3 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-lg font-bold font-mono text-foreground">{totalAlertsLast30}</p>
            <p className="text-[10px] text-foreground-muted">Total alerts</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold font-mono text-foreground">{peakDayOfWeek?.slice(0, 3) || '—'}</p>
            <p className="text-[10px] text-foreground-muted">Peak day</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold font-mono text-foreground">{peakTimeRange || '—'}</p>
            <p className="text-[10px] text-foreground-muted">Peak time</p>
          </div>
        </div>

        {/* Location frequency bars */}
        {locationStats.length > 0 && (
          <div className="px-4 py-3 space-y-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin size={11} className="text-foreground-muted" />
              <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wide">
                Location frequency
              </span>
            </div>
            {locationStats.map((loc) => (
              <div key={loc.locationId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground truncate max-w-[60%]">{loc.locationName}</span>
                  <div className="flex items-center gap-2 text-foreground-muted shrink-0">
                    <span className="font-mono">{loc.alertCount} slots</span>
                    <span className="flex items-center gap-0.5">
                      <Clock size={9} />
                      <HourLabel hour={loc.peakHour} />
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(8, (loc.alertCount / maxCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Best strategy */}
        {bestStrategy && (
          <div className="px-4 py-3 flex items-start gap-2">
            <Zap size={12} className="text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-foreground-secondary">{bestStrategy}</p>
          </div>
        )}
      </div>
    </div>
  )
}
