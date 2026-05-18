import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getHistory, getWhatsAppConfig, formatTime } from '../utils/localStorage'
import FeatureCard from '../components/FeatureCard'

export default function Dashboard() {
  const [recentScans, setRecentScans] = useState([])
  const [whatsapp, setWhatsapp] = useState({ phone: '14155238886', joinCode: 'join flag-none' })

  useEffect(() => {
    setRecentScans(getHistory().slice(0, 4))
    setWhatsapp(getWhatsAppConfig())
  }, [])

  const features = [
    {
      title: "Eye Disease Predictor",
      description: "Upload eye photos for AI analysis. Cross-references expert knowledge for Conjunctivitis, Cataracts, Glaucoma, and more.",
      icon: "👁️",
      path: "/eye-predictor",
      color: "cyan",
      stats: ["Vision AI", "Expert Grounded"]
    },
    {
      title: "Skin Rash Analyzer",
      description: "Instant dermatological assessment for Melanoma, BCC, Dermatitis, and rashes with verified medical precautions.",
      icon: "🔴",
      path: "/skin-analyzer",
      color: "rose",
      stats: ["Vision AI", "Precautions"]
    },
    {
      title: "Wound Healing Tracker",
      description: "Track daily wound healing progress. AI evaluates redness, swelling, and infection risks over time.",
      icon: "🩹",
      path: "/wound-tracker",
      color: "green",
      stats: ["Timeline", "Infection Check"]
    },
    {
      title: "Cough Sound AI",
      description: "Analyze cough audio recordings with Whisper AI. Detect dry, wet, or pertussis patterns instantly.",
      icon: "🎤",
      path: "/cough-detector",
      color: "blue",
      stats: ["Whisper AI", "Audio Analysis"]
    },
    {
      title: "Sleep Quality AI",
      description: "Evaluate sleep apnea risks and sleep architecture through audio snoring analysis and clinical questionnaires.",
      icon: "😴",
      path: "/sleep-analyzer",
      color: "purple",
      stats: ["Apnea Check", "Sleep Score"]
    },
    {
      title: "Medicine Verifier",
      description: "Snap a photo of medicine packaging to verify authenticity, check counterfeit signs, and get dosage instructions.",
      icon: "💊",
      path: "/medicine-analyzer",
      color: "teal",
      stats: ["Counterfeit Check", "OCR AI"]
    },
    {
      title: "Lab Report Analyzer",
      description: "Upload blood tests, lipid panels, or clinical lab reports for an instant, easy-to-understand AI breakdown.",
      icon: "📄",
      path: "/lab-analyzer",
      color: "amber",
      stats: ["PDF/Image", "Biomarkers"]
    },
    {
      title: "VoiceDoc Triage AI",
      description: "Rural-focused voice assistant with Llama 3.3 Versatile reasoning, native language speech synthesis, and WhatsApp bot.",
      icon: "🩺",
      path: "/voicedoc",
      color: "orange",
      stats: ["Speech Synthesis", "WhatsApp Bot"]
    }
  ]

  const getScanIcon = (type) => {
    switch(type) {
      case 'wound': return '🩹';
      case 'cough': return '🎤';
      case 'sleep': return '😴';
      case 'medicine': return '💊';
      case 'eye': return '👁️';
      case 'skin': return '🔴';
      case 'lab': return '📄';
      case 'voicedoc': return '🩺';
      default: return '📋';
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 slide-in">
      {/* Hero Section */}
      <div className="relative glass-card p-8 sm:p-12 rounded-3xl overflow-hidden border border-white/10 text-center space-y-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-medical-green/10 to-medical-blue/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-medical-blue/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-medical-green/10 border border-medical-green/20 text-medical-green text-xs font-bold uppercase tracking-wider shadow-glow">
            <span className="w-2 h-2 rounded-full bg-medical-green animate-pulse" />
            Enterprise Medical AI Suite
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white font-outfit tracking-tight leading-tight">
            VisionDX <span className="gradient-text">Mega</span> Platform
          </h1>
          
          <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
            Experience the future of healthcare. 8 powerful AI diagnostic tools unified into a single client-side platform powered by Groq Llama-3.2-Vision and Whisper AI.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a href="#diagnostics" className="btn-primary py-3.5 px-8 text-base shadow-lg shadow-medical-green/20">
              <span>🚀</span> Launch Diagnostics
            </a>
            <Link to="/history" className="btn-secondary py-3.5 px-8 text-base">
              <span>📋</span> View Patient History
            </Link>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-white/10 mt-8 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-outfit">8</div>
            <div className="text-xs text-white/50 uppercase font-semibold tracking-wider mt-1">Diagnostic Modules</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-extrabold text-medical-green font-outfit">&lt; 1s</div>
            <div className="text-xs text-white/50 uppercase font-semibold tracking-wider mt-1">Groq AI Inference</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-extrabold text-medical-blue font-outfit">100%</div>
            <div className="text-xs text-white/50 uppercase font-semibold tracking-wider mt-1">Client-Side Privacy</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-outfit">24/7</div>
            <div className="text-xs text-white/50 uppercase font-semibold tracking-wider mt-1">WhatsApp Triage</div>
          </div>
        </div>
      </div>

      {/* WhatsApp Triage Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-medical-green/30 bg-gradient-to-r from-medical-green/10 via-[#020810] to-medical-blue/10 flex flex-wrap items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-medical-green font-bold text-sm uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-medical-green animate-pulse" /> VoiceDoc WhatsApp Sandbox
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white font-outfit">
            Instant Rural Triage via WhatsApp
          </h3>
          <p className="text-sm text-white/70 leading-relaxed">
            Connect to our automated WhatsApp bot for immediate medical guidance and triage. Send the code below to our sandbox number to get started instantly.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 bg-[#020810]/80 p-4 rounded-2xl border border-white/10 backdrop-blur-xl shadow-inner">
          <div>
            <div className="text-[10px] text-white/40 uppercase font-semibold tracking-wider mb-1">1. Send this message:</div>
            <div className="font-mono text-sm sm:text-base font-bold text-medical-green bg-medical-green/10 px-4 py-2 rounded-xl border border-medical-green/20 select-all">
              {whatsapp.joinCode}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase font-semibold tracking-wider mb-1">2. To WhatsApp Number:</div>
            <div className="font-mono text-sm sm:text-base font-bold text-white bg-white/5 px-4 py-2 rounded-xl border border-white/10 select-all">
              +{whatsapp.phone}
            </div>
          </div>
          <a
            href={`https://wa.me/${whatsapp.phone}?text=${encodeURIComponent(whatsapp.joinCode)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary py-3 px-6 text-sm font-bold shadow-lg shadow-medical-green/20 self-end"
          >
            <span>💬</span> Open WhatsApp
          </a>
        </div>
      </div>

      {/* Feature Grid */}
      <div id="diagnostics" className="space-y-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-outfit flex items-center gap-2">
              <span>🩺</span> Diagnostic AI Modules
            </h2>
            <p className="text-sm text-white/60 mt-1">Select a specialized medical AI tool below to start an analysis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => (
            <FeatureCard key={idx} {...feat} />
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-outfit flex items-center gap-2">
              <span>📋</span> Recent Diagnostic Activity
            </h2>
            <p className="text-sm text-white/60 mt-1">Your latest AI assessments stored securely in local browser storage</p>
          </div>
          <Link to="/history" className="btn-secondary text-xs py-2 px-4">
            View All History ({getHistory().length})
          </Link>
        </div>

        {recentScans.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl border border-white/5 text-center space-y-3">
            <div className="text-4xl mb-2">📭</div>
            <h3 className="text-lg font-bold text-white font-outfit">No Recent Scans Found</h3>
            <p className="text-sm text-white/50 max-w-md mx-auto">
              You haven&apos;t performed any diagnostic analyses yet. Choose one of the 8 tools above to run your first AI scan!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentScans.map((scan) => (
              <Link
                key={scan.id}
                to="/history"
                className="glass-card p-5 rounded-2xl border border-white/5 hover:border-medical-green/30 transition-all group flex flex-col justify-between h-44 hover:scale-[1.02]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-md">
                      {getScanIcon(scan.type)}
                    </span>
                    <span className="text-[10px] text-white/40 bg-white/5 px-2.5 py-1 rounded-full font-semibold">
                      {formatTime(scan.timestamp)}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white font-outfit group-hover:text-medical-green transition-colors line-clamp-1 capitalize">
                    {scan.type} Analysis
                  </h4>
                  <p className="text-xs text-white/60 mt-1 line-clamp-2 leading-relaxed">
                    {scan.summary || scan.rawResponse || 'AI assessment completed.'}
                  </p>
                </div>
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40 group-hover:text-white transition-colors">
                  <span className="font-semibold text-medical-green">View Full Report</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
