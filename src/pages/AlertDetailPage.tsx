import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, MapPin, Calendar, Clock } from 'lucide-react'
import { supabase, type Alert } from '@/lib/supabase'
import { useAlerts } from '@/hooks/useAlerts'
import { SERVICE_TYPES } from '@/lib/locations'
import { formatSlotDate, formatSlotTime, minutesSince } from '@/lib/time'
import { CBP_BOOK_URL } from '@/lib/cbpApi'

export function AlertDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { markRead } = useAlerts()
  const [alert, setAlert] = useState<Alert | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    async function load() {
      if (!supabase) { setLoading(false); return }

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Failed to load alert:', error)
      }

      setAlert(data)
      setLoading(false)

      // Mark as read
      if (data && !data.read_at) {
        markRead(data.id)
      }
    }

    load()
  }, [id, markRead])

  // Haptic feedback for recent alerts
  useEffect(() => {
    if (alert && 'vibrate' in navigator) {
      const ageMinutes = minutesSince(alert.created_at)
      if (ageMinutes < 30) {
        navigator.vibrate([100, 50, 100])
      }
    }
  }, [alert])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-1 h-1 rounded-full bg-primary animate-ping" />
      </div>
    )
  }

  if (!alert) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-foreground mb-2">Alert not found</h1>
          <button onClick={() => navigate('/app/alerts')} className="text-primary hover:underline">
            Back to alerts
          </button>
        </div>
      </div>
    )
  }

  const serviceType = alert.payload.service_type as keyof typeof SERVICE_TYPES
  const service = SERVICE_TYPES[serviceType] ?? { abbr: serviceType, label: serviceType }
  const ageMinutes = minutesSince(alert.created_at)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background-elevated border-b border-border safe-top">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/app/alerts')}
            className="p-2 -ml-2 text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-foreground">Alert Details</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Service badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium bg-primary/10 text-primary px-2 py-1 rounded">
            {service.abbr}
          </span>
          <span className="text-xs text-foreground-muted">
            Appeared {ageMinutes < 1 ? 'just now' : `${ageMinutes}m ago`}
          </span>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            {alert.payload.location_name}
          </h2>
          <div className="flex items-center gap-1.5 text-foreground-secondary">
            <MapPin size={14} />
            <span className="text-sm">{service.label} enrollment center</span>
          </div>
        </div>

        {/* Slot details */}
        <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-foreground-muted">
            <Calendar size={16} />
            <span className="text-sm font-medium">Available appointment</span>
          </div>
          
          <div className="space-y-1">
            <p className="text-2xl font-mono font-bold text-primary">
              {formatSlotTime(alert.payload.slot_timestamp)}
            </p>
            <p className="text-foreground font-medium">
              {formatSlotDate(alert.payload.slot_timestamp)}
            </p>
          </div>

          {alert.payload.narrative && (
            <div className="pt-3 border-t border-border">
              <p className="text-sm text-foreground-secondary leading-relaxed">
                {alert.payload.narrative}
              </p>
            </div>
          )}
        </div>

        {/* Warning for older alerts */}
        {ageMinutes > 10 && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Time-sensitive</p>
                <p className="text-xs text-foreground-secondary">
                  This slot appeared {ageMinutes} minutes ago. It may no longer be available.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-6">
          <button
            onClick={() => window.open(CBP_BOOK_URL, '_blank')}
            className="w-full bg-primary text-white py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink size={18} />
            Book this slot
          </button>

          <button
            onClick={() => navigate('/app/alerts')}
            className="w-full border border-border text-foreground py-3 rounded-lg font-medium hover:bg-surface-muted transition-colors"
          >
            Back to alerts
          </button>
        </div>
      </div>
    </div>
  )
}