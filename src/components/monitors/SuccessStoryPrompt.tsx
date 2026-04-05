import { useState } from 'react'
import { X, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface Props {
  visible: boolean
  onDismiss: () => void
  locationName?: string
}

export function SuccessStoryPrompt({ visible, onDismiss, locationName }: Props) {
  const [waitDays, setWaitDays] = useState('')
  const [story, setStory] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!supabase || !story.trim()) return
    setLoading(true)

    await supabase.from('success_stories').insert({
      story: story.trim(),
      location_name: locationName || null,
      wait_days: waitDays ? parseInt(waitDays) : null,
    })

    setSubmitted(true)
    setLoading(false)
    setTimeout(onDismiss, 2000)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            exit={{ y: 50 }}
            className="bg-surface-elevated border border-border rounded-xl p-5 w-full max-w-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">
                {submitted ? 'Thank you!' : 'Did you book your appointment?'}
              </h4>
              <button onClick={onDismiss} className="p-1 text-foreground-muted hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitted ? (
              <p className="text-xs text-foreground-secondary">Your story helps others trust OnAlert.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-foreground-secondary">
                  Share your experience to help others. Your story may appear on our homepage.
                </p>

                <select
                  value={waitDays}
                  onChange={(e) => setWaitDays(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground"
                >
                  <option value="">How long were you waiting?</option>
                  <option value="7">About a week</option>
                  <option value="14">About 2 weeks</option>
                  <option value="30">About a month</option>
                  <option value="90">A few months</option>
                  <option value="180">6+ months</option>
                </select>

                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Tell us your experience..."
                  maxLength={280}
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground resize-none"
                />

                <button
                  onClick={handleSubmit}
                  disabled={loading || !story.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  {loading ? 'Submitting...' : 'Share my story'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
