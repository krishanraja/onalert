import { motion } from 'framer-motion'
import { ExternalLink, Flame, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { type Alert } from '@/lib/supabase'
import { SERVICE_TYPES } from '@/lib/locations'
import { formatSlotDate, formatSlotTime, minutesSince } from '@/lib/time'
import { CBP_BOOK_URL } from '@/lib/cbpApi'
import { haptic } from '@/lib/haptics'

interface Props {
  alert: Alert
}

export function HeroAlertCard({ alert }: Props) {
  const navigate = useNavigate()
  const serviceType = alert.payload.service_type as keyof typeof SERVICE_TYPES
  const service = SERVICE_TYPES[serviceType] ?? { abbr: serviceType, label: serviceType }
  const age = minutesSince(alert.created_at)
  const isHot = age <= 5
  const isWarm = age <= 15

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => {
        haptic('tap')
        navigate(`/app/alerts/${alert.id}`)
      }}
      className={`
        relative bg-surface border rounded-2xl p-5 cursor-pointer overflow-hidden
        ${isHot ? 'border-primary/40 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.35)]' :
          isWarm ? 'border-warning/30' : 'border-border'}
      `}
    >
      {/* Hot glow animation overlay */}
      {isHot && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          animate={{
            boxShadow: [
              '0 0 20px -5px hsl(0 94% 32% / 0.0)',
              '0 0 20px -5px hsl(0 94% 32% / 0.3)',
              '0 0 20px -5px hsl(0 94% 32% / 0.0)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Header: service + urgency */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold bg-primary/15 text-primary px-2.5 py-1 rounded-md">
            {service.abbr}
          </span>
          {isHot && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-1 text-primary"
            >
              <Flame size={14} />
              <span className="text-xs font-semibold">HOT</span>
            </motion.div>
          )}
        </div>
        <span className="text-xs font-mono text-foreground-muted">
          {age < 1 ? 'just now' : `${age}m ago`}
        </span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 mb-2">
        <MapPin size={13} className="text-foreground-muted shrink-0" />
        <p className="text-sm text-foreground-secondary truncate">
          {alert.payload.location_name}
        </p>
      </div>

      {/* Slot time - the hero content */}
      <div className="mb-4">
        <p className="text-2xl font-mono font-bold text-foreground">
          {formatSlotTime(alert.payload.slot_timestamp)}
        </p>
        <p className="text-sm font-medium text-foreground-secondary">
          {formatSlotDate(alert.payload.slot_timestamp)}
        </p>
      </div>

      {/* Book CTA */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={(e) => {
          e.stopPropagation()
          haptic('success')
          window.open(CBP_BOOK_URL, '_blank')
        }}
        className="w-full bg-primary text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:brightness-90 transition-colors"
      >
        <ExternalLink size={16} />
        Book this slot
      </motion.button>
    </motion.div>
  )
}
