const CBP_BOOK_URL = 'https://ttp.cbp.dhs.gov/'

// The CBP schedulerui "Choose Location" step accepts a SERVICE CODE, not the display
// name. Sending "Global Entry" (the old bug) dropped users on a blank/generic picker.
// Verified 2026: up=Global Entry, nh=NEXUS, sh=SENTRI.
const SERVICE_CODES: Record<string, string> = {
  GE: 'up',
  NEXUS: 'nh',
  SENTRI: 'sh',
}

// Note: the public scheduler does NOT support pre-selecting a specific enrollment center
// or slot via URL (the locationId scheme belongs to the schedulerapi, not the UI router),
// so the best achievable is landing on the correct program's location list. locationId is
// accepted for signature compatibility but intentionally unused.
export function buildBookUrl(_locationId?: number, serviceType?: string): string {
  const code = serviceType ? SERVICE_CODES[serviceType] : undefined
  if (!code) return CBP_BOOK_URL
  return `https://ttp.cbp.dhs.gov/schedulerui/schedule-interview/location?lang=en&vo=true&returnUrl=ttp-external&service=${code}`
}
