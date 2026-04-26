import { useState, useEffect } from 'react'
import { useAuth } from '../store/useAuth'
import QRScanner from '../components/QRScanner'

const CATEGORIES = {
  food: '🍔', coffee: '☕', fashion: '👗',
  fitness: '💪', nightlife: '🍸', shopping: '🛍️',
  beauty: '💄', books: '📚'
}

export default function MerchantDashboard() {
  const { user, profile, saveProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('offers')
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddOffer, setShowAddOffer] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [newOffer, setNewOffer] = useState({
    offer_text: '',
    description: '',
    valid_until: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [merchantPlan, setMerchantPlan] = useState('free')

useEffect(() => {
  const checkSub = async () => {
  try {
    const res = await fetch(`/api/subscription-status?userEmail=${user.email}`)
    const data = await res.json()
    // Check specifically for merchant_pro
    setMerchantPlan(data.merchantPro?.active ? 'merchant_pro' : 'free')
  } catch {}
}
  if (user) checkSub()
}, [user])

  useEffect(() => {
    if (user) fetchOffers()
  }, [user])

  const fetchOffers = async () => {
    try {
      const res = await fetch(`/api/merchant-offers?merchantId=${user.id}`)
      const data = await res.json()
      setOffers(data.offers || [])
    } catch {}
    finally { setLoading(false) }
  }

  const handleAddOffer = async () => {
    if (!newOffer.offer_text.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/merchant-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: user.id,
          business_name: profile?.business_name,
          business_address: profile?.business_address,
          business_lat: profile?.business_lat,
          business_lng: profile?.business_lng,
          business_category: profile?.business_category,
          offer_text: newOffer.offer_text.trim(),
          description: newOffer.description.trim(),
          valid_until: newOffer.valid_until || null
        })
      })
      const data = await res.json()
      if (data.offer) {
        setOffers(prev => [data.offer, ...prev])
        setNewOffer({ offer_text: '', description: '', valid_until: '' })
        setShowAddOffer(false)
      }
    } catch {}
    finally { setSubmitting(false) }
  }

  const handleToggleOffer = async (offerId, currentState) => {
    try {
      await fetch('/api/merchant-offers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, is_active: !currentState })
      })
      setOffers(prev => prev.map(o =>
        o.id === offerId ? { ...o, is_active: !currentState } : o
      ))
    } catch {}
  }

  const handleDeleteOffer = async (offerId) => {
    try {
      await fetch('/api/merchant-offers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId })
      })
      setOffers(prev => prev.filter(o => o.id !== offerId))
    } catch {}
  }

  const handleQRScan = async (qrData) => {
    setShowScanner(false)
    try {
      const validateRes = await fetch('/api/validate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData, merchantId: user.id })
      })
      const validation = await validateRes.json()
      setScanResult({ ...validation, qrData })
    } catch {
      setScanResult({ valid: false, reason: 'Failed to validate QR code' })
    }
  }

  const handleRedeem = async () => {
    if (!scanResult?.offer?.id) return
    try {
      await fetch('/api/redeem-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: scanResult.offer.id, merchantId: user.id })
      })
      setScanResult(prev => ({ ...prev, redeemed: true }))
    } catch {}
  }

  const handleSwitchToCustomer = async () => {
    await saveProfile({ current_mode: 'customer' })
    window.location.href = '/home'
  }

  const activeOffers = offers.filter(o => o.is_active)
  const totalRedemptions = offers.reduce((sum, o) => sum + (o.redemption_count || 0), 0)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingBottom: '80px'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem 1rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{ fontSize: '18px' }}>
              {CATEGORIES[profile?.business_category] || '🏪'}
            </span>
            <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
              {profile?.business_name || 'My Business'}
            </h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            {profile?.business_address}
          </p>
        </div>
        <button
          onClick={handleSwitchToCustomer}
          style={{
            padding: '8px 12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            color: 'var(--text-secondary)',
            fontSize: '12px', fontWeight: '500',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
          }}
        >
          🛍️ Customer mode
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: '10px', padding: '1rem'
      }}>
        {[
          { label: 'Active offers', value: activeOffers.length, color: '#10B981' },
          { label: 'Total offers', value: offers.length, color: 'var(--accent-violet)' },
          { label: 'Redemptions', value: totalRedemptions, color: 'var(--accent-gold)' }
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--bg-card)',
            borderRadius: '12px', padding: '12px',
            border: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '22px', fontWeight: '700',
              color: stat.color, margin: '0 0 2px',
              fontFamily: 'DM Mono, monospace'
            }}>
              {stat.value}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0',
        margin: '0 1rem',
        background: 'var(--bg-card)',
        borderRadius: '12px', padding: '4px',
        border: '1px solid var(--border)',
        marginBottom: '16px'
      }}>
        {[
          { id: 'offers', label: '📋 My Offers' },
          { id: 'scan', label: '📱 Scan QR' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setScanResult(null) }}
            style={{
              flex: 1, padding: '10px',
              background: activeTab === tab.id ? 'var(--accent-violet)' : 'none',
              border: 'none', borderRadius: '10px',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Merchant Pro upgrade — only for free merchants */}
{merchantPlan !== 'merchant_pro' && (
  <div style={{
    margin: '0 1rem 16px',
    background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.1))',
    border: '1px solid rgba(245,158,11,0.3)',
    borderRadius: '14px', padding: '14px',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '10px'
  }}>
    <div>
      <p style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 2px', color: 'var(--accent-gold)' }}>
        ⚡ Upgrade to Merchant Pro
      </p>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
        Unlimited offers + featured placement
      </p>
    </div>
    <button
      onClick={async () => {
        const res = await fetch('/api/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceId: import.meta.env.VITE_STRIPE_MERCHANT_PRO_PRICE_ID,
            userId: user.id,
            userEmail: user.email,
            plan: 'merchant_pro'
          })
        })
        const data = await res.json()
        if (data.url) window.location.href = data.url
      }}
      style={{
        padding: '8px 14px',
        background: 'var(--accent-gold)',
        border: 'none', borderRadius: '10px',
        color: 'white', fontSize: '12px',
        fontWeight: '600', cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap'
      }}
    >
      Upgrade
    </button>
  </div>
)}

      {/* OFFERS TAB */}
      {activeTab === 'offers' && (
        <div style={{ padding: '0 1rem' }}>
          {/* Add offer button */}
          <button
            onClick={() => setShowAddOffer(!showAddOffer)}
            style={{
              width: '100%', padding: '14px',
              background: showAddOffer ? 'var(--bg-card)' : 'var(--accent-violet)',
              border: showAddOffer ? '1px solid var(--border)' : 'none',
              borderRadius: '14px',
              color: showAddOffer ? 'var(--text-secondary)' : 'white',
              fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', marginBottom: '16px',
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '8px'
            }}
          >
            {showAddOffer ? '✕ Cancel' : '+ Add New Offer'}
          </button>

          {/* Add offer form */}
          {showAddOffer && (
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '16px', padding: '16px',
              border: '1px solid var(--border)',
              marginBottom: '16px'
            }}>
              <p style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 14px' }}>
                New Offer
              </p>

              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 5px' }}>
                  Offer text *
                </p>
                <input
                  value={newOffer.offer_text}
                  onChange={e => setNewOffer(p => ({ ...p, offer_text: e.target.value }))}
                  placeholder="e.g. 20% off all drinks until 6pm"
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

              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 5px' }}>
                  Description (optional)
                </p>
                <textarea
                  value={newOffer.description}
                  onChange={e => setNewOffer(p => ({ ...p, description: e.target.value }))}
                  placeholder="Any additional details..."
                  rows={2}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px', color: 'var(--text-primary)',
                    fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
                    outline: 'none', resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 5px' }}>
                  Valid until (optional)
                </p>
                <input
                  type="datetime-local"
                  value={newOffer.valid_until}
                  onChange={e => setNewOffer(p => ({ ...p, valid_until: e.target.value }))}
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

              <button
                onClick={handleAddOffer}
                disabled={submitting || !newOffer.offer_text.trim()}
                style={{
                  width: '100%', padding: '12px',
                  background: !newOffer.offer_text.trim() ? 'var(--border)' : 'var(--accent-violet)',
                  border: 'none', borderRadius: '12px',
                  color: 'white', fontSize: '14px',
                  fontWeight: '600', cursor: !newOffer.offer_text.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif'
                }}
              >
                {submitting ? 'Publishing...' : '🚀 Publish Offer'}
              </button>
            </div>
          )}

          {/* Offers list */}
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              Loading offers...
            </p>
          ) : offers.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '3rem 1rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📋</div>
              <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                No offers yet
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Add your first offer to start reaching nearby customers
              </p>
            </div>
          ) : (
            offers.map(offer => (
              <div key={offer.id} style={{
                background: 'var(--bg-card)',
                borderRadius: '14px', padding: '14px',
                border: `1px solid ${offer.is_active ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                marginBottom: '10px'
              }}>
                <div style={{
                  display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between', gap: '10px'
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: '14px', fontWeight: '600',
                      color: 'var(--text-primary)', margin: '0 0 4px'
                    }}>
                      {offer.offer_text}
                    </p>
                    {offer.description && (
                      <p style={{
                        fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px'
                      }}>
                        {offer.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px',
                        background: offer.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(156,163,175,0.15)',
                        color: offer.is_active ? '#10B981' : 'var(--text-muted)',
                        borderRadius: '20px'
                      }}>
                        {offer.is_active ? '● Active' : '○ Paused'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {offer.redemption_count || 0} redemptions
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      onClick={() => handleToggleOffer(offer.id, offer.is_active)}
                      style={{
                        padding: '6px 10px',
                        background: offer.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                        border: `1px solid ${offer.is_active ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                        borderRadius: '8px',
                        color: offer.is_active ? '#EF4444' : '#10B981',
                        fontSize: '11px', fontWeight: '500',
                        cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {offer.is_active ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteOffer(offer.id)}
                      style={{
                        padding: '6px 10px',
                        background: 'none',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-muted)',
                        fontSize: '11px', cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SCAN TAB */}
      {activeTab === 'scan' && (
        <div style={{ padding: '0 1rem' }}>
          {!scanResult ? (
            <div style={{ textAlign: 'center', paddingTop: '2rem' }}>
              <div style={{ fontSize: '64px', marginBottom: '1rem' }}>📱</div>
              <p style={{
                fontSize: '16px', fontWeight: '600',
                marginBottom: '8px'
              }}>
                Scan Customer QR
              </p>
              <p style={{
                fontSize: '13px', color: 'var(--text-secondary)',
                marginBottom: '2rem', lineHeight: '1.5'
              }}>
                When a customer shows you their claimed offer QR code, scan it here to validate and redeem
              </p>
              <button
                onClick={() => setShowScanner(true)}
                style={{
                  padding: '16px 32px',
                  background: 'var(--accent-violet)',
                  border: 'none', borderRadius: '14px',
                  color: 'white', fontSize: '15px',
                  fontWeight: '600', cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif'
                }}
              >
                📷 Open Camera Scanner
              </button>
            </div>
          ) : (
            <div>
              {/* Scan result */}
              <div style={{
                background: scanResult.valid ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1.5px solid ${scanResult.valid ? '#10B981' : '#EF4444'}`,
                borderRadius: '16px', padding: '20px',
                marginBottom: '16px', textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                  {scanResult.redeemed ? '✅' : scanResult.valid ? '🎟️' : '❌'}
                </div>
                <p style={{
                  fontSize: '18px', fontWeight: '700',
                  color: scanResult.valid ? '#10B981' : '#EF4444',
                  margin: '0 0 8px'
                }}>
                  {scanResult.redeemed
                    ? 'Offer Redeemed!'
                    : scanResult.valid
                    ? 'Valid Offer'
                    : 'Invalid QR Code'}
                </p>
                {scanResult.valid && scanResult.offer && (
                  <>
                    <p style={{
                      fontSize: '15px', fontWeight: '600',
                      color: 'var(--text-primary)', margin: '0 0 4px'
                    }}>
                      {scanResult.offer.merchant_name}
                    </p>
                    <p style={{
                      fontSize: '14px', color: 'var(--text-secondary)', margin: 0
                    }}>
                      {scanResult.offer.offer_text}
                    </p>
                  </>
                )}
                {!scanResult.valid && (
                  <p style={{ fontSize: '13px', color: '#EF4444', margin: 0 }}>
                    {scanResult.reason}
                  </p>
                )}
              </div>

              {/* Redeem button */}
              {scanResult.valid && !scanResult.redeemed && (
                <button
                  onClick={handleRedeem}
                  style={{
                    width: '100%', padding: '16px',
                    background: '#10B981',
                    border: 'none', borderRadius: '14px',
                    color: 'white', fontSize: '15px',
                    fontWeight: '600', cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                    marginBottom: '10px'
                  }}
                >
                  ✅ Confirm Redemption
                </button>
              )}

              <button
                onClick={() => { setScanResult(null) }}
                style={{
                  width: '100%', padding: '14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  color: 'var(--text-secondary)',
                  fontSize: '14px', fontWeight: '500',
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
                }}
              >
                Scan Another
              </button>
            </div>
          )}
        </div>
      )}

      {/* QR Scanner modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}