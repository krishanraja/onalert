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
  }
  active: boolean
  created_at: string
  last_checked_at: string | null
  last_alert_at: string | null
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
  }
  channel: 'email' | 'sms'
  delivered_at: string | null
  read_at: string | null
  created_at: string
}
