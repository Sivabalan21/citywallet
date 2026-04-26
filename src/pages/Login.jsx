import { useState } from 'react'
import { useAuth } from '../store/useAuth'

export default function Login() {
  const { signInWithGoogle } = useAuth()
  const [selected, setSelected] = useState(null)

  const handleSelect = (role) => {
    setSelected(role)
    setTimeout(() => signInWithGoogle(role), 300)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glows */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-20%',
        width: '70%', height: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-20%',
        width: '70%', height: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Logo */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '72px', height: '72px',
            background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-gold))',
            borderRadius: '20px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '32px',
            boxShadow: '0 8px 32px rgba(124,58,237,0.3)'
          }}>
            💳
          </div>
          <h1 style={{
            fontSize: '2rem', fontWeight: '700',
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px', margin: '0 0 8px'
          }}>
            CityWallet
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '14px', lineHeight: '1.5', margin: 0
          }}>
            The city that knows what you need,<br />before you even search for it.
          </p>
        </div>

        {/* Role selection */}
        <p style={{
          fontSize: '13px', fontWeight: '600',
          color: 'var(--text-muted)',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '14px'
        }}>
          I am a...
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '2rem' }}>
          {/* Customer card */}
          <button
            onClick={() => handleSelect('customer')}
            style={{
              padding: '20px',
              background: selected === 'customer'
                ? 'rgba(124,58,237,0.2)'
                : 'var(--bg-card)',
              border: selected === 'customer'
                ? '1.5px solid var(--accent-violet)'
                : '1px solid var(--border)',
              borderRadius: '16px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              fontFamily: 'DM Sans, sans-serif',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '48px', height: '48px',
                background: 'rgba(124,58,237,0.15)',
                borderRadius: '14px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '24px',
                flexShrink: 0
              }}>
                🛍️
              </div>
              <div>
                <p style={{
                  fontSize: '16px', fontWeight: '600',
                  color: 'var(--text-primary)', margin: '0 0 4px'
                }}>
                  Customer
                </p>
                <p style={{
                  fontSize: '13px', color: 'var(--text-secondary)', margin: 0
                }}>
                  Discover hyper-local deals & offers near you in real-time
                </p>
              </div>
            </div>
            <div style={{
              display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap'
            }}>
              {['📍 Location-aware', '🤖 AI-powered', '🎫 Claim & save'].map(tag => (
                <span key={tag} style={{
                  fontSize: '11px', padding: '3px 8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  color: 'var(--text-muted)'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </button>

          {/* Merchant card */}
          <button
            onClick={() => handleSelect('merchant')}
            style={{
              padding: '20px',
              background: selected === 'merchant'
                ? 'rgba(245,158,11,0.15)'
                : 'var(--bg-card)',
              border: selected === 'merchant'
                ? '1.5px solid var(--accent-gold)'
                : '1px solid var(--border)',
              borderRadius: '16px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              fontFamily: 'DM Sans, sans-serif'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '48px', height: '48px',
                background: 'rgba(245,158,11,0.15)',
                borderRadius: '14px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '24px',
                flexShrink: 0
              }}>
                🏪
              </div>
              <div>
                <p style={{
                  fontSize: '16px', fontWeight: '600',
                  color: 'var(--text-primary)', margin: '0 0 4px'
                }}>
                  Merchant
                </p>
                <p style={{
                  fontSize: '13px', color: 'var(--text-secondary)', margin: 0
                }}>
                  Post your offers & reach customers walking nearby
                </p>
              </div>
            </div>
            <div style={{
              display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap'
            }}>
              {['📊 Track redemptions', '📱 Scan QR codes', '🎯 Reach locals'].map(tag => (
                <span key={tag} style={{
                  fontSize: '11px', padding: '3px 8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  color: 'var(--text-muted)'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </button>
        </div>

        {selected && (
          <div style={{
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--accent-violet)',
            marginBottom: '1rem'
          }}>
            Redirecting to Google Sign In...
          </div>
        )}

        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)',
          lineHeight: '1.5'
        }}>
          By continuing, you agree to our Terms of Service.<br />
          You can switch between modes anytime after signing in.
        </p>
      </div>
    </div>
  )
}