import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TOP_LOCATIONS } from '@/lib/locations'

interface Prediction {
  location_id: number
  service_type: string
  predicted_day: string
  probability: number
}

interface Props {
  locationIds: number[]
}

export function PredictionCard({ locationIds }: Props) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !locationIds.length) {
      const t = setTimeout(() => setLoading(false), 0)
      return () => clearTimeout(t)
    }

    async function load() {
      const { data } = await supabase!
        .from('slot_predictions')
        .select('location_id, service_type, predicted_day, probability')
        .in('location_id', locationIds)
        .gte('probability', 0.5)
        .order('probability', { ascending: false })
        .limit(5)

      setPredictions(data || [])
      setLoading(false)
    }

    load()
  }, [locationIds.join(',')])

  if (loading || !predictions.length) return null

  return (
    <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-warning" />
        Slot Predictions
      </h3>
      <p className="text-2xs text-foreground-muted">Based on 90 days of historical patterns</p>

      {predictions.map((pred, i) => {
        const location = TOP_LOCATIONS.find(l => l.id === pred.location_id)
        const name = location?.name?.split(' - ')[0] || `Location ${pred.location_id}`
        const pct = Math.round(pred.probability * 100)

        return (
          <div key={i} className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground truncate">{name}</div>
              <div className="text-2xs text-foreground-muted">{pred.predicted_day}s</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-warning rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-mono text-foreground-secondary w-8 text-right">{pct}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
