import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatTime, saveRiskLog, saveHeatmapEntry, getHeatmapOptIn } from '../utils/localStorage'
import { analyzeText } from '../utils/groqApi'
import { usePrintReport } from '../hooks/usePrintReport'

export default function ResultCard({ data, onDelete, isHistory = false }) {
  const [copied, setCopied] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [speechLang, setSpeechLang] = useState('ur-PK')
  const [translatedTexts, setTranslatedTexts] = useState({})
  const [translating, setTranslating] = useState(false)
  const { printReport } = usePrintReport()

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  if (!data) return null

  const { type, timestamp, rawResponse, summary, details } = data

  useEffect(() => {
    if (data && data.id) {
      const text = (rawResponse || summary || '').toUpperCase()
      let urgency = 'NORMAL'
      if (text.includes('EMERGENCY') || text.includes('HIGH') || text.includes('DANGEROUS') || text.includes('SEVERE')) {
        urgency = 'EMERGENCY'
      } else if (text.includes('SEE_DOCTOR') || text.includes('MEDIUM') || text.includes('MODERATE')) {
        urgency = 'SEE_DOCTOR'
      }
      
      saveRiskLog(urgency)

      if (getHeatmapOptIn()) {
        const profile = JSON.parse(localStorage.getItem('visiondx_user') || '{}')
        const userCity = profile.city || 'Karachi'
        let condition = details?.detectedCondition || details?.classifiedCoughType || details?.reportCategory || type || 'General Observation'
        if (typeof condition === 'string') {
          condition = condition.replace(/Analysis|Report|Diagnostic|Prediction/gi, '').trim()
        }
        saveHeatmapEntry(userCity, condition)
      }
    }
  }, [data])


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
      case 'hair': return '💇 Hair & Scalp AI Analysis'
      case 'routine': return '📅 Daily Routine Wellness Report'
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

  const calculateConfidence = (text) => {
    if (!text) return 72
    const lower = text.toLowerCase()
    if (lower.includes('strongly suggests') || lower.includes('highly likely') || lower.includes('definitive') || lower.includes('confirmed')) return 94
    if (lower.includes('likely') || lower.includes('suggests') || lower.includes('probable') || lower.includes('indicates')) return 82
    if (lower.includes('possible') || lower.includes('potential') || lower.includes('may indicate') || lower.includes('suspected')) return 61
    if (lower.includes('uncertain') || lower.includes('unclear') || lower.includes('inconclusive') || lower.includes('differential')) return 38
    return 72
  }

  const handlePrint = () => {
    printReport(getTitle(), data)
  }

  const handleSpeak = async () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.')
      return
    }

    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }

    const textToSpeak = rawResponse || summary || ''
    if (!textToSpeak) return

    const cleanText = textToSpeak.replace(/\*\*/g, '').replace(/[-*]/g, '')

    const speakWithVoice = (text, langCode) => {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      
      // If we are speaking Roman Urdu, we use standard English voice
      const targetLangCode = langCode === 'ur-roman' ? 'en-US' : langCode
      utterance.lang = targetLangCode
      utterance.rate = langCode === 'ur-roman' ? 0.88 : 0.95 // slightly slower for Roman Urdu to sound natural

      const voices = window.speechSynthesis.getVoices()
      let bestVoice = voices.find(v => v.lang.toLowerCase() === targetLangCode.toLowerCase()) ||
                       voices.find(v => v.lang.toLowerCase().startsWith(targetLangCode.split('-')[0].toLowerCase()))

      if (langCode === 'ur-PK') {
        bestVoice = voices.find(v => v.lang.includes('ur') || v.name.includes('Urdu')) || bestVoice
      } else if (langCode === 'hi-IN') {
        bestVoice = voices.find(v => v.lang.includes('hi') || v.name.includes('Hindi') || v.name.includes('Google ID')) || bestVoice
      } else if (langCode === 'ar-SA') {
        bestVoice = voices.find(v => v.lang.includes('ar') || v.name.includes('Arabic')) || bestVoice
      }

      if (bestVoice) {
        utterance.voice = bestVoice
      }

      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)

      window.speechSynthesis.speak(utterance)
    }

    if (speechLang !== 'en-US') {
      if (translatedTexts[speechLang]) {
        speakWithVoice(translatedTexts[speechLang], speechLang)
      } else {
        setTranslating(true)
        try {
          const voices = window.speechSynthesis.getVoices()
          const hasUrduVoice = !!voices.find(v => v.lang.includes('ur') || v.name.includes('Urdu'))

          let prompt = ''
          let targetLangCode = speechLang

          if (speechLang === 'ur-roman' || (speechLang === 'ur-PK' && !hasUrduVoice)) {
            // Fallback to Roman Urdu because native Urdu voice is missing!
            targetLangCode = 'ur-roman'
            prompt = `You are a professional medical translator. Translate the following clinical report into highly conversational, friendly, and clear Roman Urdu (Urdu language written in standard English/Latin letters, e.g., "Aap ki skin report ke mutabik sab theek hai. Kisi fikar ki baat nahi hai"). Use simple everyday phrases. Keep it natural, easy to read aloud, and extremely concise. Only return the Roman Urdu transliterated text, without any intro or explanations.
            
Text: "${cleanText}"`
          } else {
            // Standard translation
            const languageNames = {
              'ur-PK': 'Urdu (اردو)',
              'hi-IN': 'Hindi (हिंदी)',
              'pa-IN': 'Punjabi (ਪੰਜਾਬੀ)',
              'ar-SA': 'Arabic (العربية)',
              'bn-BD': 'Bengali (বাংলা)'
            }
            const targetLang = languageNames[speechLang] || 'Urdu'
            
            if (speechLang === 'ur-PK') {
              prompt = `You are a professional medical translator. Translate this clinical report into extremely clear, polite, and simple conversational Urdu (اردو) script. Use standard everyday Urdu words that are very easy to understand and speak aloud. Avoid difficult or archaic Persian/Arabic medical vocabulary (for example, use 'bukhār' instead of 'tap-e-shuda', 'jild' instead of 'poast', 'āṅkh' instead of 'chashm'). Keep it concise. Only return the translated Urdu script, without any intro or explanations.
              
Text: "${cleanText}"`
            } else {
              prompt = `Translate the following medical assessment/report text into clear, simple, conversational ${targetLang} suitable for speech synthesis (text-to-speech). Maintain the professional medical advice but make it very natural when spoken aloud. Only return the translated text without any introduction, explanations, or metadata. Keep it concise.
              
Text: "${cleanText}"`
            }
          }

          const translated = await analyzeText(prompt)
          if (translated) {
            setTranslatedTexts(prev => ({ ...prev, [speechLang]: translated }))
            speakWithVoice(translated, targetLangCode)
          } else {
            speakWithVoice(cleanText, speechLang)
          }
        } catch (err) {
          console.error('Translation for speech synthesis failed:', err)
          speakWithVoice(cleanText, speechLang)
        } finally {
          setTranslating(false)
        }
      }
    } else {
      speakWithVoice(cleanText, 'en-US')
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

  const formattedDetails = useMemo(() => {
    if (!details || typeof details !== 'object') return [];
    return Object.entries(details).map(([key, val]) => ({
      key,
      formattedKey: key.replace(/([A-Z])/g, ' $1').trim(),
      val
    }));
  }, [details]);

  const confidence = calculateConfidence(rawResponse || summary)
  let confColor = 'bg-emerald-500'
  let confTextColor = 'text-emerald-400'
  let confBgColor = 'bg-emerald-500/10'
  let confBorderColor = 'border-emerald-500/20'
  if (confidence < 40) {
    confColor = 'bg-red-500'
    confTextColor = 'text-red-400'
    confBgColor = 'bg-red-500/10'
    confBorderColor = 'border-red-500/20'
  } else if (confidence <= 70) {
    confColor = 'bg-amber-500'
    confTextColor = 'text-amber-400'
    confBgColor = 'bg-amber-500/10'
    confBorderColor = 'border-amber-500/20'
  }

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

          <div className={`px-3 py-1.5 rounded-full ${confBgColor} ${confTextColor} border ${confBorderColor} text-xs font-semibold flex items-center gap-2.5 shadow-lg`}>
            <span className="font-bold">AI Certainty: {confidence}%</span>
            <div className="w-14 h-1.5 rounded-full bg-white/10 overflow-hidden hidden sm:block">
              <div className={`h-full ${confColor} rounded-full`} style={{ width: `${confidence}%` }}></div>
            </div>
          </div>

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

          {type !== 'prescription' && (
            <Link
              to={`/suggest-medicine?source=${type}&id=${data.id}`}
              className="px-4 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 hover:border-teal-500/40 text-teal-400 hover:text-teal-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
              title="Get suggested medicines based on this scan"
            >
              <span>💊</span> Suggest Meds
            </Link>
          )}

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
            disabled={translating}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg transition-all ${
              translating ? 'bg-indigo-600 text-white animate-pulse shadow-indigo-500/30 cursor-wait' :
              speaking ? 'bg-amber-500 text-navy-950 animate-pulse shadow-amber-500/30 hover:scale-105' : 'bg-medical-green text-navy-950 hover:scale-105 shadow-medical-green/30'
            }`}
            title={translating ? 'Translating Report with AI...' : speaking ? 'Stop Speaking' : 'Listen Aloud'}
          >
            {translating ? '⏳' : speaking ? '⏸️' : '🔊'}
          </button>
          <div>
            <div className="text-base font-bold text-white font-outfit flex items-center gap-2">
              <span>🗣️</span> {translating ? 'Translating Report with AI...' : speaking ? 'Speaking Report Aloud...' : 'Listen to Report Aloud'}
            </div>
            <div className="text-xs text-white/60 mt-0.5 max-w-md">
              {translating ? 'AI is converting the diagnosis to your chosen language. One moment...' : 'Select language below and click the speaker icon to listen to the AI medical assessment.'}
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
            <option value="ur-roman">🇵🇰 Roman Urdu (اردو)</option>
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
        {formattedDetails.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
            {formattedDetails.map(({ key, formattedKey, val }) => (
              <div key={key} className="glass-panel p-4 rounded-2xl border border-white/5">
                <div className="text-xs font-bold text-medical-green uppercase tracking-wider mb-1.5">
                  {formattedKey}
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
      <div className="mt-8 pt-4 border-t border-white/5 space-y-4">
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] leading-relaxed font-semibold">
          ⚠️ <b>IMPORTANT MEDICAL NOTICE:</b> This project is designed strictly for educational and informational purposes. The suggestions, diagnostic indicators, and early-use guidelines provided by this AI are simulated assessments. They do not constitute formal medical diagnoses, clinical guidelines, or pharmaceutical prescriptions. Always seek professional advice from a qualified doctor or healthcare practitioner.
        </div>
        <div className="flex flex-wrap items-center justify-between text-[11px] text-white/30 gap-2 font-medium">
          <span className="font-semibold text-white/40">VisionDX Mega AI Engine</span>
          <span>Always consult a certified medical professional for definitive health decisions.</span>
        </div>
      </div>
    </div>
  )
}
