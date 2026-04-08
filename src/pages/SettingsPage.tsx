import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Crown, Mail, Smartphone, LogOut, Bell, Users, Activity } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'
import { useMonitors } from '@/hooks/useMonitors'
import { MonitorCard } from '@/components/monitors/MonitorCard'
import { createCheckoutSession } from '@/lib/stripe'
import { PLANS } from '@/lib/plans'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { showToast } from '@/hooks/useToast'
import { haptic } from '@/lib/haptics'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'

export function SettingsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, isPaid, isFamily, isExpress, updateProfile } = useProfile()
  const { monitors, loading: monitorsLoading, toggleMonitor, deleteMonitor } = useMonitors()
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const upgradeRef = useRef<HTMLDivElement>(null)
  const hasScrolled = useRef(false)

  const scrollToUpgrade = useCallback(() => {
    if (hasScrolled.current || !upgradeRef.current) return
    hasScrolled.current = true
    // Wait for page transition animation to complete
    setTimeout(() => {
      upgradeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 500)
  }, [])

  // Scroll to upgrade section when navigated here with state or hash
  useEffect(() => {
    const shouldScroll = location.state?.scrollToUpgrade || location.hash === '#upgrade'
    if (shouldScroll && upgradeRef.current) {
      scrollToUpgrade()
    }
  }, [location.state, location.hash, isPaid, scrollToUpgrade])

  // Derive notification prefs from profile with fallbacks
  const emailAlerts = profile?.email_alerts_enabled ?? true
  const smsAlerts = profile?.sms_alerts_enabled ?? false

  const handleToggleEmail = async (checked: boolean) => {
    haptic('selection')
    try {
      await updateProfile({ email_alerts_enabled: checked })
      showToast(checked ? 'Email alerts enabled' : 'Email alerts disabled', 'info')
    } catch {
      showToast('Failed to update preference', 'error')
    }
  }

  const handleToggleSms = async (checked: boolean) => {
    if (!isPaid) return
    haptic('selection')
    try {
      await updateProfile({ sms_alerts_enabled: checked })
      showToast(checked ? 'SMS alerts enabled' : 'SMS alerts disabled', 'info')
    } catch {
      showToast('Failed to update preference', 'error')
    }
  }

  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneSaving, setPhoneSaving] = useState(false)

  useEffect(() => {
    if (profile?.phone_number) setPhoneNumber(profile.phone_number)
  }, [profile?.phone_number])

  const handleSavePhone = async () => {
    if (!phoneNumber.match(/^\+1\d{10}$/)) {
      showToast('Enter a valid US number: +1XXXXXXXXXX', 'error')
      return
    }
    setPhoneSaving(true)
    try {
      await updateProfile({ phone_number: phoneNumber })
      showToast('Phone number saved', 'success')
    } catch {
      showToast('Failed to save phone number', 'error')
    }
    setPhoneSaving(false)
  }

  const handleUpgrade = async (plan: 'pro' | 'multi' | 'express') => {
    // Track upgrade click
    trackEvent(AnalyticsEvents.UPGRADE_CLICKED, { plan })

    setLoading(plan)
    setError('')
    try {
      const url = await createCheckoutSession(plan)
      // Track checkout started
      trackEvent(AnalyticsEvents.CHECKOUT_STARTED, { plan })
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upgrade failed. Please try again.')
    } finally {
      setLoading('')
    }
  }

  const handleSignOut = async () => {
    if (!supabase) { navigate('/'); return }
    await supabase.auth.signOut()
    trackEvent(AnalyticsEvents.SIGNOUT_COMPLETED)
    navigate('/')
  }

  const planLabel = isFamily ? 'MULTI' : isExpress ? 'EXPRESS' : isPaid ? 'PRO' : 'FREE'

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <header className="bg-background-elevated border-b border-border safe-top lg:hidden shrink-0">
        <div className="px-4 py-4">
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 space-y-6 max-w-2xl lg:mx-0">
        {/* Desktop title */}
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-foreground-secondary mt-1">Manage your account and notifications</p>
        </div>

        {/* Account */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Account</h2>
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-foreground">{profile?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  {isPaid ? (
                    <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {isFamily ? <Users size={10} /> : <Crown size={10} />}
                      <span className="text-xs font-medium">{planLabel}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        hasScrolled.current = false
                        upgradeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                      className="text-xs text-foreground-muted bg-surface-muted px-2 py-0.5 rounded-full hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      FREE
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Notifications</h2>
          <div className="bg-surface border border-border rounded-lg divide-y divide-border">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-foreground-muted" />
                <div>
                  <p className="font-medium text-foreground">Email alerts</p>
                  <p className="text-xs text-foreground-secondary">Get notified via email</p>
                </div>
              </div>
              <Switch
                checked={emailAlerts}
                onCheckedChange={handleToggleEmail}
                aria-label="Toggle email alerts"
              />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone size={18} className="text-foreground-muted" />
                <div>
                  <p className="font-medium text-foreground">SMS alerts</p>
                  <p className="text-xs text-foreground-secondary">
                    {isPaid ? 'Get notified via text message' : 'Paid feature'}
                  </p>
                </div>
              </div>
              <Switch
                checked={smsAlerts}
                onCheckedChange={handleToggleSms}
                disabled={!isPaid}
                aria-label="Toggle SMS alerts"
              />
            </div>

            {smsAlerts && isPaid && (
              <div className="px-4 pb-4 -mt-2">
                <label className="text-xs text-foreground-muted mb-1 block">Phone number (US)</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1XXXXXXXXXX"
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-foreground-muted"
                  />
                  <button
                    onClick={handleSavePhone}
                    disabled={phoneSaving}
                    className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {phoneSaving ? '...' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-foreground-muted" />
                <div>
                  <p className="font-medium text-foreground">Push notifications</p>
                  <p className="text-xs text-foreground-secondary">
                    Browser push when slots open
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if ('Notification' in window && Notification.permission === 'default') {
                    Notification.requestPermission().then((perm) => {
                      if (perm === 'granted') {
                        showToast('Push notifications enabled!', 'success')
                      }
                    })
                  } else if ('Notification' in window && Notification.permission === 'granted') {
                    showToast('Push notifications already enabled', 'info')
                  } else {
                    showToast('Notifications blocked. Check browser settings.', 'error')
                  }
                }}
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'Enabled' : 'Enable'}
              </button>
            </div>
          </div>
        </div>

        {/* Monitors */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Monitors</h2>
          {monitorsLoading ? (
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-sm text-foreground-muted">Loading monitors...</p>
            </div>
          ) : monitors.length === 0 ? (
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Activity size={18} className="text-foreground-muted" />
                <p className="text-sm text-foreground-muted">No monitors set up yet.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {monitors.map((monitor) => (
                <MonitorCard
                  key={monitor.id}
                  monitor={monitor}
                  onToggle={toggleMonitor}
                  onDelete={deleteMonitor}
                />
              ))}
            </div>
          )}
        </div>

        {/* Upgrade */}
        {!isPaid && (
          <div ref={upgradeRef} className="space-y-3 scroll-mt-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Upgrade</h2>
            <div className="space-y-3">
              {/* Pro */}
              <div className="bg-surface border border-primary rounded-lg p-4 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">Most popular</span>
                </div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">Pro</h3>
                    <p className="text-2xl font-bold text-foreground">
                      ${PLANS.pro.price}
                      <span className="text-sm font-normal text-foreground-secondary"> one-time</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpgrade('pro')}
                    disabled={loading === 'pro'}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {loading === 'pro' ? 'Loading...' : 'Buy Pro'}
                  </button>
                </div>
                <ul className="space-y-1">
                  {PLANS.pro.features.map((feature) => (
                    <li key={feature} className="text-sm text-foreground-secondary">
                      • {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Multi */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">
                    Best for families
                  </span>
                </div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">Multi</h3>
                    <p className="text-2xl font-bold text-foreground">
                      ${PLANS.multi.price}
                      <span className="text-sm font-normal text-foreground-secondary"> one-time</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpgrade('multi')}
                    disabled={loading === 'multi'}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {loading === 'multi' ? 'Loading...' : 'Buy Multi'}
                  </button>
                </div>
                <ul className="space-y-1">
                  {PLANS.multi.features.map((feature) => (
                    <li key={feature} className="text-sm text-foreground-secondary">
                      • {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Express */}
              <div className="bg-surface border border-warning/30 rounded-lg p-4 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-warning text-black px-3 py-1 rounded-full text-xs font-medium">Fastest alerts</span>
                </div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">Express</h3>
                    <p className="text-2xl font-bold text-foreground">
                      ${PLANS.express.price}
                      <span className="text-sm font-normal text-foreground-secondary"> one-time</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpgrade('express')}
                    disabled={loading === 'express'}
                    className="bg-warning text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-warning/90 transition-colors disabled:opacity-50"
                  >
                    {loading === 'express' ? 'Loading...' : 'Buy Express'}
                  </button>
                </div>
                <ul className="space-y-1">
                  {PLANS.express.features.map((feature) => (
                    <li key={feature} className="text-sm text-foreground-secondary">
                      • {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              <p className="text-xs text-foreground-muted text-center">
                One-time payment. No subscription. Yours forever.
              </p>
            </div>
          </div>
        )}

        {/* Upgrade from Pro to Multi */}
        {isPaid && !isFamily && !isExpress && (
          <div ref={upgradeRef} className="space-y-3 scroll-mt-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Upgrade</h2>
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">Upgrade to Multi</h3>
                  <p className="text-sm text-foreground-secondary">Monitor up to {PLANS.multi.monitors} programs simultaneously. No cooldown on changes.</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    ${PLANS.multi.price}
                    <span className="text-sm font-normal text-foreground-secondary"> one-time</span>
                  </p>
                </div>
                <button
                  onClick={() => handleUpgrade('multi')}
                  disabled={loading === 'multi'}
                  className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading === 'multi' ? 'Loading...' : 'Upgrade'}
                </button>
              </div>
            </div>

            {/* Express upgrade */}
            <div className="bg-surface border border-warning/30 rounded-lg p-4 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-warning text-black px-3 py-1 rounded-full text-xs font-medium">Fastest alerts</span>
              </div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">Upgrade to Express</h3>
                  <p className="text-sm text-foreground-secondary">1-minute checks with priority alerts and pre-verified slots.</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    ${PLANS.express.price}
                    <span className="text-sm font-normal text-foreground-secondary"> one-time</span>
                  </p>
                </div>
                <button
                  onClick={() => handleUpgrade('express')}
                  disabled={loading === 'express'}
                  className="bg-warning text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-warning/90 transition-colors disabled:opacity-50"
                >
                  {loading === 'express' ? 'Loading...' : 'Upgrade'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <p className="text-xs text-foreground-muted text-center">
              One-time payment. No subscription. Yours forever.
            </p>
          </div>
        )}

        {/* Upgrade from Multi to Express */}
        {isFamily && !isExpress && (
          <div ref={upgradeRef} className="space-y-3 scroll-mt-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Upgrade</h2>
            <div className="bg-surface border border-warning/30 rounded-lg p-4 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-warning text-black px-3 py-1 rounded-full text-xs font-medium">Fastest alerts</span>
              </div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">Upgrade to Express</h3>
                  <p className="text-sm text-foreground-secondary">1-minute checks with priority alerts and pre-verified slots.</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    ${PLANS.express.price}
                    <span className="text-sm font-normal text-foreground-secondary"> one-time</span>
                  </p>
                </div>
                <button
                  onClick={() => handleUpgrade('express')}
                  disabled={loading === 'express'}
                  className="bg-warning text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-warning/90 transition-colors disabled:opacity-50"
                >
                  {loading === 'express' ? 'Loading...' : 'Upgrade'}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <p className="text-xs text-foreground-muted text-center">
              One-time payment. No subscription. Yours forever.
            </p>
          </div>
        )}

        {/* Sign out */}
        <div className="pt-6">
          <button
            onClick={() => setShowSignOutDialog(true)}
            className="flex items-center gap-2 text-foreground-muted hover:text-destructive transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>

      <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <DialogContent className="max-w-xs mx-auto">
          <DialogHeader>
            <DialogTitle>Sign out?</DialogTitle>
            <DialogDescription>
              You'll need to sign in again to access your monitors.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2">
            <button
              onClick={() => setShowSignOutDialog(false)}
              className="flex-1 border border-border text-foreground py-2 rounded-lg hover:bg-surface-muted transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSignOut}
              className="flex-1 bg-destructive text-white py-2 rounded-lg hover:bg-destructive/90 transition-colors text-sm font-medium"
            >
              Sign out
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
