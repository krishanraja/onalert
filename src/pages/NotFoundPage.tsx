import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Helmet>
        <title>Page Not Found | OnAlert</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-accent mb-2">404</div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Page not found</h1>
        <p className="text-foreground-secondary mb-8">
          This page doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl 
                       bg-surface-elevated text-foreground hover:bg-surface-muted 
                       transition-colors min-h-[44px]"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-3 rounded-xl 
                       bg-accent text-background font-medium hover:bg-accent/90 
                       transition-colors min-h-[44px]"
          >
            <Home size={18} />
            Home
          </button>
        </div>
      </div>
    </div>
  )
}
