import { useState } from 'react'
import { Pause, Play, Trash2, MapPin, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Monitor } from '@/lib/supabase'
import { TOP_LOCATIONS, SERVICE_TYPES } from '@/lib/locations'
import { formatDistanceToNow } from '@/lib/time'

interface Props {
  monitor: Monitor
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}

export function MonitorCard({ monitor, onToggle, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const locations = monitor.config.location_ids
    .map((id) => TOP_LOCATIONS.find((l) => l.id === id))
    .filter(Boolean)
  const service = SERVICE_TYPES[monitor.config.service_type]

  return (
    <div className={cn(
      'bg-surface border border-border rounded-lg p-4 transition-opacity',
      !monitor.active && 'opacity-50'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
              {service.abbr}
            </span>
            <span className={cn(
              'text-[10px] font-medium',
              monitor.active ? 'text-success' : 'text-foreground-muted'
            )}>
              {monitor.active ? '● Active' : '○ Paused'}
            </span>
          </div>
          <div className="space-y-0.5">
            {locations.slice(0, 3).map((loc) => (
              <div key={loc!.id} className="flex items-center gap-1.5 text-sm text-foreground">
                <MapPin size={11} className="text-foreground-muted shrink-0" />
                <span className="truncate">{loc!.city}, {loc!.state}</span>
              </div>
            ))}
            {locations.length > 3 && (
              <p className="text-xs text-foreground-muted pl-[19px]">
                +{locations.length - 3} more locations
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={async () => {
              setToggling(true)
              try { await onToggle(monitor.id, !monitor.active) } catch {}
              setToggling(false)
            }}
            disabled={toggling}
            className="p-2 rounded-md text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors disabled:opacity-50"
          >
            {monitor.active ? <Pause size={15} /> : <Play size={15} />}
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={async () => {
                  setDeleting(true)
                  try { await onDelete(monitor.id) } catch { setDeleting(false); setConfirmDelete(false) }
                }}
                disabled={deleting}
                className="px-2 py-1 text-[10px] font-medium text-white bg-destructive rounded disabled:opacity-50"
              >
                {deleting ? '...' : 'Delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-[10px] font-medium text-foreground-muted bg-surface-muted rounded"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 rounded-md text-foreground-muted hover:text-destructive hover:bg-surface-muted transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <div className="flex items-center gap-1.5 text-foreground-muted">
          <Clock size={11} />
          <span className="text-[11px] font-mono">
            {monitor.last_checked_at
              ? `Checked ${formatDistanceToNow(monitor.last_checked_at)}`
              : 'Not yet checked'}
          </span>
        </div>
        {monitor.last_alert_at && (
          <span className="text-[11px] text-primary font-mono ml-auto">
            Last alert {formatDistanceToNow(monitor.last_alert_at)}
          </span>
        )}
      </div>
    </div>
  )
}
