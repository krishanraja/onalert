import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Mail } from 'lucide-react'

export function AuthPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (!supabase) return

    // Check if already authenticated
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/app')
    })

    // Handle magic link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/app')
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError('')

    try {
      if (!supabase) throw new Error('Service unavailable. Please try again later.')

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/app`,
        },
      })

      if (error) throw error
      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-surface border border-border rounded-lg p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-foreground mb-2">Check your email</h1>
            <p className="text-sm text-foreground-secondary mb-4">
              We sent a sign-in link to <strong>{email}</strong>
            </p>
            <p className="text-xs text-foreground-muted">
              Didn't receive it? Check your spam folder or try again.
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-xs text-primary hover:underline mt-3"
            >
              Try different email
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="safe-top">
        <div className="px-4 py-4 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      </header>

      {/* Auth form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img 
              src="/brand/icon-192.png" 
              alt="OnAlert" 
              className="w-16 h-16 mx-auto mb-4" 
            />
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Sign in to OnAlert
            </h1>
            <p className="text-sm text-foreground-secondary">
              Enter your email to sign in or create your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending link...' : 'Send magic link'}
            </button>
          </form>

          <p className="text-xs text-foreground-muted text-center mt-6">
            We'll send you a link — no password needed
          </p>
        </div>
      </div>
    </div>
  )
}