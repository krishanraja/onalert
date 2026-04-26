import { MapPin, TrendingUp, Clock } from 'lucide-react'
import { useLocationIntelligence } from '@/hooks/useLocationIntelligence'
import { TOP_LOCATIONS } from '@/lib/locations'

interface Props {
  locationIds: number[]
}

export function LocationIntelligence({ locationIds }: Props) {
  const { stats, loading } = useLocationIntelligence(locationIds)

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-surface-muted rounded w-1/2" />
          <div className="h-20 bg-surface-muted rounded" />
        </div>
      </div>
    )
  }

  if (!stats.length) {
    return (
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Location Intelligence</h3>
        <p className="text-xs text-foreground-muted">Collecting data... Check back after a few days of monitoring.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <TrendingUp className="w-4 h-4 text-primary" />
        Location Intelligence
      </h3>

      {stats.slice(0, 5).map((loc) => {
        const location = TOP_LOCATIONS.find(l => l.id === loc.locationId)
        const name = location?.name || `Location ${loc.locationId}`

        return (
          <div key={loc.locationId} className="space-y-2">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-foreground-muted" />
              <span className="text-xs font-medium text-foreground truncate">{name}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-background rounded-lg p-2">
                <div className="text-sm font-semibold text-foreground">{loc.cancellationsPerWeek}</div>
                <div className="text-2xs text-foreground-muted">slots/week</div>
              </div>
              <div className="bg-background rounded-lg p-2">
                <div className="text-sm font-semibold text-foreground">
                  {loc.avgFillMinutes ? `${loc.avgFillMinutes}m` : '--'}
                </div>
                <div className="text-2xs text-foreground-muted">avg fill</div>
              </div>
              <div className="bg-background rounded-lg p-2">
                <div className="text-sm font-semibold text-foreground">
                  {loc.peakDays[0]?.day || '--'}
                </div>
                <div className="text-2xs text-foreground-muted">peak day</div>
              </div>
            </div>

            {/* Day-of-week heatmap */}
            <div className="flex gap-1">
              {loc.peakDays
                .sort((a, b) => {
                  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                  return days.indexOf(a.day) - days.indexOf(b.day)
                })
                .map(({ day, count }) => {
                  const max = Math.max(...loc.peakDays.map(d => d.count))
                  const intensity = max > 0 ? count / max : 0
                  return (
                    <div key={day} className="flex-1 text-center">
                      <div
                        className="h-3 rounded-sm"
                        style={{
                          backgroundColor: intensity > 0
                            ? `hsl(0 94% 32% / ${0.2 + intensity * 0.6})`
                            : 'hsl(0 0% 15%)',
                        }}
                      />
                      <span className="text-2xs text-foreground-muted">{day}</span>
                    </div>
                  )
                })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
