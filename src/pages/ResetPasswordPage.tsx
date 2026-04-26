import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/hooks/useToast'

/**
 * Mounted at /auth/reset. Supabase delivers the user here via the password
 * reset email link with a recovery session attached. We then let them set
 * a new password via supabase.auth.updateUser.
 */
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    if (!supabase) {
      setHasSession(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    if (!supabase) {
      setError('Service unavailable. Please try again later.')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      showToast('Password updated. You are signed in.', 'success')
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Reset password | OnAlert</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <header className="safe-top">
        <div className="px-4 py-4 flex items-center">
          <button
            onClick={() => navigate('/auth')}
            aria-label="Back to sign in"
            className="p-2 -ml-2 text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-1">Set a new password</h1>
            <p className="text-sm text-foreground-secondary">
              Choose a strong password you don't use anywhere else.
            </p>
          </div>

          {hasSession === false && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-foreground" role="alert" aria-live="assertive">
                This reset link looks expired or already used. Request a new one from the sign-in page.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-foreground mb-2">
                New password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 pr-10 text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-foreground-muted hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground mb-2">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your new password"
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert" aria-live="assertive">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || hasSession === false}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
