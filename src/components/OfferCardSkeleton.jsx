export default function OfferCardSkeleton() {
  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '16px',
      border: '1px solid var(--border)',
      padding: '16px',
      marginBottom: '12px',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, var(--border) 25%, var(--border-light) 50%, var(--border) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }
      `}</style>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        <div className="shimmer" style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
        <div style={{ flex: 1 }}>
          <div className="shimmer" style={{ height: '14px', width: '60%', marginBottom: '6px' }} />
          <div className="shimmer" style={{ height: '12px', width: '40%' }} />
        </div>
      </div>
      <div className="shimmer" style={{ height: '48px', marginBottom: '10px', borderRadius: '10px' }} />
      <div className="shimmer" style={{ height: '12px', width: '80%', marginBottom: '6px' }} />
      <div className="shimmer" style={{ height: '12px', width: '60%', marginBottom: '14px' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <div className="shimmer" style={{ height: '36px', flex: 1, borderRadius: '10px' }} />
        <div className="shimmer" style={{ height: '36px', flex: 1, borderRadius: '10px' }} />
        <div className="shimmer" style={{ height: '36px', flex: 2, borderRadius: '10px' }} />
      </div>
    </div>
  )
}