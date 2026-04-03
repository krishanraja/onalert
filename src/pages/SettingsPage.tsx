import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, Mail, Smartphone, LogOut, Bell, Users } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'
import { createCheckoutSession } from '@/lib/stripe'
import { PLANS } from '@/lib/plans'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { showToast } from '@/hooks/useToast'
import { haptic } from '@/lib/haptics'

export function SettingsPage() {
  const navigate = useNavigate()
  const { profile, isPaid, isFamily, updateProfile } = useProfile()
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)

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

  const handleUpgrade = async (plan: 'pro' | 'family') => {
    setLoading(plan)
    setError('')
    try {
      const url = await createCheckoutSession(plan)
      if (url) {
        window.location.href = url
      } else {
        setError('Could not create checkout session. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upgrade failed. Please try again.')
    } finally {
      setLoading('')
    }
  }

  const handleSignOut = async () => {
    if (!supabase) { navigate('/'); return }
    await supabase.auth.signOut()
    navigate('/')
  }

  const planLabel = isFamily ? 'FAMILY' : isPaid ? 'PRO' : 'FREE'

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <header className="bg-background-elevated border-b border-border safe-top lg:hidden">
        <div className="px-4 py-4">
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        </div>
      </header>

      <div className="px-4 lg:px-6 py-6 space-y-6 max-w-2xl lg:mx-0">
        {/* Desktop title */}
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-foreground-secondary mt-1">Manage your account and notifications</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

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
                    <span className="text-xs text-foreground-muted bg-surface-muted px-2 py-0.5 rounded-full">
                      FREE
                    </span>
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

        {/* Upgrade */}
        {!isPaid && (
          <div className="space-y-3">
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

              {/* Family */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 relative">
                <div className="absolute -top-2 left-4">
                  <span className="bg-primary text-white px-2 py-0.5 rounded-full text-xs font-medium">
                    Best for families
                  </span>
                </div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">Family</h3>
                    <p className="text-2xl font-bold text-foreground">
                      ${PLANS.family.price}
                      <span className="text-sm font-normal text-foreground-secondary"> one-time</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpgrade('family')}
                    disabled={loading === 'family'}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {loading === 'family' ? 'Loading...' : 'Buy Family'}
                  </button>
                </div>
                <ul className="space-y-1">
                  {PLANS.family.features.map((feature) => (
                    <li key={feature} className="text-sm text-foreground-secondary">
                      • {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-foreground-muted text-center">
                One-time payment. No subscription. Yours forever.
              </p>
            </div>
          </div>
        )}

        {/* Upgrade from Pro to Family */}
        {isPaid && !isFamily && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Upgrade</h2>
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">Upgrade to Family</h3>
                  <p className="text-sm text-foreground-secondary">Monitor up to 5 programs for the whole family.</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    ${PLANS.family.price}
                    <span className="text-sm font-normal text-foreground-secondary"> one-time</span>
                  </p>
                </div>
                <button
                  onClick={() => handleUpgrade('family')}
                  disabled={loading === 'family'}
                  className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading === 'family' ? 'Loading...' : 'Upgrade'}
                </button>
              </div>
            </div>
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
