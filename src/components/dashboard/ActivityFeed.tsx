import { MapPin, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { type Alert } from '@/lib/supabase'
import { SERVICE_TYPES } from '@/lib/locations'
import { formatDistanceToNow, formatSlotTime } from '@/lib/time'

interface Props {
  alerts: Alert[]
}

export function ActivityFeed({ alerts }: Props) {
  const navigate = useNavigate()
  const recentAlerts = alerts.slice(0, 8)

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Recent alerts</h3>
        {alerts.length > 0 && (
          <button
            onClick={() => navigate('/app/alerts')}
            className="text-[10px] text-primary hover:text-primary/80 transition-colors font-medium"
          >
            View all
          </button>
        )}
      </div>

      {recentAlerts.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-foreground-muted">No alerts yet</p>
          <p className="text-xs text-foreground-muted mt-1">Alerts will appear here in real time</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {recentAlerts.map((alert) => {
            const serviceType = alert.payload.service_type as keyof typeof SERVICE_TYPES
            const service = SERVICE_TYPES[serviceType] ?? { abbr: serviceType }
            const isUnread = !alert.read_at

            return (
              <button
                key={alert.id}
                onClick={() => navigate(`/app/alerts/${alert.id}`)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-muted transition-colors text-left"
              >
                {/* Unread dot */}
                <div className="shrink-0">
                  {isUnread
                    ? <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    : <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {service.abbr}
                    </span>
                    <span className="text-xs text-foreground truncate flex items-center gap-1">
                      <MapPin size={9} className="shrink-0" />
                      {alert.payload.location_name}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-foreground-secondary mt-0.5">
                    {formatSlotTime(alert.payload.slot_timestamp)}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-1 text-foreground-muted">
                  <Clock size={9} />
                  <span className="text-[9px] font-mono">{formatDistanceToNow(alert.created_at)}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
