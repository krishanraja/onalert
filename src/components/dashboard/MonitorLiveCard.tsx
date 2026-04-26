import { motion } from 'framer-motion'
import { ExternalLink, MapPin, Clock, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Monitor, type Alert } from '@/lib/supabase'
import { TOP_LOCATIONS, SERVICE_TYPES } from '@/lib/locations'
import { formatSlotDateShort, formatDistanceToNow } from '@/lib/time'
import { CBP_BOOK_URL, buildBookUrl } from '@/lib/cbpApi'
import { haptic } from '@/lib/haptics'
import { trackBookingClick } from '@/lib/tracking'

interface Props {
  monitor: Monitor
  liveAlerts: Alert[]
}

export function MonitorLiveCard({ monitor, liveAlerts }: Props) {
  const service = SERVICE_TYPES[monitor.config.service_type as keyof typeof SERVICE_TYPES] ?? { abbr: monitor.config.service_type, label: monitor.config.service_type }
  const locations = monitor.config.location_ids
    .map((id) => TOP_LOCATIONS.find((l) => l.id === id))
    .filter(Boolean)

  // Sort live alerts by soonest slot first
  const sortedAlerts = [...liveAlerts].sort(
    (a, b) => new Date(a.payload.slot_timestamp).getTime() - new Date(b.payload.slot_timestamp).getTime()
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-surface border rounded-xl overflow-hidden transition-all',
        liveAlerts.length > 0 ? 'border-primary/30' : 'border-border',
        !monitor.active && 'opacity-50'
      )}
    >
      {/* Monitor header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-mono font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded">
            {service.abbr}
          </span>
          <span className={cn(
            'text-2xs font-medium flex items-center gap-1',
            monitor.active ? 'text-success' : 'text-foreground-muted'
          )}>
            {monitor.active ? (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
                </span>
                Active
              </>
            ) : (
              <>&#9675; Paused</>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1 text-foreground-muted">
          <Clock size={10} />
          <span className="text-2xs font-mono">
            {monitor.last_checked_at ? formatDistanceToNow(monitor.last_checked_at) : 'pending'}
          </span>
        </div>
      </div>

      {/* Locations summary */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-1 text-xs text-foreground-secondary">
          <MapPin size={10} className="shrink-0 text-foreground-muted" />
          <span className="truncate">
            {locations.slice(0, 2).map((l) => `${l!.city}, ${l!.state}`).join(' · ')}
            {locations.length > 2 && ` +${locations.length - 2} more`}
          </span>
        </div>
      </div>

      {/* Live slots */}
      {sortedAlerts.length > 0 ? (
        <div className="border-t border-border divide-y divide-border">
          {sortedAlerts.slice(0, 5).map((alert) => (
            <div key={alert.id} className="px-4 py-2.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground-muted truncate flex items-center gap-1">
                  <MapPin size={9} className="shrink-0" />
                  {alert.payload.location_name}
                </p>
                <p className="text-sm font-mono font-medium text-foreground">
                  {formatSlotDateShort(alert.payload.slot_timestamp)}
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={(e) => {
                  e.stopPropagation()
                  haptic('success')
                  trackBookingClick(alert.id, alert.payload.location_id)
                  window.open(alert.payload.book_url || buildBookUrl(alert.payload.location_id, alert.payload.service_type), '_blank', 'noopener,noreferrer')
                }}
                className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 hover:bg-primary/90 transition-colors"
              >
                <ExternalLink size={11} />
                Book
              </motion.button>
            </div>
          ))}
          {sortedAlerts.length > 5 && (
            <div className="px-4 py-2 text-center">
              <span className="text-2xs font-mono text-foreground-muted">
                +{sortedAlerts.length - 5} more slots
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="border-t border-border px-4 py-4 flex items-center justify-center gap-2">
          <ShieldCheck size={14} className="text-success" />
          <span className="text-xs text-foreground-secondary">
            No new slots detected
          </span>
        </div>
      )}
    </motion.div>
  )
}
