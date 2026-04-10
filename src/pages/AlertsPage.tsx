import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ArrowLeft, ExternalLink, MapPin, Calendar, Clock, CheckCircle, Layers, RefreshCw, Lock, FilterX } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAlerts } from '@/hooks/useAlerts'
import { useProfile } from '@/hooks/useProfile'
import { AlertCard } from '@/components/alerts/AlertCard'
import { AlertFilterBar } from '@/components/alerts/AlertFilterBar'
import { AlertsListSkeleton } from '@/components/ui/Skeleton'
import { type Alert } from '@/lib/supabase'
import { SERVICE_TYPES } from '@/lib/locations'
import { formatSlotDate, formatSlotTime, minutesSince } from '@/lib/time'
import { CBP_BOOK_URL, buildBookUrl } from '@/lib/cbpApi'
import { trackBookingClick } from '@/lib/tracking'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/hooks/useToast'
import { haptic } from '@/lib/haptics'

type AlertTab = 'live' | 'history'

function isLiveAlert(alert: Alert): boolean {
  const slotTime = new Date(alert.payload.slot_timestamp).getTime()
  const now = Date.now()
  const createdAge = minutesSince(alert.created_at)
  return slotTime > now && createdAge <= 30
}

function AlertDetailInline({ alert, onClose, isPaid }: { alert: Alert; onClose: () => void; isPaid: boolean }) {
  const navigate = useNavigate()
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
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors xl:hidden"
        >
          <ArrowLeft size={14} /> Back to list
        </button>

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
                        window.open(slot.book_url || buildBookUrl(slot.location_id, alert.payload.service_type), '_blank')
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
            onClick={() => {
              trackBookingClick(alert.id, alert.payload.location_id)
              window.open(alert.payload.book_url || buildBookUrl(alert.payload.location_id, alert.payload.service_type), '_blank')
            }}
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
          <button
            onClick={() => navigate('/app/settings', { state: { scrollToUpgrade: true } })}
            className="w-full flex items-center justify-center gap-2 text-xs text-foreground-muted hover:text-primary py-2 transition-colors"
          >
            <Lock size={12} />
            <span>Upgrade to Pro to re-check slot availability</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function AlertsPage() {
  const { alerts, loading, markRead, toggleStar } = useAlerts()
  const { isPaid } = useProfile()
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [tab, setTab] = useState<AlertTab>('live')
  const [serviceFilter, setServiceFilter] = useState<Set<string>>(new Set())
  const [starredFilter, setStarredFilter] = useState(false)
  const [locationFilter, setLocationFilter] = useState<string | null>(null)

  // Split alerts into live vs history
  const liveAlerts = useMemo(() => {
    return alerts
      .filter(isLiveAlert)
      .sort((a, b) =>
        new Date(a.payload.slot_timestamp).getTime() - new Date(b.payload.slot_timestamp).getTime()
      )
  }, [alerts])

  const historyAlerts = useMemo(() => {
    return alerts
      .filter((a) => !isLiveAlert(a))
      .sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
  }, [alerts])

  const currentAlerts = tab === 'live' ? liveAlerts : historyAlerts

  // Derive unique locations from current alerts
  const locations = useMemo(() => {
    const locs = new Set<string>()
    currentAlerts.forEach((a) => {
      locs.add(a.payload.location_name)
      a.payload.slots?.forEach((s) => locs.add(s.location_name))
    })
    return Array.from(locs).sort()
  }, [currentAlerts])

  const filteredAlerts = useMemo(() => {
    return currentAlerts.filter((a) => {
      if (serviceFilter.size > 0 && !serviceFilter.has(a.payload.service_type)) return false
      if (starredFilter && !a.starred_at) return false
      if (locationFilter && a.payload.location_name !== locationFilter) return false
      return true
    })
  }, [currentAlerts, serviceFilter, starredFilter, locationFilter])

  const filterCounts = useMemo(() => ({
    total: currentAlerts.length,
    starred: currentAlerts.filter(a => !!a.starred_at).length,
    byService: currentAlerts.reduce((acc, a) => {
      const st = a.payload.service_type
      acc[st] = (acc[st] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }), [currentAlerts])

  const hasActiveFilters = serviceFilter.size > 0 || starredFilter || locationFilter !== null

  const clearFilters = () => {
    setServiceFilter(new Set())
    setStarredFilter(false)
    setLocationFilter(null)
  }

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
      <div className="h-full bg-background">
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

  const tabButton = (t: AlertTab, label: string, count: number) => (
    <button
      onClick={() => { setTab(t); clearFilters() }}
      className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-colors ${
        tab === t
          ? 'bg-primary/15 text-primary'
          : 'text-foreground-muted hover:text-foreground-secondary'
      }`}
    >
      {label}
      <span className={`ml-1.5 ${tab === t ? 'text-primary/60' : 'text-foreground-muted/60'}`}>
        {count}
      </span>
    </button>
  )

  return (
    <div className="h-full bg-background">
      {/* ============ MOBILE: Card list ============ */}
      <div className="lg:hidden flex flex-col h-full">
        {/* Header */}
        <header className="bg-background-elevated border-b border-border safe-top shrink-0">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground">Alerts</h1>
            <span className="text-xs font-mono text-foreground-muted">
              {hasActiveFilters ? `${filteredAlerts.length} of ${currentAlerts.length}` : `${currentAlerts.length}`}
            </span>
          </div>
          {/* Tabs */}
          <div className="px-4 pb-2 flex items-center gap-2">
            {tabButton('live', 'Live', liveAlerts.length)}
            {tabButton('history', 'History', historyAlerts.length)}
          </div>
        </header>

        {/* Filter bar */}
        {currentAlerts.length > 0 && (
          <div className="px-4 py-2 border-b border-border bg-background-elevated shrink-0">
            <AlertFilterBar
              serviceTypes={serviceFilter}
              onServiceTypesChange={setServiceFilter}
              starredFilter={starredFilter}
              onStarredFilterChange={setStarredFilter}
              locationFilter={locationFilter}
              onLocationFilterChange={setLocationFilter}
              locations={locations}
              counts={filterCounts}
            />
          </div>
        )}

        {alerts.length === 0 ? (
          /* Empty state - no alerts at all */
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-16 bg-success/10 border border-success/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-7 h-7 text-success" />
              </motion.div>
              <h3 className="font-semibold text-foreground mb-2">All caught up</h3>
              <p className="text-sm text-foreground-secondary max-w-sm mx-auto">
                Alerts will appear here when appointment slots become available.
              </p>
            </motion.div>
          </div>
        ) : currentAlerts.length === 0 ? (
          /* Tab has no alerts */
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <Bell className="w-8 h-8 text-foreground-muted mx-auto mb-3" />
              <h3 className="font-medium text-foreground mb-2">
                {tab === 'live' ? 'No live slots right now' : 'No history yet'}
              </h3>
              <p className="text-sm text-foreground-secondary max-w-sm mx-auto">
                {tab === 'live'
                  ? 'Live slots appear when new appointments are detected. Check back soon.'
                  : 'Past alerts will show up here.'}
              </p>
            </div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          /* No filter results */
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <FilterX className="w-8 h-8 text-foreground-muted mx-auto mb-3" />
              <h3 className="font-medium text-foreground mb-2">No alerts match your filters</h3>
              <button onClick={clearFilters} className="text-sm text-primary hover:text-primary/80 transition-colors">
                Clear filters
              </button>
            </div>
          </div>
        ) : (
          /* Scrollable alert list */
          <div className="flex-1 overflow-y-auto px-4 py-2">
            <div className="space-y-2">
              {filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  isHistory={tab === 'history'}
                  onToggleStar={toggleStar}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============ DESKTOP: Split pane ============ */}
      <div className="hidden lg:flex lg:h-[calc(100vh-0px)]">
        {/* Alert list */}
        <div className="lg:w-96 lg:border-r lg:border-border lg:overflow-y-auto lg:shrink-0">
          <div className="px-4 py-4 border-b border-border">
            <h1 className="text-lg font-semibold text-foreground">Alerts</h1>
            <p className="text-xs text-foreground-muted mt-0.5">
              {hasActiveFilters ? `${filteredAlerts.length} of ${currentAlerts.length}` : `${currentAlerts.length}`} alert{(hasActiveFilters ? filteredAlerts.length : currentAlerts.length) !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Tabs */}
          <div className="px-4 py-2 border-b border-border flex items-center gap-2">
            {tabButton('live', 'Live', liveAlerts.length)}
            {tabButton('history', 'History', historyAlerts.length)}
          </div>

          {currentAlerts.length > 0 && (
            <div className="px-4 py-2 border-b border-border">
              <AlertFilterBar
                serviceTypes={serviceFilter}
                onServiceTypesChange={setServiceFilter}
                starredFilter={starredFilter}
                onStarredFilterChange={setStarredFilter}
                locationFilter={locationFilter}
                onLocationFilterChange={setLocationFilter}
                locations={locations}
                counts={filterCounts}
              />
            </div>
          )}

          <div className="px-4 py-2">
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
            ) : currentAlerts.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-8 h-8 text-foreground-muted mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-2">
                  {tab === 'live' ? 'No live slots right now' : 'No history yet'}
                </h3>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-12">
                <FilterX className="w-8 h-8 text-foreground-muted mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-2">No alerts match your filters</h3>
                <button onClick={clearFilters} className="text-sm text-primary hover:text-primary/80 transition-colors">
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="cursor-pointer"
                    onClick={() => handleSelectAlert(alert)}
                  >
                    <AlertCard
                      alert={alert}
                      isSelected={selectedAlertId === alert.id}
                      isHistory={tab === 'history'}
                      onToggleStar={toggleStar}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail pane */}
        <div className="flex-1 bg-background-elevated overflow-y-auto">
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
