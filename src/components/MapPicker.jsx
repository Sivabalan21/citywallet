import { useEffect, useRef, useState } from 'react'
import { useLocation } from '../store/useLocation'

export default function MapPicker({ onClose }) {
  const { lat, lng, setLocation, startWatching, isWatching } = useLocation()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const searchBoxRef = useRef(null)
  const [selectedLat, setSelectedLat] = useState(lat)
  const [selectedLng, setSelectedLng] = useState(lng)
  const [address, setAddress] = useState('Times Square, NYC')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    if (!window.google) return
    initMap()
  }, [])

  const initMap = () => {
  // Dismiss Google Maps error dialogs automatically
  setTimeout(() => {
    const buttons = document.querySelectorAll('button')
    buttons.forEach(btn => {
      if (btn.textContent === 'OK') btn.click()
    })
  }, 500)
    
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 15,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1a1a27' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0f' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d3f' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0a2e' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] }
      ],
      disableDefaultUI: true,
      zoomControl: true
    })

    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map,
      draggable: true,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#7C3AED',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    })

    // Click on map to set location
    map.addListener('click', async (e) => {
      const newLat = e.latLng.lat()
      const newLng = e.latLng.lng()
      marker.setPosition({ lat: newLat, lng: newLng })
      setSelectedLat(newLat)
      setSelectedLng(newLng)
      await reverseGeocode(newLat, newLng)
    })

    marker.addListener('dragend', async (e) => {
      const newLat = e.latLng.lat()
      const newLng = e.latLng.lng()
      setSelectedLat(newLat)
      setSelectedLng(newLng)
      await reverseGeocode(newLat, newLng)
    })

    // Search box autocomplete
    const searchBox = new window.google.maps.places.Autocomplete(
      searchBoxRef.current,
      {
        componentRestrictions: { country: 'us' },
        fields: ['geometry', 'formatted_address', 'name']
      }
    )

    searchBox.addListener('place_changed', () => {
      const place = searchBox.getPlace()
      if (!place.geometry) return

      const newLat = place.geometry.location.lat()
      const newLng = place.geometry.location.lng()

      map.setCenter({ lat: newLat, lng: newLng })
      map.setZoom(16)
      marker.setPosition({ lat: newLat, lng: newLng })
      setSelectedLat(newLat)
      setSelectedLng(newLng)
      setAddress(place.name || place.formatted_address)
    })

    mapInstanceRef.current = map
    markerRef.current = marker
  }

  const reverseGeocode = async (lat, lng) => {
    try {
      const geocoder = new window.google.maps.Geocoder()
      const result = await geocoder.geocode({ location: { lat, lng } })
      if (result.results[0]) {
        const components = result.results[0].address_components
        const neighborhood = components.find(c =>
          c.types.includes('neighborhood') || c.types.includes('sublocality')
        )
        const area = neighborhood?.long_name ||
          result.results[0].formatted_address.split(',')[0]
        setAddress(`${area}, NYC`)
      }
    } catch {
      setAddress('New York City')
    }
  }

  const handleConfirm = () => {
    setLocation(selectedLat, selectedLng, address)
    onClose()
  }

  const handleRealLocation = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
      setSelectedLat(latitude)
      setSelectedLng(longitude)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude })
        markerRef.current?.setPosition({ lat: latitude, lng: longitude })
      }
      await reverseGeocode(latitude, longitude)
    })
  }

  const handleStartWalking = () => {
    setLocation(selectedLat, selectedLng, address)
    startWatching()
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '24px 24px 0 0',
        width: '100%',
        maxWidth: '430px',
        border: '1px solid var(--border)',
        borderBottom: 'none',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Set Location</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer'
          }}>×</button>
        </div>

        {/* Search box */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
          <input
            ref={searchBoxRef}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="🔍 Search location (e.g. Chelsea, NYC)"
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: 'DM Sans, sans-serif',
              outline: 'none'
            }}
          />
        </div>

        {/* Map */}
        <div ref={mapRef} style={{ width: '100%', height: '280px' }} />

        {/* Footer */}
        <div style={{ padding: '12px' }}>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            📍 {address}
          </p>

          {isWatching && (
            <div style={{
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '10px',
              padding: '8px 12px',
              marginBottom: '10px',
              textAlign: 'center',
              fontSize: '12px',
              color: '#10B981'
            }}>
              🚶 Walking mode active — offers updating as you move
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleRealLocation} style={{
              flex: 1, padding: '10px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--text-secondary)',
              fontSize: '12px', fontWeight: '500',
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
            }}>
              📡 GPS
            </button>
            <button onClick={handleStartWalking} style={{
              flex: 1, padding: '10px',
              background: isWatching
                ? 'rgba(239,68,68,0.2)'
                : 'rgba(16,185,129,0.2)',
              border: `1px solid ${isWatching ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`,
              borderRadius: '10px',
              color: isWatching ? '#EF4444' : '#10B981',
              fontSize: '12px', fontWeight: '500',
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
            }}>
              {isWatching ? '⏹ Stop' : '🚶 Walk'}
            </button>
            <button onClick={handleConfirm} style={{
              flex: 2, padding: '10px',
              background: 'var(--accent-violet)',
              border: 'none', borderRadius: '10px',
              color: 'white', fontSize: '12px',
              fontWeight: '600', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif'
            }}>
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}