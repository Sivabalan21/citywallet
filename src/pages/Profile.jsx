import { useState, useEffect } from 'react'
import { useAuth } from '../store/useAuth'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

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

const BUDGETS = [
  { id: 'budget', label: 'Budget ($)' },
  { id: 'mid', label: 'Mid-range ($$)' },
  { id: 'premium', label: 'Premium ($$$)' },
]

export default function Profile() {
  const { user, signOut, profile, saveProfile } = useAuth()
  const navigate = useNavigate()
  const [preferences, setPreferences] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({ saved: 0, claimed: 0 })
  const [editCategories, setEditCategories] = useState([])
  const [editBudget, setEditBudget] = useState('mid')
  const [subscription, setSubscription] = useState({
    plan: 'free', active: false,
    currentPeriodEnd: null,
    customerPro: null, merchantPro: null
  })

  const fetchSubscription = async () => {
    try {
      const res = await fetch(`/api/subscription-status?userEmail=${user.email}`)
      const data = await res.json()
      setSubscription(data)
    } catch {}
  }

  useEffect(() => {
    if (user) fetchSubscription()
  }, [user])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscription') === 'success') {
      window.history.replaceState({}, '', '/profile')
      if (user) setTimeout(() => fetchSubscription(), 2000)
    }
  }, [user])

  useEffect(() => {
    const load = async () => {
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()
      setPreferences(prefs)
      if (prefs) {
        setEditCategories(prefs.categories || [])
        setEditBudget(prefs.budget || 'mid')
      }
      const { data: offers } = await supabase
        .from('saved_offers')
        .select('status')
        .eq('user_id', user.id)
      if (offers) {
        setStats({
          saved: offers.filter(o => o.status === 'saved').length,
          claimed: offers.filter(o => o.status === 'claimed').length
        })
      }
    }
    if (user) load()
  }, [user])

  const handleSavePreferences = async () => {
    setSaving(true)
    try {
      await supabase.from('user_preferences').upsert({
        user_id: user.id,
        categories: editCategories,
        budget: editBudget,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      setPreferences(prev => ({ ...prev, categories: editCategories, budget: editBudget }))
      setEditing(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleSwitchToMerchant = async () => {
    await saveProfile({ current_mode: 'merchant' })
    window.location.href = '/merchant'
  }

  // Customer profile only cares about customerPro
  const isPro = !!(subscription.customerPro?.active)
  const customerProRenewDate = subscription.customerPro?.currentPeriodEnd
    ? new Date(subscription.customerPro.currentPeriodEnd).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      })
    : null

  return (
    <div style={{
      padding: '1.25rem 1rem',
      minHeight: '100vh',
      background: 'var(--bg-primary)'
    }}>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px' }}>
        Profile
      </h1>

      {/* User card */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: `1px solid ${isPro ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
        padding: '20px', marginBottom: '16px',
        display: 'flex', alignItems: 'center', gap: '14px',
        position: 'relative', overflow: 'hidden'
      }}>
        {isPro && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, var(--accent-violet), #9333EA)'
          }} />
        )}
        {user?.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt="Avatar"
            style={{
              width: '52px', height: '52px', borderRadius: '50%',
              border: `2px solid ${isPro ? 'var(--accent-violet)' : 'var(--border)'}`
            }}
          />
        ) : (
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'var(--accent-violet)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: '700', color: 'white'
          }}>
            {user?.user_metadata?.name?.[0] || user?.email?.[0] || '?'}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: '6px', marginBottom: '2px', flexWrap: 'wrap'
          }}>
            <p style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
              {user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}
            </p>
            {isPro && (
              <span style={{
                fontSize: '10px', padding: '2px 8px',
                background: 'linear-gradient(135deg, var(--accent-violet), #9333EA)',
                borderRadius: '20px', color: 'white', fontWeight: '700'
              }}>
                PRO
              </span>
            )}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            {user?.email}
          </p>
        </div>
      </div>

      {/* Customer Pro status — only shown when customer pro is active */}
      {isPro && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(147,51,234,0.1))',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: '16px', padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <div>
                <p style={{
                  fontSize: '14px', fontWeight: '700', margin: 0,
                  color: 'var(--accent-violet)'
                }}>
                  Customer Pro
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                  {customerProRenewDate ? `Renews ${customerProRenewDate}` : 'Active subscription'}
                </p>
              </div>
            </div>
            <span style={{
              fontSize: '11px', padding: '3px 10px',
              background: 'rgba(16,185,129,0.2)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '20px', color: '#10B981', fontWeight: '600'
            }}>
              ✅ Active
            </span>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '6px', marginBottom: '12px'
          }}>
            {['✓ Unlimited claims', '✓ Priority AI offers', '✓ Exclusive deals', '✓ No ads'].map(f => (
              <span key={f} style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{f}</span>
            ))}
          </div>
          <button
            onClick={() => navigate('/invoices')}
            style={{
              width: '100%', padding: '10px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '10px', color: 'var(--text-secondary)',
              fontSize: '13px', fontWeight: '500',
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
            }}
          >
            🧾 View Invoices & Billing
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '10px', marginBottom: '16px'
      }}>
        {[
          { label: 'Saved', value: stats.saved, icon: '🔖' },
          { label: 'Claimed', value: stats.claimed, icon: '🎫' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--bg-card)',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            padding: '16px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{stat.icon}</div>
            <div style={{
              fontSize: '24px', fontWeight: '700',
              color: 'var(--accent-violet)',
              fontFamily: 'DM Mono, monospace'
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Upgrade banner — only when NOT customer pro */}
      {!isPro && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(245,158,11,0.15))',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: '16px', padding: '16px',
          marginBottom: '16px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '12px'
        }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 2px' }}>
              ⚡ Upgrade to Customer Pro
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              Unlimited claims + exclusive deals · $4.99/mo
            </p>
          </div>
          <button
            onClick={() => navigate('/pricing')}
            style={{
              padding: '8px 16px',
              background: 'var(--accent-violet)',
              border: 'none', borderRadius: '10px',
              color: 'white', fontSize: '13px',
              fontWeight: '600', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap'
            }}
          >
            Upgrade
          </button>
        </div>
      )}

      {/* Preferences */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        padding: '16px', marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '14px'
        }}>
          <p style={{ fontSize: '15px', fontWeight: '600' }}>Preferences</p>
          <button
            onClick={() => editing ? handleSavePreferences() : setEditing(true)}
            style={{
              padding: '6px 14px',
              background: editing ? 'var(--accent-violet)' : 'var(--bg-secondary)',
              border: `1px solid ${editing ? 'var(--accent-violet)' : 'var(--border)'}`,
              borderRadius: '8px',
              color: editing ? 'white' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: '500',
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
            }}
          >
            {saving ? 'Saving...' : editing ? 'Save' : 'Edit'}
          </button>
        </div>
        {editing ? (
          <>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Categories
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setEditCategories(prev =>
                    prev.includes(cat.id)
                      ? prev.filter(c => c !== cat.id)
                      : [...prev, cat.id]
                  )}
                  style={{
                    padding: '6px 12px',
                    background: editCategories.includes(cat.id)
                      ? 'rgba(124,58,237,0.2)' : 'var(--bg-secondary)',
                    border: editCategories.includes(cat.id)
                      ? '1px solid var(--accent-violet)' : '1px solid var(--border)',
                    borderRadius: '20px', color: 'var(--text-primary)',
                    fontSize: '13px', cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif'
                  }}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Budget
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {BUDGETS.map(b => (
                <button
                  key={b.id}
                  onClick={() => setEditBudget(b.id)}
                  style={{
                    flex: 1, padding: '8px',
                    background: editBudget === b.id
                      ? 'rgba(124,58,237,0.2)' : 'var(--bg-secondary)',
                    border: editBudget === b.id
                      ? '1px solid var(--accent-violet)' : '1px solid var(--border)',
                    borderRadius: '10px', color: 'var(--text-primary)',
                    fontSize: '12px', cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif'
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {(preferences?.categories || []).map(cat => {
                const c = CATEGORIES.find(c => c.id === cat)
                return c ? (
                  <span key={cat} style={{
                    padding: '4px 10px',
                    background: 'rgba(124,58,237,0.15)',
                    border: '1px solid rgba(124,58,237,0.3)',
                    borderRadius: '20px', fontSize: '12px',
                    color: 'var(--text-secondary)'
                  }}>
                    {c.icon} {c.label}
                  </span>
                ) : null
              })}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Budget: {BUDGETS.find(b => b.id === preferences?.budget)?.label || 'Mid-range'}
            </p>
          </>
        )}
      </div>

      {/* Mode switcher */}
      {profile?.is_merchant && (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          padding: '16px', marginBottom: '12px'
        }}>
          <p style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 12px' }}>
            Switch Mode
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{
              flex: 1, padding: '12px',
              background: 'rgba(124,58,237,0.15)',
              border: '1.5px solid var(--accent-violet)',
              borderRadius: '12px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>🛍️</div>
              <p style={{ fontSize: '12px', color: 'var(--accent-violet)', fontWeight: '600', margin: 0 }}>
                Customer Mode
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Active now
              </p>
            </div>
            <button
              onClick={handleSwitchToMerchant}
              style={{
                flex: 1, padding: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px', textAlign: 'center',
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>🏪</div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', margin: 0 }}>
                {profile?.business_name || 'Merchant Mode'}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Switch</p>
            </button>
          </div>
        </div>
      )}

      {/* Become a merchant */}
      {!profile?.is_merchant && (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid rgba(245,158,11,0.3)',
          padding: '16px', marginBottom: '12px'
        }}>
          <p style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 6px' }}>
            🏪 Are you a merchant?
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
            Set up your business profile and start reaching customers nearby
          </p>
          <button
            onClick={() => navigate('/merchant-onboarding')}
            style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, var(--accent-gold), #F97316)',
              border: 'none', borderRadius: '12px',
              color: 'white', fontSize: '13px',
              fontWeight: '600', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif'
            }}
          >
            Set up merchant profile →
          </button>
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        style={{
          width: '100%', padding: '16px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '14px', color: '#EF4444',
          fontSize: '15px', fontWeight: '600',
          cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
        }}
      >
        Sign Out
      </button>
    </div>
  )
}