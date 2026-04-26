import { useState, useEffect } from 'react'
import { useAuth } from '../store/useAuth'
import QRModal from '../components/QRModal'

export default function Saved() {
  const { user } = useAuth()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('saved')
  const [selectedOffer, setSelectedOffer] = useState(null)

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await fetch(`/api/saved-offers?userId=${user.id}`)
        const data = await res.json()
        setOffers(data.offers || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (user) fetchSaved()
  }, [user])

  const savedOffers = offers.filter(o => o.status === 'saved')
  const claimedOffers = offers.filter(o => o.status === 'claimed')
  const redeemedOffers = offers.filter(o => o.status === 'redeemed')

  const getDisplayed = () => {
    if (activeTab === 'saved') return savedOffers
    if (activeTab === 'claimed') return claimedOffers
    return redeemedOffers
  }

  const displayed = getDisplayed()

  const categoryIcons = {
    food: '🍔', coffee: '☕', fashion: '👗',
    fitness: '💪', nightlife: '🍸', shopping: '🛍️',
    beauty: '💄', books: '📚'
  }

  const tabs = [
    { id: 'saved', label: 'Saved', count: savedOffers.length, icon: '🔖' },
    { id: 'claimed', label: 'Claimed', count: claimedOffers.length, icon: '🎫' },
    { id: 'redeemed', label: 'Redeemed', count: redeemedOffers.length, icon: '✅' }
  ]

  const emptyStates = {
    saved: { icon: '🔖', title: 'No saved offers', desc: 'Save offers from your home feed' },
    claimed: { icon: '🎫', title: 'No claimed offers', desc: 'Claim merchant offers to generate QR codes' },
    redeemed: { icon: '✅', title: 'No redeemed offers', desc: 'Redeemed offers appear here after merchant confirms' }
  }

  const handleDirections = (offer) => {
    const destination = encodeURIComponent(
      `${offer.merchant_name}, ${offer.merchant_address || 'New York City'}`
    )
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
      '_blank'
    )
  }

  return (
    <div style={{
      padding: '1.25rem 1rem',
      minHeight: '100vh',
      background: 'var(--bg-primary)'
    }}>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '16px' }}>
        Saved
      </h1>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-card)',
        borderRadius: '12px',
        padding: '4px',
        marginBottom: '20px',
        border: '1px solid var(--border)',
        gap: '4px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '9px 4px',
              background: activeTab === tab.id ? 'var(--accent-violet)' : 'none',
              border: 'none', borderRadius: '10px',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              fontSize: '12px', fontWeight: '600',
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.15s ease',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '2px'
            }}
          >
            <span style={{ fontSize: '14px' }}>{tab.icon}</span>
            <span>{tab.label} ({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Status explanation */}
      {activeTab === 'claimed' && claimedOffers.length > 0 && (
        <div style={{
          background: 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: '10px', padding: '10px 12px',
          marginBottom: '14px',
          fontSize: '12px', color: 'var(--text-secondary)',
          display: 'flex', gap: '8px', alignItems: 'center'
        }}>
          <span>ℹ️</span>
          <span>Show your QR code to the merchant. Once they scan and confirm, it moves to Redeemed.</span>
        </div>
      )}

      {activeTab === 'redeemed' && redeemedOffers.length > 0 && (
        <div style={{
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '10px', padding: '10px 12px',
          marginBottom: '14px',
          fontSize: '12px', color: '#10B981',
          display: 'flex', gap: '8px', alignItems: 'center'
        }}>
          <span>✅</span>
          <span>These offers have been confirmed by the merchant.</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading...
        </div>
      )}

      {/* Offer list */}
      {!loading && displayed.map(offer => (
        <div
          key={offer.id}
          style={{
            background: 'var(--bg-card)',
            borderRadius: '14px',
            border: `1px solid ${
              offer.status === 'redeemed'
                ? 'rgba(16,185,129,0.3)'
                : offer.status === 'claimed'
                ? 'rgba(124,58,237,0.3)'
                : 'var(--border)'
            }`,
            padding: '14px', marginBottom: '10px'
          }}
        >
          {/* Main content row */}
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            gap: '12px', marginBottom: '10px'
          }}>
            <div style={{
              width: '42px', height: '42px',
              borderRadius: '10px',
              background: 'var(--bg-secondary)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px', flexShrink: 0
            }}>
              {categoryIcons[offer.category] || '🏪'}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: '6px', marginBottom: '2px'
              }}>
                <p style={{
                  fontSize: '14px', fontWeight: '600',
                  margin: 0, overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {offer.merchant_name}
                </p>
                {offer.status === 'redeemed' && (
                  <span style={{
                    fontSize: '10px', padding: '1px 6px',
                    background: 'rgba(16,185,129,0.15)',
                    color: '#10B981', borderRadius: '10px', flexShrink: 0
                  }}>
                    ✅ Redeemed
                  </span>
                )}
                {offer.status === 'claimed' && (
                  <span style={{
                    fontSize: '10px', padding: '1px 6px',
                    background: 'rgba(124,58,237,0.15)',
                    color: 'var(--accent-violet)', borderRadius: '10px', flexShrink: 0
                  }}>
                    🎫 Pending
                  </span>
                )}
              </div>
              <p style={{
                fontSize: '12px', color: 'var(--text-secondary)',
                marginBottom: '4px', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {offer.offer_text}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                {offer.status === 'redeemed' && offer.redeemed_at
                  ? `Redeemed ${new Date(offer.redeemed_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}`
                  : `Saved ${new Date(offer.saved_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}`
                }
              </p>
            </div>
          </div>

          {/* Action buttons — always show directions, show QR only for claimed */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleDirections(offer)}
              style={{
                flex: 1, padding: '8px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '10px', color: 'var(--text-secondary)',
                fontSize: '12px', fontWeight: '500',
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
              }}
            >
              🗺️ Directions
            </button>

            {offer.status === 'claimed' && offer.qr_data && (
              <button
                onClick={() => setSelectedOffer(offer)}
                style={{
                  flex: 1, padding: '8px 12px',
                  background: 'var(--accent-violet)',
                  border: 'none', borderRadius: '10px',
                  color: 'white', fontSize: '12px',
                  fontWeight: '600', cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif'
                }}
              >
                🎫 Show QR
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {!loading && displayed.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>
            {emptyStates[activeTab].icon}
          </div>
          <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            {emptyStates[activeTab].title}
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {emptyStates[activeTab].desc}
          </p>
        </div>
      )}

      {selectedOffer && (
        <QRModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
        />
      )}
    </div>
  )
}