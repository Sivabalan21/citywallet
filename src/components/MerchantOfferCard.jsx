import { useState, useEffect } from 'react'
import { useAuth } from '../store/useAuth'
import QRModal from './QRModal'

const categoryIcons = {
  food: '🍔', coffee: '☕', fashion: '👗',
  fitness: '💪', nightlife: '🍸', shopping: '🛍️',
  beauty: '💄', books: '📚'
}

export default function MerchantOfferCard({ offer }) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [claimedOffer, setClaimedOffer] = useState(null)
  const [alreadyClaimed, setAlreadyClaimed] = useState(false)
  const [claimStatus, setClaimStatus] = useState(null)

  useEffect(() => {
    const checkClaimed = async () => {
      try {
        const res = await fetch(`/api/saved-offers?userId=${user.id}`)
        const data = await res.json()
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const existing = (data.offers || []).find(o =>
          o.merchant_name === offer.business_name &&
          o.offer_text === offer.offer_text &&
          ['claimed', 'redeemed'].includes(o.status) &&
          new Date(o.claimed_at) >= today
        )

        if (existing) {
          setAlreadyClaimed(true)
          setClaimStatus(existing.status)
        }
      } catch {}
    }
    if (user) checkClaimed()
  }, [user, offer.business_name, offer.offer_text])

  const handleClaim = async () => {
    if (saving || alreadyClaimed) return
    setSaving(true)
    try {
      const res = await fetch('/api/save-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer: {
            merchant_name: offer.business_name,
            merchant_address: offer.business_address,
            offer_text: offer.offer_text,
            why_relevant: 'Verified merchant offer',
            category: offer.business_category,
            rating: null,
            price_level: null,
            distance_meters: offer.distance_meters || 0,
            lat: offer.business_lat,
            lng: offer.business_lng
          },
          userId: user.id,
          action: 'claim'
        })
      })
      const data = await res.json()
      if (data.success) {
        setClaimedOffer(data.offer)
        setShowQR(true)
        setAlreadyClaimed(true)
        setClaimStatus('claimed')
      } else if (data.error === 'already_claimed') {
        setAlreadyClaimed(true)
        setClaimStatus('claimed')
        alert(data.message)
      } else if (data.error === 'already_redeemed') {
        setAlreadyClaimed(true)
        setClaimStatus('redeemed')
        alert(data.message)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (saving || saved) return
    setSaving(true)
    try {
      const res = await fetch('/api/save-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer: {
            merchant_name: offer.business_name,
            merchant_address: offer.business_address,
            offer_text: offer.offer_text,
            why_relevant: 'Verified merchant offer',
            category: offer.business_category,
            rating: null,
            price_level: null,
            distance_meters: offer.distance_meters || 0,
            lat: offer.business_lat,
            lng: offer.business_lng
          },
          userId: user.id,
          action: 'save'
        })
      })
      const data = await res.json()
      if (data.success) setSaved(true)
      else if (data.error === 'already_saved') setSaved(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDirections = () => {
    const destination = encodeURIComponent(
      `${offer.business_name}, ${offer.business_address}`
    )
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
      '_blank'
    )
  }

  return (
    <>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1.5px solid rgba(245,158,11,0.4)',
        padding: '16px',
        marginBottom: '12px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Gold accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: '4px', height: '100%',
          background: 'var(--accent-gold)',
          borderRadius: '4px 0 0 4px'
        }} />

        {/* Verified badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          background: 'rgba(245,158,11,0.15)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: '20px', padding: '2px 8px',
          marginBottom: '10px', marginLeft: '8px'
        }}>
          <span style={{ fontSize: '10px' }}>✅</span>
          <span style={{
            fontSize: '11px', color: 'var(--accent-gold)',
            fontWeight: '600'
          }}>
            Verified Merchant Offer
          </span>
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '8px', marginBottom: '10px', paddingLeft: '8px'
        }}>
          <span style={{ fontSize: '18px' }}>
            {categoryIcons[offer.business_category] || '🏪'}
          </span>
          <div>
            <p style={{
              fontSize: '15px', fontWeight: '600',
              color: 'var(--text-primary)', margin: 0
            }}>
              {offer.business_name}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              {offer.distance_meters
                ? offer.distance_meters < 1000
                  ? `${offer.distance_meters}m away`
                  : `${(offer.distance_meters / 1000).toFixed(1)}km away`
                : offer.business_address}
            </p>
          </div>
        </div>

        {/* Offer text */}
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '10px', padding: '10px 12px',
          marginBottom: '10px', marginLeft: '8px'
        }}>
          <p style={{
            fontSize: '14px', fontWeight: '600',
            color: 'var(--text-primary)', margin: 0
          }}>
            {offer.offer_text}
          </p>
          {offer.description && (
            <p style={{
              fontSize: '12px', color: 'var(--text-secondary)',
              margin: '4px 0 0'
            }}>
              {offer.description}
            </p>
          )}
        </div>

        {/* Valid until */}
        {offer.valid_until && (
          <p style={{
            fontSize: '11px', color: 'var(--text-muted)',
            marginBottom: '10px', paddingLeft: '8px'
          }}>
            ⏰ Valid until {new Date(offer.valid_until).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', paddingLeft: '8px' }}>
          <button
            onClick={handleDirections}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '10px', color: 'var(--text-secondary)',
              fontSize: '12px', fontWeight: '500',
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
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
            onClick={handleClaim}
            disabled={saving || alreadyClaimed}
            style={{
              flex: 1, padding: '8px 12px',
              background: alreadyClaimed
                ? claimStatus === 'redeemed'
                  ? 'rgba(16,185,129,0.2)'
                  : 'rgba(124,58,237,0.2)'
                : 'linear-gradient(135deg, var(--accent-gold), #F97316)',
              border: alreadyClaimed
                ? `1px solid ${claimStatus === 'redeemed' ? '#10B981' : 'var(--accent-violet)'}`
                : 'none',
              borderRadius: '10px',
              color: alreadyClaimed
                ? claimStatus === 'redeemed' ? '#10B981' : 'var(--accent-violet)'
                : 'white',
              fontSize: '12px', fontWeight: '600',
              cursor: alreadyClaimed ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? '...' :
             alreadyClaimed && claimStatus === 'redeemed' ? '✅ Redeemed' :
             alreadyClaimed && claimStatus === 'claimed' ? '🎫 QR Active' :
             '🎫 Claim'}
          </button>
        </div>
      </div>

      {showQR && claimedOffer && (
        <QRModal
          offer={claimedOffer}
          onClose={() => setShowQR(false)}
        />
      )}
    </>
  )
}