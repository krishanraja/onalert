import { motion } from 'framer-motion'
import { type Monitor } from '@/lib/supabase'
import { SERVICE_TYPES } from '@/lib/locations'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'

interface Props {
  monitor: Monitor
  onTap?: () => void
}

export function MonitorChip({ monitor, onTap }: Props) {
  const service = SERVICE_TYPES[monitor.config.service_type]
  const locationCount = monitor.config.location_ids?.length || 0

  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={() => {
        haptic('tap')
        onTap?.()
      }}
      className={cn(
        'shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors',
        monitor.active
          ? 'bg-surface border-border'
          : 'bg-surface-muted border-border opacity-50'
      )}
    >
      <span className="text-[10px] font-mono font-semibold bg-primary/15 text-primary px-1.5 py-0.5 rounded">
        {service.abbr}
      </span>
      {monitor.active && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
        </span>
      )}
      <span className="text-xs text-foreground-secondary font-mono">
        {locationCount} loc{locationCount !== 1 ? 's' : ''}
      </span>
    </motion.button>
  )
}
