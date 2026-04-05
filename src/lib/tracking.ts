import { supabase } from './supabase'

export async function trackBookingClick(alertId: string, locationId: number): Promise<number> {
  if (!supabase) return 0
  try {
    const { data } = await supabase.functions.invoke('track-booking-click', {
      body: { alert_id: alertId, location_id: locationId },
    })
    return data?.total_count || 0
  } catch {
    return 0
  }
}

export async function getBookingCount(): Promise<number> {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-booking-click`,
      { method: 'GET' }
    )
    if (!res.ok) return 0
    const data = await res.json()
    return data?.count || 0
  } catch {
    return 0
  }
}
