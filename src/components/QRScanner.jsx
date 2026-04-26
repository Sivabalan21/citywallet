import { useEffect, useRef, useState } from 'react'

export default function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)
  const [error, setError] = useState(null)
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        intervalRef.current = setInterval(scanFrame, 500)
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera access and try again.')
    }
  }

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
  }

  const scanFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    try {
      // Use BarcodeDetector if available (Chrome/Edge)
      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        const barcodes = await detector.detect(canvas)
        if (barcodes.length > 0) {
          setScanning(false)
          stopCamera()
          onScan(barcodes[0].rawValue)
        }
      } else {
        // Fallback — jsQR library loaded dynamically
        const jsQR = (await import('jsqr')).default
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code) {
          setScanning(false)
          stopCamera()
          onScan(code.data)
        }
      }
    } catch {}
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.95)',
      zIndex: 2000,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center'
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <p style={{ color: 'white', fontWeight: '600', fontSize: '16px', margin: 0 }}>
          Scan Customer QR
        </p>
        <button
          onClick={() => { stopCamera(); onClose() }}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none', borderRadius: '50%',
            width: '36px', height: '36px',
            color: 'white', fontSize: '18px',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}
        >×</button>
      </div>

      {error ? (
        <div style={{
          background: 'rgba(239,68,68,0.2)',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: '14px', padding: '20px',
          textAlign: 'center', maxWidth: '280px'
        }}>
          <p style={{ color: '#EF4444', fontSize: '14px', margin: '0 0 12px' }}>{error}</p>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', background: 'var(--accent-violet)',
              border: 'none', borderRadius: '10px',
              color: 'white', fontSize: '13px',
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
            }}
          >
            Close
          </button>
        </div>
      ) : (
        <>
          {/* Camera view */}
          <div style={{
            position: 'relative',
            width: '280px', height: '280px',
            borderRadius: '16px', overflow: 'hidden'
          }}>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              playsInline muted
            />
            {/* Scanning overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              border: '2px solid var(--accent-violet)',
              borderRadius: '16px'
            }}>
              {/* Corner markers */}
              {['topleft', 'topright', 'bottomleft', 'bottomright'].map(corner => (
                <div key={corner} style={{
                  position: 'absolute',
                  width: '24px', height: '24px',
                  borderColor: 'var(--accent-gold)',
                  borderStyle: 'solid',
                  borderWidth: corner.includes('top') ? '3px 0 0' : '0 0 3px',
                  borderLeftWidth: corner.includes('left') ? '3px' : '0',
                  borderRightWidth: corner.includes('right') ? '3px' : '0',
                  top: corner.includes('top') ? '8px' : 'auto',
                  bottom: corner.includes('bottom') ? '8px' : 'auto',
                  left: corner.includes('left') ? '8px' : 'auto',
                  right: corner.includes('right') ? '8px' : 'auto',
                }} />
              ))}
              {/* Scanning line */}
              {scanning && (
                <div style={{
                  position: 'absolute',
                  left: '8px', right: '8px',
                  height: '2px',
                  background: 'var(--accent-violet)',
                  boxShadow: '0 0 8px var(--accent-violet)',
                  animation: 'scanline 2s linear infinite'
                }} />
              )}
            </div>
            <style>{`
              @keyframes scanline {
                0% { top: 10%; }
                50% { top: 85%; }
                100% { top: 10%; }
              }
            `}</style>
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '13px', marginTop: '20px',
            textAlign: 'center'
          }}>
            Point camera at customer's QR code
          </p>
        </>
      )}
    </div>
  )
}