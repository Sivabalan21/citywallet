import { QRCodeSVG } from 'qrcode.react'

export default function QRModal({ offer, onClose }) {
  const qrData = offer.qr_data || JSON.stringify({ merchant: offer.merchant_name })

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
    }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '24px 24px 0 0',
          padding: '2rem',
          width: '100%',
          maxWidth: '430px',
          border: '1px solid var(--border)',
          borderBottom: 'none'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div style={{
          width: '40px',
          height: '4px',
          background: 'var(--border-light)',
          borderRadius: '2px',
          margin: '0 auto 1.5rem'
        }} />

        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '4px'
        }}>
          {offer.merchant_name}
        </h3>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          {offer.offer_text}
        </p>

        {/* QR Code */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}>
          <QRCodeSVG
            value={qrData}
            size={200}
            style={{ height: 'auto', maxWidth: '100%' }}
          />
        </div>

        <p style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          Show this QR code to the merchant · Valid for 24 hours
        </p>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '16px',
            background: 'var(--accent-violet)',
            border: 'none',
            borderRadius: '14px',
            color: 'white',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif'
          }}
        >
          Done
        </button>
      </div>
    </div>
  )
}