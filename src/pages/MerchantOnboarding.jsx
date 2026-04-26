import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { loadGoogleMaps } from '../components/GoogleMapsLoader'

const CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: '🍔' },
  { id: 'coffee', label: 'Coffee & Café', icon: '☕' },
  { id: 'fashion', label: 'Fashion & Apparel', icon: '👗' },
  { id: 'fitness', label: 'Fitness & Wellness', icon: '💪' },
  { id: 'nightlife', label: 'Bar & Nightlife', icon: '🍸' },
  { id: 'shopping', label: 'Retail & Shopping', icon: '🛍️' },
  { id: 'beauty', label: 'Beauty & Spa', icon: '💄' },
  { id: 'books', label: 'Books & Education', icon: '📚' },
]

export default function MerchantOnboarding() {
  const { user, saveProfile, profile } = useAuth()
  const navigate = useNavigate()
  const [businessName, setBusinessName] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [businessCategory, setBusinessCategory] = useState('')
  const [businessLat, setBusinessLat] = useState(null)
  const [businessLng, setBusinessLng] = useState(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const addressInputRef = useRef(null)
  const autocompleteRef = useRef(null)

  // If already a merchant with business set up, go straight to dashboard
  useEffect(() => {
    if (profile?.is_merchant && profile?.business_name) {
      navigate('/merchant')
    }
  }, [profile, navigate])

  // Pre-fill form if partial merchant profile exists
  useEffect(() => {
    if (profile?.business_name) setBusinessName(profile.business_name)
    if (profile?.business_address) setBusinessAddress(profile.business_address)
    if (profile?.business_category) setBusinessCategory(profile.business_category)
  }, [profile])

  useEffect(() => {
    loadGoogleMaps(import.meta.env.VITE_GOOGLE_MAPS_API_KEY).then(() => {
      if (!addressInputRef.current || autocompleteRef.current) return
      const autocomplete = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        { fields: ['formatted_address', 'geometry', 'name'] }
      )
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place.formatted_address) {
          setBusinessAddress(place.formatted_address)
          setBusinessLat(place.geometry?.location?.lat() || null)
          setBusinessLng(place.geometry?.location?.lng() || null)
        }
      })
      autocompleteRef.current = autocomplete
    })
  }, [])

  const validate = () => {
    const errs = {}
    if (!businessName.trim()) errs.name = 'Business name is required'
    if (!businessAddress.trim()) errs.address = 'Business address is required'
    if (!businessCategory) errs.category = 'Please select a category'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await saveProfile({
        role: 'merchant',
        is_merchant: true,
        current_mode: 'merchant',
        business_name: businessName.trim(),
        business_address: businessAddress.trim(),
        business_category: businessCategory,
        business_lat: businessLat,
        business_lng: businessLng
      })
      navigate('/merchant')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '2rem 1.5rem'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          width: '48px', height: '48px',
          background: 'rgba(245,158,11,0.15)',
          borderRadius: '14px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '24px',
          marginBottom: '1rem'
        }}>
          🏪
        </div>
        <h1 style={{
          fontSize: '22px', fontWeight: '700',
          color: 'var(--text-primary)', margin: '0 0 6px'
        }}>
          Set up your business
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          Tell us about your business so customers nearby can discover your offers
        </p>
      </div>

      {/* Business name */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{
          fontSize: '13px', fontWeight: '600',
          color: errors.name ? '#EF4444' : 'var(--text-secondary)',
          margin: '0 0 6px'
        }}>
          Business name {errors.name && <span style={{ color: '#EF4444' }}>— {errors.name}</span>}
        </p>
        <input
          value={businessName}
          onChange={e => { setBusinessName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
          placeholder="e.g. Joe's Coffee, The Burger Joint..."
          style={{
            width: '100%', padding: '12px 14px',
            background: errors.name ? 'rgba(239,68,68,0.1)' : 'var(--bg-card)',
            border: `1px solid ${errors.name ? '#EF4444' : 'var(--border)'}`,
            borderRadius: '12px', color: 'var(--text-primary)',
            fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
            outline: 'none', boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Business address */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{
          fontSize: '13px', fontWeight: '600',
          color: errors.address ? '#EF4444' : 'var(--text-secondary)',
          margin: '0 0 6px'
        }}>
          Business address {errors.address && <span style={{ color: '#EF4444' }}>— {errors.address}</span>}
        </p>
        <input
          ref={addressInputRef}
          value={businessAddress}
          onChange={e => { setBusinessAddress(e.target.value); setErrors(p => ({ ...p, address: '' })) }}
          placeholder="Start typing your address..."
          style={{
            width: '100%', padding: '12px 14px',
            background: errors.address ? 'rgba(239,68,68,0.1)' : 'var(--bg-card)',
            border: `1px solid ${errors.address ? '#EF4444' : 'var(--border)'}`,
            borderRadius: '12px', color: 'var(--text-primary)',
            fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
            outline: 'none', boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Category */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{
          fontSize: '13px', fontWeight: '600',
          color: errors.category ? '#EF4444' : 'var(--text-secondary)',
          margin: '0 0 10px'
        }}>
          Business category {errors.category && <span style={{ color: '#EF4444' }}>— {errors.category}</span>}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setBusinessCategory(cat.id); setErrors(p => ({ ...p, category: '' })) }}
              style={{
                padding: '12px',
                background: businessCategory === cat.id ? 'rgba(245,158,11,0.15)' : 'var(--bg-card)',
                border: businessCategory === cat.id ? '1.5px solid var(--accent-gold)' : '1px solid var(--border)',
                borderRadius: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '20px' }}>{cat.icon}</span>
              <span style={{
                fontSize: '13px', fontWeight: '500',
                color: businessCategory === cat.id ? 'var(--accent-gold)' : 'var(--text-secondary)'
              }}>
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={saving}
        style={{
          width: '100%', padding: '16px',
          background: 'linear-gradient(135deg, var(--accent-gold), #F97316)',
          border: 'none', borderRadius: '14px',
          color: 'white', fontSize: '15px',
          fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer',
          fontFamily: 'DM Sans, sans-serif',
          opacity: saving ? 0.7 : 1
        }}
      >
        {saving ? 'Setting up...' : '🏪 Launch my merchant profile'}
      </button>
    </div>
  )
}