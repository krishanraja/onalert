import { useState } from 'react'
import { X, Crown, Users, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PLANS } from '@/lib/plans'
import { createCheckoutSession } from '@/lib/stripe'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'
import { haptic } from '@/lib/haptics'

interface Props {
  open: boolean
  onClose: () => void
  currentPlan: 'free' | 'pro' | 'family' | 'multi' | 'express'
}

const PLAN_META = {
  pro: { icon: Crown, label: 'Pro', tagline: '5-min checks, instant alerts, SMS', color: 'bg-primary', textColor: 'text-white' },
  multi: { icon: Users, label: 'Multi', tagline: '5 monitors, unlimited locations, no cooldown', color: 'bg-primary', textColor: 'text-white' },
  express: { icon: Zap, label: 'Express', tagline: '1-min checks, priority alerts, pre-verified', color: 'bg-warning', textColor: 'text-black' },
} as const

function getAvailableUpgrades(plan: string): ('pro' | 'multi' | 'express')[] {
  switch (plan) {
    case 'free': return ['pro', 'multi', 'express']
    case 'pro': return ['multi', 'express']
    case 'family':
    case 'multi': return ['express']
    default: return []
  }
}

export function UpgradeOverlay({ open, onClose, currentPlan }: Props) {
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')
  const upgrades = getAvailableUpgrades(currentPlan)

  const handleUpgrade = async (plan: 'pro' | 'multi' | 'express') => {
    trackEvent(AnalyticsEvents.UPGRADE_CLICKED, { plan })
    haptic('selection')
    setLoading(plan)
    setError('')
    try {
      const url = await createCheckoutSession(plan)
      trackEvent(AnalyticsEvents.CHECKOUT_STARTED, { plan })
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upgrade failed. Please try again.')
    } finally {
      setLoading('')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            exit={{ y: 50 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-elevated border border-border rounded-xl p-5 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Upgrade your plan</h3>
              <button onClick={onClose} className="p-1 text-foreground-muted hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {upgrades.length === 0 ? (
              <p className="text-sm text-foreground-secondary text-center py-4">
                You're on the fastest plan available.
              </p>
            ) : (
              <div className="space-y-3">
                {upgrades.map((planKey) => {
                  const meta = PLAN_META[planKey]
                  const plan = PLANS[planKey]
                  const Icon = meta.icon
                  return (
                    <div
                      key={planKey}
                      className="bg-surface border border-border rounded-lg p-3 flex items-center gap-3"
                    >
                      <div className={`w-8 h-8 rounded-lg ${meta.color} flex items-center justify-center shrink-0`}>
                        <Icon size={16} className={meta.textColor} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-foreground text-sm">{meta.label}</span>
                          <span className="text-foreground font-bold text-sm">${plan.price}</span>
                          <span className="text-[10px] text-foreground-muted">one-time</span>
                        </div>
                        <p className="text-xs text-foreground-secondary truncate">{meta.tagline}</p>
                      </div>
                      <button
                        onClick={() => handleUpgrade(planKey)}
                        disabled={loading === planKey}
                        className={`${meta.color} ${meta.textColor} px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0`}
                      >
                        {loading === planKey ? '...' : 'Buy'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {error && (
              <div className="mt-3 bg-destructive/10 border border-destructive/20 rounded-lg p-2">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <p className="text-[10px] text-foreground-muted text-center mt-4">
              One-time payment. No subscription. Yours forever.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
