import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ShieldCheck, Users } from 'lucide-react'
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

  const benefits = [
    'Scans every 5 minutes',
    'Instant email & SMS alerts',
    'Global Entry · TSA PreCheck · NEXUS · SENTRI',
    'Slots found in minutes, not months',
    '30-day money-back guarantee',
    'No app install required',
  ]

  return (
    <div className="h-dvh overflow-hidden flex flex-col bg-background relative">
      <Helmet>
        <title>OnAlert - Global Entry, TSA PreCheck, NEXUS & SENTRI Appointment Alerts</title>
        <meta name="description" content="Get instant alerts when Global Entry, TSA PreCheck, NEXUS & SENTRI appointment slots open from cancellations. Scans every 5 minutes. Book in days, not months." />
        <link rel="canonical" href="https://onalert.app/" />
      </Helmet>
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
          Never miss a Trusted Traveler appointment
        </p>
        <p className="text-xs md:text-sm text-foreground-secondary text-center max-w-sm mx-auto mb-6">
          OnAlert monitors Global Entry, TSA PreCheck, NEXUS & SENTRI appointment slots and alerts you within minutes when one opens from a cancellation.
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

        {/* Benefits ticker */}
        <div
          className="mt-6 w-full overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          }}
        >
          <div className="flex animate-ticker-scroll motion-reduce:animate-none whitespace-nowrap" aria-label="Benefits">
            {[0, 1].map((setIndex) => (
              <div key={setIndex} className="flex shrink-0" aria-hidden={setIndex > 0 || undefined}>
                {benefits.map((benefit, i) => (
                  <span key={i} className="inline-flex items-center px-4 text-xs text-foreground-secondary">
                    <span className="text-primary mr-2">✦</span>
                    {benefit}
                  </span>
                ))}
              </div>
            ))}
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
