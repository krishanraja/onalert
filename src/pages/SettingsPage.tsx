import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Crown, Mail, Smartphone, LogOut, Bell, Users, Activity, CreditCard, KeyRound } from 'lucide-react'
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
import {
  subscribeToPush,
  unsubscribeFromPush,
  isPushSubscribed,
} from '@/lib/pushNotifications'

export function SettingsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, isPaid, isFamily, isExpress, updateProfile } = useProfile()
  const { monitors, loading: monitorsLoading, toggleMonitor, deleteMonitor } = useMonitors()
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  // Push subscription state
  const [pushReady, setPushReady] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)

  // Change-password state
  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  // Open upgrade overlay when navigated here with state or hash
  useEffect(() => {
    if (location.state?.scrollToUpgrade || location.hash === '#upgrade') {
      setUpgradeOpen(true)
    }
  }, [location.state, location.hash])

  // Read current push subscription state on mount
  useEffect(() => {
    let cancelled = false
    isPushSubscribed()
      .then((subscribed) => {
        if (cancelled) return
        setPushEnabled(subscribed)
        setPushReady(true)
      })
      .catch(() => {
        if (!cancelled) setPushReady(true)
      })
    return () => { cancelled = true }
  }, [])

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

  const handleEnablePush = async () => {
    if (pushBusy) return
    setPushBusy(true)
    try {
      if (!('Notification' in window)) {
        showToast('Your browser does not support notifications.', 'error')
        return
      }
      if (Notification.permission === 'denied') {
        showToast('Notifications blocked. Check browser settings.', 'error')
        return
      }
      const ok = await subscribeToPush()
      if (ok) {
        setPushEnabled(true)
        showToast('Push notifications enabled!', 'success')
      } else {
        showToast("Couldn't enable push notifications - try again", 'error')
      }
    } catch {
      showToast("Couldn't enable push notifications - try again", 'error')
    } finally {
      setPushBusy(false)
    }
  }

  const handleDisablePush = async () => {
    if (pushBusy) return
    setPushBusy(true)
    try {
      const ok = await unsubscribeFromPush()
      if (ok) {
        setPushEnabled(false)
        showToast('Push notifications disabled', 'info')
      } else {
        showToast('Failed to disable push notifications', 'error')
      }
    } finally {
      setPushBusy(false)
    }
  }

  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneSaving, setPhoneSaving] = useState(false)
  const [phoneError, setPhoneError] = useState('')

  useEffect(() => {
    if (profile?.phone_number) setPhoneNumber(profile.phone_number)
  }, [profile?.phone_number])

  const handleSavePhone = async () => {
    setPhoneError('')
    if (!phoneNumber.match(/^\+1\d{10}$/)) {
      const msg = 'Enter a valid US number: +1XXXXXXXXXX'
      setPhoneError(msg)
      showToast(msg, 'error')
      return
    }
    setPhoneSaving(true)
    try {
      await updateProfile({ phone_number: phoneNumber })
      showToast('Phone number saved', 'success')
    } catch {
      const msg = 'Failed to save phone number'
      setPhoneError(msg)
      showToast(msg, 'error')
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.")
      return
    }
    if (!supabase) {
      setPasswordError('Service unavailable. Please try again later.')
      return
    }

    setPasswordSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      showToast('Password updated.', 'success')
      setNewPassword('')
      setConfirmPassword('')
      setChangingPassword(false)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setPasswordSaving(false)
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
                  <p className="text-xs text-foreground-secondary">Get notified via email</p>
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
              <div className="px-3 pb-3 -mt-1">
                <label htmlFor="sms-phone" className="text-2xs text-foreground-muted mb-1 block">Phone number (US)</label>
                <div className="flex gap-2">
                  <input
                    id="sms-phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1XXXXXXXXXX"
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-foreground-muted"
                    aria-invalid={phoneError ? 'true' : 'false'}
                  />
                  <button
                    onClick={handleSavePhone}
                    disabled={phoneSaving}
                    className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {phoneSaving ? '...' : 'Save'}
                  </button>
                </div>
                {phoneError && (
                  <p
                    className="text-xs text-destructive mt-1"
                    role="alert"
                    aria-live="assertive"
                  >
                    {phoneError}
                  </p>
                )}
              </div>
            )}

            <div className="px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={16} className="text-foreground-muted" />
                <div>
                  <p className="text-sm font-medium text-foreground">Push notifications</p>
                  <p className="text-xs text-foreground-secondary">
                    Browser push when slots open
                  </p>
                </div>
              </div>
              {pushReady && pushEnabled ? (
                <button
                  onClick={handleDisablePush}
                  disabled={pushBusy}
                  className="text-xs text-foreground-muted hover:text-destructive font-medium transition-colors disabled:opacity-50"
                >
                  {pushBusy ? '...' : 'Disable'}
                </button>
              ) : (
                <button
                  onClick={handleEnablePush}
                  disabled={pushBusy || !pushReady}
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
                >
                  {pushBusy ? '...' : 'Enable'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Security: change password */}
        <div className="space-y-2 shrink-0">
          <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">Security</h2>
          <div className="bg-surface border border-border rounded-lg p-3">
            {!changingPassword ? (
              <button
                onClick={() => setChangingPassword(true)}
                className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors"
              >
                <KeyRound size={16} className="text-foreground-muted" />
                Change password
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label htmlFor="settings-new-password" className="block text-xs font-medium text-foreground mb-1">
                    New password
                  </label>
                  <input
                    id="settings-new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    minLength={6}
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-foreground-muted"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="settings-confirm-password" className="block text-xs font-medium text-foreground mb-1">
                    Confirm password
                  </label>
                  <input
                    id="settings-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    minLength={6}
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-foreground-muted"
                    required
                  />
                </div>
                {passwordError && (
                  <p
                    className="text-xs text-destructive"
                    role="alert"
                    aria-live="assertive"
                  >
                    {passwordError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setChangingPassword(false)
                      setNewPassword('')
                      setConfirmPassword('')
                      setPasswordError('')
                    }}
                    className="flex-1 border border-border text-foreground py-1.5 rounded-lg text-xs hover:bg-surface-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="flex-1 bg-primary text-white py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {passwordSaving ? 'Saving...' : 'Update password'}
                  </button>
                </div>
              </form>
            )}
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
