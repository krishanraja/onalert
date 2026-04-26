// CBP scheduler URL helpers (browser-side).
// NOTE: Direct CBP API calls (slots, locations) are not viable from the browser
// due to CORS restrictions. All polling happens server-side in supabase functions.

export type CBPSlot = {
  locationId: number
  startTimestamp: string
  endTimestamp: string
  active: boolean
  duration: number
  remoteInd: boolean
}

export function formatSlotTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York',
  })
}

export function minutesUntilExpiry(timestamp: string): number {
  const slotTime = new Date(timestamp).getTime()
  const now = Date.now()
  return Math.max(0, Math.round((slotTime - now) / 60000))
}

export const CBP_BOOK_URL = 'https://ttp.cbp.dhs.gov/'

const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  GE: 'Global Entry',
  NEXUS: 'NEXUS',
  SENTRI: 'SENTRI',
}

export function buildBookUrl(locationId?: number, serviceType?: string): string {
  const serviceName = serviceType && SERVICE_DISPLAY_NAMES[serviceType]
  if (!serviceName) return CBP_BOOK_URL
  const base = `https://ttp.cbp.dhs.gov/schedulerui/schedule-interview/location?service=${encodeURIComponent(serviceName)}&type=new`
  // TODO: validate that &location=${id} matches CBP scheduler URL spec — best-effort
  // pre-selection so the user lands on the right enrollment center when possible.
  if (typeof locationId === 'number') {
    return `${base}&location=${encodeURIComponent(String(locationId))}`
  }
  return base
}
