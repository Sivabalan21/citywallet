import { useEffect, useState } from 'react'

let isLoaded = false
let isLoading = false
const callbacks = []

export function loadGoogleMaps(apiKey) {
  return new Promise((resolve) => {
    if (isLoaded) return resolve()
    callbacks.push(resolve)
    if (isLoading) return
    isLoading = true

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding`
    script.async = true
    script.onload = () => {
      isLoaded = true
      callbacks.forEach(cb => cb())
    }
    document.head.appendChild(script)
  })
}

export default function GoogleMapsLoader({ children }) {
  const [loaded, setLoaded] = useState(isLoaded)

  useEffect(() => {
    if (isLoaded) return setLoaded(true)
    loadGoogleMaps(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
      .then(() => setLoaded(true))
  }, [])

  if (!loaded) return null
  return children
}