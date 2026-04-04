import { useNavigate } from 'react-router-dom'
import { Clock, Smartphone, Shield } from 'lucide-react'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="h-dvh overflow-hidden flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background-elevated safe-top">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <img
            src="/brand/icon-light.svg"
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
      <section className="flex-1 flex flex-col justify-center max-w-4xl mx-auto px-4 pt-8 pb-8 md:pt-16 md:pb-20 overflow-hidden">
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
        <div className="grid md:grid-cols-3 gap-6 mt-8 md:mt-16">
          <div className="text-center">
            <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Checks every 5 minutes</h3>
            <p className="text-sm text-foreground-secondary">Slots fill in under 10 minutes. Pro catches them before they're gone.</p>
          </div>
          <div className="text-center">
            <Smartphone className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Instant email + SMS</h3>
            <p className="text-sm text-foreground-secondary">Alerts delivered the moment a slot opens. Not 15 minutes later.</p>
          </div>
          <div className="text-center">
            <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">All trusted traveler programs</h3>
            <p className="text-sm text-foreground-secondary">Global Entry · TSA PreCheck · NEXUS · SENTRI</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background-elevated">
        <div className="max-w-4xl mx-auto px-4 py-4">
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
