import { motion } from 'framer-motion'
import { ShieldCheck, Activity } from 'lucide-react'
import { type Monitor } from '@/lib/supabase'
import { formatDistanceToNow } from '@/lib/time'

interface Props {
  monitors: Monitor[]
}

export function AllClearCard({ monitors }: Props) {
  const activeCount = monitors.filter((m) => m.active).length
  const totalLocations = monitors.reduce(
    (sum, m) => sum + (m.config.location_ids?.length || 0), 0
  )
  const lastChecked = monitors
    .filter((m) => m.last_checked_at)
    .sort((a, b) => new Date(b.last_checked_at!).getTime() - new Date(a.last_checked_at!).getTime())[0]

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center"
    >
      {/* Breathing checkmark */}
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mb-4"
      >
        <ShieldCheck size={28} className="text-success" />
      </motion.div>

      <h3 className="text-lg font-semibold text-foreground mb-1">All clear</h3>
      <p className="text-sm text-foreground-secondary mb-4">
        No new slots detected. We're watching.
      </p>

      <div className="flex items-center gap-4 text-xs text-foreground-muted">
        <div className="flex items-center gap-1.5">
          <Activity size={12} className="text-success" />
          <span className="font-mono">
            {activeCount} monitor{activeCount !== 1 ? 's' : ''} · {totalLocations} location{totalLocations !== 1 ? 's' : ''}
          </span>
        </div>
        {lastChecked?.last_checked_at && (
          <span className="font-mono">
            Scanned {formatDistanceToNow(lastChecked.last_checked_at)}
          </span>
        )}
      </div>
    </motion.div>
  )
}
