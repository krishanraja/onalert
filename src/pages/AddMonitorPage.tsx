import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Search, MapPin, Zap, Star, Navigation, CalendarClock, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfile } from '@/hooks/useProfile'
import { useMonitors } from '@/hooks/useMonitors'
import { SERVICE_TYPES, TOP_LOCATIONS, searchLocations, type ServiceType } from '@/lib/locations'
import { getRecommendations, getNearestLocations } from '@/lib/recommendations'
import { getUserLocation, guessLocationFromTimezone } from '@/lib/geolocation'
import { haptic } from '@/lib/haptics'
import { showToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { SuccessScreen } from '@/components/monitors/SuccessScreen'

const POPULAR_LOCATION_IDS = [5140, 5003, 5006, 5002, 5007, 5004, 5030, 5008]

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '30%' : '-30%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-30%' : '30%', opacity: 0 }),
}

export function AddMonitorPage() {
  const navigate = useNavigate()
  const { profile, isPaid, isFamily } = useProfile()
  const { monitors, createMonitor } = useMonitors()
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
  const [stepDirection, setStepDirection] = useState(1)
  const [serviceType, setServiceType] = useState<ServiceType | null>('GE')
  const [selectedLocations, setSelectedLocations] = useState<number[]>([])
  const [locationSearch, setLocationSearch] = useState('')
  const [deadlineDate, setDeadlineDate] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nearestLocations, setNearestLocations] = useState<number[]>([])
  const [geoLoading, setGeoLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const filteredLocations = searchLocations(locationSearch)
  const maxLocations = isPaid ? Infinity : 3
  const maxMonitors = isFamily ? 5 : 1
  const canAddMore = monitors.length < maxMonitors

  useEffect(() => {
    async function detectNearest() {
      try {
        setGeoLoading(true)
        let coords: { lat: number; lng: number } | null = null
        try {
          coords = await getUserLocation()
        } catch {
          coords = guessLocationFromTimezone()
        }
        if (coords) {
          const nearest = getNearestLocations(coords.lat, coords.lng, 3)
          setNearestLocations(nearest.map((l) => l.id))
        }
      } catch {
        // Silent fail
      } finally {
        setGeoLoading(false)
      }
    }
    detectNearest()
  }, [])

  const recommendations = getRecommendations(selectedLocations, 2)

  if (showSuccess) {
    return <SuccessScreen />
  }

  if (!canAddMore) {
    const upgradeTarget = isPaid ? 'Family' : 'Pro or Family'
    const limitText = isFamily
      ? 'Family accounts can have up to 5 active monitors.'
      : isPaid
        ? 'Pro accounts can have 1 active monitor. Upgrade to Family for up to 5.'
        : 'Free accounts can have 1 active monitor.'

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-sm"
        >
          <h1 className="text-lg font-semibold text-foreground mb-2">Monitor limit reached</h1>
          <p className="text-sm text-foreground-secondary mb-4">{limitText}</p>
          {!isFamily && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/app/settings')}
              className="bg-primary text-white px-4 py-2 rounded-lg"
            >
              Upgrade to {upgradeTarget}
            </motion.button>
          )}
        </motion.div>
      </div>
    )
  }

  const handleQuickSetup = async () => {
    const locationIds = nearestLocations.length > 0
      ? nearestLocations.slice(0, maxLocations)
      : POPULAR_LOCATION_IDS.slice(0, maxLocations)

    setLoading(true)
    setError('')
    try {
      const monitor = await createMonitor({
        location_ids: locationIds,
        service_type: 'GE',
        last_known_slots: {}
      })
      if (monitor) {
        setShowSuccess(true)
      } else {
        setError('Failed to create monitor. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create monitor.')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    haptic('selection')
    setStepDirection(1)
    if (step === 1 && serviceType) setStep(2)
    else if (step === 2 && selectedLocations.length > 0) setStep(3)
  }

  const handleBack = () => {
    setStepDirection(-1)
    if (step === 0 || step === 1) navigate('/app')
    else setStep(step - 1 as 1 | 2)
  }

  const handleLocationToggle = (locationId: number) => {
    haptic('tap')
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
      const config: Parameters<typeof createMonitor>[0] = {
        location_ids: selectedLocations,
        service_type: serviceType,
        last_known_slots: {},
      }
      if (isPaid && deadlineDate) {
        config.deadline_date = deadlineDate
      }
      const monitor = await createMonitor(config)

      if (monitor) {
        setShowSuccess(true)
      } else {
        setError('Failed to create monitor. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create monitor. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Quick setup screen (step 0)
  if (step === 0) {
    const quickLocations = nearestLocations.length > 0
      ? nearestLocations.slice(0, 3)
      : POPULAR_LOCATION_IDS.slice(0, 3)
    const quickLocationNames = quickLocations
      .map((id) => TOP_LOCATIONS.find((l) => l.id === id))
      .filter(Boolean)

    return (
      <div className="min-h-screen bg-background">
        <header className="bg-background-elevated border-b border-border safe-top">
          <div className="px-4 py-4 flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/app')} className="p-2 -ml-2 text-foreground-muted hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
            </motion.button>
            <h1 className="font-semibold text-foreground">Add Monitor</h1>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="p-6 space-y-8 max-w-lg mx-auto"
        >
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Quick Start</h2>
            </div>
            <p className="text-sm text-foreground-secondary mb-4">
              Monitor Global Entry at {nearestLocations.length > 0 ? 'your nearest' : 'the most popular'} airports. One tap to start.
            </p>

            <div className="space-y-2 mb-4">
              {quickLocationNames.map((loc, i) => loc && (
                <motion.div
                  key={loc.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  {nearestLocations.includes(loc.id) ? (
                    <Navigation size={12} className="text-primary shrink-0" />
                  ) : (
                    <Star size={12} className="text-warning shrink-0" />
                  )}
                  <span>{loc.city}, {loc.state}</span>
                  <span className="text-xs text-foreground-muted">- {loc.name}</span>
                </motion.div>
              ))}
              {geoLoading && (
                <p className="text-xs text-foreground-muted animate-pulse">Detecting your nearest locations...</p>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleQuickSetup}
              disabled={loading}
              className="w-full bg-primary text-white py-3.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Activating...' : (
                <>
                  <Zap size={16} />
                  Activate in one tap
                </>
              )}
            </motion.button>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="text-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-foreground-muted">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <button
              onClick={() => { setStepDirection(1); setStep(1) }}
              className="text-sm text-foreground-secondary hover:text-foreground transition-colors font-medium"
            >
              Customize your monitor →
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background-elevated border-b border-border safe-top">
        <div className="px-4 py-4 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleBack}
            className="p-2 -ml-2 text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground">Add Monitor</h1>
            <p className="text-xs text-foreground-muted">Step {step} of 3</p>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-lg mx-auto">
        {/* Animated progress bar */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <motion.div
                animate={{
                  backgroundColor: s <= step ? 'hsl(0 94% 32%)' : 'hsl(0 0% 10%)',
                  borderColor: s <= step ? 'hsl(0 94% 32%)' : 'hsl(0 0% 16%)',
                  color: s <= step ? 'hsl(0 0% 96%)' : 'hsl(0 0% 40%)',
                }}
                transition={{ duration: 0.3 }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border"
              >
                {s < step ? <Check size={14} /> : s}
              </motion.div>
              {s < 3 && (
                <motion.div
                  animate={{ backgroundColor: s < step ? 'hsl(0 94% 32%)' : 'hsl(0 0% 16%)' }}
                  transition={{ duration: 0.3 }}
                  className="h-0.5 w-8 mx-1"
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content with animations */}
        <AnimatePresence mode="wait" custom={stepDirection}>
          <motion.div
            key={step}
            custom={stepDirection}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Step 1: Service Type */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Choose service type</h2>
                  <p className="text-sm text-foreground-secondary">
                    Which trusted traveler program do you want to monitor?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(SERVICE_TYPES).map(([key, service], i) => (
                    <motion.button
                      key={key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setServiceType(key as ServiceType); haptic('selection') }}
                      className={cn(
                        'p-4 rounded-lg border text-left transition-all',
                        serviceType === key
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-surface hover:border-border/60'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{service.label}</h3>
                        {key === 'GE' && (
                          <span className="text-[9px] font-medium bg-warning/10 text-warning px-1.5 py-0.5 rounded">Popular</span>
                        )}
                      </div>
                      <p className="text-xs text-foreground-secondary leading-relaxed">
                        {service.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Locations */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Select locations</h2>
                  <p className="text-sm text-foreground-secondary">
                    Choose which enrollment centers to monitor.
                    {!isPaid && ` Free accounts can select up to ${maxLocations} locations.`}
                  </p>
                </div>

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

                {recommendations.length > 0 && selectedLocations.length > 0 && (
                  <div className="bg-surface border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={12} className="text-warning" />
                      <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">Recommended</span>
                    </div>
                    {recommendations.map((rec) => {
                      const isSelected = selectedLocations.includes(rec.location.id)
                      const canSelect = isSelected || selectedLocations.length < maxLocations
                      return (
                        <motion.button
                          key={rec.location.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => canSelect && handleLocationToggle(rec.location.id)}
                          disabled={!canSelect}
                          className="w-full flex items-center gap-3 py-2 text-left"
                        >
                          <motion.div
                            animate={{ scale: isSelected ? 1 : 0.9 }}
                            className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                              isSelected ? 'border-primary bg-primary' : 'border-border'
                            )}
                          >
                            {isSelected && <Check size={10} className="text-white" />}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground font-medium">{rec.location.city}, {rec.location.state}</p>
                            <p className="text-xs text-foreground-muted">{rec.reason}</p>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                )}

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredLocations.length === 0 && locationSearch && (
                    <p className="text-sm text-foreground-secondary text-center py-4">
                      No locations found for "{locationSearch}". Try a different search.
                    </p>
                  )}
                  {filteredLocations.map((location) => {
                    const isSelected = selectedLocations.includes(location.id)
                    const canSelect = isSelected || selectedLocations.length < maxLocations
                    const isPopular = POPULAR_LOCATION_IDS.includes(location.id)
                    const isNearby = nearestLocations.includes(location.id)

                    return (
                      <motion.button
                        key={location.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => canSelect && handleLocationToggle(location.id)}
                        disabled={!canSelect}
                        className={cn(
                          'w-full p-3 rounded-lg border text-left transition-all',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : canSelect
                              ? 'border-border bg-surface hover:border-border/60'
                              : 'border-border bg-surface opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{
                              scale: isSelected ? [1, 1.2, 1] : 1,
                              backgroundColor: isSelected ? 'hsl(0 94% 32%)' : 'transparent',
                              borderColor: isSelected ? 'hsl(0 94% 32%)' : 'hsl(0 0% 16%)',
                            }}
                            transition={{ duration: 0.2 }}
                            className="w-5 h-5 rounded border flex items-center justify-center"
                          >
                            {isSelected && <Check size={12} className="text-white" />}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={12} className="text-foreground-muted shrink-0" />
                              <span className="font-medium text-foreground truncate">
                                {location.city}, {location.state}
                              </span>
                              {isNearby && (
                                <span className="text-[9px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">Nearby</span>
                              )}
                              {isPopular && !isNearby && (
                                <span className="text-[9px] font-medium bg-warning/10 text-warning px-1.5 py-0.5 rounded shrink-0">Popular</span>
                              )}
                            </div>
                            <p className="text-xs text-foreground-secondary truncate">
                              {location.name}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Confirm monitor</h2>
                  <p className="text-sm text-foreground-secondary">
                    Review your settings and activate the monitor.
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface border border-border rounded-lg p-4 space-y-4"
                >
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

                  {/* Deadline date filter */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarClock size={14} className={isPaid ? 'text-primary' : 'text-foreground-muted'} />
                      <h3 className="font-medium text-foreground">Date deadline</h3>
                      {!isPaid && <Lock size={12} className="text-foreground-muted" />}
                    </div>
                    {isPaid ? (
                      <div>
                        <p className="text-xs text-foreground-secondary mb-2">
                          Only get alerts for slots before this date. Leave blank to see all slots.
                        </p>
                        <input
                          type="date"
                          value={deadlineDate}
                          onChange={(e) => setDeadlineDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-foreground-muted">
                        <button onClick={() => navigate('/app/settings')} className="text-primary hover:text-primary/80">Upgrade to Pro</button> to filter alerts by date — only get notified about slots you can actually use.
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-6">
          {step < 3 ? (
            <>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleBack}
                className="flex-1 border border-border text-foreground py-3 rounded-lg font-medium hover:bg-surface-muted transition-colors"
              >
                Back
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                disabled={
                  (step === 1 && !serviceType) ||
                  (step === 2 && selectedLocations.length === 0)
                }
                className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Next <ArrowRight size={16} />
              </motion.button>
            </>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Activating...' : 'Activate Monitor'}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}
