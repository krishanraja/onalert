const CBP_BOOK_URL = 'https://ttp.cbp.dhs.gov/'

export function buildBookUrl(locationId?: number, serviceType?: string): string {
  if (!locationId) return CBP_BOOK_URL
  const params = new URLSearchParams({ id: locationId.toString(), lang: 'en' })
  if (serviceType) params.set('serviceType', serviceType)
  return `https://ttp.cbp.dhs.gov/schedulerui/schedule-interview/location?${params.toString()}`
}
