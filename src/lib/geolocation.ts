export function getUserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    )
  })
}

// Timezone-based fallback for approximate location when geolocation is denied
export function guessLocationFromTimezone(): { lat: number; lng: number } | null {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  const tzMap: Record<string, { lat: number; lng: number }> = {
    'America/New_York': { lat: 40.7128, lng: -74.0060 },
    'America/Chicago': { lat: 41.8781, lng: -87.6298 },
    'America/Denver': { lat: 39.7392, lng: -104.9903 },
    'America/Los_Angeles': { lat: 34.0522, lng: -118.2437 },
    'America/Phoenix': { lat: 33.4484, lng: -112.0740 },
    'America/Anchorage': { lat: 61.2181, lng: -149.9003 },
    'Pacific/Honolulu': { lat: 21.3069, lng: -157.8583 },
    'America/Detroit': { lat: 42.3314, lng: -83.0458 },
    'America/Indiana/Indianapolis': { lat: 39.7684, lng: -86.1581 },
    'America/Boise': { lat: 43.6150, lng: -116.2023 },
  }

  return tzMap[tz] ?? null
}
