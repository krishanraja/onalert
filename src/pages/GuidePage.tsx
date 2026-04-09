import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, Clock, Zap, Shield, ExternalLink } from 'lucide-react'

export function GuidePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-background">
      <Helmet>
        <title>How to Get a Global Entry Appointment Faster | OnAlert</title>
        <meta name="description" content="4 proven strategies to get Global Entry, TSA PreCheck, NEXUS & SENTRI appointments faster. Learn how automated monitoring catches cancellation slots in minutes." />
        <link rel="canonical" href="https://onalert.app/guide" />
      </Helmet>
      <header className="sticky top-0 z-10 bg-background-elevated border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1 text-foreground-muted hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Getting Your Appointment Faster</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">
            How to Get a Global Entry Appointment Faster: The Complete Guide
          </h2>
          <p className="text-sm text-foreground-secondary leading-relaxed">
            If you've been conditionally approved for Global Entry, TSA PreCheck, NEXUS, or SENTRI, you already know the
            frustration: the nearest appointment might be 3-12 months away. This guide covers every strategy to get your
            enrollment interview sooner.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Why the Wait is So Long
          </h3>
          <p className="text-sm text-foreground-secondary leading-relaxed mb-3">
            CBP processes millions of Trusted Traveler applications annually. Popular enrollment centers at major airports
            (JFK, LAX, SFO, ORD) are consistently overbooked. The official system shows only the next available appointment,
            which can be months out.
          </p>
          <p className="text-sm text-foreground-secondary leading-relaxed">
            But here's what most people don't know: <strong className="text-foreground">cancellations happen daily</strong>.
            When someone cancels or reschedules, their slot becomes available immediately. The problem is these slots fill
            within 5-15 minutes -- if you're not watching at the right moment, you'll miss them.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-warning" />
            Strategy 1: Monitor for Cancellation Slots
          </h3>
          <p className="text-sm text-foreground-secondary leading-relaxed mb-3">
            The most effective strategy is automated monitoring. Services like OnAlert check the CBP scheduler every
            5 minutes and notify you the instant a slot opens -- giving you a realistic chance to book before it fills.
          </p>
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs text-foreground-muted mb-2">Why this works:</p>
            <ul className="space-y-1">
              <li className="text-xs text-foreground-secondary">- Cancellations are unpredictable but frequent at popular locations</li>
              <li className="text-xs text-foreground-secondary">- 5-minute polling catches slots that manual checking misses</li>
              <li className="text-xs text-foreground-secondary">- Instant email/SMS alerts let you book from anywhere</li>
              <li className="text-xs text-foreground-secondary">- Many OnAlert users book appointments within days, not months</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-foreground mb-2">Strategy 2: Check Multiple Locations</h3>
          <p className="text-sm text-foreground-secondary leading-relaxed mb-3">
            Don't limit yourself to one enrollment center. Nearby locations may have much shorter wait times.
            Some users drive 1-2 hours to a less popular center and get an appointment weeks sooner.
          </p>
          <button
            onClick={() => navigate('/locations')}
            className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
          >
            Browse all enrollment centers <ExternalLink className="w-3 h-3" />
          </button>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-foreground mb-2">Strategy 3: Enrollment on Arrival (EoA)</h3>
          <p className="text-sm text-foreground-secondary leading-relaxed">
            If you're traveling internationally soon, you may be able to complete your enrollment interview when you arrive
            back in the US. This is called "Enrollment on Arrival" (EoA). Not all airports participate, and lines can be long,
            but it's a valid option if you're already flying.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-foreground mb-2">Strategy 4: Try Off-Peak Times</h3>
          <p className="text-sm text-foreground-secondary leading-relaxed">
            Early morning slots and midweek appointments are often the first to open from cancellations.
            Monday and Tuesday mornings tend to have the highest cancellation rates.
            Setting up monitoring for specific locations helps you catch these windows automatically.
          </p>
        </section>

        <section className="bg-surface border border-border rounded-xl p-5 text-center space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Ready to stop waiting?</h3>
          <p className="text-sm text-foreground-secondary">
            Set up a monitor and get notified the moment a slot opens.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="bg-primary text-white px-8 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Get started free
          </button>
          <p className="text-xs text-foreground-muted flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" />
            30-day money-back guarantee on paid plans
          </p>
        </section>
      </main>

      <footer className="py-6 px-4 text-center border-t border-border">
        <p className="text-[11px] text-foreground-muted">
          © 2026 OnAlert · <a href="/privacy" className="hover:text-foreground">Privacy</a> · <a href="/terms" className="hover:text-foreground">Terms</a>
        </p>
      </footer>
    </div>
  )
}
