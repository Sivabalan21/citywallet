import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../store/useAuth'
import { useLocation } from '../store/useLocation'
import { loadGoogleMaps } from './GoogleMapsLoader'

export default function CommunityUpload({ onSuccess }) {
  const { user } = useAuth()
  const { lat, lng, neighborhood } = useLocation()
  const [step, setStep] = useState('idle') // idle | preview | details | uploading | result
  const [preview, setPreview] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [mimeType, setMimeType] = useState('image/jpeg')
  const [manualMerchant, setManualMerchant] = useState('')
  const [manualAddress, setManualAddress] = useState('')
  const [extractedOffer, setExtractedOffer] = useState(null)
  const [result, setResult] = useState(null)
  const [merchantError, setMerchantError] = useState(false)
  const fileInputRef = useRef(null)
  const addressInputRef = useRef(null)
  const autocompleteRef = useRef(null)

  // Auto-populate address
  useEffect(() => {
    const reverseGeocode = async () => {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
        )
        const data = await res.json()
        if (data.results?.[0]) {
          const components = data.results[0].address_components
          const streetNumber = components.find(c => c.types.includes('street_number'))?.long_name || ''
          const street = components.find(c => c.types.includes('route'))?.long_name || ''
          const city = components.find(c => c.types.includes('locality'))?.long_name || 'New York'
          const state = components.find(c => c.types.includes('administrative_area_level_1'))?.short_name || 'NY'
          const zip = components.find(c => c.types.includes('postal_code'))?.long_name || ''
          const addr = [streetNumber && street ? `${streetNumber} ${street}` : '', city, state, zip].filter(Boolean).join(', ')
          setManualAddress(addr)
        }
      } catch {
        setManualAddress(neighborhood || 'New York City, NY')
      }
    }
    reverseGeocode()
  }, [lat, lng])

  // Init Google Places Autocomplete on address input
  useEffect(() => {
    if (step !== 'details') return
    loadGoogleMaps(import.meta.env.VITE_GOOGLE_MAPS_API_KEY).then(() => {
      if (!addressInputRef.current || autocompleteRef.current) return
      const autocomplete = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        { componentRestrictions: { country: 'us' }, fields: ['formatted_address', 'name'] }
      )
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place.formatted_address) {
          setManualAddress(place.formatted_address)
        }
      })
      autocompleteRef.current = autocomplete
    })
  }, [step])

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const maxSize = 800
        let { width, height } = img
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        } else if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = url
    })
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const compressed = await compressImage(file)
    setPreview(compressed)
    setImageBase64(compressed.split(',')[1])
    setMimeType(file.type)
    setStep('details')
    setManualMerchant('')
    setExtractedOffer(null)
  }

  const handleSubmit = async () => {
    if (!manualMerchant.trim()) {
      setMerchantError(true)
      return
    }
    setMerchantError(false)
    setStep('uploading')

    try {
      const res = await fetch('/api/upload-community-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          userId: user.id,
          lat,
          lng,
          neighborhood,
          manualMerchant: manualMerchant.trim(),
          manualAddress: manualAddress.trim()
        })
      })

      const data = await res.json()
      setResult(data)
      setStep('result')

      if (data.success && onSuccess) {
        setTimeout(() => onSuccess(data.offer), 1500)
      }
    } catch {
      setResult({ success: false, message: 'Upload failed. Please try again.' })
      setStep('result')
    }
  }

  const handleReset = () => {
    setStep('idle')
    setPreview(null)
    setImageBase64(null)
    setResult(null)
    setManualMerchant('')
    setExtractedOffer(null)
    setMerchantError(false)
    autocompleteRef.current = null
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '16px',
      border: '1px solid var(--border)',
      padding: '16px',
      marginBottom: '16px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: step === 'idle' ? '12px' : '14px'
      }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'rgba(245,158,11,0.15)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '18px', flexShrink: 0
        }}>📸</div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            Spotted a deal?
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            Photo → AI extracts → joins the community feed
          </p>
        </div>
      </div>

      {/* IDLE STATE */}
      {step === 'idle' && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
          <button
            onClick={() => { fileInputRef.current?.removeAttribute('capture'); fileInputRef.current?.click() }}
            style={{
              flex: 1, padding: '10px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '10px', color: 'var(--text-secondary)',
              fontSize: '13px', fontWeight: '500', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif'
            }}
          >
            🖼️ Gallery
          </button>
          <button
            onClick={() => { fileInputRef.current?.setAttribute('capture', 'environment'); fileInputRef.current?.click() }}
            style={{
              flex: 1, padding: '10px',
              background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-gold))',
              border: 'none', borderRadius: '10px',
              color: 'white', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
            }}
          >
            📷 Camera
          </button>
        </div>
      )}

      {/* DETAILS STATE */}
      {step === 'details' && (
        <>
          {/* Image preview */}
          <img
            src={preview}
            alt="Preview"
            style={{
              width: '100%', height: '160px',
              objectFit: 'cover', borderRadius: '10px',
              border: '1px solid var(--border)', marginBottom: '14px'
            }}
          />

          {/* Merchant name — required */}
          <div style={{ marginBottom: '10px' }}>
            <p style={{
              fontSize: '11px', fontWeight: '600',
              color: merchantError ? '#EF4444' : 'var(--text-muted)',
              margin: '0 0 5px',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              Merchant name
              <span style={{
                fontSize: '10px', color: 'white',
                background: '#EF4444', padding: '1px 5px',
                borderRadius: '4px'
              }}>required</span>
              {merchantError && <span style={{ color: '#EF4444', fontSize: '11px' }}>← Please fill this in</span>}
            </p>
            <input
              value={manualMerchant}
              onChange={e => { setManualMerchant(e.target.value); setMerchantError(false) }}
              placeholder="e.g. Subway, Starbucks, Joe's Pizza..."
              autoFocus
              style={{
                width: '100%', padding: '10px 12px',
                background: merchantError ? 'rgba(239,68,68,0.1)' : 'var(--bg-secondary)',
                border: `1px solid ${merchantError ? '#EF4444' : 'var(--border)'}`,
                borderRadius: '10px', color: 'var(--text-primary)',
                fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Address — auto-filled, editable with autocomplete */}
          <div style={{ marginBottom: '14px' }}>
            <p style={{
              fontSize: '11px', fontWeight: '600',
              color: 'var(--text-muted)', margin: '0 0 5px',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              Address
              <span style={{
                fontSize: '10px', color: '#10B981',
                background: 'rgba(16,185,129,0.15)',
                padding: '1px 6px', borderRadius: '10px'
              }}>
                📍 auto-detected · edit if needed
              </span>
            </p>
            <input
              ref={addressInputRef}
              value={manualAddress}
              onChange={e => setManualAddress(e.target.value)}
              placeholder="Street, City, State, ZIP"
              style={{
                width: '100%', padding: '10px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '10px', color: 'var(--text-primary)',
                fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleReset}
              style={{
                flex: 1, padding: '11px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '10px', color: 'var(--text-secondary)',
                fontSize: '13px', fontWeight: '500',
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              style={{
                flex: 2, padding: '11px',
                background: 'var(--accent-violet)',
                border: 'none', borderRadius: '10px',
                color: 'white', fontSize: '13px',
                fontWeight: '600', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif'
              }}
            >
              🤖 Verify & Submit
            </button>
          </div>
        </>
      )}

      {/* UPLOADING STATE */}
      {step === 'uploading' && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '12px', padding: '20px 0'
        }}>
          <div style={{
            width: '40px', height: '40px',
            border: '3px solid var(--border)',
            borderTop: '3px solid var(--accent-violet)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
            🤖 AI reading and verifying offer...
          </p>
        </div>
      )}

      {/* RESULT STATE */}
      {step === 'result' && result && (
        <>
          <div style={{
            padding: '14px',
            borderRadius: '12px',
            marginBottom: '12px',
            background: result.success ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${result.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            <p style={{
              fontSize: '14px', fontWeight: '600',
              color: result.success ? '#10B981' : '#EF4444',
              margin: '0 0 4px'
            }}>
              {result.success ? '✅ Offer verified and added!' : '❌ ' + result.message}
            </p>
            {result.success && result.offer && (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                "{result.offer.offer_text}" is now visible to nearby users
              </p>
            )}
          </div>
          <button
            onClick={handleReset}
            style={{
              width: '100%', padding: '11px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '10px', color: 'var(--text-secondary)',
              fontSize: '13px', fontWeight: '500',
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
            }}
          >
            Upload another deal
          </button>
        </>
      )}
    </div>
  )
}