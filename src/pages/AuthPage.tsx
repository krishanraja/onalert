import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Mail, Eye, EyeOff } from 'lucide-react'

type AuthMode = 'sign_in' | 'sign_up' | 'magic_link'

export function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<AuthMode>('sign_in')
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

    // Handle auth state changes (magic link, OAuth redirect, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/app')
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      if (!supabase) throw new Error('Service unavailable. Please try again later.')

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app`,
        },
      })

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
      setLoading(false)
    }
  }

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return

    setLoading(true)
    setError('')

    try {
      if (!supabase) throw new Error('Service unavailable. Please try again later.')

      if (mode === 'sign_up') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
          },
        })
        if (error) throw error
        setSent(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) throw error
        // onAuthStateChange will handle navigation
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Confirmation screen after magic link or sign up
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
              We sent a {mode === 'sign_up' ? 'confirmation' : 'sign-in'} link to <strong>{email}</strong>
            </p>
            <p className="text-xs text-foreground-muted">
              Didn't receive it? Check your spam folder or try again.
            </p>
            <button
              onClick={() => { setSent(false); setError('') }}
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
            aria-label="Go back"
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
              src="/brand/icon-light.svg"
              alt="OnAlert"
              className="w-16 h-16 mx-auto mb-4"
            />
            <h1 className="text-xl font-semibold text-foreground mb-2">
              {mode === 'sign_up' ? 'Create your account' : 'Sign in to OnAlert'}
            </h1>
            <p className="text-sm text-foreground-secondary">
              {mode === 'sign_up'
                ? 'Get started with appointment monitoring'
                : 'Monitor government appointments in real time'}
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-foreground-muted">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email + Password form */}
          {mode !== 'magic_link' ? (
            <form onSubmit={handleEmailPassword} className="space-y-4">
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

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'sign_up' ? 'Create a password (min 6 characters)' : 'Enter your password'}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 pr-10 text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? (mode === 'sign_up' ? 'Creating account...' : 'Signing in...')
                  : (mode === 'sign_up' ? 'Create account' : 'Sign in')}
              </button>
            </form>
          ) : (
            /* Magic link form */
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label htmlFor="email-magic" className="block text-sm font-medium text-foreground mb-2">
                  Email address
                </label>
                <input
                  id="email-magic"
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
          )}

          {/* Mode switchers */}
          <div className="text-center mt-6 space-y-2">
            {mode !== 'magic_link' && (
              <button
                onClick={() => { setMode('magic_link'); setError(''); setPassword('') }}
                className="text-xs text-foreground-muted hover:text-foreground-secondary transition-colors block mx-auto"
              >
                Sign in with magic link instead
              </button>
            )}
            {mode === 'magic_link' && (
              <button
                onClick={() => { setMode('sign_in'); setError('') }}
                className="text-xs text-foreground-muted hover:text-foreground-secondary transition-colors block mx-auto"
              >
                Sign in with password instead
              </button>
            )}
            <p className="text-xs text-foreground-muted">
              {mode === 'sign_up' ? (
                <>Already have an account?{' '}
                  <button onClick={() => { setMode('sign_in'); setError('') }} className="text-primary hover:underline">
                    Sign in
                  </button>
                </>
              ) : (
                <>Don't have an account?{' '}
                  <button onClick={() => { setMode('sign_up'); setError('') }} className="text-primary hover:underline">
                    Create one
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
