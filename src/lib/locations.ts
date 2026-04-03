export type CBPLocation = {
  id: number
  name: string
  city: string
  state: string
  serviceType: 'GE' | 'TSA' | 'NEXUS' | 'SENTRI' | 'ALL'
}

// Top 50 CBP TTP enrollment locations
// Full list available at: https://ttp.cbp.dhs.gov/schedulerapi/locations/?operationName=GE&lang=en&reasonCode=AP&serviceName=Global%20Entry
export const TOP_LOCATIONS: CBPLocation[] = [
  { id: 5140, name: 'New York  - JFK International Airport', city: 'New York', state: 'NY', serviceType: 'ALL' },
  { id: 5446, name: 'New York  - 26 Federal Plaza', city: 'New York', state: 'NY', serviceType: 'ALL' },
  { id: 5447, name: 'Newark Liberty International Airport', city: 'Newark', state: 'NJ', serviceType: 'ALL' },
  { id: 5003, name: 'Los Angeles International Airport', city: 'Los Angeles', state: 'CA', serviceType: 'ALL' },
  { id: 5006, name: 'San Francisco International Airport', city: 'San Francisco', state: 'CA', serviceType: 'ALL' },
  { id: 5002, name: "Chicago O'Hare International Airport", city: 'Chicago', state: 'IL', serviceType: 'ALL' },
  { id: 5007, name: 'Miami International Airport', city: 'Miami', state: 'FL', serviceType: 'ALL' },
  { id: 5023, name: 'Seattle-Tacoma International Airport', city: 'Seattle', state: 'WA', serviceType: 'ALL' },
  { id: 5021, name: 'Boston Logan International Airport', city: 'Boston', state: 'MA', serviceType: 'ALL' },
  { id: 5004, name: 'Atlanta  - Hartsfield-Jackson Airport', city: 'Atlanta', state: 'GA', serviceType: 'ALL' },
  { id: 5030, name: 'Dallas/Fort Worth International Airport', city: 'Dallas', state: 'TX', serviceType: 'ALL' },
  { id: 5011, name: 'Denver International Airport', city: 'Denver', state: 'CO', serviceType: 'ALL' },
  { id: 5009, name: 'Las Vegas  - Harry Reid International Airport', city: 'Las Vegas', state: 'NV', serviceType: 'ALL' },
  { id: 5013, name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', state: 'AZ', serviceType: 'ALL' },
  { id: 5008, name: 'Washington Dulles International Airport', city: 'Dulles', state: 'VA', serviceType: 'ALL' },
  { id: 5010, name: 'Houston  - George Bush Intercontinental', city: 'Houston', state: 'TX', serviceType: 'ALL' },
  { id: 5012, name: 'Minneapolis-St. Paul International Airport', city: 'Minneapolis', state: 'MN', serviceType: 'ALL' },
  { id: 5014, name: 'Portland International Airport', city: 'Portland', state: 'OR', serviceType: 'ALL' },
  { id: 5015, name: 'San Diego International Airport', city: 'San Diego', state: 'CA', serviceType: 'ALL' },
  { id: 5016, name: 'San Juan  - Luis Muñoz Marín International', city: 'San Juan', state: 'PR', serviceType: 'ALL' },
  { id: 5017, name: 'Philadelphia International Airport', city: 'Philadelphia', state: 'PA', serviceType: 'ALL' },
  { id: 5018, name: 'Detroit Metro Wayne County Airport', city: 'Detroit', state: 'MI', serviceType: 'ALL' },
  { id: 5019, name: 'Charlotte Douglas International Airport', city: 'Charlotte', state: 'NC', serviceType: 'ALL' },
  { id: 5020, name: 'Salt Lake City International Airport', city: 'Salt Lake City', state: 'UT', serviceType: 'ALL' },
  { id: 5022, name: 'Tampa International Airport', city: 'Tampa', state: 'FL', serviceType: 'ALL' },
  { id: 5024, name: 'Orlando International Airport', city: 'Orlando', state: 'FL', serviceType: 'ALL' },
  { id: 5025, name: 'Kansas City International Airport', city: 'Kansas City', state: 'MO', serviceType: 'ALL' },
  { id: 5026, name: 'Sacramento International Airport', city: 'Sacramento', state: 'CA', serviceType: 'ALL' },
  { id: 5027, name: 'Raleigh-Durham International Airport', city: 'Raleigh', state: 'NC', serviceType: 'ALL' },
  { id: 5028, name: 'Indianapolis International Airport', city: 'Indianapolis', state: 'IN', serviceType: 'ALL' },
  { id: 5029, name: 'Pittsburgh International Airport', city: 'Pittsburgh', state: 'PA', serviceType: 'ALL' },
  { id: 5031, name: 'New Orleans International Airport', city: 'New Orleans', state: 'LA', serviceType: 'ALL' },
  { id: 5032, name: 'Memphis International Airport', city: 'Memphis', state: 'TN', serviceType: 'ALL' },
  { id: 5033, name: 'Nashville International Airport', city: 'Nashville', state: 'TN', serviceType: 'ALL' },
  { id: 5034, name: 'Austin-Bergstrom International Airport', city: 'Austin', state: 'TX', serviceType: 'ALL' },
  { id: 5035, name: 'San Antonio International Airport', city: 'San Antonio', state: 'TX', serviceType: 'ALL' },
  { id: 5036, name: 'El Paso International Airport', city: 'El Paso', state: 'TX', serviceType: 'ALL' },
  { id: 5037, name: 'Honolulu  - Daniel K. Inouye International', city: 'Honolulu', state: 'HI', serviceType: 'ALL' },
  { id: 5038, name: 'Anchorage  - Ted Stevens International', city: 'Anchorage', state: 'AK', serviceType: 'ALL' },
  { id: 5039, name: 'Baltimore/Washington International Airport', city: 'Baltimore', state: 'MD', serviceType: 'ALL' },
  { id: 5040, name: 'Columbus International Airport', city: 'Columbus', state: 'OH', serviceType: 'ALL' },
  { id: 5041, name: 'Cleveland Hopkins International Airport', city: 'Cleveland', state: 'OH', serviceType: 'ALL' },
  { id: 5042, name: 'St. Louis Lambert International Airport', city: 'St. Louis', state: 'MO', serviceType: 'ALL' },
  { id: 5043, name: 'Cincinnati/Northern Kentucky International', city: 'Cincinnati', state: 'OH', serviceType: 'ALL' },
  { id: 5044, name: 'Milwaukee Mitchell International Airport', city: 'Milwaukee', state: 'WI', serviceType: 'ALL' },
  { id: 5045, name: 'Richmond International Airport', city: 'Richmond', state: 'VA', serviceType: 'ALL' },
  { id: 5046, name: 'Jacksonville International Airport', city: 'Jacksonville', state: 'FL', serviceType: 'ALL' },
  { id: 5047, name: 'Tucson International Airport', city: 'Tucson', state: 'AZ', serviceType: 'ALL' },
  { id: 5048, name: 'Albuquerque International Airport', city: 'Albuquerque', state: 'NM', serviceType: 'ALL' },
  { id: 5049, name: 'Oklahoma City  - Will Rogers World Airport', city: 'Oklahoma City', state: 'OK', serviceType: 'ALL' },
]

export const SERVICE_TYPES = {
  GE: { label: 'Global Entry', abbr: 'GE', description: 'Expedited US customs for pre-approved travellers. Includes TSA PreCheck.' },
  TSA: { label: 'TSA PreCheck', abbr: 'TSA', description: 'Faster airport security screening at 200+ airports.' },
  NEXUS: { label: 'NEXUS', abbr: 'NEXUS', description: 'Expedited travel between the US and Canada.' },
  SENTRI: { label: 'SENTRI', abbr: 'SENTRI', description: 'Expedited entry at US-Mexico land border crossings.' },
} as const

export type ServiceType = keyof typeof SERVICE_TYPES

export function searchLocations(query: string): CBPLocation[] {
  const q = query.toLowerCase().trim()
  if (!q) return TOP_LOCATIONS
  return TOP_LOCATIONS.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q) ||
      l.state.toLowerCase().includes(q)
  )
}
