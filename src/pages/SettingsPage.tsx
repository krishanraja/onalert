import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, Mail, Smartphone, ExternalLink, LogOut } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'
import { createCheckoutSession, openCustomerPortal } from '@/lib/stripe'
import { PLANS } from '@/lib/plans'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

export function SettingsPage() {
  const navigate = useNavigate()
  const { profile, isPremium } = useProfile()
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [smsAlerts, setSmsAlerts] = useState(isPremium)
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)

  const handleUpgrade = async (plan: 'premium_monthly' | 'premium_annual') => {
    setLoading(plan)
    setError('')
    try {
      const url = await createCheckoutSession(plan)
      if (url) {
        window.location.href = url
      } else {
        setError('Could not create checkout session. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'Upgrade failed. Please try again.')
    } finally {
      setLoading('')
    }
  }

  const handleBilling = async () => {
    setLoading('billing')
    setError('')
    try {
      await openCustomerPortal()
    } catch (err: any) {
      setError(err.message || 'Could not open billing portal. Please try again.')
    } finally {
      setLoading('')
    }
  }

  const handleSignOut = async () => {
    if (!supabase) { navigate('/'); return }
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <header className="bg-background-elevated border-b border-border safe-top">
        <div className="px-4 py-4">
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
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
                  {isPremium ? (
                    <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      <Crown size={10} />
                      <span className="text-xs font-medium">PREMIUM</span>
                    </div>
                  ) : (
                    <span className="text-xs text-foreground-muted bg-surface-muted px-2 py-0.5 rounded-full">
                      FREE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isPremium && (
              <button
                onClick={handleBilling}
                disabled={loading === 'billing'}
                className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors disabled:opacity-50"
              >
                <ExternalLink size={14} />
                Manage billing
                {loading === 'billing' && <span className="text-xs">(Loading...)</span>}
              </button>
            )}
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
                onCheckedChange={setEmailAlerts}
                aria-label="Toggle email alerts"
              />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone size={18} className="text-foreground-muted" />
                <div>
                  <p className="font-medium text-foreground">SMS alerts</p>
                  <p className="text-xs text-foreground-secondary">
                    {isPremium ? 'Get notified via text message' : 'Premium feature'}
                  </p>
                </div>
              </div>
              <Switch
                checked={smsAlerts}
                onCheckedChange={setSmsAlerts}
                disabled={!isPremium}
                aria-label="Toggle SMS alerts"
              />
            </div>
          </div>
        </div>

        {/* Upgrade */}
        {!isPremium && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Upgrade</h2>
            <div className="space-y-3">
              {/* Monthly */}
              <div className="bg-surface border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">Premium</h3>
                    <p className="text-2xl font-bold text-foreground">
                      ${PLANS.premium_monthly.price}
                      <span className="text-sm font-normal text-foreground-secondary">/month</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpgrade('premium_monthly')}
                    disabled={loading === 'premium_monthly'}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {loading === 'premium_monthly' ? 'Loading...' : 'Upgrade'}
                  </button>
                </div>
                <ul className="space-y-1">
                  {PLANS.premium_monthly.features.map((feature) => (
                    <li key={feature} className="text-sm text-foreground-secondary">
                      • {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Annual */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 relative">
                <div className="absolute -top-2 left-4">
                  <span className="bg-primary text-white px-2 py-0.5 rounded-full text-xs font-medium">
                    Save $79
                  </span>
                </div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">Premium Annual</h3>
                    <p className="text-2xl font-bold text-foreground">
                      ${PLANS.premium_annual.price}
                      <span className="text-sm font-normal text-foreground-secondary">/year</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpgrade('premium_annual')}
                    disabled={loading === 'premium_annual'}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {loading === 'premium_annual' ? 'Loading...' : 'Upgrade'}
                  </button>
                </div>
                <ul className="space-y-1">
                  {PLANS.premium_annual.features.map((feature) => (
                    <li key={feature} className="text-sm text-foreground-secondary">
                      • {feature}
                    </li>
                  ))}
                </ul>
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
