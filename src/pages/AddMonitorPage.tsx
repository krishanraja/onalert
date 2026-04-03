import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Search, MapPin } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { useMonitors } from '@/hooks/useMonitors'
import { SERVICE_TYPES, TOP_LOCATIONS, searchLocations, type ServiceType } from '@/lib/locations'
import { cn } from '@/lib/utils'

export function AddMonitorPage() {
  const navigate = useNavigate()
  const { profile, isPaid, isFamily } = useProfile()
  const { monitors, createMonitor } = useMonitors()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [serviceType, setServiceType] = useState<ServiceType | null>(null)
  const [selectedLocations, setSelectedLocations] = useState<number[]>([])
  const [locationSearch, setLocationSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredLocations = searchLocations(locationSearch)
  const maxLocations = isPaid ? Infinity : 3
  const maxMonitors = isFamily ? 5 : 1
  const canAddMore = monitors.length < maxMonitors

  if (!canAddMore) {
    const upgradeTarget = isPaid ? 'Family' : 'Pro or Family'
    const limitText = isFamily
      ? 'Family accounts can have up to 5 active monitors.'
      : isPaid
        ? 'Pro accounts can have 1 active monitor. Upgrade to Family for up to 5.'
        : 'Free accounts can have 1 active monitor.'

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-lg font-semibold text-foreground mb-2">
            Monitor limit reached
          </h1>
          <p className="text-sm text-foreground-secondary mb-4">
            {limitText}
          </p>
          {!isFamily && (
            <button
              onClick={() => navigate('/app/settings')}
              className="bg-primary text-white px-4 py-2 rounded-lg"
            >
              Upgrade to {upgradeTarget}
            </button>
          )}
        </div>
      </div>
    )
  }

  const handleNext = () => {
    if (step === 1 && serviceType) setStep(2)
    else if (step === 2 && selectedLocations.length > 0) setStep(3)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1 as 1 | 2)
    else navigate('/app')
  }

  const handleLocationToggle = (locationId: number) => {
    setSelectedLocations(prev => {
      if (prev.includes(locationId)) {
        return prev.filter(id => id !== locationId)
      } else if (prev.length < maxLocations) {
        return [...prev, locationId]
      } else {
        return prev
      }
    })
  }

  const handleCreate = async () => {
    if (!serviceType || selectedLocations.length === 0) return

    setLoading(true)
    setError('')
    try {
      const monitor = await createMonitor({
        location_ids: selectedLocations,
        service_type: serviceType,
        last_known_slots: {}
      })

      if (monitor) {
        if ('vibrate' in navigator) navigator.vibrate([50, 30, 50])
        navigate('/app')
      } else {
        setError('Failed to create monitor. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create monitor. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background-elevated border-b border-border safe-top">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground">Add Monitor</h1>
            <p className="text-xs text-foreground-muted">Step {step} of 3</p>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold',
                s <= step ? 'bg-primary text-white' : 'bg-surface text-foreground-muted border border-border'
              )}>
                {s < step ? <Check size={14} /> : s}
              </div>
              {s < 3 && <div className={cn('h-0.5 w-8 mx-1', s < step ? 'bg-primary' : 'bg-border')} />}
            </div>
          ))}
        </div>

        {/* Step 1: Service Type */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Choose service type
              </h2>
              <p className="text-sm text-foreground-secondary">
                Which trusted traveler program do you want to monitor?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(SERVICE_TYPES).map(([key, service]) => (
                <button
                  key={key}
                  onClick={() => setServiceType(key as ServiceType)}
                  className={cn(
                    'p-4 rounded-lg border text-left transition-colors',
                    serviceType === key
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-surface hover:border-border/60'
                  )}
                >
                  <h3 className="font-semibold text-foreground mb-1">{service.label}</h3>
                  <p className="text-xs text-foreground-secondary leading-relaxed">
                    {service.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Locations */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Select locations
              </h2>
              <p className="text-sm text-foreground-secondary">
                Choose which enrollment centers to monitor.
                {!isPaid && ` Free accounts can select up to ${maxLocations} locations.`}
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted" />
              <input
                type="text"
                placeholder="Search locations..."
                aria-label="Search enrollment centers"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-3 text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Selected count */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-secondary">
                {selectedLocations.length} location{selectedLocations.length !== 1 ? 's' : ''} selected
              </span>
              {selectedLocations.length >= maxLocations && !isPaid && (
                <span className="text-warning">Limit reached</span>
              )}
              {selectedLocations.length === 0 && (
                <span className="text-foreground-muted text-xs" role="alert">Select at least one location to continue</span>
              )}
            </div>

            {/* Location list */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredLocations.length === 0 && locationSearch && (
                <p className="text-sm text-foreground-secondary text-center py-4">
                  No locations found for "{locationSearch}". Try a different search.
                </p>
              )}
              {filteredLocations.map((location) => {
                const isSelected = selectedLocations.includes(location.id)
                const canSelect = isSelected || selectedLocations.length < maxLocations

                return (
                  <button
                    key={location.id}
                    onClick={() => canSelect && handleLocationToggle(location.id)}
                    disabled={!canSelect}
                    className={cn(
                      'w-full p-3 rounded-lg border text-left transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : canSelect
                          ? 'border-border bg-surface hover:border-border/60'
                          : 'border-border bg-surface opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-5 h-5 rounded border flex items-center justify-center',
                        isSelected ? 'border-primary bg-primary' : 'border-border'
                      )}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-foreground-muted shrink-0" />
                          <span className="font-medium text-foreground truncate">
                            {location.city}, {location.state}
                          </span>
                        </div>
                        <p className="text-xs text-foreground-secondary truncate">
                          {location.name}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Confirm monitor
              </h2>
              <p className="text-sm text-foreground-secondary">
                Review your settings and activate the monitor.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
              <div>
                <h3 className="font-medium text-foreground mb-1">Service type</h3>
                <p className="text-sm text-foreground-secondary">
                  {serviceType && SERVICE_TYPES[serviceType].label}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Locations ({selectedLocations.length})</h3>
                <div className="space-y-1">
                  {selectedLocations.map((id) => {
                    const location = TOP_LOCATIONS.find(l => l.id === id)
                    return location && (
                      <p key={id} className="text-sm text-foreground-secondary">
                        {location.city}, {location.state}
                      </p>
                    )
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-1">Check frequency</h3>
                <p className="text-sm text-foreground-secondary">
                  Every {isPaid ? '5' : '60'} minutes
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-1">Notifications</h3>
                <p className="text-sm text-foreground-secondary">
                  Email{isPaid ? ' + SMS' : ' only'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-6">
          {step < 3 ? (
            <>
              <button
                onClick={handleBack}
                className="flex-1 border border-border text-foreground py-3 rounded-lg font-medium hover:bg-surface-muted transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={
                  (step === 1 && !serviceType) ||
                  (step === 2 && selectedLocations.length === 0)
                }
                className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Next <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Activating...' : 'Activate Monitor'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
