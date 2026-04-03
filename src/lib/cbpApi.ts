const CBP_BASE = 'https://ttp.cbp.dhs.gov/schedulerapi'

export type CBPSlot = {
  locationId: number
  startTimestamp: string
  endTimestamp: string
  active: boolean
  duration: number
  remoteInd: boolean
}

export async function getAvailableLocations() {
  const res = await fetch(
    `${CBP_BASE}/locations/?operationName=GE&lang=en&reasonCode=AP&serviceName=Global%20Entry`,
    { cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`CBP API error: ${res.status}`)
  return res.json()
}

export async function getSlotsForLocation(
  locationId: number,
  serviceId = 'TP'
): Promise<CBPSlot[]> {
  const res = await fetch(
    `${CBP_BASE}/slots?orderBy=soonest&limit=5&locationId=${locationId}&serviceId=${serviceId}`,
    { cache: 'no-store' }
  )
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
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
