import { useState } from 'react'
import { Pause, Play, Trash2, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Monitor } from '@/lib/supabase'
import { TOP_LOCATIONS, SERVICE_TYPES } from '@/lib/locations'
import { haptic } from '@/lib/haptics'
import { showToast } from '@/hooks/useToast'

interface Props {
  monitor: Monitor
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}

export function MonitorRow({ monitor, onToggle, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const locations = monitor.config.location_ids
    .map((id) => TOP_LOCATIONS.find((l) => l.id === id))
    .filter(Boolean)
  const service = SERVICE_TYPES[monitor.config.service_type]
  const firstLoc = locations[0]

  return (
    <div className={cn(
      'bg-surface border border-border rounded-lg px-3 py-2.5 flex items-center gap-2.5 transition-all',
      !monitor.active && 'opacity-50'
    )}>
      {/* Service badge */}
      <span className="text-[10px] font-mono font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
        {service.abbr}
      </span>

      {/* Status + Location */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className={cn(
          'relative flex h-2 w-2 shrink-0',
          monitor.active ? 'text-success' : 'text-foreground-muted'
        )}>
          {monitor.active ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground-muted" />
          )}
        </span>
        <div className="flex items-center gap-1 min-w-0">
          <MapPin size={10} className="text-foreground-muted shrink-0" />
          <span className="text-xs text-foreground truncate">
            {firstLoc ? `${firstLoc.city}, ${firstLoc.state}` : 'Unknown'}
          </span>
          {locations.length > 1 && (
            <span className="text-[10px] text-foreground-muted shrink-0">+{locations.length - 1}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={async () => {
            setToggling(true)
            haptic('selection')
            try {
              await onToggle(monitor.id, !monitor.active)
              showToast(monitor.active ? 'Monitor paused' : 'Monitor resumed', 'info')
            } catch {
              showToast('Failed to update monitor', 'error')
            }
            setToggling(false)
          }}
          disabled={toggling}
          aria-label={monitor.active ? 'Pause monitor' : 'Resume monitor'}
          className="p-1.5 rounded text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors disabled:opacity-50"
        >
          {monitor.active ? <Pause size={13} /> : <Play size={13} />}
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-0.5">
            <button
              onClick={async () => {
                setDeleting(true)
                haptic('warning')
                try {
                  await onDelete(monitor.id)
                  showToast('Monitor deleted', 'info')
                } catch {
                  showToast('Failed to delete monitor', 'error')
                  setDeleting(false)
                  setConfirmDelete(false)
                }
              }}
              disabled={deleting}
              className="px-1.5 py-0.5 text-[10px] font-medium text-white bg-destructive rounded disabled:opacity-50"
            >
              {deleting ? '...' : 'Delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-1.5 py-0.5 text-[10px] font-medium text-foreground-muted bg-surface-muted rounded"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete monitor"
            className="p-1.5 rounded text-foreground-muted hover:text-destructive hover:bg-surface-muted transition-colors"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}
