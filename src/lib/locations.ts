export type CBPLocation = {
  id: number
  name: string
  city: string
  state: string
  services: readonly ServiceType[]
}

// CBP TTP enrollment locations — IDs verified against live CBP schedulerapi
// Full list: https://ttp.cbp.dhs.gov/schedulerapi/locations/?operationName=GE&lang=en&reasonCode=AP&serviceName=Global%20Entry
export const TOP_LOCATIONS: CBPLocation[] = [
  { id: 5140, name: 'New York - JFK International Airport', city: 'New York', state: 'NY', services: ['GE'] },
  { id: 6480, name: 'New York - Bowling Green', city: 'New York', state: 'NY', services: ['GE'] },
  { id: 5444, name: 'Newark Liberty International Airport', city: 'Newark', state: 'NJ', services: ['GE'] },
  { id: 5180, name: 'Los Angeles International Airport', city: 'Los Angeles', state: 'CA', services: ['GE'] },
  { id: 5446, name: 'San Francisco Enrollment Center', city: 'San Francisco', state: 'CA', services: ['GE'] },
  { id: 5183, name: "Chicago O'Hare International Airport", city: 'Chicago', state: 'IL', services: ['GE'] },
  { id: 5181, name: 'Miami International Airport', city: 'Miami', state: 'FL', services: ['GE'] },
  { id: 5420, name: 'Seattle-Tacoma International Airport', city: 'Seattle', state: 'WA', services: ['GE'] },
  { id: 5441, name: 'Boston-Logan International Airport', city: 'Boston', state: 'MA', services: ['GE'] },
  { id: 5182, name: 'Atlanta - Hartsfield-Jackson Airport', city: 'Atlanta', state: 'GA', services: ['GE'] },
  { id: 5300, name: 'Dallas/Fort Worth International Airport', city: 'Dallas', state: 'TX', services: ['GE'] },
  { id: 6940, name: 'Denver International Airport', city: 'Denver', state: 'CO', services: ['GE'] },
  { id: 5360, name: 'Las Vegas Enrollment Center', city: 'Las Vegas', state: 'NV', services: ['GE'] },
  { id: 7160, name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', state: 'AZ', services: ['GE', 'SENTRI'] },
  { id: 5142, name: 'Washington Dulles International Airport', city: 'Dulles', state: 'VA', services: ['GE'] },
  { id: 5141, name: 'Houston - George Bush Intercontinental', city: 'Houston', state: 'TX', services: ['GE'] },
  { id: 6840, name: 'Minneapolis-St. Paul International Airport', city: 'Minneapolis', state: 'MN', services: ['GE'] },
  { id: 7960, name: 'Portland International Airport', city: 'Portland', state: 'OR', services: ['GE'] },
  { id: 16547, name: 'San Diego International Airport', city: 'San Diego', state: 'CA', services: ['GE'] },
  { id: 5400, name: 'San Juan - Luis Munoz Marin International', city: 'San Juan', state: 'PR', services: ['GE'] },
  { id: 5445, name: 'Philadelphia International Airport', city: 'Philadelphia', state: 'PA', services: ['GE'] },
  { id: 5320, name: 'Detroit Metro Wayne County Airport', city: 'Detroit', state: 'MI', services: ['GE'] },
  { id: 14321, name: 'Charlotte Douglas International Airport', city: 'Charlotte', state: 'NC', services: ['GE'] },
  { id: 7600, name: 'Salt Lake City International Airport', city: 'Salt Lake City', state: 'UT', services: ['GE'] },
  { id: 8020, name: 'Tampa Enrollment Center', city: 'Tampa', state: 'FL', services: ['GE'] },
  { id: 5380, name: 'Orlando International Airport', city: 'Orlando', state: 'FL', services: ['GE'] },
  { id: 12781, name: 'Kansas City Enrollment Center', city: 'Kansas City', state: 'MO', services: ['GE'] },
  { id: 16970, name: 'Indianapolis Enrollment Center', city: 'Indianapolis', state: 'IN', services: ['GE'] },
  { id: 9200, name: 'Pittsburgh International Airport', city: 'Pittsburgh', state: 'PA', services: ['GE'] },
  { id: 9740, name: 'New Orleans Enrollment Center', city: 'New Orleans', state: 'LA', services: ['GE'] },
  { id: 13621, name: 'Memphis International Airport', city: 'Memphis', state: 'TN', services: ['GE'] },
  { id: 10260, name: 'Nashville Enrollment Center', city: 'Nashville', state: 'TN', services: ['GE'] },
  { id: 7820, name: 'Austin-Bergstrom International Airport', city: 'Austin', state: 'TX', services: ['GE'] },
  { id: 7520, name: 'San Antonio International Airport', city: 'San Antonio', state: 'TX', services: ['GE'] },
  { id: 5005, name: 'El Paso Enrollment Center', city: 'El Paso', state: 'TX', services: ['GE', 'SENTRI'] },
  { id: 5340, name: 'Honolulu - Daniel K. Inouye International', city: 'Honolulu', state: 'HI', services: ['GE'] },
  { id: 7540, name: 'Anchorage Enrollment Center', city: 'Anchorage', state: 'AK', services: ['GE'] },
  { id: 7940, name: 'Baltimore/Washington International Airport', city: 'Baltimore', state: 'MD', services: ['GE'] },
  { id: 9180, name: 'Cleveland Enrollment Center', city: 'Cleveland', state: 'OH', services: ['GE'] },
  { id: 12021, name: 'St. Louis Enrollment Center', city: 'St. Louis', state: 'MO', services: ['GE'] },
  { id: 7680, name: 'Cincinnati Enrollment Center', city: 'Cincinnati', state: 'OH', services: ['GE'] },
  { id: 7740, name: 'Milwaukee Enrollment Center', city: 'Milwaukee', state: 'WI', services: ['GE'] },
  { id: 14981, name: 'Richmond Enrollment Center', city: 'Richmond', state: 'VA', services: ['GE'] },
  { id: 9240, name: 'Tucson Enrollment Center', city: 'Tucson', state: 'AZ', services: ['GE', 'SENTRI'] },
  { id: 8040, name: 'Albuquerque Enrollment Center', city: 'Albuquerque', state: 'NM', services: ['GE', 'SENTRI'] },
]

export const SERVICE_TYPES = {
  GE: { label: 'Global Entry', abbr: 'GE', description: 'Expedited US customs for pre-approved travellers. Includes TSA PreCheck.' },
  NEXUS: { label: 'NEXUS', abbr: 'NEXUS', description: 'Expedited travel between the US and Canada.' },
  SENTRI: { label: 'SENTRI', abbr: 'SENTRI', description: 'Expedited entry at US-Mexico land border crossings.' },
} as const

export type ServiceType = keyof typeof SERVICE_TYPES

export function searchLocations(query: string, serviceType?: ServiceType): CBPLocation[] {
  let results = TOP_LOCATIONS
  if (serviceType) {
    results = results.filter((l) => l.services.includes(serviceType))
  }
  const q = query.toLowerCase().trim()
  if (!q) return results
  return results.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q) ||
      l.state.toLowerCase().includes(q)
  )
}
