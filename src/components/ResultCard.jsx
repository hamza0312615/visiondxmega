import { useState, useEffect } from 'react'
import { formatTime } from '../utils/localStorage'

export default function ResultCard({ data, onDelete, isHistory = false }) {
  const [copied, setCopied] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [speechLang, setSpeechLang] = useState('ur-PK')

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  if (!data) return null

  const { type, timestamp, rawResponse, summary, details } = data

  const getBadgeConfig = () => {
    const text = (rawResponse || summary || '').toUpperCase()
    
    if (text.includes('EMERGENCY') || text.includes('HIGH') || text.includes('DANGEROUS') || text.includes('INFECT') || text.includes('COUNTERFEIT') || text.includes('RED') || text.includes('SEVERE')) {
      return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'High Urgency / Attention Required' }
    }
    if (text.includes('SEE_DOCTOR') || text.includes('MEDIUM') || text.includes('POOR') || text.includes('SLOWLY') || text.includes('SLOW') || text.includes('YELLOW') || text.includes('MODERATE')) {
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', label: 'Medium Urgency / Monitor Closely' }
    }
    return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Normal / Good Status' }
  }

  const badge = getBadgeConfig()

  const getTitle = () => {
    switch(type) {
      case 'wound': return '🩹 Wound Analysis Report'
      case 'cough': return '🎤 Cough Audio Assessment'
      case 'sleep': return '😴 Sleep Quality Analysis'
      case 'medicine': return '💊 Medicine Breakdown'
      case 'eye': return '👁️ Eye Diagnostic Prediction'
      case 'skin': return '🔴 Skin Rash AI Analysis'
      case 'lab': return '📄 Medical Lab Report Analysis'
      case 'voicedoc': return '🩺 VoiceDoc Triage Assessment'
      default: return '📋 Diagnostic Report'
    }
  }

  const handleShare = () => {
    const shareText = `VisionDX Mega Report (${getTitle()})\nDate: ${formatTime(timestamp)}\nStatus: ${badge.label}\n\nDetails:\n${rawResponse || summary || ''}\n\nDisclaimer: VisionDX is not a substitute for professional medical advice.`
    navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (speaking) {
        window.speechSynthesis.cancel()
        setSpeaking(false)
        return
      }

      window.speechSynthesis.cancel()
      const textToSpeak = rawResponse || summary || ''
      if (!textToSpeak) return

      const cleanText = textToSpeak.replace(/\*\*/g, '').replace(/[-*]/g, '')
      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = speechLang
      utterance.rate = 0.9

      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)

      window.speechSynthesis.speak(utterance)
    } else {
      alert('Speech synthesis is not supported in this browser.')
    }
  }

  const renderFormattedContent = (text) => {
    if (!text) return <p className="text-white/60">No details provided.</p>;
    const lines = text.split('\n');
    const renderedSections = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        renderedSections.push(
          <div key={`h-${index}`} className="bg-gradient-to-r from-medical-green/20 via-white/5 to-transparent p-4 rounded-2xl border-l-4 border-medical-green my-4 shadow-md">
            <h4 className="text-lg font-bold font-outfit text-white flex items-center gap-2">
              <span>📌</span> {trimmed.replace(/\*\*/g, '')}
            </h4>
          </div>
        );
      } else if (trimmed.startsWith('**') && trimmed.includes(':**')) {
        const parts = trimmed.split(':**');
        const title = parts[0].replace(/\*\*/g, '');
        const content = parts.slice(1).join(':**').trim();
        renderedSections.push(
          <div key={`s-${index}`} className="glass-panel p-5 rounded-2xl border border-white/10 my-4 hover:border-medical-green/40 transition-all shadow-lg bg-navy-900/40">
            <h5 className="text-base font-bold font-outfit text-medical-green mb-2 flex items-center gap-2">
              <span>🩺</span> {title}
            </h5>
            <p className="text-white/85 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
        );
      } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const cleanPoint = trimmed.replace(/^[-*]\s*/, '');
        renderedSections.push(
          <div key={`b-${index}`} className="flex items-start gap-3 pl-4 my-2 text-sm text-white/80 leading-relaxed">
            <span className="text-medical-green font-bold text-base mt-0.5">•</span>
            <span className="flex-1">{cleanPoint.replace(/\*\*/g, '')}</span>
          </div>
        );
      } else {
        renderedSections.push(
          <p key={`p-${index}`} className="text-white/80 text-sm leading-relaxed my-3 bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner">
            {trimmed.replace(/\*\*/g, '')}
          </p>
        );
      }
    });

    return <div className="space-y-1">{renderedSections}</div>;
  };

  return (
    <div className={`glass-card p-6 md:p-8 rounded-3xl border ${badge.border} relative overflow-hidden transition-all duration-300 hover:shadow-2xl mb-6`}>
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-2xl font-bold font-outfit text-white flex items-center gap-2">
            {getTitle()}
          </h3>
          <p className="text-xs text-white/40 mt-1">
            Scanned on {formatTime(timestamp)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`px-4 py-1.5 rounded-full ${badge.bg} ${badge.text} border ${badge.border} text-xs font-semibold flex items-center gap-2 shadow-lg`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            {badge.label}
          </span>

          <button
            onClick={handleShare}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
            title="Copy summary to clipboard"
          >
            {copied ? (
              <>
                <span className="text-medical-green font-bold">✓</span> Copied
              </>
            ) : (
              <>
                <span>📤</span> Share
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 rounded-xl bg-medical-green/10 hover:bg-medical-green/20 border border-medical-green/20 text-medical-green hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
            title="Print or Save PDF"
          >
            <span>🖨️</span> Print / PDF
          </button>

          {isHistory && onDelete && (
            <button
              onClick={() => onDelete(data.id)}
              className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs transition-all"
              title="Delete entry"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Multi-Language Speech Synthesis Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-medical-green/30 bg-gradient-to-r from-navy-900 via-medical-green/10 to-navy-900 flex flex-wrap items-center justify-between gap-4 mb-8 shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSpeak}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg transition-all ${
              speaking ? 'bg-amber-500 text-navy-950 animate-pulse shadow-amber-500/30' : 'bg-medical-green text-navy-950 hover:scale-105 shadow-medical-green/30'
            }`}
            title={speaking ? 'Stop Speaking' : 'Listen Aloud'}
          >
            {speaking ? '⏸️' : '🔊'}
          </button>
          <div>
            <div className="text-base font-bold text-white font-outfit flex items-center gap-2">
              <span>🗣️</span> {speaking ? 'Speaking Report Aloud...' : 'Listen to Report Aloud'}
            </div>
            <div className="text-xs text-white/60 mt-0.5 max-w-md">
              Select language below and click the speaker icon to listen to the AI medical assessment.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto bg-navy-950/60 p-2 rounded-xl border border-white/10">
          <label className="text-xs font-bold text-white/70 uppercase tracking-wider px-2">Language:</label>
          <select
            value={speechLang}
            onChange={(e) => setSpeechLang(e.target.value)}
            className="input-field py-2 px-3 text-xs bg-navy-900 border-white/20 w-44 font-semibold text-white cursor-pointer rounded-lg"
          >
            <option value="ur-PK">🇵🇰 Urdu (اردو)</option>
            <option value="en-US">🇺🇸 English (US)</option>
            <option value="hi-IN">🇮🇳 Hindi (हिंदी)</option>
            <option value="pa-IN">🇮🇳 Punjabi (ਪੰਜਾਬੀ)</option>
            <option value="ar-SA">🇸🇦 Arabic (العربية)</option>
            <option value="bn-BD">🇧🇩 Bengali (বাংলা)</option>
          </select>
        </div>
      </div>

      {/* Main AI Response Content */}
      <div className="space-y-6 text-white/80 text-sm leading-relaxed">
        {details && typeof details === 'object' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
            {Object.entries(details).map(([key, val]) => (
              <div key={key} className="glass-panel p-4 rounded-2xl border border-white/5">
                <div className="text-xs font-bold text-medical-green uppercase tracking-wider mb-1.5">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="text-white text-sm font-medium">{val}</div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Beautiful Styled Markdown Content */}
        <div className="bg-[#020810]/40 p-6 rounded-2xl border border-white/5 shadow-inner leading-relaxed">
          {renderFormattedContent(rawResponse || summary)}
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-8 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between text-[11px] text-white/30 gap-2">
        <span className="font-semibold text-white/40">VisionDX Mega AI Engine</span>
        <span>Always consult a certified medical professional for definitive health decisions.</span>
      </div>
    </div>
  )
}
