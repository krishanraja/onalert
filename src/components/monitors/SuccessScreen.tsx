import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { haptic } from '@/lib/haptics'

export function SuccessScreen() {
  const navigate = useNavigate()

  useEffect(() => {
    haptic('monitorCreated')
    const timer = setTimeout(() => navigate('/app', { replace: true }), 2000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6"
    >
      {/* Glow behind checkmark */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="relative mb-6"
      >
        <motion.div
          animate={{
            boxShadow: [
              '0 0 0 0 hsl(142 71% 45% / 0)',
              '0 0 40px 10px hsl(142 71% 45% / 0.15)',
              '0 0 0 0 hsl(142 71% 45% / 0)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 rounded-full bg-success/10 border-2 border-success/30 flex items-center justify-center"
        >
          {/* Animated checkmark SVG */}
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <motion.path
              d="M12 24 L21 33 L36 15"
              stroke="hsl(142 71% 45%)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
            />
          </svg>
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-xl font-bold text-foreground mb-2"
      >
        Monitor activated
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="text-sm text-foreground-secondary text-center"
      >
        We'll alert you the moment a slot opens.
      </motion.p>
    </motion.div>
  )
}
