import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Smartphone, Shield, ShieldCheck, Users } from 'lucide-react'
import { getBookingCount } from '@/lib/tracking'
import { supabase } from '@/lib/supabase'

interface SuccessStory {
  story: string
  location_name: string | null
  wait_days: number | null
}

export function LandingPage() {
  const navigate = useNavigate()
  const [bookingCount, setBookingCount] = useState(0)
  const [stories, setStories] = useState<SuccessStory[]>([])

  useEffect(() => {
    getBookingCount().then(setBookingCount)
    if (supabase) {
      supabase
        .from('success_stories')
        .select('story, location_name, wait_days')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data }) => { if (data) setStories(data) })
    }
  }, [])

  return (
    <div className="h-dvh overflow-hidden flex flex-col bg-background relative">
      {/* Ambient crimson glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 25%, hsl(0 94% 32% / 0.07) 0%, transparent 60%)' }}
      />

      {/* Floating sign-in */}
      <button
        onClick={() => navigate('/auth')}
        className="absolute top-2 right-2 z-10 text-sm text-foreground-secondary hover:text-foreground transition-colors px-3 py-2"
        aria-label="Sign in"
        style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
      >
        Sign in
      </button>

      {/* Hero */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 relative z-10">
        <img
          src="/brand/logo-wordmark-dark.png"
          alt="OnAlert"
          className="h-[141px] md:h-[317px] mx-auto mb-3"
        />
        <p className="text-lg md:text-xl font-medium tracking-tight text-foreground text-center max-w-md mx-auto mb-2">
          Be first in line for a US Govt appointment
        </p>
        <p className="text-xs md:text-sm text-foreground-secondary text-center max-w-sm mx-auto mb-6">
          OnAlert monitors government appointment systems and alerts you within minutes when a slot opens.
        </p>
        <button
          onClick={() => navigate('/auth')}
          className="bg-primary text-white px-8 py-3 rounded-lg text-base font-semibold hover:bg-primary/90 transition-colors w-full max-w-sm ring-1 ring-primary/20"
          style={{ boxShadow: '0 0 24px -4px hsl(0 94% 32% / 0.5)' }}
        >
          Set up your first monitor
        </button>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className="flex items-center gap-1 text-[10px] text-foreground-muted">
            <ShieldCheck className="w-3 h-3 text-success" />
            30-day money-back guarantee
          </span>
          {bookingCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-foreground-muted">
              <Users className="w-3 h-3 text-primary" />
              {bookingCount.toLocaleString()} appointments booked
            </span>
          )}
        </div>

        {/* Government agency logos */}
        <div className="mt-6 mb-2 flex flex-col items-center">
          <p className="text-[10px] md:text-xs text-foreground-muted mb-3 tracking-wide uppercase">Programs monitored from</p>
          <div className="flex items-center justify-center gap-8 md:gap-12">
            {[
              {
                name: 'DHS',
                full: 'Dept. of Homeland Security',
                src: '/dhs-logo.png',
              },
              {
                name: 'CBP',
                full: 'Customs & Border Protection',
                src: '/cbp-logo.png',
              },
              {
                name: 'TSA',
                full: 'Transportation Security Admin.',
                src: '/tsa-logo.png',
              },
            ].map((agency) => (
              <div key={agency.name} className="flex flex-col items-center gap-1.5">
                <img
                  src={agency.src}
                  alt={agency.full}
                  className="h-10 md:h-12 w-auto object-contain rounded-full"
                  loading="lazy"
                />
                <span className="text-[9px] md:text-[10px] text-foreground-muted text-center">{agency.full}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Compact features row */}
        <div className="grid grid-cols-3 gap-2 mt-8 w-full max-w-sm md:max-w-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center mb-1.5">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[11px] md:text-xs font-medium text-foreground">Every 5 min</span>
            <p className="hidden md:block text-xs text-foreground-secondary mt-1">Slots fill in under 10 minutes. Pro catches them before they're gone.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center mb-1.5">
              <Smartphone className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[11px] md:text-xs font-medium text-foreground">Email + SMS</span>
            <p className="hidden md:block text-xs text-foreground-secondary mt-1">Alerts delivered the moment a slot opens. Not 15 minutes later.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center mb-1.5">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[11px] md:text-xs font-medium text-foreground">All programs</span>
            <p className="hidden md:block text-xs text-foreground-secondary mt-1">Global Entry · TSA PreCheck · NEXUS · SENTRI</p>
          </div>
        </div>
      </section>

      {/* Success stories */}
      {stories.length > 0 && (
        <section className="relative z-10 px-4 pb-3">
          <div className="max-w-sm mx-auto">
            <p className="text-[10px] text-foreground-muted text-center mb-2 uppercase tracking-wide">What users say</p>
            <div className="bg-surface/50 border border-border rounded-lg px-3 py-2">
              <p className="text-xs text-foreground-secondary italic">"{stories[0].story}"</p>
              {stories[0].wait_days && (
                <p className="text-[10px] text-foreground-muted mt-1">
                  Waited {stories[0].wait_days} days{stories[0].location_name ? ` at ${stories[0].location_name}` : ''}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Minimal footer */}
      <footer className="relative z-10 py-3 px-4 text-center">
        <p className="text-[11px] text-foreground-muted flex items-center justify-center gap-1 flex-wrap">
          <span>© 2026 OnAlert</span>
          <span>·</span>
          <a href="/privacy" className="py-2 px-1 hover:text-foreground transition-colors" aria-label="Privacy policy">Privacy</a>
          <span>·</span>
          <a href="/terms" className="py-2 px-1 hover:text-foreground transition-colors" aria-label="Terms of service">Terms</a>
          <span>·</span>
          <a href="mailto:support@onalert.app" className="py-2 px-1 hover:text-foreground transition-colors" aria-label="Contact support">Support</a>
        </p>
      </footer>
    </div>
  )
}
