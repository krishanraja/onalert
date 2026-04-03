import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { ExternalLink, Flame, MapPin, Calendar } from 'lucide-react'
import { type Alert } from '@/lib/supabase'
import { SERVICE_TYPES } from '@/lib/locations'
import { formatSlotDate, formatSlotTime, minutesSince } from '@/lib/time'
import { CBP_BOOK_URL } from '@/lib/cbpApi'
import { haptic } from '@/lib/haptics'

interface Props {
  alert: Alert
  onSwipeLeft: () => void
  onSwipeRight: () => void
}

export function SwipeableAlertCard({ alert, onSwipeLeft, onSwipeRight }: Props) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-8, 8])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5])

  const serviceType = alert.payload.service_type as keyof typeof SERVICE_TYPES
  const service = SERVICE_TYPES[serviceType] ?? { abbr: serviceType, label: serviceType }
  const age = minutesSince(alert.created_at)
  const isHot = age <= 5
  const isWarm = age <= 15

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100
    if (info.offset.x < -threshold) {
      haptic('swipeAction')
      onSwipeLeft()
    } else if (info.offset.x > threshold) {
      haptic('swipeAction')
      onSwipeRight()
    }
  }

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`
        bg-surface border rounded-2xl p-6 cursor-grab active:cursor-grabbing touch-pan-y
        ${isHot ? 'border-primary/40 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.35)]' :
          isWarm ? 'border-warning/30' : 'border-border'}
      `}
    >
      {/* Urgency indicator */}
      <div className="flex items-center justify-between mb-4">
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
          {isWarm && !isHot && (
            <span className="text-xs font-medium text-warning">WARM</span>
          )}
        </div>
        <span className="text-xs font-mono text-foreground-muted">
          {age < 1 ? 'just now' : `${age}m ago`}
        </span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={14} className="text-foreground-muted shrink-0" />
        <p className="text-foreground font-medium truncate">
          {alert.payload.location_name}
        </p>
      </div>

      {/* Slot details */}
      <div className="bg-background/50 border border-border rounded-xl p-4 mb-5">
        <div className="flex items-center gap-2 text-foreground-muted mb-2">
          <Calendar size={14} />
          <span className="text-xs font-medium">Available appointment</span>
        </div>
        <p className="text-3xl font-mono font-bold text-primary mb-1">
          {formatSlotTime(alert.payload.slot_timestamp)}
        </p>
        <p className="text-sm font-medium text-foreground">
          {formatSlotDate(alert.payload.slot_timestamp)}
        </p>
      </div>

      {/* Book CTA */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          haptic('success')
          window.open(CBP_BOOK_URL, '_blank')
        }}
        className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 active:brightness-90 transition-colors"
      >
        <ExternalLink size={16} />
        Book this slot
      </motion.button>

      {/* Swipe hint */}
      <p className="text-center text-[10px] text-foreground-muted mt-3 font-mono">
        ← swipe to browse →
      </p>
    </motion.div>
  )
}
