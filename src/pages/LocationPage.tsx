import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { MapPin, ArrowLeft, Clock, TrendingUp, Shield } from 'lucide-react'
import { TOP_LOCATIONS, SERVICE_TYPES } from '@/lib/locations'
import { useLocationIntelligence } from '@/hooks/useLocationIntelligence'

export function LocationPage() {
  const { locationId } = useParams()
  const navigate = useNavigate()
  const id = parseInt(locationId || '0')
  const location = TOP_LOCATIONS.find(l => l.id === id)
  const { stats } = useLocationIntelligence([id])
  const locStat = stats[0]

  if (!location) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground-muted mb-2">Location not found</p>
          <button onClick={() => navigate('/locations')} className="text-primary text-sm">
            Browse all locations
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background">
      <Helmet>
        <title>{`${location.name} - Global Entry, NEXUS & SENTRI Appointments | OnAlert`}</title>
        <meta name="description" content={`Monitor appointment slots at ${location.name} in ${location.city}, ${location.state}. Get instant alerts when Global Entry, NEXUS or SENTRI cancellations open.`} />
        <link rel="canonical" href={`${(import.meta.env.VITE_APP_URL as string | undefined) || 'https://onalert.app'}/locations/${location.id}`} />
      </Helmet>
      <header className="bg-background-elevated border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/locations')} className="p-1 text-foreground-muted hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{location.name}</h1>
            <p className="text-xs text-foreground-muted">{location.city}, {location.state}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Programs available */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Programs Available</h2>
          <div className="flex flex-wrap gap-2">
            {location.services.map((st) => (
              <span key={st} className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-foreground">
                {SERVICE_TYPES[st].label}
              </span>
            ))}
          </div>
        </section>

        {/* Stats */}
        {locStat && (
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-2">Slot Intelligence</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface border border-border rounded-xl p-3 text-center">
                <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
                <div className="text-lg font-semibold text-foreground">{locStat.cancellationsPerWeek}</div>
                <div className="text-2xs text-foreground-muted">cancellations/week</div>
              </div>
              <div className="bg-surface border border-border rounded-xl p-3 text-center">
                <Clock className="w-4 h-4 text-warning mx-auto mb-1" />
                <div className="text-lg font-semibold text-foreground">
                  {locStat.avgFillMinutes ? `${locStat.avgFillMinutes}m` : '--'}
                </div>
                <div className="text-2xs text-foreground-muted">avg fill time</div>
              </div>
              <div className="bg-surface border border-border rounded-xl p-3 text-center">
                <MapPin className="w-4 h-4 text-success mx-auto mb-1" />
                <div className="text-lg font-semibold text-foreground">{locStat.peakDays[0]?.day || '--'}</div>
                <div className="text-2xs text-foreground-muted">peak day</div>
              </div>
            </div>
          </section>
        )}

        {!locStat && (
          <section className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs text-foreground-muted text-center">
              Slot data is being collected for this location. Set up a monitor to start tracking.
            </p>
          </section>
        )}

        {/* CTA */}
        <section className="text-center space-y-3 pt-4">
          <p className="text-sm text-foreground-secondary">
            Get notified when slots open at {location.name}
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="bg-primary text-white px-8 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Monitor this location
          </button>
          <p className="text-xs text-foreground-muted flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" />
            30-day money-back guarantee
          </p>
        </section>
      </main>
    </div>
  )
}
