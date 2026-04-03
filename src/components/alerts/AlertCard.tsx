import { MapPin, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Alert } from '@/lib/supabase'
import { SERVICE_TYPES } from '@/lib/locations'
import { formatDistanceToNow, formatSlotDate, formatSlotTime } from '@/lib/time'
import { useNavigate } from 'react-router-dom'

interface Props {
  alert: Alert
}

export function AlertCard({ alert }: Props) {
  const navigate = useNavigate()
  const isUnread = !alert.read_at
  const serviceType = alert.payload.service_type as keyof typeof SERVICE_TYPES
  const service = SERVICE_TYPES[serviceType] ?? { abbr: serviceType, label: serviceType }

  return (
    <button
      onClick={() => navigate(`/app/alerts/${alert.id}`)}
      className={cn(
        'w-full text-left bg-surface border border-border rounded-lg p-4 transition-colors hover:border-primary/30 hover:bg-surface-muted',
        isUnread && 'border-primary/20 bg-alert-muted/30'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Unread dot */}
        <div className="mt-1.5 shrink-0">
          {isUnread
            ? <div className="w-2 h-2 rounded-full bg-primary" />
            : <div className="w-2 h-2 rounded-full bg-border" />
          }
        </div>

        <div className="flex-1 min-w-0">
          {/* Service + location */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
              {service.abbr}
            </span>
            <span className="text-xs text-foreground-muted truncate flex items-center gap-1">
              <MapPin size={10} />
              {alert.payload.location_name}
            </span>
          </div>

          {/* Slot time */}
          <p className="font-mono text-sm font-medium text-foreground">
            {formatSlotDate(alert.payload.slot_timestamp)}
          </p>
          <p className="font-mono text-xs text-foreground-secondary">
            {formatSlotTime(alert.payload.slot_timestamp)}
          </p>
        </div>

        {/* Time ago */}
        <div className="shrink-0 flex items-center gap-1 text-foreground-muted">
          <Clock size={10} />
          <span className="text-[10px] font-mono">{formatDistanceToNow(alert.created_at)}</span>
        </div>
      </div>
    </button>
  )
}
