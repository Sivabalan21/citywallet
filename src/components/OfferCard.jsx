import { useState } from 'react'
import { useAuth } from '../store/useAuth'

const categoryColors = {
  food: '#EF4444',
  coffee: '#92400E',
  fashion: '#EC4899',
  fitness: '#10B981',
  nightlife: '#8B5CF6',
  shopping: '#3B82F6',
  beauty: '#F59E0B',
  books: '#6366F1',
}

const categoryIcons = {
  food: '🍔',
  coffee: '☕',
  fashion: '👗',
  fitness: '💪',
  nightlife: '🍸',
  shopping: '🛍️',
  beauty: '💄',
  books: '📚',
}

export default function OfferCard({ offer, featured = false }) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const color = categoryColors[offer.category] || '#7C3AED'
  const icon = categoryIcons[offer.category] || '🏪'

  const handleDirections = () => {
    const destination = offer.merchant_address
      ? encodeURIComponent(`${offer.merchant_name}, ${offer.merchant_address}`)
      : encodeURIComponent(`${offer.merchant_name}, New York City`)
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank')
  }

  const handleSave = async () => {
    if (saving || saved) return
    setSaving(true)
    try {
      const res = await fetch('/api/save-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer, userId: user.id, action: 'save' })
      })
      const data = await res.json()
      if (data.success || data.error === 'already_saved') setSaved(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAndGo = async () => {
    if (saving) return
    // Open directions immediately
    handleDirections()
    // Save in background if not already saved
    if (!saved) {
      setSaving(true)
      try {
        const res = await fetch('/api/save-offer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offer, userId: user.id, action: 'save' })
        })
        const data = await res.json()
        if (data.success || data.error === 'already_saved') setSaved(true)
      } catch (err) {
        console.error(err)
      } finally {
        setSaving(false)
      }
    }
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: featured ? '20px' : '16px',
      border: `1px solid ${featured ? color + '40' : 'var(--border)'}`,
      padding: featured ? '20px' : '16px',
      marginBottom: '12px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.15s ease'
    }}>
      {/* Category color accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: '4px', height: '100%',
        background: color, borderRadius: '4px 0 0 4px'
      }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '10px', paddingLeft: '8px'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: '8px', marginBottom: '4px'
          }}>
            <span style={{ fontSize: featured ? '20px' : '16px' }}>{icon}</span>
            <span style={{
              fontSize: featured ? '16px' : '14px',
              fontWeight: '600', color: 'var(--text-primary)'
            }}>
              {offer.merchant_name}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {offer.rating && (
              <span style={{ fontSize: '12px', color: 'var(--accent-gold)' }}>
                ★ {offer.rating}
              </span>
            )}
            {offer.price_level && (
              <span style={{
                fontSize: '12px', color: 'var(--text-muted)',
                fontFamily: 'DM Mono, monospace'
              }}>
                {offer.price_level}
              </span>
            )}
            {offer.distance_meters && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {offer.distance_meters < 1000
                  ? `${offer.distance_meters}m`
                  : `${(offer.distance_meters / 1000).toFixed(1)}km`}
              </span>
            )}
            <span style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
              background: offer.freshness === 'live'
                ? 'rgba(16,185,129,0.15)' : 'rgba(156,163,175,0.15)',
              color: offer.freshness === 'live' ? '#10B981' : 'var(--text-muted)'
            }}>
              {offer.freshness === 'live' ? '● live' : offer.freshness}
            </span>
          </div>
        </div>

        {/* Confidence indicator */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: `conic-gradient(${color} ${offer.confidence * 360}deg, var(--border) 0deg)`,
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0
        }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: 'var(--bg-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: '600', color: 'var(--text-secondary)'
          }}>
            {Math.round(offer.confidence * 100)}%
          </div>
        </div>
      </div>

      {/* Offer text */}
      <div style={{
        background: `${color}15`,
        border: `1px solid ${color}30`,
        borderRadius: '10px', padding: '10px 12px',
        marginBottom: '10px', marginLeft: '8px'
      }}>
        <p style={{
          fontSize: '13px', fontWeight: '600',
          color: 'var(--text-primary)', margin: 0
        }}>
          {offer.offer_text}
        </p>
      </div>

      {/* AI reasoning */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        gap: '6px', marginBottom: '14px', paddingLeft: '8px'
      }}>
        <span style={{ fontSize: '12px', marginTop: '1px' }}>🤖</span>
        <p style={{
          fontSize: '12px', color: 'var(--text-secondary)',
          lineHeight: '1.4', margin: 0, fontStyle: 'italic'
        }}>
          {offer.why_relevant}
        </p>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px', paddingLeft: '8px' }}>
        <button
          onClick={handleDirections}
          style={{
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '10px', color: 'var(--text-secondary)',
            fontSize: '12px', fontWeight: '500',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}
        >
          🗺️ Directions
        </button>

        <button
          onClick={handleSave}
          style={{
            padding: '8px 12px',
            background: saved ? 'rgba(124,58,237,0.15)' : 'var(--bg-secondary)',
            border: `1px solid ${saved ? 'var(--accent-violet)' : 'var(--border)'}`,
            borderRadius: '10px',
            color: saved ? 'var(--accent-violet)' : 'var(--text-secondary)',
            fontSize: '12px', fontWeight: '500',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
          }}
        >
          {saved ? '🔖 Saved' : '🔖 Save'}
        </button>

        <button
          onClick={handleSaveAndGo}
          disabled={saving}
          style={{
            flex: 1, padding: '8px 12px',
            background: saved
              ? 'var(--bg-secondary)'
              : `linear-gradient(135deg, var(--accent-violet), ${color})`,
            border: saved ? '1px solid var(--accent-violet)' : 'none',
            borderRadius: '10px',
            color: saved ? 'var(--accent-violet)' : 'white',
            fontSize: '12px', fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? '...' : saved ? '🗺️ Get Directions' : '⚡ Save & Go'}
        </button>
      </div>
    </div>
  )
}