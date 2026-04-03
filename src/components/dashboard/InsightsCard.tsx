import { TrendingUp, Lightbulb, BarChart3, AlertCircle } from 'lucide-react'
import { type Insight } from '@/hooks/useInsights'

const ICONS = {
  trend: TrendingUp,
  tip: Lightbulb,
  stat: BarChart3,
  alert: AlertCircle,
}

interface Props {
  insights: Insight[]
}

export function InsightsCard({ insights }: Props) {
  if (insights.length === 0) return null

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Lightbulb size={14} className="text-warning" />
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Insights</h3>
      </div>
      <div className="divide-y divide-border">
        {insights.map((insight) => {
          const Icon = ICONS[insight.icon]
          return (
            <div key={insight.id} className="px-4 py-3 flex items-start gap-3">
              <Icon
                size={14}
                className={
                  insight.icon === 'alert' ? 'text-primary shrink-0 mt-0.5' :
                  insight.icon === 'tip' ? 'text-warning shrink-0 mt-0.5' :
                  insight.icon === 'trend' ? 'text-success shrink-0 mt-0.5' :
                  'text-foreground-muted shrink-0 mt-0.5'
                }
              />
              <p className="text-sm text-foreground-secondary leading-relaxed">{insight.text}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
