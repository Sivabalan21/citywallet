import { create } from 'zustand'

export const useLocation = create((set, get) => ({
  lat: 40.7580,
  lng: -73.9855,
  neighborhood: 'Times Square, NYC',
  isWatching: false,
  watchId: null,
  locationInitialized: false,

  initializeLocation: () => {
    if (get().locationInitialized) return
    set({ locationInitialized: true })

    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const neighborhood = await reverseGeocode(latitude, longitude)
        set({ lat: latitude, lng: longitude, neighborhood })
      },
      (err) => {
        console.log('GPS unavailable, using Times Square as default:', err.message)
        // Keep Times Square as fallback — user can change manually
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  },

  setLocation: (lat, lng, neighborhood = 'New York City') => {
    set({ lat, lng, neighborhood })
  },

  startWatching: () => {
    if (!navigator.geolocation) return
    const { isWatching, stopWatching } = get()
    if (isWatching) stopWatching()

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const { lat: currentLat, lng: currentLng } = get()

        const distance = getDistance(currentLat, currentLng, latitude, longitude)
        if (distance > 200) {
          const neighborhood = await reverseGeocode(latitude, longitude)
          set({ lat: latitude, lng: longitude, neighborhood })
        }
      },
      (err) => console.error('Geolocation error:', err),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
    )
    set({ isWatching: true, watchId })
  },

  stopWatching: () => {
    const { watchId } = get()
    if (watchId) navigator.geolocation.clearWatch(watchId)
    set({ isWatching: false, watchId: null })
  }
}))

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function reverseGeocode(lat, lng) {
  try {
    // Use Google Maps Geocoder if available
    if (window.google?.maps?.Geocoder) {
      const geocoder = new window.google.maps.Geocoder()
      const result = await geocoder.geocode({ location: { lat, lng } })
      if (result.results[0]) {
        const components = result.results[0].address_components
        const neighborhood = components.find(c =>
          c.types.includes('neighborhood') || c.types.includes('sublocality')
        )
        return neighborhood?.long_name
          ? `${neighborhood.long_name}, NYC`
          : result.results[0].formatted_address.split(',')[0] + ', NYC'
      }
    }

    // Fallback — use Google Geocoding REST API directly
    const key = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY
    if (key) {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`
      )
      const data = await res.json()
      if (data.results?.[0]) {
        const components = data.results[0].address_components
        const neighborhood = components.find(c =>
          c.types.includes('neighborhood') || c.types.includes('sublocality')
        )
        const city = components.find(c => c.types.includes('locality'))
        return neighborhood?.long_name
          ? `${neighborhood.long_name}, ${city?.short_name || 'NYC'}`
          : data.results[0].formatted_address.split(',')[0]
      }
    }

    return 'New York City'
  } catch {
    return 'New York City'
  }
}