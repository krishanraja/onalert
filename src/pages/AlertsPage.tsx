import { useState } from 'react'
import { Bell, ArrowLeft, ExternalLink, MapPin, Calendar, Clock, Layers, RefreshCw, Lock } from 'lucide-react'
import { useAlerts } from '@/hooks/useAlerts'
import { useProfile } from '@/hooks/useProfile'
import { AlertCard } from '@/components/alerts/AlertCard'
import { AlertsListSkeleton } from '@/components/ui/Skeleton'
import { type Alert } from '@/lib/supabase'
import { SERVICE_TYPES } from '@/lib/locations'
import { formatSlotDate, formatSlotTime, minutesSince } from '@/lib/time'
import { CBP_BOOK_URL } from '@/lib/cbpApi'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/hooks/useToast'
import { haptic } from '@/lib/haptics'

function AlertDetailInline({ alert, onClose, isPaid }: { alert: Alert; onClose: () => void; isPaid: boolean }) {
  const [recheckLoading, setRecheckLoading] = useState(false)
  const [recheckSent, setRecheckSent] = useState(false)

  const handleRecheck = async () => {
    if (!supabase || recheckSent) return
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

  const serviceType = alert.payload.service_type as keyof typeof SERVICE_TYPES
  const service = SERVICE_TYPES[serviceType] ?? { abbr: serviceType, label: serviceType }
  const ageMinutes = minutesSince(alert.created_at)
  const isDigest = alert.payload.slots && alert.payload.slots.length > 1

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Back button for tablet-ish sizes */}
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors xl:hidden"
        >
          <ArrowLeft size={14} /> Back to list
        </button>

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
                      onClick={() => window.open(slot.book_url || CBP_BOOK_URL, '_blank')}
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
            {/* Single alert: Location */}
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

        {/* Book button (single alert only - digest has per-slot buttons) */}
        {!isDigest && (
          <button
            onClick={() => window.open(CBP_BOOK_URL, '_blank')}
            aria-label="Book this appointment slot (opens in new tab)"
            className="w-full bg-primary text-white py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink size={18} />
            Book this slot
          </button>
        )}

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
          <div className="flex items-center justify-center gap-2 text-xs text-foreground-muted py-2">
            <Lock size={12} />
            <span>Upgrade to Pro to re-check slot availability</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function AlertsPage() {
  const { alerts, loading, markRead } = useAlerts()
  const { isPaid } = useProfile()
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)

  const selectedAlert = selectedAlertId
    ? alerts.find((a) => a.id === selectedAlertId) ?? null
    : null

  const handleSelectAlert = (alert: Alert) => {
    setSelectedAlertId(alert.id)
    if (!alert.read_at) {
      markRead(alert.id)
    }
  }

  if (loading) {
    return (
      <div className="min-h-full bg-background">
        <header className="bg-background-elevated border-b border-border safe-top lg:hidden">
          <div className="px-4 py-4">
            <h1 className="text-lg font-semibold text-foreground">Alerts</h1>
          </div>
        </header>
        <div className="px-4 py-6">
          <AlertsListSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-background">
      {/* Mobile header */}
      <header className="bg-background-elevated border-b border-border safe-top lg:hidden">
        <div className="px-4 py-4">
          <h1 className="text-lg font-semibold text-foreground">Alerts</h1>
        </div>
      </header>

      {/* Desktop: split pane layout */}
      <div className="lg:flex lg:h-[calc(100vh-0px)]">
        {/* Alert list */}
        <div className="lg:w-96 lg:border-r lg:border-border lg:overflow-y-auto lg:shrink-0">
          {/* Desktop header for list */}
          <div className="hidden lg:block px-4 py-4 border-b border-border">
            <h1 className="text-lg font-semibold text-foreground">Alerts</h1>
            <p className="text-xs text-foreground-muted mt-0.5">
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="px-4 py-4 lg:py-2">
            {alerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-surface border-2 border-dashed border-border rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-6 h-6 text-foreground-muted" />
                </div>
                <h3 className="font-medium text-foreground mb-2">No alerts yet</h3>
                <p className="text-sm text-foreground-secondary max-w-sm mx-auto">
                  Your alerts will appear here when appointment slots become available.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div key={alert.id} className="lg:cursor-pointer">
                    {/* Mobile: navigate to detail page */}
                    <div className="lg:hidden">
                      <AlertCard alert={alert} />
                    </div>
                    {/* Desktop: select for split pane */}
                    <div
                      className="hidden lg:block"
                      onClick={() => handleSelectAlert(alert)}
                    >
                      <AlertCard
                        alert={alert}
                        isSelected={selectedAlertId === alert.id}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop: detail pane */}
        <div className="hidden lg:block flex-1 bg-background-elevated overflow-y-auto">
          {selectedAlert ? (
            <AlertDetailInline
              alert={selectedAlert}
              onClose={() => setSelectedAlertId(null)}
              isPaid={isPaid}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Bell size={32} className="text-foreground-muted mx-auto mb-3" />
                <p className="text-sm text-foreground-muted">Select an alert to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
