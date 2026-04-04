import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronRight,
  RefreshCw, Clock, Zap, Mail, Eye, ArrowRight,
} from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { useAuditData, type HealthCheck, type PipelineStatus } from '@/hooks/useAuditData'
import { formatDistanceToNow } from '@/lib/time'
import type { ScrapeLog } from '@/lib/supabase'

// Subset of location names for display
const LOCATION_NAMES: Record<number, string> = {
  5140: 'JFK Airport, NY', 5446: '26 Federal Plaza, NY', 5447: 'Newark Airport, NJ',
  5003: 'LAX, CA', 5006: 'SFO, CA', 5002: "O'Hare, IL", 5007: 'Miami, FL',
  5023: 'SeaTac, WA', 5021: 'Boston Logan, MA', 5004: 'Atlanta, GA',
  5030: 'DFW, TX', 5011: 'Denver, CO', 5009: 'Las Vegas, NV',
  5013: 'Phoenix, AZ', 5008: 'Dulles, VA', 5010: 'Houston, TX',
  5012: 'Minneapolis, MN', 5014: 'Portland, OR', 5015: 'San Diego, CA',
  5039: 'BWI, MD', 5034: 'Austin, TX', 5037: 'Honolulu, HI',
}

function getLocationLabel(id: number) {
  return LOCATION_NAMES[id] || `Location ${id}`
}

// --- Status Indicator ---
function StatusDot({ status }: { status: PipelineStatus }) {
  const colors = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    down: 'bg-red-500',
  }
  return (
    <span className="relative flex h-3 w-3">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors[status]}`} />
      <span className={`relative inline-flex rounded-full h-3 w-3 ${colors[status]}`} />
    </span>
  )
}

function HealthCheckBadge({ check }: { check: HealthCheck }) {
  const icons = {
    ok: <CheckCircle className="h-4 w-4 text-green-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    critical: <XCircle className="h-4 w-4 text-red-500" />,
  }
  const bg = {
    ok: 'bg-green-500/10 border-green-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20',
    critical: 'bg-red-500/10 border-red-500/20',
  }
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${bg[check.status]}`}>
      {icons[check.status]}
      <div>
        <div className="text-xs font-medium text-foreground">{check.name}</div>
        <div className="text-xs text-foreground-muted">{check.message}</div>
      </div>
    </div>
  )
}

