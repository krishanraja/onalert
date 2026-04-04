import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). ' +
    'Authenticated features will not work.'
  )
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export type Profile = {
  id: string
  email: string
  stripe_customer_id: string | null
  plan: 'free' | 'pro' | 'family'
  email_alerts_enabled: boolean
  sms_alerts_enabled: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

export type Monitor = {
  id: string
  user_id: string
  type: 'appointment'
  config: {
    location_ids: number[]
    service_type: 'GE' | 'TSA' | 'NEXUS' | 'SENTRI'
    last_known_slots?: Record<string, string[]>
    deadline_date?: string
  }
  active: boolean
  created_at: string
  last_checked_at: string | null
  last_alert_at: string | null
}

export type AlertSlot = {
  location_id: number
  location_name: string
  slot_timestamp: string
  book_url: string
  narrative?: string
}

export type Alert = {
  id: string
  monitor_id: string
  user_id: string
  payload: {
    location_id: number
    location_name: string
    slot_timestamp: string
    book_url: string
    service_type: string
    narrative?: string
    slots?: AlertSlot[]
  }
  channel: 'email' | 'sms'
  delivered_at: string | null
  read_at: string | null
  created_at: string
  delay_until: string | null
}

export type ScrapeLog = {
  id: string
  run_id: string | null
  location_id: number | null
  service_type: string | null
  started_at: string
  completed_at: string | null
  slots_found: number
  new_alerts_fired: number
  error: string | null
  monitors_eligible: number | null
  monitors_skipped: number | null
  locations_fetched: number | null
  locations_failed: number | null
  locations_zero_slots: number | null
  new_slots_detected: number | null
  alerts_created: number | null
  alerts_sent: number | null
  alerts_delayed: number | null
  duration_ms: number | null
  cbp_avg_latency_ms: number | null
  cbp_max_latency_ms: number | null
  anomaly_flags: string[] | null
  metadata: Record<string, unknown> | null
}

export type LocationFetchLog = {
  id: string
  run_id: string
  location_id: number
  http_status: number | null
  latency_ms: number | null
  slots_returned: number
  response_valid: boolean
  error: string | null
  fetched_at: string
}
