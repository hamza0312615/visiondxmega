import { useState, useRef, useEffect } from 'react'

export default function WebcamCapture({ onCapture, label = "Take Live Photo" }) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState('')
  const [hasTorch, setHasTorch] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  
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

      // Check for torch capability
      const track = stream.getVideoTracks()[0]
      if (track) {
        // Wait slightly for capabilities to populate on some mobile browsers
        setTimeout(() => {
          try {
            const capabilities = track.getCapabilities ? track.getCapabilities() : {}
            if (capabilities.torch) {
              setHasTorch(true)
            }
          } catch (e) {
            console.warn('getVideoTracks().getCapabilities() not supported or failed:', e)
          }
        }, 300)
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
    setHasTorch(false)
    setTorchOn(false)
    setIsOpen(false)
  }

  const toggleTorch = async () => {
    if (!streamRef.current) return
    const track = streamRef.current.getVideoTracks()[0]
    if (track && hasTorch) {
      try {
        const nextTorchState = !torchOn
        await track.applyConstraints({
          advanced: [{ torch: nextTorchState }]
        })
        setTorchOn(nextTorchState)
      } catch (err) {
        console.error('Failed to toggle torch:', err)
      }
    }
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
        className="w-full py-4 rounded-2xl border border-dashed border-medical-green/40 bg-medical-green/5 hover:bg-medical-green/10 text-medical-green font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:border-medical-green/60"
      >
        <span>📸</span> {label}
      </button>
    )
  }

  return (
    <div className="glass-card p-4 rounded-3xl border border-medical-green/30 space-y-4">
      <div className="flex items-center justify-between px-2">
        <span className="text-sm font-bold text-white flex items-center gap-2 font-outfit">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" /> Live Camera Stream
        </span>
        <button
          type="button"
          onClick={stopCamera}
          className="text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-all font-medium"
        >
          ✕ Close Camera
        </button>
      </div>

      {error ? (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
          {error}
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-navy-950 aspect-square md:aspect-video border border-white/10 shadow-inner max-h-[50vh] flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 pointer-events-none border-2 border-medical-green/20 rounded-2xl" />
          
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`absolute top-4 right-4 z-10 w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all border shadow-lg ${
                torchOn 
                  ? 'bg-amber-500 text-navy-950 border-amber-400 shadow-amber-500/30 scale-105' 
                  : 'bg-black/60 text-white border-white/10 hover:bg-black/80 hover:scale-105'
              }`}
              title={torchOn ? 'Turn Flash Off' : 'Turn Flash On'}
            >
              {torchOn ? '⚡' : '💡'}
            </button>
          )}
        </div>
      )}

      {!error && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={captureFrame}
            className="btn-primary w-full justify-center py-3.5 text-sm font-extrabold shadow-xl shadow-medical-green/20"
          >
            <span>⏺️</span> Capture & Analyze
          </button>
        </div>
      )}
    </div>
  )
}
