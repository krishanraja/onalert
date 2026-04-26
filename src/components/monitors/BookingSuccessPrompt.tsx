import { useState } from 'react'
import { X, Copy, Check, Share2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { trackEvent } from '@/lib/analytics'

interface Props {
  visible: boolean
  onDismiss: () => void
}

export function BookingSuccessPrompt({ visible, onDismiss }: Props) {
  const [copied, setCopied] = useState(false)
  const shareUrl =
    (import.meta.env.VITE_APP_URL as string | undefined) || 'https://onalert.app'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      trackEvent('referral_shared', { method: 'copy' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm"
        >
          <div className="bg-surface-elevated border border-border rounded-xl p-4 shadow-lg">
            <button
              onClick={onDismiss}
              className="absolute top-2 right-2 p-1 text-foreground-muted hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Share2 className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Share OnAlert</h4>
            </div>

            <p className="text-xs text-foreground-secondary mb-3">
              Know someone waiting for an appointment? Share OnAlert with them.
            </p>

            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 bg-surface-muted hover:bg-surface border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-success" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy link to share
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