// --- Expandable Poll Run Row ---
function PollRunRow({ run, locationFetches }: {
  run: ScrapeLog
  locationFetches: { location_id: number; http_status: number | null; latency_ms: number | null; slots_returned: number; response_valid: boolean; error: string | null }[]
}) {
  const [expanded, setExpanded] = useState(false)
  const hasError = !!run.error
  const hasAnomalies = run.anomaly_flags && run.anomaly_flags.length > 0

  return (
    <>
      <tr
        className={`border-b border-border cursor-pointer hover:bg-surface-muted/50 transition-colors ${
          hasError ? 'bg-red-500/5' : hasAnomalies ? 'bg-yellow-500/5' : ''
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-3 py-2 text-xs">
          {expanded ? <ChevronDown className="h-3 w-3 inline" /> : <ChevronRight className="h-3 w-3 inline" />}
        </td>
        <td className="px-3 py-2 text-xs font-mono">{formatDistanceToNow(run.started_at)}</td>
        <td className="px-3 py-2 text-xs font-mono">{run.duration_ms ? `${run.duration_ms}ms` : '-'}</td>
        <td className="px-3 py-2 text-xs">
          {run.locations_fetched ?? '-'}
          {(run.locations_failed ?? 0) > 0 && (
            <span className="text-red-400 ml-1">({run.locations_failed} failed)</span>
          )}
        </td>
        <td className="px-3 py-2 text-xs">
          {run.slots_found ?? 0}
          {(run.new_slots_detected ?? 0) > 0 && (
            <span className="text-green-400 ml-1">(+{run.new_slots_detected} new)</span>
          )}
        </td>
        <td className="px-3 py-2 text-xs">
          {run.alerts_created ?? run.new_alerts_fired ?? 0}
          {(run.alerts_delayed ?? 0) > 0 && (
            <span className="text-yellow-400 ml-1">({run.alerts_delayed} delayed)</span>
          )}
        </td>
        <td className="px-3 py-2 text-xs">
          {hasAnomalies ? (
            <span className="text-yellow-400">{run.anomaly_flags!.join(', ')}</span>
          ) : '-'}
        </td>
        <td className="px-3 py-2 text-xs">
          {hasError ? (
            <XCircle className="h-4 w-4 text-red-500 inline" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500 inline" />
          )}
        </td>
      </tr>
      {expanded && locationFetches.length > 0 && (
        <tr className="bg-surface-muted/30">
          <td colSpan={8} className="px-6 py-3">
            <div className="text-xs font-medium text-foreground-muted mb-2">Per-Location Fetch Details</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {locationFetches.map((f, i) => (
                <div key={i} className={`px-3 py-2 rounded border text-xs ${
                  f.error ? 'border-red-500/30 bg-red-500/5' : 'border-border bg-surface'
                }`}>
                  <div className="font-medium">{getLocationLabel(f.location_id)}</div>
                  <div className="text-foreground-muted mt-1">
                    {f.http_status ? `HTTP ${f.http_status}` : 'No response'} | {f.latency_ms}ms | {f.slots_returned} slot(s)
                    {!f.response_valid && <span className="text-yellow-400 ml-1">(invalid)</span>}
                    {f.error && <div className="text-red-400 mt-1">{f.error}</div>}
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
      {expanded && locationFetches.length === 0 && (
        <tr className="bg-surface-muted/30">
          <td colSpan={8} className="px-6 py-3 text-xs text-foreground-muted">
            No per-location data available for this run (pre-audit data)
          </td>
        </tr>
      )}
    </>
  )
}

// --- Main Page ---
export function AdminAuditPage() {
  const navigate = useNavigate()
  const { profile, loading: profileLoading } = useProfile()
  const {
    pollRuns, locationFetches, loading: auditLoading,
    healthChecks, pipelineStatus, alertPipelineStats, locationHealth, refetch,
  } = useAuditData()
  const [activeTab, setActiveTab] = useState<'runs' | 'alerts' | 'locations'>('runs')

  // Redirect non-admins
  useEffect(() => {
    if (!profileLoading && (!profile || !profile.is_admin)) {
      navigate('/app', { replace: true })
    }
  }, [profileLoading, profile, navigate])

  if (profileLoading || auditLoading) {
    return (
      <div className="min-h-full bg-background px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-surface-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!profile?.is_admin) return null

  const lastRun = pollRuns[0]
  const statusLabel = { healthy: 'Healthy', degraded: 'Degraded', down: 'Down' }
  const statusColor = { healthy: 'text-green-400', degraded: 'text-yellow-400', down: 'text-red-400' }

  return (
    <div className="min-h-full bg-background">
      <div className="px-4 py-6 max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Pipeline Audit</h1>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-surface border border-border hover:bg-surface-muted transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>

        {/* Section 1: Live Status Banner */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <StatusDot status={pipelineStatus} />
            <span className={`text-sm font-semibold ${statusColor[pipelineStatus]}`}>
              Pipeline {statusLabel[pipelineStatus]}
            </span>
            {lastRun && (
              <span className="text-xs text-foreground-muted ml-auto flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last poll: {formatDistanceToNow(lastRun.started_at)}
                {lastRun.cbp_avg_latency_ms != null && (
                  <> | Avg latency: {lastRun.cbp_avg_latency_ms}ms</>
                )}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {healthChecks.map((check, i) => (
              <HealthCheckBadge key={i} check={check} />
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
          {([
            { key: 'runs' as const, label: 'Poll Runs', icon: Zap },
            { key: 'alerts' as const, label: 'Alert Pipeline', icon: Mail },
            { key: 'locations' as const, label: 'Location Health', icon: Activity },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Section 2: Poll Run History */}
        {activeTab === 'runs' && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Poll Run History</h2>
              <p className="text-xs text-foreground-muted mt-0.5">Last {pollRuns.length} runs. Click a row to see per-location details.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/50">
                    <th className="px-3 py-2 text-xs font-medium text-foreground-muted text-left w-6"></th>
                    <th className="px-3 py-2 text-xs font-medium text-foreground-muted text-left">Time</th>
                    <th className="px-3 py-2 text-xs font-medium text-foreground-muted text-left">Duration</th>
                    <th className="px-3 py-2 text-xs font-medium text-foreground-muted text-left">Locations</th>
                    <th className="px-3 py-2 text-xs font-medium text-foreground-muted text-left">Slots</th>
                    <th className="px-3 py-2 text-xs font-medium text-foreground-muted text-left">Alerts</th>
                    <th className="px-3 py-2 text-xs font-medium text-foreground-muted text-left">Anomalies</th>
                    <th className="px-3 py-2 text-xs font-medium text-foreground-muted text-left w-8">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pollRuns.map(run => (
                    <PollRunRow
                      key={run.id}
                      run={run}
                      locationFetches={
                        run.run_id
                          ? locationFetches.filter(f => f.run_id === run.run_id)
                          : []
                      }
                    />
                  ))}
                  {pollRuns.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-sm text-foreground-muted">
                        No poll runs recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 3: Alert Pipeline */}
        {activeTab === 'alerts' && (
          <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Alert Pipeline (Last 24h)</h2>

            {/* Funnel */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Mail className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-foreground">{alertPipelineStats.created}</div>
                <div className="text-xs text-foreground-muted">Created</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-foreground">{alertPipelineStats.delivered}</div>
                <div className="text-xs text-foreground-muted">
                  Delivered {alertPipelineStats.created > 0 && (
                    <span>({Math.round(alertPipelineStats.delivered / alertPipelineStats.created * 100)}%)</span>
                  )}
                </div>
              </div>
              <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Eye className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-foreground">{alertPipelineStats.read}</div>
                <div className="text-xs text-foreground-muted">
                  Read {alertPipelineStats.created > 0 && (
                    <span>({Math.round(alertPipelineStats.read / alertPipelineStats.created * 100)}%)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Flow arrows */}
            <div className="flex items-center justify-center gap-2 text-foreground-muted">
              <span className="text-xs">Created</span>
              <ArrowRight className="h-3 w-3" />
              <span className="text-xs">Delivered</span>
              <ArrowRight className="h-3 w-3" />
              <span className="text-xs">Read</span>
            </div>

            {/* Stuck alerts */}
            {alertPipelineStats.stuck > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">
                    {alertPipelineStats.stuck} stuck alert(s)
                  </span>
                </div>
                <p className="text-xs text-foreground-muted mt-1">
                  These alerts were created but never delivered (and are past their delay window).
                </p>
              </div>
            )}
          </div>
        )}

        {/* Section 4: Per-Location Health */}
        {activeTab === 'locations' && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Per-Location Health (Last 24h)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/50">
                    <th className="px-3 py-2 text-xs font-medium text-foreground-muted text-left">Location</th>
                    <th className="px-3 py-2 text-xs font-medium text-foreground-muted text-left">Fetches</th>
                    <th className="px-3 py-2 text-xs font-medium text-foreground-muted text-left">Failures</th>
                    <th className="px-3 py-2 text-xs font-medium text-foreground-muted text-left">Avg Latency</th>
                    <th className="px-3 py-2 text-xs font-medium text-foreground-muted text-left">Avg Slots</th>
                    <th className="px-3 py-2 text-xs font-medium text-foreground-muted text-left">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {locationHealth.map(loc => (
                    <tr key={loc.locationId} className={`border-b border-border ${
                      loc.failureRate > 30 ? 'bg-red-500/5' : ''
                    }`}>
                      <td className="px-3 py-2 text-xs font-medium">{getLocationLabel(loc.locationId)}</td>
                      <td className="px-3 py-2 text-xs font-mono">{loc.totalFetches}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className={loc.failures > 0 ? 'text-red-400' : 'text-green-400'}>
                          {loc.failures} ({loc.failureRate}%)
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs font-mono">
                        <span className={loc.avgLatency > 5000 ? 'text-red-400' : loc.avgLatency > 3000 ? 'text-yellow-400' : ''}>
                          {loc.avgLatency}ms
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs font-mono">{loc.avgSlots}</td>
                      <td className="px-3 py-2 text-xs text-foreground-muted">{formatDistanceToNow(loc.lastSeen)}</td>
                    </tr>
                  ))}
                  {locationHealth.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-foreground-muted">
                        No location fetch data in the last 24 hours
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
