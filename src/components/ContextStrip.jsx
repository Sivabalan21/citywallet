import { useEffect, useState } from 'react'
import { useLocation } from '../store/useLocation'

export default function ContextStrip() {
  const { lat, lng, neighborhood } = useLocation()
  const [weather, setWeather] = useState({ display: 'Loading...' })
  const [time, setTime] = useState('')

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}`)
        const data = await res.json()
        setWeather(data)
      } catch {
        setWeather({ display: 'NYC' })
      }
    }
    fetchWeather()
  }, [lat, lng])

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }))
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: 'var(--bg-card)',
      borderRadius: '14px',
      border: '1px solid var(--border)',
      marginBottom: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '14px' }}>📍</span>
        <span style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          fontWeight: '500',
          maxWidth: '140px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {neighborhood}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{
          fontSize: '13px',
          color: 'var(--text-secondary)'
        }}>
          {weather.display}
        </span>
        <span style={{
          fontSize: '13px',
          color: 'var(--accent-gold)',
          fontFamily: 'DM Mono, monospace',
          fontWeight: '500'
        }}>
          {time}
        </span>
      </div>
    </div>
  )
}