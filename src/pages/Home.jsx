import { useAuth } from '../store/useAuth'
import { useLocation } from '../store/useLocation'
import ContextStrip from '../components/ContextStrip'
import OfferCard from '../components/OfferCard'
import OfferCardSkeleton from '../components/OfferCardSkeleton'
import MapPicker from '../components/MapPicker'
import GoogleMapsLoader from '../components/GoogleMapsLoader'
import { useState, useEffect, useCallback, useRef } from 'react'
import CommunityUpload from '../components/CommunityUpload'
import CommunityOfferCard from '../components/CommunityOfferCard'
import MerchantOfferCard from '../components/MerchantOfferCard'

export default function Home() {
  const { user } = useAuth()
  const { lat, lng, neighborhood, isWatching } = useLocation()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [lastFetched, setLastFetched] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [communityOffers, setCommunityOffers] = useState([])
  const [merchantOffers, setMerchantOffers] = useState([])

  // Load user preferences
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { supabase } = await import('../lib/supabase')
        const { data } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single()
        setUserProfile(data)
      } catch {
        setUserProfile({})
      }
    }
    if (user) loadProfile()
  }, [user])

  // Fetch community offers
useEffect(() => {
  const fetchCommunityOffers = async () => {
    try {
      const res = await fetch(`/api/community-offers?lat=${lat}&lng=${lng}&radius=1000`)
      const data = await res.json()
      setCommunityOffers(data.offers || [])
    } catch {}
  }
  fetchCommunityOffers()
}, [lat, lng])

useEffect(() => {
  const fetchMerchantOffers = async () => {
    try {
      const res = await fetch(
        `/api/nearby-merchant-offers?lat=${lat}&lng=${lng}&radius=2000`
      )
      const data = await res.json()
      setMerchantOffers(data.offers || [])
    } catch {}
  }
  fetchMerchantOffers()
}, [lat, lng])

// Initialize GPS location on first load
useEffect(() => {
  const { initializeLocation } = useLocation.getState()
  initializeLocation()
}, [])

  const fetchOffers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      let weather = 'Clear, 18°C'
      try {
        const wRes = await fetch(`/api/weather?lat=${lat}&lng=${lng}`)
        const wData = await wRes.json()
        weather = wData.display
      } catch {}

      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          neighborhood,
          weather,
          userProfile: userProfile || {}
        })
      })

      const data = await res.json()
      if (res.status === 429) {
        // Show cached offers if available, don't clear existing
        console.log('Rate limited — keeping existing offers')
        return
      }
      if (data.offers) {
        setOffers(data.offers)
        setLastFetched(new Date())
      }
    } catch (err) {
      console.error('Failed to fetch offers:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [lat, lng, neighborhood, userProfile])

  // Fetch on mount and when location changes
const fetchTimeoutRef = useRef(null)

useEffect(() => {
  if (userProfile === null) return
  if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current)
  fetchTimeoutRef.current = setTimeout(() => {
    fetchOffers()
  }, 1000)
  return () => clearTimeout(fetchTimeoutRef.current)
}, [lat, lng, userProfile])

  // Auto refresh every 10 minutes
useEffect(() => {
  const interval = setInterval(() => {
    fetchOffers(true)
  }, 10 * 60 * 1000)
  return () => clearInterval(interval)
}, [fetchOffers])

  // Pull to refresh
  useEffect(() => {
    let startY = 0
    let pulling = false

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY
      pulling = window.scrollY === 0
    }

    const handleTouchEnd = (e) => {
      const endY = e.changedTouches[0].clientY
      if (pulling && endY - startY > 80) {
        fetchOffers(true)
      }
    }

    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [fetchOffers])

  const featuredOffers = offers.slice(0, 3)
  const moreOffers = offers.slice(3)

  return (
    <div style={{
      padding: '1.25rem 1rem',
      minHeight: '100vh',
      background: 'var(--bg-primary)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Hey {user?.user_metadata?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            margin: '2px 0 0'
          }}>
            {offers.length > 0
              ? `${offers.length} offers near you`
              : 'Finding offers near you...'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {refreshing && (
            <div style={{
              width: '18px',
              height: '18px',
              border: '2px solid var(--border)',
              borderTop: '2px solid var(--accent-violet)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
          )}
          {isWatching && (
            <div style={{
              fontSize: '11px',
              color: '#10B981',
              background: 'rgba(16,185,129,0.15)',
              padding: '4px 8px',
              borderRadius: '20px',
              border: '1px solid rgba(16,185,129,0.3)'
            }}>
              🚶 Walking
            </div>
          )}
          <button
            onClick={() => setShowMap(true)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            🗺️
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <ContextStrip />

      {isWatching && (
        <div style={{
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '12px',
          padding: '10px 14px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: '#10B981'
        }}>
          <span>🚶</span>
          <span>Walking mode — offers updating as you move through the city</span>
        </div>
      )}

      <button
        onClick={() => fetchOffers(false)}
        disabled={loading}
        style={{
          width: '100%',
          padding: '10px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
          marginBottom: '16px',
          fontFamily: 'DM Sans, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
      >
        {loading ? '⏳ Finding offers...' : '🔄 Refresh offers'}
        {lastFetched && !loading && (
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            · {Math.floor((new Date() - lastFetched) / 60000)}m ago
          </span>
        )}
      </button>

      {loading && (
        <>
          <p style={{
            fontSize: '12px',
            color: 'var(--accent-violet)',
            textAlign: 'center',
            marginBottom: '12px'
          }}>
            🤖 AI agent scanning nearby venues...
          </p>
          {[1, 2, 3].map(i => <OfferCardSkeleton key={i} />)}
        </>
      )}

      {!loading && featuredOffers.length > 0 && (
        <>
          <p style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '10px'
          }}>
            ⚡ Top picks for you
          </p>
          {featuredOffers.map((offer, i) => (
            <OfferCard key={i} offer={offer} featured={i === 0} />
          ))}
        </>
      )}

      {/* Verified merchant offers */}
{!loading && merchantOffers.length > 0 && (
  <>
    <p style={{
      fontSize: '12px', fontWeight: '600',
      color: 'var(--accent-gold)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '10px', marginTop: '4px'
    }}>
      ✅ Merchant offers nearby
    </p>
    {merchantOffers.map((offer, i) => (
      <MerchantOfferCard key={i} offer={offer} />
    ))}
  </>
)}

      {!loading && moreOffers.length > 0 && (
        <>
          <p style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '10px',
            marginTop: '4px'
          }}>
            More nearby
          </p>
          {moreOffers.map((offer, i) => (
            <OfferCard key={i + 3} offer={offer} />
          ))}
        </>
      )}

      {/* Community offers */}
      {!loading && communityOffers.length > 0 && (
        <>
          <p style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--accent-gold)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '10px',
            marginTop: '4px'
          }}>
            👥 Community spotted
          </p>
          {communityOffers.map((offer, i) => (
            <CommunityOfferCard key={i} offer={offer} />
          ))}
        </>
      )}

      {/* Community upload */}
      {!loading && (
        <CommunityUpload
          onSuccess={(offer) => {
            setCommunityOffers(prev => [offer, ...prev])
          }}
        />
      )}

      {!loading && offers.length === 0 && communityOffers.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🏙️</div>
          <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            No offers found
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Try setting a different location or refreshing
          </p>
        </div>
      )}

      {showMap && (
        <GoogleMapsLoader>
          <MapPicker onClose={() => setShowMap(false)} />
        </GoogleMapsLoader>
      )}
    </div>
  )
}