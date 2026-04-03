import { motion } from 'framer-motion'
import { type ReactNode } from 'react'

interface Props {
  children: ReactNode
  direction?: 'left' | 'right' | 'up' | 'fade'
}

const variants = {
  left: {
    initial: { x: '25%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-25%', opacity: 0 },
  },
  right: {
    initial: { x: '-25%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '25%', opacity: 0 },
  },
  up: {
    initial: { y: '15%', opacity: 0, scale: 0.95 },
    animate: { y: 0, opacity: 1, scale: 1 },
    exit: { y: '15%', opacity: 0, scale: 0.95 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
}

export function PageTransition({ children, direction = 'fade' }: Props) {
  const v = variants[direction]
  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}
