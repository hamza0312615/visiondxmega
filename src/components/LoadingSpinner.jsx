import { useState, useEffect } from 'react'

const medicalTips = [
  "💡 Tip: Staying well-hydrated helps your body maintain healthy blood volume and supports kidney function.",
  "💡 Tip: Adequate sleep (7-9 hours) is crucial for immune system repair and memory consolidation.",
  "💡 Tip: High-fiber foods like lentils, beans, and whole grains support healthy gut microbiome diversity.",
  "💡 Tip: Regular physical activity can reduce the risk of chronic conditions like heart disease and diabetes.",
  "💡 Tip: Proper wound care includes keeping the area clean, moist with ointment, and covered with a sterile bandage.",
  "💡 Tip: Persistent wet coughs or coughs lasting more than 3 weeks should always be evaluated by a physician.",
  "💡 Tip: Sleep apnea often goes undiagnosed; loud snoring followed by silent pauses is a common warning sign.",
  "💡 Tip: Always check medicine packaging for correct spelling, security seals, and proper batch numbers to avoid counterfeits.",
  "💡 Tip: Eye redness accompanied by severe pain or sudden vision loss requires immediate ophthalmologic emergency care.",
  "💡 Tip: For skin rashes, avoid scratching to prevent secondary bacterial infections and permanent scarring.",
  "💡 Tip: Fasting for 8-12 hours is usually required before a lipid panel or fasting blood glucose lab test.",
  "💡 Tip: In rural emergencies, clear communication of patient vitals and symptoms aids rapid triage decisions."
]

export default function LoadingSpinner({ message = "AI is analyzing your medical data..." }) {
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % medicalTips.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center glass-card rounded-3xl border border-medical-green/30 border-glow my-8">
      {/* Animated Medical Cross / Spinner */}
      <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-medical-green/20 animate-pulse" />
        <div className="absolute inset-0 rounded-full border-4 border-medical-green border-t-transparent animate-spin-slow" />
        <div className="text-4xl animate-pulse text-medical-green shadow-glow">✚</div>
      </div>

      {/* Message */}
      <h4 className="text-xl font-bold text-white font-outfit mb-3 flex items-center justify-center gap-2">
        {message}
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-medical-green animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-medical-green animate-pulse delay-100" />
          <span className="w-1.5 h-1.5 rounded-full bg-medical-green animate-pulse delay-200" />
        </span>
      </h4>

      {/* Rotating Medical Tip */}
      <div className="max-w-md mt-4 p-5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/80 leading-relaxed transition-all duration-500 shadow-inner" key={tipIndex}>
        {medicalTips[tipIndex]}
      </div>

      <div className="mt-8 text-xs text-white/40 tracking-wider uppercase font-semibold">
        Powered by Groq Llama-3.2-90B-Vision & Whisper Large v3
      </div>
    </div>
  )
}
