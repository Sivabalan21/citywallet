import { useState, useEffect } from 'react'
import { useAuth } from '../store/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Pricing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(null)
  const [customerPlan, setCustomerPlan] = useState('free')
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const res = await fetch(`/api/subscription-status?userEmail=${user.email}&planType=customer`)
        const data = await res.json()
        // Only show customer_pro status here — ignore merchant_pro
        setCustomerPlan(data.plan === 'customer_pro' ? 'customer_pro' : 'free')
      } catch {}
      finally { setCheckingStatus(false) }
    }
    if (user) checkSubscription()
  }, [user])

  // Re-fetch after Stripe redirect instead of relying on URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscription') === 'success') {
      // Clean URL
      window.history.replaceState({}, '', '/pricing')
      // Re-fetch subscription status
      const refetch = async () => {
        try {
          const res = await fetch(`/api/subscription-status?userEmail=${user.email}`)
          const data = await res.json()
          setCustomerPlan(data.plan === 'customer_pro' ? 'customer_pro' : 'free')
        } catch {}
      }
      if (user) refetch()
    }
  }, [user])

  const handleSubscribe = async (plan) => {
    setLoading(plan)
    try {
      const priceId = import.meta.env.VITE_STRIPE_CUSTOMER_PRO_PRICE_ID
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          userEmail: user.email,
          plan: 'customer_pro'
        })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  const isCustomerPro = customerPlan === 'customer_pro'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '1.5rem 1rem',
      paddingBottom: '100px'
    }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none', border: 'none',
          color: 'var(--text-secondary)', fontSize: '14px',
          cursor: 'pointer', marginBottom: '1rem',
          fontFamily: 'DM Sans, sans-serif',
          display: 'flex', alignItems: 'center', gap: '4px'
        }}
      >
        ← Back
      </button>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px' }}>
          Customer Pro
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          Get more from your city
        </p>
      </div>

      {/* Current plan badge */}
      {!checkingStatus && (
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{
            fontSize: '12px', padding: '4px 12px',
            background: isCustomerPro ? 'rgba(16,185,129,0.15)' : 'var(--bg-card)',
            border: `1px solid ${isCustomerPro ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
            borderRadius: '20px',
            color: isCustomerPro ? '#10B981' : 'var(--text-muted)'
          }}>
            {isCustomerPro ? '✅ Customer Pro — Active' : 'Current plan: Free'}
          </span>
        </div>
      )}

      {/* Customer Pro card */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '20px',
        border: `1.5px solid ${isCustomerPro ? 'var(--accent-violet)' : 'var(--border)'}`,
        padding: '20px', marginBottom: '16px',
        position: 'relative', overflow: 'hidden'
      }}>
        {isCustomerPro && (
          <div style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'var(--accent-violet)',
            color: 'white', fontSize: '11px',
            fontWeight: '600', padding: '3px 10px',
            borderRadius: '20px'
          }}>
            Active
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '12px', marginBottom: '12px'
        }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'rgba(124,58,237,0.15)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '24px'
          }}>
            🛍️
          </div>
          <div>
            <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Customer Pro
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              For power users who want the best deals
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <span style={{
            fontSize: '32px', fontWeight: '700',
            color: 'var(--accent-violet)',
            fontFamily: 'DM Mono, monospace'
          }}>
            $4.99
          </span>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/month</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {[
            'Unlimited offer claims per day',
            'Priority AI offer ranking',
            'Exclusive merchant deals',
            'Early access to new features',
            'No ads'
          ].map(feature => (
            <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--accent-violet)', fontSize: '14px' }}>✓</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{feature}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => !isCustomerPro && handleSubscribe('customer_pro')}
          disabled={isCustomerPro || loading === 'customer_pro'}
          style={{
            width: '100%', padding: '14px',
            background: isCustomerPro
              ? 'var(--bg-secondary)'
              : 'linear-gradient(135deg, var(--accent-violet), #9333EA)',
            border: isCustomerPro ? '1px solid var(--accent-violet)' : 'none',
            borderRadius: '12px',
            color: isCustomerPro ? 'var(--accent-violet)' : 'white',
            fontSize: '14px', fontWeight: '600',
            cursor: isCustomerPro ? 'default' : 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            opacity: loading === 'customer_pro' ? 0.7 : 1
          }}
        >
          {loading === 'customer_pro' ? 'Redirecting...' :
           isCustomerPro ? '✅ Current Plan' :
           'Upgrade to Customer Pro'}
        </button>
      </div>

      {/* Free plan */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        padding: '16px', marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 2px' }}>Free Plan</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              5 claims/day · Basic AI offers
            </p>
          </div>
          {!isCustomerPro && (
            <span style={{
              fontSize: '11px', padding: '3px 10px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '20px', color: 'var(--text-muted)'
            }}>
              Current
            </span>
          )}
        </div>
      </div>

      <p style={{
        textAlign: 'center', fontSize: '11px',
        color: 'var(--text-muted)', marginTop: '1rem'
      }}>
        🔒 Secure payments via Stripe · Test mode active
      </p>
    </div>
  )
}