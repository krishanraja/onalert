import { cn } from '@/lib/utils'
import { SERVICE_TYPES, type ServiceType } from '@/lib/locations'

type ReadFilter = 'all' | 'unread' | 'read'

interface AlertFilterBarProps {
  serviceTypes: Set<string>
  onServiceTypesChange: (types: Set<string>) => void
  readFilter: ReadFilter
  onReadFilterChange: (filter: ReadFilter) => void
  counts: {
    total: number
    unread: number
    byService: Record<string, number>
  }
}

const SERVICE_KEYS = Object.keys(SERVICE_TYPES) as ServiceType[]
const READ_OPTIONS: { value: ReadFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
]

export function AlertFilterBar({
  serviceTypes,
  onServiceTypesChange,
  readFilter,
  onReadFilterChange,
  counts,
}: AlertFilterBarProps) {
  const toggleService = (key: string) => {
    const next = new Set(serviceTypes)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    onServiceTypesChange(next)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Service type pills */}
      {SERVICE_KEYS.map((key) => {
        const active = serviceTypes.has(key)
        const count = counts.byService[key] || 0
        return (
          <button
            key={key}
            onClick={() => toggleService(key)}
            className={cn(
              'text-[10px] font-mono font-medium px-2 py-1 rounded transition-colors',
              active
                ? 'bg-primary/15 text-primary'
                : 'bg-surface-muted text-foreground-muted hover:text-foreground-secondary'
            )}
          >
            {SERVICE_TYPES[key].abbr}
            {count > 0 && (
              <span className={cn('ml-1', active ? 'text-primary/60' : 'text-foreground-muted/60')}>
                {count}
              </span>
            )}
          </button>
        )
      })}

      {/* Separator */}
      <div className="w-px h-4 bg-border mx-1" />

      {/* Read status filter */}
      {READ_OPTIONS.map((opt) => {
        const active = readFilter === opt.value
        const count = opt.value === 'all' ? counts.total : opt.value === 'unread' ? counts.unread : counts.total - counts.unread
        return (
          <button
            key={opt.value}
            onClick={() => onReadFilterChange(opt.value)}
            className={cn(
              'text-[10px] font-mono font-medium px-2 py-1 rounded transition-colors',
              active
                ? 'bg-primary/15 text-primary'
                : 'bg-surface-muted text-foreground-muted hover:text-foreground-secondary'
            )}
          >
            {opt.label}
            <span className={cn('ml-1', active ? 'text-primary/60' : 'text-foreground-muted/60')}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
