import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, Mail, Smartphone, ExternalLink, LogOut } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'
import { createCheckoutSession, openCustomerPortal, PLANS } from '@/lib/stripe'
import { cn } from '@/lib/utils'

export function SettingsPage() {
  const navigate = useNavigate()
  const { profile, isPremium } = useProfile()
  const [loading, setLoading] = useState('')

  const handleUpgrade = async (plan: 'premium_monthly' | 'premium_annual') => {
    setLoading(plan)
    try {
      const url = await createCheckoutSession(plan)
      if (url) window.location.href = url
    } catch (error) {
      console.error('Upgrade failed:', error)
    } finally {
      setLoading('')
    }
  }

  const handleBilling = async () => {
    setLoading('billing')
    try {
      await openCustomerPortal()
    } catch (error) {
      console.error('Portal failed:', error)
    } finally {
      setLoading('')
    }
  }

  const handleSignOut = async () => {
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
              <div className="w-11 h-6 bg-primary rounded-full flex items-center justify-end px-1">
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
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
              <div className={cn(
                'w-11 h-6 rounded-full flex items-center px-1',
                isPremium ? 'bg-primary justify-end' : 'bg-border justify-start'
              )}>
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
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
            onClick={handleSignOut}
            className="flex items-center gap-2 text-foreground-muted hover:text-destructive transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
