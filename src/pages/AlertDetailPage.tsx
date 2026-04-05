import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, MapPin, Calendar, Clock, RefreshCw, Lock, Layers, ChevronDown } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { supabase, type Alert } from '@/lib/supabase'
import { useAlerts } from '@/hooks/useAlerts'
import { useProfile } from '@/hooks/useProfile'
import { SERVICE_TYPES, type ServiceType } from '@/lib/locations'
import { PROGRAMS } from '@/lib/programs'
import { formatSlotDate, formatSlotTime, minutesSince } from '@/lib/time'
import { CBP_BOOK_URL } from '@/lib/cbpApi'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import { showToast } from '@/hooks/useToast'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'
import { trackBookingClick } from '@/lib/tracking'

export function AlertDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { markRead } = useAlerts()
  const { isPaid } = useProfile()
  const [alert, setAlert] = useState<Alert | null>(null)
  const [loading, setLoading] = useState(true)
  const [recheckLoading, setRecheckLoading] = useState(false)
  const [recheckSent, setRecheckSent] = useState(false)
  const [showBookingGuide, setShowBookingGuide] = useState(false)

  useEffect(() => {
    if (!id) return

    async function load() {
      if (!supabase) { setLoading(false); return }

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Failed to load alert:', error)
      }

      setAlert(data)
      setLoading(false)

      // Track alert view
      if (data) {
        trackEvent(AnalyticsEvents.ALERT_VIEWED, {
          alert_id: data.id,
          service_type: data.payload?.service_type,
          age_minutes: minutesSince(data.created_at),
        })
      }

      // Mark as read
      if (data && !data.read_at) {
        markRead(data.id)
      }
    }

    load()
  }, [id, markRead])

  // Haptic feedback for recent alerts
  useEffect(() => {
    if (alert) {
      const ageMinutes = minutesSince(alert.created_at)
      if (ageMinutes <= 5) {
        haptic('urgentAlert')
      } else if (ageMinutes < 30) {
        haptic('alertArrival')
      }
    }
  }, [alert])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!alert) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-foreground mb-2">Alert not found</h1>
          <button onClick={() => navigate('/app/alerts')} className="text-primary hover:underline">
            Back to alerts
          </button>
        </div>
      </div>
    )
  }

  const serviceType = alert.payload.service_type as keyof typeof SERVICE_TYPES
  const service = SERVICE_TYPES[serviceType] ?? { abbr: serviceType, label: serviceType }
  const ageMinutes = minutesSince(alert.created_at)
  const isDigest = alert.payload.slots && alert.payload.slots.length > 1

  const handleRecheck = async () => {
    if (!supabase || !alert || recheckSent) return
    setRecheckLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('recheck_requests').insert({
        alert_id: alert.id,
        user_id: user.id,
        location_id: alert.payload.location_id,
        slot_timestamp: alert.payload.slot_timestamp,
      })

      if (error) throw error
      setRecheckSent(true)
      haptic('monitorCreated')
      showToast("Re-check requested! You'll get an email in ~2 minutes.", 'success')
    } catch (err) {
      console.error('Recheck failed:', err)
      showToast('Failed to request re-check', 'error')
    } finally {
      setRecheckLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background-elevated border-b border-border safe-top">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/app/alerts')}
            aria-label="Go back to alerts"
            className="p-2 -ml-2 text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-foreground">Alert Details</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Service badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium bg-primary/10 text-primary px-2 py-1 rounded">
            {service.abbr}
          </span>
          {isDigest && (
            <span className="text-xs font-mono font-medium bg-warning/10 text-warning px-2 py-1 rounded flex items-center gap-1">
              <Layers size={10} />
              {alert.payload.slots!.length} slots
            </span>
          )}
          <span className="text-xs text-foreground-muted">
            Appeared {ageMinutes < 1 ? 'just now' : `${ageMinutes}m ago`}
          </span>
        </div>

        {isDigest ? (
          <>
            {/* Digest header */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                {alert.payload.slots!.length} slots just opened
              </h2>
              <p className="text-sm text-foreground-secondary">
                Sorted by soonest appointment date
              </p>
            </div>

            {/* Digest slot list */}
            <div className="space-y-3">
              {alert.payload.slots!.map((slot, i) => (
                <div key={i} className="bg-surface border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-foreground-secondary">
                    <MapPin size={12} />
                    <span className="text-sm font-medium">{slot.location_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-mono font-bold text-primary">
                        {formatSlotTime(slot.slot_timestamp)}
                      </p>
                      <p className="text-sm text-foreground">
                        {formatSlotDate(slot.slot_timestamp)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        trackBookingClick(alert.id, slot.location_id)
                        window.open(slot.book_url || CBP_BOOK_URL, '_blank')
                      }}
                      className="bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <ExternalLink size={14} />
                      Book
                    </button>
                  </div>
                  {slot.narrative && (
                    <p className="text-xs text-foreground-muted leading-relaxed">{slot.narrative}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Location */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                {alert.payload.location_name}
              </h2>
              <div className="flex items-center gap-1.5 text-foreground-secondary">
                <MapPin size={14} />
                <span className="text-sm">{service.label} enrollment center</span>
              </div>
            </div>

            {/* Slot details */}
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-foreground-muted">
                <Calendar size={16} />
                <span className="text-sm font-medium">Available appointment</span>
              </div>

              <div className="space-y-1">
                <p className="text-2xl font-mono font-bold text-primary">
                  {formatSlotTime(alert.payload.slot_timestamp)}
                </p>
                <p className="text-foreground font-medium">
                  {formatSlotDate(alert.payload.slot_timestamp)}
                </p>
              </div>

              {alert.payload.narrative && (
                <div className="pt-3 border-t border-border">
                  <p className="text-sm text-foreground-secondary leading-relaxed">
                    {alert.payload.narrative}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Warning for older alerts */}
        {ageMinutes > 10 && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Time-sensitive</p>
                <p className="text-xs text-foreground-secondary">
                  {isDigest ? 'These slots appeared' : 'This slot appeared'} {ageMinutes} minutes ago. {isDigest ? 'They' : 'It'} may no longer be available.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-6">
          {!isDigest && (
            <button
              onClick={() => {
                trackBookingClick(alert.id, alert.payload.location_id)
                window.open(alert.payload.book_url || CBP_BOOK_URL, '_blank')
              }}
              aria-label="Book this appointment slot (opens in new tab)"
              className="w-full bg-primary text-white py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink size={18} />
              Book on CBP site
            </button>
          )}

          {/* Collapsible booking guidance */}
          {(() => {
            const program = PROGRAMS[serviceType as ServiceType]
            if (!program) return null
            return (
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowBookingGuide(!showBookingGuide)}
                  className="w-full px-4 py-3 flex items-center justify-between text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  <span className="font-medium">How to book this slot</span>
                  <ChevronDown size={14} className={cn('transition-transform', showBookingGuide && 'rotate-180')} />
                </button>
                {showBookingGuide && (
                  <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                    {program.bookingSteps.map((step, i) => (
                      <div key={i} className="flex gap-2.5">
                        <span className="text-[11px] font-bold text-foreground-muted bg-surface-muted w-5 h-5 rounded-full flex items-center justify-center shrink-0">{i + 1}</span>
                        <p className="text-xs text-foreground-secondary leading-relaxed pt-0.5">{step}</p>
                      </div>
                    ))}
                    <p className="text-[11px] text-foreground-muted mt-2 pt-2 border-t border-border/50">
                      {program.prerequisite}
                    </p>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Re-check button (paid users, single alerts only) */}
          {!isDigest && isPaid ? (
            <button
              onClick={handleRecheck}
              disabled={recheckLoading || recheckSent}
              className="w-full border border-primary/30 text-primary py-3 rounded-lg font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={recheckLoading ? 'animate-spin' : ''} />
              {recheckSent ? 'Re-check requested — email in ~2 min' : recheckLoading ? 'Requesting...' : 'Re-check in 2 min'}
            </button>
          ) : !isDigest && !isPaid ? (
            <button
              onClick={() => navigate('/app/settings', { state: { scrollToUpgrade: true } })}
              className="w-full border border-border text-foreground-muted py-3 rounded-lg font-medium hover:bg-surface-muted transition-colors flex items-center justify-center gap-2"
            >
              <Lock size={14} />
              Upgrade to re-check slots
            </button>
          ) : null}

          <button
            onClick={() => navigate('/app/alerts')}
            className="w-full border border-border text-foreground py-3 rounded-lg font-medium hover:bg-surface-muted transition-colors"
          >
            Back to alerts
          </button>
        </div>
      </div>
    </div>
  )
}