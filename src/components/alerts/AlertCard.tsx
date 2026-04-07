import { MapPin, Clock, Flame, Layers, Star, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { type Alert } from '@/lib/supabase'
import { SERVICE_TYPES } from '@/lib/locations'
import { formatDistanceToNow, formatSlotDateShort, minutesSince } from '@/lib/time'
import { useNavigate } from 'react-router-dom'
import { haptic } from '@/lib/haptics'

interface Props {
  alert: Alert
  isSelected?: boolean
  isHistory?: boolean
  onToggleStar?: (id: string) => void
}

function getUrgencyLevel(alert: Alert): 'hot' | 'warm' | 'normal' {
  const age = minutesSince(alert.created_at)
  if (age <= 5) return 'hot'
  if (age <= 15) return 'warm'
  return 'normal'
}

export function AlertCard({ alert, isSelected, isHistory, onToggleStar }: Props) {
  const navigate = useNavigate()
  const isUnread = !alert.read_at
  const isStarred = !!alert.starred_at
  const serviceType = alert.payload.service_type as keyof typeof SERVICE_TYPES
  const service = SERVICE_TYPES[serviceType] ?? { abbr: serviceType, label: serviceType }
  const urgency = getUrgencyLevel(alert)
  const isDigest = alert.payload.slots && alert.payload.slots.length > 1
  const ageMinutes = minutesSince(alert.created_at)
  const isLikelyGone = ageMinutes > 10

  // Unified: always show the earliest slot as the primary display
  const primarySlot = isDigest
    ? [...alert.payload.slots!].sort(
        (a, b) => new Date(a.slot_timestamp).getTime() - new Date(b.slot_timestamp).getTime()
      )[0]
    : { location_name: alert.payload.location_name, slot_timestamp: alert.payload.slot_timestamp }
  const extraCount = isDigest ? alert.payload.slots!.length - 1 : 0

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className={cn(
        'w-full text-left bg-surface border rounded-lg p-4 transition-all',
        isHistory && 'opacity-50',
        isStarred && !isHistory && 'border-warning/30 bg-warning/5',
        !isStarred && isUnread && !isHistory && 'border-primary/20 bg-alert-muted/30',
        !isStarred && !isUnread && !isHistory && 'border-border',
        isSelected && 'border-primary bg-primary/5 ring-1 ring-primary/30',
        urgency === 'hot' && isUnread && !isHistory && 'shadow-[0_0_12px_-3px_hsl(var(--primary)/0.3)]'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Unread dot + urgency */}
        <button
          onClick={() => {
            haptic('tap')
            navigate(`/app/alerts/${alert.id}`)
          }}
          className="flex-1 min-w-0 flex items-start gap-3 text-left"
        >
          <div className="mt-1.5 shrink-0">
            {urgency === 'hot' && isUnread && !isHistory ? (
              <Flame size={12} className="text-primary animate-pulse" />
            ) : isUnread && !isHistory ? (
              <div className={cn(
                'w-2 h-2 rounded-full',
                urgency === 'warm' ? 'bg-warning' : 'bg-primary'
              )} />
            ) : (
              <div className="w-2 h-2 rounded-full bg-border" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Row 1: Service badge + location + time ago */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-medium bg-primary/10 text-primary px-2 py-0.5 rounded shrink-0">
                {service.abbr}
              </span>
              <span className="text-xs text-foreground-muted truncate flex items-center gap-1">
                <MapPin size={10} className="shrink-0" />
                {primarySlot.location_name}
              </span>
              <div className="shrink-0 flex items-center gap-1 text-foreground-muted ml-auto">
                <Clock size={10} />
                <span className="text-[10px] font-mono">{formatDistanceToNow(alert.created_at)}</span>
              </div>
            </div>

            {/* Row 2: Date+time + likely gone badge + extra slots */}
            <div className="flex items-center justify-between">
              <p className={cn(
                'font-mono text-sm font-medium truncate',
                isHistory ? 'text-foreground-muted' : 'text-foreground'
              )}>
                {formatSlotDateShort(primarySlot.slot_timestamp)}
              </p>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {isLikelyGone && !isHistory && (
                  <span className="text-[9px] font-mono text-warning flex items-center gap-0.5">
                    <AlertTriangle size={9} />
                    Likely gone
                  </span>
                )}
                {extraCount > 0 && (
                  <span className="text-[10px] font-mono text-foreground-muted flex items-center gap-1">
                    <Layers size={10} />
                    +{extraCount} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </button>

        {/* Star button */}
        {onToggleStar && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              haptic('selection')
              onToggleStar(alert.id)
            }}
            aria-label={isStarred ? 'Unstar alert' : 'Star alert'}
            className="mt-1 p-1.5 rounded-md hover:bg-surface-muted transition-colors shrink-0"
          >
            <Star
              size={14}
              className={cn(
                'transition-colors',
                isStarred ? 'fill-warning text-warning' : 'text-foreground-muted'
              )}
            />
          </button>
        )}
      </div>
    </motion.div>
  )
}
