import { TOP_LOCATIONS, type CBPLocation } from './locations'

// Approximate lat/lng for top locations (for distance-based recommendations)
const LOCATION_COORDS: Record<number, [number, number]> = {
  5140: [40.6413, -73.7781],  // JFK
  5446: [40.7143, -74.0060],  // Federal Plaza NYC
  5447: [40.6895, -74.1745],  // Newark
  5003: [33.9416, -118.4085], // LAX
  5006: [37.6213, -122.3790], // SFO
  5002: [41.9742, -87.9073],  // ORD
  5007: [25.7959, -80.2870],  // MIA
  5023: [47.4502, -122.3088], // SEA
  5021: [42.3656, -71.0096],  // BOS
  5004: [33.6407, -84.4277],  // ATL
  5030: [32.8998, -97.0403],  // DFW
  5011: [39.8561, -104.6737], // DEN
  5009: [36.0840, -115.1537], // LAS
  5013: [33.4373, -112.0078], // PHX
  5008: [38.9531, -77.4565],  // IAD
  5010: [29.9902, -95.3368],  // IAH
  5012: [44.8848, -93.2223],  // MSP
  5014: [45.5898, -122.5951], // PDX
  5015: [32.7338, -117.1933], // SAN
  5017: [39.8744, -75.2424],  // PHL
  5018: [42.2162, -83.3554],  // DTW
  5020: [40.7899, -111.9791], // SLC
  5024: [28.4312, -81.3081],  // MCO
  5039: [39.1774, -76.6684],  // BWI
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export interface LocationRecommendation {
  location: CBPLocation
  reason: string
  distanceMiles: number | null
}

export function getRecommendations(
  selectedIds: number[],
  maxResults = 3
): LocationRecommendation[] {
  if (selectedIds.length === 0) return []

  const recommendations: LocationRecommendation[] = []

  // Find nearby locations to the selected ones
  for (const selectedId of selectedIds) {
    const selectedCoords = LOCATION_COORDS[selectedId]
    if (!selectedCoords) continue

    const selectedLocation = TOP_LOCATIONS.find((l) => l.id === selectedId)
    if (!selectedLocation) continue

    for (const candidate of TOP_LOCATIONS) {
      if (selectedIds.includes(candidate.id)) continue
      if (recommendations.some((r) => r.location.id === candidate.id)) continue

      const candidateCoords = LOCATION_COORDS[candidate.id]
      if (!candidateCoords) continue

      const distance = haversineDistance(
        selectedCoords[0], selectedCoords[1],
        candidateCoords[0], candidateCoords[1]
      )

      if (distance <= 150) {
        recommendations.push({
          location: candidate,
          reason: `${Math.round(distance)} mi from ${selectedLocation.city} - adds more slot opportunities`,
          distanceMiles: Math.round(distance),
        })
      }
    }
  }

  // Sort by distance (closest first)
  recommendations.sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity))
  return recommendations.slice(0, maxResults)
}

export function getNearestLocations(
  lat: number,
  lng: number,
  count = 3
): CBPLocation[] {
  const withDistance = TOP_LOCATIONS
    .map((loc) => {
      const coords = LOCATION_COORDS[loc.id]
      if (!coords) return { loc, distance: Infinity }
      return { loc, distance: haversineDistance(lat, lng, coords[0], coords[1]) }
    })
    .sort((a, b) => a.distance - b.distance)

  return withDistance.slice(0, count).map((w) => w.loc)
}
