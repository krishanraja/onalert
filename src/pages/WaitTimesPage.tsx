import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Clock, TrendingUp, Shield } from 'lucide-react'
import { TOP_LOCATIONS, searchLocations } from '@/lib/locations'

interface WaitTimeData {
  location_id: number
  total_slots: number
  avg_fill_minutes: number | null
  last_slot_seen: string
  slots_per_week: number
}

export function WaitTimesPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [waitData, setWaitData] = useState<WaitTimeData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-wait-times`
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setWaitData(data.locations || [])
        }
      } catch {
        // API not available yet
      }
      setLoading(false)
    }
    load()
  }, [])

  const filteredLocations = query ? searchLocations(query) : TOP_LOCATIONS
  const waitMap = new Map(waitData.map(w => [w.location_id, w]))

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 bg-background-elevated border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1 text-foreground-muted hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Wait Time Checker</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <p className="text-sm text-foreground-secondary">
          Check current estimated wait times at any CBP enrollment center. Data based on real cancellation patterns.
        </p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, city, or state..."
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-sm text-foreground-muted">Loading wait times...</div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLocations.map((loc) => {
              const data = waitMap.get(loc.id)
              const effectiveWait = data?.slots_per_week
                ? `~${Math.round(7 / data.slots_per_week)} days`
                : 'No data yet'

              return (
                <div
                  key={loc.id}
                  className="bg-surface border border-border rounded-lg px-4 py-3 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">{loc.name}</div>
                    <div className="text-xs text-foreground-muted">{loc.city}, {loc.state}</div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {data ? (
                      <>
                        <div className="text-right">
                          <div className="text-xs font-medium text-foreground flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-success" />
                            {data.slots_per_week}/wk
                          </div>
                          <div className="text-[10px] text-foreground-muted">cancellations</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3 text-warning" />
                            {effectiveWait}
                          </div>
                          <div className="text-[10px] text-foreground-muted">via OnAlert</div>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-foreground-muted">No data yet</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="text-center pt-4 space-y-3">
          <button
            onClick={() => navigate('/auth')}
            className="bg-primary text-white px-8 py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Start monitoring for free
          </button>
          <p className="text-xs text-foreground-muted flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" />
            30-day money-back guarantee on paid plans
          </p>
        </div>
      </main>
    </div>
  )
}
