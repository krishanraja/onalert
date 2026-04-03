import { useNavigate } from 'react-router-dom'
import { Check, Clock, Smartphone, Shield } from 'lucide-react'
import { PLANS } from '@/lib/plans'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background-elevated safe-top">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <img
            src="/brand/nav-icon.svg"
            alt="OnAlert"
            className="h-9 w-9"
          />
          <button
            onClick={() => navigate('/auth')}
            className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
            aria-label="Sign in"
          >
            Sign in
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-16 pb-20">
        <div className="text-center">
          <img
            src="/brand/logo-wordmark-dark.png"
            alt="OnAlert"
            className="h-36 md:h-48 mx-auto mb-4"
          />
          <p className="text-lg md:text-xl text-foreground-secondary max-w-md mx-auto mb-6">
            Be first in line for a US Govt appointment
          </p>
          <p className="text-sm text-foreground-secondary max-w-2xl mx-auto mb-8">
            OnAlert monitors government appointment systems in real time and reaches you
            within minutes when a slot opens. Never miss a cancellation again.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors w-full max-w-sm"
          >
            Set up your first monitor
          </button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="text-center">
            <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Checks every 10 minutes</h3>
            <p className="text-sm text-foreground-secondary">Faster than manual checking. Premium users get priority monitoring.</p>
          </div>
          <div className="text-center">
            <Smartphone className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Email + SMS alerts</h3>
            <p className="text-sm text-foreground-secondary">Instant notifications wherever you are. Never miss an opening.</p>
          </div>
          <div className="text-center">
            <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">All trusted traveler programs</h3>
            <p className="text-sm text-foreground-secondary">Global Entry · TSA PreCheck · NEXUS · SENTRI</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">Simple pricing</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">Free</h3>
            <p className="text-3xl font-bold text-foreground mb-4">$0<span className="text-base font-normal text-foreground-secondary">/month</span></p>
            <ul className="space-y-2 mb-6">
              {PLANS.free.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <Check size={14} className="text-success shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/auth')}
              className="w-full border border-border text-foreground py-2 rounded-lg hover:bg-surface-muted transition-colors"
            >
              Get started
            </button>
          </div>

          {/* Premium */}
          <div className="bg-surface border border-primary rounded-lg p-6 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">Most popular</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Premium</h3>
            <p className="text-3xl font-bold text-foreground mb-4">$19<span className="text-base font-normal text-foreground-secondary">/month</span></p>
            <ul className="space-y-2 mb-6">
              {PLANS.premium_monthly.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <Check size={14} className="text-success shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/auth')}
              className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Start Premium trial
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background-elevated safe-bottom">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-sm text-foreground-muted">
              © 2026 OnAlert. Real-time opportunity monitoring.
            </p>
            <div className="flex justify-center gap-6 mt-4">
              <a href="/privacy" className="text-xs text-foreground-secondary hover:text-foreground" aria-label="Privacy policy">Privacy</a>
              <a href="/terms" className="text-xs text-foreground-secondary hover:text-foreground" aria-label="Terms of service">Terms</a>
              <a href="mailto:support@onalert.app" className="text-xs text-foreground-secondary hover:text-foreground" aria-label="Contact support">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}