import { cn } from '@/lib/utils'
import { SERVICE_TYPES, type ServiceType } from '@/lib/locations'
import { Star } from 'lucide-react'

interface AlertFilterBarProps {
  serviceTypes: Set<string>
  onServiceTypesChange: (types: Set<string>) => void
  starredFilter: boolean
  onStarredFilterChange: (starred: boolean) => void
  locationFilter: string | null
  onLocationFilterChange: (location: string | null) => void
  locations: string[]
  counts: {
    total: number
    starred: number
    byService: Record<string, number>
  }
}

const SERVICE_KEYS = Object.keys(SERVICE_TYPES) as ServiceType[]

export function AlertFilterBar({
  serviceTypes,
  onServiceTypesChange,
  starredFilter,
  onStarredFilterChange,
  locationFilter,
  onLocationFilterChange,
  locations,
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
    <div className="space-y-2">
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

        {/* Starred filter */}
        <button
          onClick={() => onStarredFilterChange(!starredFilter)}
          className={cn(
            'text-[10px] font-mono font-medium px-2 py-1 rounded transition-colors flex items-center gap-1',
            starredFilter
              ? 'bg-warning/15 text-warning'
              : 'bg-surface-muted text-foreground-muted hover:text-foreground-secondary'
          )}
        >
          <Star size={9} className={starredFilter ? 'fill-warning' : ''} />
          Starred
          {counts.starred > 0 && (
            <span className={cn('ml-0.5', starredFilter ? 'text-warning/60' : 'text-foreground-muted/60')}>
              {counts.starred}
            </span>
          )}
        </button>
      </div>

      {/* Location filter row — only show if there are multiple locations */}
      {locations.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => onLocationFilterChange(null)}
            className={cn(
              'text-[10px] font-mono font-medium px-2 py-1 rounded transition-colors whitespace-nowrap shrink-0',
              locationFilter === null
                ? 'bg-primary/15 text-primary'
                : 'bg-surface-muted text-foreground-muted hover:text-foreground-secondary'
            )}
          >
            All locations
          </button>
          {locations.map((loc) => (
            <button
              key={loc}
              onClick={() => onLocationFilterChange(locationFilter === loc ? null : loc)}
              className={cn(
                'text-[10px] font-mono font-medium px-2 py-1 rounded transition-colors whitespace-nowrap shrink-0',
                locationFilter === loc
                  ? 'bg-primary/15 text-primary'
                  : 'bg-surface-muted text-foreground-muted hover:text-foreground-secondary'
              )}
            >
              {loc}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
