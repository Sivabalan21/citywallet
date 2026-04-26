import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/useAuth'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import MerchantOnboarding from './pages/MerchantOnboarding'
import MerchantDashboard from './pages/MerchantDashboard'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Saved from './pages/Saved'
import Profile from './pages/Profile'
import NavBar from './components/NavBar'
import Pricing from './pages/Pricing'
import Invoices from './pages/Invoices'

function CustomerLayout() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '80px' }}>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
      <NavBar />
    </div>
  )
}

export default function App() {
  const { user, loading, initialize, profile, saveProfile } = useAuth()

  useEffect(() => {
    initialize()
  }, [])

  useEffect(() => {
    const handlePostOAuth = async () => {
      if (!user) return
      if (profile === undefined) return

      const intendedRole = localStorage.getItem('citywallet_intended_role')

      if (profile === null) {
        if (intendedRole) {
          localStorage.removeItem('citywallet_intended_role')
          await saveProfile({
            role: intendedRole,
            is_merchant: intendedRole === 'merchant',
            current_mode: intendedRole
          })
        }
      } else {
        if (intendedRole === 'merchant' && profile.is_merchant) {
          localStorage.removeItem('citywallet_intended_role')
          await saveProfile({ current_mode: 'merchant' })
        } else if (intendedRole === 'customer') {
          localStorage.removeItem('citywallet_intended_role')
          await saveProfile({ current_mode: 'customer' })
        } else {
          localStorage.removeItem('citywallet_intended_role')
        }
      }
    }
    handlePostOAuth()
  }, [user, profile])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid var(--border)',
          borderTop: '3px solid var(--accent-violet)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <>
            <Route path="/merchant-onboarding" element={<MerchantOnboarding />} />
            <Route path="/merchant" element={<MerchantDashboard />} />
            <Route path="/onboarding" element={<Onboarding />} />
            {/* Standalone routes — accessible from any mode */}
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/*" element={
              <RequireSetup profile={profile}>
                <CustomerLayout />
              </RequireSetup>
            } />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}

function RequireSetup({ profile, children }) {
  if (profile === undefined) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid var(--border)',
          borderTop: '3px solid var(--accent-violet)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (profile === null) {
    const intendedRole = localStorage.getItem('citywallet_intended_role') || 'customer'
    if (intendedRole === 'merchant') {
      return <Navigate to="/merchant-onboarding" />
    }
    return <Navigate to="/onboarding" />
  }

  if (profile.is_merchant && profile.current_mode === 'merchant') {
    return <Navigate to="/merchant" />
  }

  return children
}