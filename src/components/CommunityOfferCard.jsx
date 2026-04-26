const categoryIcons = {
  food: '🍔', coffee: '☕', fashion: '👗',
  fitness: '💪', nightlife: '🍸', shopping: '🛍️',
  beauty: '💄', books: '📚'
}

export default function CommunityOfferCard({ offer }) {
  const handleDirections = () => {
    const destination = offer.merchant_address
      ? encodeURIComponent(`${offer.merchant_name}, ${offer.merchant_address}`)
      : encodeURIComponent(`${offer.merchant_name}, New York City`)
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank')
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '16px',
      border: '1px solid rgba(245,158,11,0.3)',
      padding: '16px',
      marginBottom: '12px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Community badge accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4px',
        height: '100%',
        background: 'var(--accent-gold)',
        borderRadius: '4px 0 0 4px'
      }} />

      {/* Community badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(245,158,11,0.15)',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: '20px',
        padding: '2px 8px',
        marginBottom: '10px',
        marginLeft: '8px'
      }}>
        <span style={{ fontSize: '10px' }}>👥</span>
        <span style={{
          fontSize: '11px',
          color: 'var(--accent-gold)',
          fontWeight: '500'
        }}>
          Community spotted · Verify before visiting
        </span>
      </div>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '10px',
        paddingLeft: '8px'
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px'
          }}>
            <span style={{ fontSize: '16px' }}>
              {categoryIcons[offer.category] || '🏪'}
            </span>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              {offer.merchant_name}
            </span>
          </div>
          <p style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            margin: 0,
            paddingLeft: '24px'
          }}>
            {offer.merchant_address}
          </p>
        </div>

        <div style={{
          fontSize: '11px',
          color: 'var(--accent-gold)',
          background: 'rgba(245,158,11,0.1)',
          padding: '2px 8px',
          borderRadius: '20px',
          whiteSpace: 'nowrap'
        }}>
          {Math.round((offer.ai_confidence || 0.7) * 100)}% AI verified
        </div>
      </div>

      {/* Offer text */}
      <div style={{
        background: 'rgba(245,158,11,0.1)',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: '10px',
        padding: '10px 12px',
        marginBottom: '10px',
        marginLeft: '8px'
      }}>
        <p style={{
          fontSize: '13px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          margin: 0
        }}>
          {offer.offer_text}
        </p>
      </div>

      {/* Image thumbnail if available */}
      {offer.image_url && (
        <div style={{ paddingLeft: '8px', marginBottom: '10px' }}>
          <img
            src={offer.image_url}
            alt="Community offer"
            style={{
              width: '80px',
              height: '60px',
              objectFit: 'cover',
              borderRadius: '8px',
              border: '1px solid var(--border)'
            }}
          />
        </div>
      )}

      {/* Time */}
      <p style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        marginBottom: '12px',
        paddingLeft: '8px'
      }}>
        🕐 {new Date(offer.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>

      {/* Actions */}
      <div style={{ paddingLeft: '8px' }}>
        <button
          onClick={handleDirections}
          style={{
            padding: '8px 16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif'
          }}
        >
          🗺️ Directions
        </button>
      </div>
    </div>
  )
}