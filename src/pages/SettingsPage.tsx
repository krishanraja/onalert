import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Crown, Mail, Smartphone, LogOut, Bell, Users, Activity, CreditCard } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'
import { useMonitors } from '@/hooks/useMonitors'
import { MonitorRow } from '@/components/settings/MonitorRow'
import { UpgradeOverlay } from '@/components/settings/UpgradeOverlay'
import { createPortalSession } from '@/lib/stripe'
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
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  // Open upgrade overlay when navigated here with state or hash
  useEffect(() => {
    if (location.state?.scrollToUpgrade || location.hash === '#upgrade') {
      setUpgradeOpen(true)
    }
  }, [location.state, location.hash])

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

  const handleManageBilling = async () => {
    setPortalLoading(true)
    try {
      const url = await createPortalSession()
      window.location.href = url
    } catch {
      showToast('Could not open billing portal', 'error')
    }
    setPortalLoading(false)
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

      <div className="flex-1 flex flex-col overflow-hidden px-4 lg:px-6 pt-3 pb-2 gap-3 max-w-2xl lg:mx-0">
        {/* Desktop title */}
        <div className="hidden lg:flex flex-col shrink-0">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-foreground-secondary mt-1">Manage your account and notifications</p>
        </div>

        {/* Account */}
        <div className="bg-surface border border-border rounded-lg p-3 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <p className="font-medium text-foreground text-sm truncate">{profile?.email}</p>
            {isPaid && (
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-primary transition-colors mt-1 disabled:opacity-50"
              >
                <CreditCard size={14} />
                {portalLoading ? 'Opening...' : 'Manage billing'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {isFamily ? <Users size={10} /> : isPaid ? <Crown size={10} /> : null}
              <span className="text-xs font-medium">{planLabel}</span>
            </div>
            {!isExpress && (
              <button
                onClick={() => setUpgradeOpen(true)}
                className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Crown size={14} />
                Upgrade
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-2 shrink-0">
          <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">Notifications</h2>
          <div className="bg-surface border border-border rounded-lg divide-y divide-border">
            <div className="px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-foreground-muted" />
                <div>
                  <p className="text-sm font-medium text-foreground">Email alerts</p>
                  <p className="text-[11px] text-foreground-secondary">Get notified via email</p>
                </div>
              </div>
              <Switch
                checked={emailAlerts}
                onCheckedChange={handleToggleEmail}
                aria-label="Toggle email alerts"
              />
            </div>

            <div className="px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone size={16} className="text-foreground-muted" />
                <div>
                  <p className="text-sm font-medium text-foreground">SMS alerts</p>
                  <p className="text-[11px] text-foreground-secondary">
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
              <div className="px-3 pb-3 -mt-1">
                <label className="text-[11px] text-foreground-muted mb-1 block">Phone number (US)</label>
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

            <div className="px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={16} className="text-foreground-muted" />
                <div>
                  <p className="text-sm font-medium text-foreground">Push notifications</p>
                  <p className="text-[11px] text-foreground-secondary">
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
        <div className="flex-1 min-h-0 flex flex-col">
          <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-wide shrink-0 mb-2">Monitors</h2>
          <div className="flex-1 overflow-y-auto space-y-2">
            {monitorsLoading ? (
              <div className="bg-surface border border-border rounded-lg p-3">
                <p className="text-xs text-foreground-muted">Loading monitors...</p>
              </div>
            ) : monitors.length === 0 ? (
              <div className="bg-surface border border-border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Activity size={16} className="text-foreground-muted" />
                  <p className="text-xs text-foreground-muted">No monitors set up yet.</p>
                </div>
              </div>
            ) : (
              monitors.map((monitor) => (
                <MonitorRow
                  key={monitor.id}
                  monitor={monitor}
                  onToggle={toggleMonitor}
                  onDelete={deleteMonitor}
                />
              ))
            )}
          </div>
        </div>

        {/* Sign out */}
        <div className="shrink-0 pb-2">
          <button
            onClick={() => setShowSignOutDialog(true)}
            className="flex items-center gap-2 text-sm text-foreground-muted hover:text-destructive transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={14} />
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

      <UpgradeOverlay
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        currentPlan={profile?.plan ?? 'free'}
      />
    </div>
  )
}
