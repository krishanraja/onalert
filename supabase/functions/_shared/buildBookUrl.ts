const CBP_BOOK_URL = 'https://ttp.cbp.dhs.gov/'

const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  GE: 'Global Entry',
  NEXUS: 'NEXUS',
  SENTRI: 'SENTRI',
}

export function buildBookUrl(_locationId?: number, serviceType?: string): string {
  const serviceName = serviceType && SERVICE_DISPLAY_NAMES[serviceType]
  if (!serviceName) return CBP_BOOK_URL
  return `https://ttp.cbp.dhs.gov/schedulerui/schedule-interview/location?service=${encodeURIComponent(serviceName)}&type=new`
}
