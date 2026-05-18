import { useState, useRef, useEffect } from 'react'

export default function WebcamCapture({ onCapture, label = "Take Live Photo" }) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const startCamera = async () => {
    setError('')
    setIsOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setError('Could not access camera. Please verify permissions or use file upload.')
      console.error(err)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsOpen(false)
  }

  const captureFrame = () => {
    if (!videoRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(blob => {
      if (!blob) {
        setError('Failed to capture frame.')
        return
      }
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
      onCapture(file)
      stopCamera()
    }, 'image/jpeg', 0.9)
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={startCamera}
        className="w-full py-4 rounded-2xl border border-dashed border-medical-green/40 bg-medical-green/5 hover:bg-medical-green/10 text-medical-green font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
      >
        <span>📸</span> {label}
      </button>
    )
  }

  return (
    <div className="glass-card p-4 rounded-3xl border border-medical-green/30 space-y-4">
      <div className="flex items-center justify-between px-2">
        <span className="text-sm font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Camera View
        </span>
        <button
          type="button"
          onClick={stopCamera}
          className="text-xs text-white/50 hover:text-white bg-white/5 px-3 py-1 rounded-xl border border-white/10"
        >
          ✕ Close
        </button>
      </div>

      {error ? (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
          {error}
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-navy aspect-video border border-white/10 shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 pointer-events-none border-2 border-medical-green/20 rounded-2xl" />
        </div>
      )}

      {!error && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={captureFrame}
            className="btn-primary w-full justify-center py-3 text-sm font-bold shadow-lg shadow-medical-green/30"
          >
            <span>⏺️</span> Capture & Analyze
          </button>
        </div>
      )}
    </div>
  )
}
