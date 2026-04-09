import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft } from 'lucide-react'

export function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Privacy Policy | OnAlert</title>
        <meta name="description" content="OnAlert privacy policy. Learn how we collect, use, and protect your data for our appointment monitoring service." />
        <link rel="canonical" href="https://onalert.app/privacy" />
      </Helmet>
      <header className="border-b border-border bg-background-elevated safe-top">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            aria-label="Go back"
            className="p-2 -ml-2 text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-foreground">Privacy Policy</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <p className="text-foreground-secondary text-sm">Last updated: April 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">What we collect</h2>
          <p className="text-foreground-secondary leading-relaxed">
            OnAlert collects your email address for authentication and alert delivery. If you enable SMS alerts, we also store your phone number. We store your monitor configurations (service types and enrollment center preferences) to provide the monitoring service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">How we use your data</h2>
          <p className="text-foreground-secondary leading-relaxed">
            Your data is used solely to operate the OnAlert service: checking for appointment availability and sending you notifications. We do not sell, share, or use your data for advertising purposes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Data storage</h2>
          <p className="text-foreground-secondary leading-relaxed">
            Your data is stored securely using Supabase (hosted on AWS). Payment information is processed and stored by Stripe - we never see or store your full card details.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p className="text-foreground-secondary leading-relaxed">
            For privacy-related questions, contact us at{' '}
            <a href="mailto:support@onalert.app" className="text-primary hover:underline">support@onalert.app</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
