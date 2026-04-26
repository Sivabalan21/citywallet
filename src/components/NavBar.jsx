import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { path: '/home', icon: '🏠', label: 'Home' },
  { path: '/explore', icon: '🔍', label: 'Explore' },
  { path: '/saved', icon: '🔖', label: 'Saved' },
  { path: '/profile', icon: '👤', label: 'Profile' },
]

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '430px',
      background: 'rgba(18, 18, 26, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      padding: '8px 0 20px',
      zIndex: 100
    }}>
      {tabs.map(tab => {
        const active = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 0',
              fontFamily: 'DM Sans, sans-serif'
            }}
          >
            <span style={{
              fontSize: '22px',
              filter: active ? 'none' : 'grayscale(1) opacity(0.5)'
            }}>
              {tab.icon}
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: active ? '600' : '400',
              color: active ? 'var(--accent-violet)' : 'var(--text-muted)'
            }}>
              {tab.label}
            </span>
            {active && (
              <div style={{
                position: 'absolute',
                bottom: '0',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: 'var(--accent-violet)'
              }} />
            )}
          </button>
        )
      })}
    </div>
  )
}