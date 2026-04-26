import { useState } from 'react'
import { useLocation } from '../store/useLocation'
import { useAuth } from '../store/useAuth'
import OfferCard from '../components/OfferCard'
import OfferCardSkeleton from '../components/OfferCardSkeleton'

const CATEGORIES = [
  { id: 'food', label: 'Food', icon: '🍔' },
  { id: 'coffee', label: 'Coffee', icon: '☕' },
  { id: 'fashion', label: 'Fashion', icon: '👗' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'nightlife', label: 'Nightlife', icon: '🍸' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'beauty', label: 'Beauty', icon: '💄' },
  { id: 'books', label: 'Books', icon: '📚' },
]

export default function Explore() {
  const { lat, lng, neighborhood } = useLocation()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (searchQuery = query, category = activeCategory) => {
    if (!searchQuery && !category) return
    setLoading(true)
    setSearched(true)

    try {
      const res = await fetch('/api/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          neighborhood,
          query: searchQuery || category,
          userProfile: { categories: category ? [category] : [] }
        })
      })
      const data = await res.json()
      setOffers(data.offers || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (categoryId) => {
    const newCategory = activeCategory === categoryId ? null : categoryId
    setActiveCategory(newCategory)
    if (newCategory) handleSearch('', newCategory)
  }

  return (
    <div style={{
      padding: '1.25rem 1rem',
      minHeight: '100vh',
      background: 'var(--bg-primary)'
    }}>
      <h1 style={{
        fontSize: '22px',
        fontWeight: '700',
        marginBottom: '4px'
      }}>Explore</h1>
      <p style={{
        fontSize: '13px',
        color: 'var(--text-secondary)',
        marginBottom: '16px'
      }}>
        Search for deals near {neighborhood}
      </p>

      {/* Search bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search deals, merchants, categories..."
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontFamily: 'DM Sans, sans-serif',
            outline: 'none'
          }}
        />
        <button
          onClick={() => handleSearch()}
          disabled={loading || !query}
          style={{
            padding: '12px 16px',
            background: 'var(--accent-violet)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif'
          }}
        >
          🔍
        </button>
      </div>

      {/* Category chips */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px',
        marginBottom: '20px'
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            style={{
              padding: '8px 14px',
              background: activeCategory === cat.id
                ? 'rgba(124,58,237,0.2)'
                : 'var(--bg-card)',
              border: activeCategory === cat.id
                ? '1.5px solid var(--accent-violet)'
                : '1px solid var(--border)',
              borderRadius: '20px',
              color: activeCategory === cat.id
                ? 'var(--text-primary)'
                : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <>
          <p style={{
            fontSize: '12px',
            color: 'var(--accent-violet)',
            textAlign: 'center',
            marginBottom: '12px'
          }}>
            🤖 Searching for the best deals...
          </p>
          {[1, 2, 3].map(i => <OfferCardSkeleton key={i} />)}
        </>
      )}

      {/* Results */}
      {!loading && offers.length > 0 && (
        <>
          <p style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '12px'
          }}>
            {offers.length} results found
          </p>
          {offers.map((offer, i) => (
            <OfferCard key={i} offer={offer} />
          ))}
        </>
      )}

      {/* Empty state */}
      {!loading && searched && offers.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🔍</div>
          <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            No results found
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Try a different search or category
          </p>
        </div>
      )}

      {/* Initial state */}
      {!searched && (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🗽</div>
          <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            Discover NYC deals
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Search above or tap a category
          </p>
        </div>
      )}
    </div>
  )
}