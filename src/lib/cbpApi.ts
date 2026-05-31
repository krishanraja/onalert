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

// CBP schedulerui service codes (verified 2026): the UI expects the short code, not the
// display name. up=Global Entry, nh=NEXUS, sh=SENTRI. Keep in sync with
// supabase/functions/_shared/buildBookUrl.ts.
const SERVICE_CODES: Record<string, string> = {
  GE: 'up',
  NEXUS: 'nh',
  SENTRI: 'sh',
}

// The public scheduler does not support pre-selecting a specific enrollment center or
// slot via URL, so we land the user on the correct program's location list. locationId is
// accepted for signature compatibility but intentionally unused.
export function buildBookUrl(_locationId?: number, serviceType?: string): string {
  const code = serviceType ? SERVICE_CODES[serviceType] : undefined
  if (!code) return CBP_BOOK_URL
  return `https://ttp.cbp.dhs.gov/schedulerui/schedule-interview/location?lang=en&vo=true&returnUrl=ttp-external&service=${code}`
}
