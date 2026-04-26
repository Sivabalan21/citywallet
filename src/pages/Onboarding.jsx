import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { supabase } from '../lib/supabase'

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
  { id: 'budget', label: 'Budget', desc: 'Under $15', icon: '$' },
  { id: 'mid', label: 'Mid-range', desc: '$15 – $50', icon: '$$' },
  { id: 'premium', label: 'Premium', desc: '$50+', icon: '$$$' },
]

const BRANDS = [
  'Starbucks', 'Nike', 'Whole Foods', 'SoulCycle',
  'Sephora', "McDonald's", 'Apple', 'Lululemon',
  "Trader Joe's", 'Equinox', 'H&M', 'Zara'
]

export default function Onboarding() {
  const { user, saveProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState([])
  const [budget, setBudget] = useState('mid')
  const [brands, setBrands] = useState([])
  const [saving, setSaving] = useState(false)

  const toggleCategory = (id) => {
    setCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const toggleBrand = (brand) => {
    if (brands.includes(brand)) {
      setBrands(prev => prev.filter(b => b !== brand))
    } else if (brands.length < 5) {
      setBrands(prev => [...prev, brand])
    }
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      // Step 1 — Save user preferences
      const { error: prefError } = await supabase
  .from('user_preferences')
  .upsert({
    user_id: user.id,
    categories,
    budget,
    brand_affinities: brands,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })

      if (prefError) {
        console.error('Preferences error:', prefError)
        throw prefError
      }

      // Step 2 — Save profile (marks onboarding complete)
      const savedProfile = await saveProfile({
        role: 'customer',
        is_merchant: false,
        current_mode: 'customer'
      })

      console.log('Profile saved:', savedProfile)

      // Step 3 — Navigate to home
      navigate('/home')
    } catch (err) {
      console.error('Onboarding finish error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '2rem 1.5rem',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Progress */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              height: '4px', flex: 1,
              marginRight: s < 3 ? '8px' : 0,
              borderRadius: '2px',
              background: s <= step ? 'var(--accent-violet)' : 'var(--border)'
            }} />
          ))}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          Step {step} of 3
        </p>
      </div>

      {/* Step 1 — Categories */}
      {step === 1 && (
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            What are you into?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '1.5rem' }}>
            Pick your interests so we can find relevant offers
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                style={{
                  padding: '16px',
                  background: categories.includes(cat.id) ? 'rgba(124,58,237,0.2)' : 'var(--bg-card)',
                  border: categories.includes(cat.id) ? '1.5px solid var(--accent-violet)' : '1px solid var(--border)',
                  borderRadius: '14px', color: 'var(--text-primary)',
                  cursor: 'pointer', display: 'flex',
                  flexDirection: 'column', alignItems: 'flex-start',
                  gap: '8px', fontFamily: 'DM Sans, sans-serif',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '24px' }}>{cat.icon}</span>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Budget */}
      {step === 2 && (
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Your spending style?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '1.5rem' }}>
            We'll match offers to your budget range
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {BUDGETS.map(b => (
              <button
                key={b.id}
                onClick={() => setBudget(b.id)}
                style={{
                  padding: '20px',
                  background: budget === b.id ? 'rgba(124,58,237,0.2)' : 'var(--bg-card)',
                  border: budget === b.id ? '1.5px solid var(--accent-violet)' : '1px solid var(--border)',
                  borderRadius: '14px', color: 'var(--text-primary)',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between',
                  fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s ease'
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600' }}>{b.label}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{b.desc}</div>
                </div>
                <span style={{
                  fontSize: '18px', fontWeight: '700',
                  color: budget === b.id ? 'var(--accent-violet)' : 'var(--text-muted)',
                  fontFamily: 'DM Mono, monospace'
                }}>{b.icon}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — Brands */}
      {step === 3 && (
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Favourite brands?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '0.5rem' }}>
            Pick up to 5 brands you love (optional)
          </p>
          <p style={{ color: 'var(--accent-violet)', fontSize: '12px', marginBottom: '1.5rem' }}>
            {brands.length}/5 selected
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {BRANDS.map(brand => (
              <button
                key={brand}
                onClick={() => toggleBrand(brand)}
                style={{
                  padding: '10px 16px',
                  background: brands.includes(brand) ? 'rgba(124,58,237,0.2)' : 'var(--bg-card)',
                  border: brands.includes(brand) ? '1.5px solid var(--accent-violet)' : '1px solid var(--border)',
                  borderRadius: '20px',
                  color: brands.includes(brand) ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '14px', fontWeight: '500',
                  fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s ease'
                }}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '2rem' }}>
        {step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            style={{
              flex: 1, padding: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '14px', color: 'var(--text-secondary)',
              fontSize: '15px', fontWeight: '600',
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
            }}
          >
            Back
          </button>
        )}
        <button
          onClick={() => step < 3 ? setStep(s => s + 1) : handleFinish()}
          disabled={saving || (step === 1 && categories.length === 0)}
          style={{
            flex: 2, padding: '16px',
            background: (step === 1 && categories.length === 0) || saving
              ? 'var(--border)' : 'var(--accent-violet)',
            border: 'none', borderRadius: '14px',
            color: 'white', fontSize: '15px', fontWeight: '600',
            cursor: (step === 1 && categories.length === 0) || saving ? 'not-allowed' : 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? 'Saving...' : step === 3 ? 'Get Started' : 'Continue'}
        </button>
      </div>
    </div>
  )
}