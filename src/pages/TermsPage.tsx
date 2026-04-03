import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function TermsPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background-elevated safe-top">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            aria-label="Go back"
            className="p-2 -ml-2 text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-foreground">Terms of Service</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <p className="text-foreground-secondary text-sm">Last updated: April 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Service description</h2>
          <p className="text-foreground-secondary leading-relaxed">
            OnAlert is a monitoring service that checks government appointment systems (such as Global Entry, TSA PreCheck, NEXUS, and SENTRI) for available slots and notifies you when openings are found. OnAlert does not guarantee appointment availability or booking success.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Accounts</h2>
          <p className="text-foreground-secondary leading-relaxed">
            You are responsible for maintaining the security of your account. One account per person. You must provide a valid email address to use the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Payments and refunds</h2>
          <p className="text-foreground-secondary leading-relaxed">
            Pro and Family plans are one-time purchases processed through Stripe. Once purchased, your plan access is permanent -- no recurring charges. Refunds are handled on a case-by-case basis within 30 days of purchase.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Limitations</h2>
          <p className="text-foreground-secondary leading-relaxed">
            OnAlert monitors publicly available government appointment data. We are not affiliated with CBP, TSA, or any government agency. Appointment availability depends on government systems and is outside our control.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p className="text-foreground-secondary leading-relaxed">
            Questions about these terms? Contact us at{' '}
            <a href="mailto:support@onalert.app" className="text-primary hover:underline">support@onalert.app</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
