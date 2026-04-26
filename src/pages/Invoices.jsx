import { useState, useEffect } from 'react'
import { useAuth } from '../store/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Invoices() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch(`/api/invoices?userEmail=${user.email}`)
        const data = await res.json()
        setInvoices(data.invoices || [])
        setSubscription(data.subscription || null)
      } catch {}
      finally { setLoading(false) }
    }
    if (user) fetchInvoices()
  }, [user])

  return (
    <div style={{
      padding: '1.25rem 1rem',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingBottom: '100px'
    }}>
      <button
        onClick={() => navigate('/profile')}
        style={{
          background: 'none', border: 'none',
          color: 'var(--text-secondary)', fontSize: '14px',
          cursor: 'pointer', marginBottom: '1rem',
          fontFamily: 'DM Sans, sans-serif',
          display: 'flex', alignItems: 'center', gap: '4px'
        }}
      >
        ← Back to Profile
      </button>

      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>
        Billing & Invoices
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        Your subscription and payment history
      </p>

      {/* Subscription summary */}
      {subscription && (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid rgba(124,58,237,0.3)',
          padding: '16px', marginBottom: '20px'
        }}>
          <p style={{
            fontSize: '13px', color: 'var(--text-muted)',
            margin: '0 0 10px', fontWeight: '500'
          }}>
            CURRENT SUBSCRIPTION
          </p>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 2px' }}>
                {subscription.plan === 'customer_pro' ? 'Customer Pro' : 'Merchant Pro'}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                {subscription.plan === 'customer_pro' ? '$4.99' : '$9.99'}/month
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                fontSize: '11px', padding: '3px 10px',
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '20px', color: '#10B981',
                display: 'block', marginBottom: '4px'
              }}>
                ✅ Active
              </span>
              {subscription.currentPeriodEnd && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoices list */}
      <p style={{
        fontSize: '13px', color: 'var(--text-muted)',
        margin: '0 0 12px', fontWeight: '500',
        textTransform: 'uppercase', letterSpacing: '0.05em'
      }}>
        Payment History
      </p>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading invoices...
        </div>
      )}

      {!loading && invoices.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '3rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🧾</div>
          <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            No invoices yet
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Your payment history will appear here
          </p>
        </div>
      )}

      {!loading && invoices.map(invoice => (
        <div
          key={invoice.id}
          style={{
            background: 'var(--bg-card)',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            padding: '14px', marginBottom: '10px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px',
              borderRadius: '10px',
              background: invoice.status === 'paid'
                ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '18px', flexShrink: 0
            }}>
              {invoice.status === 'paid' ? '✅' : '❌'}
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 2px' }}>
                {invoice.description || 'CityWallet Subscription'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                {new Date(invoice.created * 1000).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{
              fontSize: '15px', fontWeight: '700',
              color: 'var(--text-primary)', margin: '0 0 4px',
              fontFamily: 'DM Mono, monospace'
            }}>
              ${(invoice.amount_paid / 100).toFixed(2)}
            </p>
            {invoice.hosted_invoice_url && (
              
                <a href={invoice.hosted_invoice_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '11px', color: 'var(--accent-violet)',
                  textDecoration: 'none', fontWeight: '500'
                }}
              >
                View PDF →
              </a>
            )}
          </div>
        </div>
      ))}

      <p style={{
        textAlign: 'center', fontSize: '11px',
        color: 'var(--text-muted)', marginTop: '1.5rem'
      }}>
        🔒 Invoices are also sent automatically to {user?.email}
      </p>
    </div>
  )
}