import { useState, useEffect } from 'react'
import { getApiKey, setApiKey, getWhatsAppConfig, setWhatsAppConfig } from '../utils/localStorage'

export default function Settings() {
  const [apiKey, setApiKeyValue] = useState('')
  const [geminiKey, setGeminiKeyValue] = useState('')
  const [doctorPhone, setDoctorPhone] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setApiKeyValue(getApiKey())
    setGeminiKeyValue(localStorage.getItem('visiondx_gemini_key') || '')
    const waConfig = getWhatsAppConfig()
    setDoctorPhone(waConfig.doctorPhone || '')
  }, [])

  const handleSave = (e) => {
    e.preventDefault()
    setApiKey(apiKey.trim())
    localStorage.setItem('visiondx_gemini_key', geminiKey.trim())
    setWhatsAppConfig({ doctorPhone: doctorPhone.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleResetDefault = () => {
    const defaultKey = import.meta.env.VITE_GROQ_API_KEY || ''
    const defaultPhone = '923001234567'
    setApiKeyValue(defaultKey)
    setApiKey(defaultKey)
    setGeminiKeyValue('')
    localStorage.removeItem('visiondx_gemini_key')
    setDoctorPhone(defaultPhone)
    setWhatsAppConfig({ doctorPhone: defaultPhone })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 slide-in">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-3">
          <span>⚙️</span> System Settings
        </h1>
        <p className="text-sm text-white/60 mt-1 max-w-2xl">
          Configure your Groq & Gemini API credentials and WhatsApp Doctor triage routing preferences for VisionDX Mega.
        </p>
      </div>

      {/* API Key Configuration Card */}
      <div className="glass-card p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-medical-green/5 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
            <span>🔑</span> AI API Keys & WhatsApp Configuration
          </h2>
          <p className="text-sm text-white/50 leading-relaxed">
            VisionDX operates 100% client-side. Your API keys and WhatsApp configurations are stored securely in your browser's local storage and are never transmitted to any external server.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                Groq API Key (Primary)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKeyValue(e.target.value)}
                placeholder="gsk_..."
                className="input-field font-mono text-sm tracking-widest bg-navy-900"
                required
              />
              <p className="text-xs text-white/40 mt-2 leading-relaxed">
                Get your free, high-speed inference API key from the{' '}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-medical-green hover:underline font-semibold"
                >
                  Groq Cloud Console
                </a>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                Gemini API Key (Vision Fallback)
              </label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKeyValue(e.target.value)}
                placeholder="AIzaSy..."
                className="input-field font-mono text-sm tracking-widest bg-navy-900"
              />
              <p className="text-xs text-white/40 mt-2 leading-relaxed">
                Optional fallback for image analysis if Groq Vision is rate-limited. Get it from{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-medical-green hover:underline font-semibold"
                >
                  Google AI Studio
                </a>.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                WhatsApp Doctor Phone Number
              </label>
              <input
                type="text"
                value={doctorPhone}
                onChange={(e) => setDoctorPhone(e.target.value)}
                placeholder="e.g. 923001234567"
                className="input-field font-mono text-sm tracking-widest bg-navy-900 max-w-md"
              />
              <p className="text-xs text-white/40 mt-2 leading-relaxed">
                Enter the country code followed by phone number (no '+' or leading zeros). Used for instant triage alert forwarding.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button type="submit" className="btn-primary py-3 px-8 text-xs shadow-lg shadow-medical-green/20">
              <span>💾</span> Save Configurations
            </button>

            <button
              type="button"
              onClick={handleResetDefault}
              className="btn-secondary py-3 px-6 text-xs"
              title="Restore the default project key and phone number"
            >
              🔄 Restore Default Settings
            </button>

            {saved && (
              <span className="text-xs font-semibold text-medical-green flex items-center gap-1.5 fade-in bg-medical-green/10 border border-medical-green/20 px-4 py-2 rounded-xl shadow-md">
                <span className="w-2 h-2 rounded-full bg-medical-green animate-pulse" />
                Settings saved successfully!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Model Specs & Architecture Info */}
      <div className="glass-card-light p-8 rounded-3xl border border-white/5 space-y-6 shadow-xl">
        <h3 className="text-lg font-bold text-white font-outfit flex items-center gap-2">
          <span>🧠</span> Active AI Models & Multi-Tier Fallback Architecture
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5 shadow-inner">
            <div className="text-xs text-white/40 uppercase font-bold tracking-wider">Vision Engine (3-Tier)</div>
            <div className="font-bold text-white font-mono text-xs text-medical-green">llama-3.2-11b / Gemini / OCR</div>
            <div className="text-[11px] text-white/50 leading-relaxed">Multi-model fallback ensures 100% success rate for Eye, Skin, Wound & Medicine scans.</div>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5 shadow-inner">
            <div className="text-xs text-white/40 uppercase font-bold tracking-wider">Audio Engine</div>
            <div className="font-bold text-white font-mono text-xs text-cyan-400">whisper-large-v3</div>
            <div className="text-[11px] text-white/50 leading-relaxed">Used for Cough, Sleep acoustic markers & VoiceDoc speech transcription.</div>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5 shadow-inner">
            <div className="text-xs text-white/40 uppercase font-bold tracking-wider">Text Engine</div>
            <div className="font-bold text-white font-mono text-xs text-purple-400">llama-3.3-70b-versatile</div>
            <div className="text-[11px] text-white/50 leading-relaxed">Used for complex diagnostic reasoning, scoring & multilingual triage.</div>
          </div>
        </div>

        {/* Global Medical Disclaimer */}
        <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 space-y-2 shadow-inner">
          <div className="font-bold font-outfit text-base flex items-center gap-2">
            <span>⚕️</span> Medical Disclaimer
          </div>
          <p className="text-xs leading-relaxed text-white/80">
            VisionDX Mega is an AI-powered medical diagnostics demonstration platform. All evaluations, recommendations, and risk assessments are generated by artificial intelligence models and are not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider with any medical questions or emergencies.
          </p>
        </div>
      </div>
    </div>
  )
}
