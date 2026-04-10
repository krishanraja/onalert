import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { MapPin, Search, ArrowLeft } from 'lucide-react'
import { TOP_LOCATIONS, searchLocations } from '@/lib/locations'

export function LocationsIndexPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const locations = query ? searchLocations(query) : TOP_LOCATIONS

  return (
    <div className="min-h-dvh bg-background">
      <Helmet>
        <title>CBP Enrollment Centers - Browse All Locations | OnAlert</title>
        <meta name="description" content="Browse CBP enrollment centers nationwide. Search Global Entry, NEXUS & SENTRI interview locations by name, city, or state." />
        <link rel="canonical" href="https://onalert.app/locations" />
      </Helmet>
      <header className="sticky top-0 z-10 bg-background-elevated border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1 text-foreground-muted hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">CBP Enrollment Centers</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, city, or state..."
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted"
          />
        </div>

        <p className="text-xs text-foreground-muted mb-3">{locations.length} locations</p>

        <div className="grid gap-2">
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => navigate(`/locations/${loc.id}`)}
              className="flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-3 hover:bg-surface-muted transition-colors text-left w-full"
            >
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{loc.name}</div>
                <div className="text-xs text-foreground-muted">{loc.city}, {loc.state}</div>
              </div>
            </button>
          ))}
        </div>
      </main>

      <footer className="py-6 px-4 text-center">
        <button
          onClick={() => navigate('/auth')}
          className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Monitor a location
        </button>
      </footer>
    </div>
  )
}
