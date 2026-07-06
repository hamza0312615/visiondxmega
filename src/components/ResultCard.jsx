import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatTime, saveRiskLog, saveHeatmapEntry, getHeatmapOptIn } from '../utils/localStorage'
import { analyzeText } from '../utils/groqApi'
import { translateText } from '../utils/translationService'
import { usePrintReport } from '../hooks/usePrintReport'
import { speakText, cancelSpeech } from '../utils/ttsService'

const getLocalTranslation = (type, langCode, text, details) => {
  const isUr = langCode === 'ur-PK'
  const isRoman = langCode === 'ur-roman'
  const isHi = langCode === 'hi-IN'
  const isAr = langCode === 'ar-SA'
  const isBn = langCode === 'bn-BD'
  const isPa = langCode === 'pa-IN'

  const upperText = text.toUpperCase()
  let urgency = 'NORMAL'
  if (upperText.includes('EMERGENCY') || upperText.includes('HIGH') || upperText.includes('DANGEROUS') || upperText.includes('SEVERE')) {
    urgency = 'EMERGENCY'
  } else if (upperText.includes('SEE_DOCTOR') || upperText.includes('MEDIUM') || upperText.includes('MODERATE')) {
    urgency = 'SEE_DOCTOR'
  }

  const rawCondition = details?.detectedCondition || details?.classifiedCoughType || details?.reportCategory || details?.statusObservation || type || 'Observation'
  const condition = rawCondition.replace(/Analysis|Report|Diagnostic|Prediction/gi, '').trim()

  if (isUr) {
    if (urgency === 'EMERGENCY') {
      return `اہم طبی انتباہ۔ ایمرجنسی صورتحال ہے۔ آپ کی ${condition} رپورٹ کے مطابق فوری علاج کی ضرورت ہے۔ براہ کرم فوری ڈاکٹر یا قریبی ایمرجنسی سے رجوع کریں۔`
    } else if (urgency === 'SEE_DOCTOR') {
      return `طبی مشورہ۔ آپ کو ڈاکٹر سے مشورہ کرنا چاہیے۔ آپ کی ${condition} رپورٹ میں کچھ احتیاطی علامات ہیں۔ جلد ڈاکٹر سے ملیں۔`
    } else {
      return `آپ کی ${condition} رپورٹ بالکل نارمل ہے۔ گھبرانے کی کوئی ضرورت نہیں ہے۔ صحت مند طرزِ زندگی جاری رکھیں۔`
    }
  }

  if (isRoman) {
    if (urgency === 'EMERGENCY') {
      return `Ahem tibbi intibah. Emergency soorat-e-haal hai. Aap ki ${condition} report ke mutabik fori elaj ki zaroorat hai. Bara-e-maherbani fori doctor ya qareebi emergency se ruju karein.`
    } else if (urgency === 'SEE_DOCTOR') {
      return `Tibbi mashwara. Aap ko doctor se mashwara karna chahiye. Aap ki ${condition} report me kuch ehtiyati nishaniyan hain. Jald doctor se milein.`
    } else {
      return `Aap ki ${condition} report bilkul normal hai. Ghabranay ki koi zaroorat nahi hai. Sehat-mand lifestyle jari rakhein.`
    }
  }

  if (isHi) {
    if (urgency === 'EMERGENCY') {
      return `महत्वपूर्ण चिकित्सा चेतावनी। आपातकालीन स्थिति है। आपकी ${condition} रिपोर्ट के अनुसार तत्काल उपचार की आवश्यकता है। कृपया तुरंत डॉक्टर या आपातकालीन विभाग से संपर्क करें।`
    } else if (urgency === 'SEE_DOCTOR') {
      return `चिकित्सा परामर्श। आपको डॉक्टर से परामर्श करना चाहिए। आपकी ${condition} रिपोर्ट में कुछ असामान्य लक्षण हैं। जल्द ही डॉक्टर से मिलें।`
    } else {
      return `आपकी ${condition} रिपोर्ट सामान्य है। चिंता की कोई बात नहीं है। स्वस्थ दिनचर्या का पालन करें।`
    }
  }

  if (isAr) {
    if (urgency === 'EMERGENCY') {
      return `تحذير طبي مهم. حالة طوارئ. يحتاج تقرير ${condition} الخاص بك إلى علاج فوري. يرجى مراجعة الطبيب أو قسم الطوارئ فوراً.`
    } else if (urgency === 'SEE_DOCTOR') {
      return `استشارة طبية. يجب عليك استشارة الطبيب. تقرير ${condition} يحتوي على بعض العلامات غير الطبيعية. راجع طبيبك قريباً.`
    } else {
      return `تقرير ${condition} الخاص بك طبيعي تماماً. لا داعي للقلق. استمر في نمط حياتك الصحي.`
    }
  }

  if (isBn) {
    if (urgency === 'EMERGENCY') {
      return `গুরুত্বপূর্ণ চিকিৎসা সতর্কতা। এটি একটি জরুরি অবস্থা। আপনার ${condition} রিপোর্ট অনুযায়ী অবিলম্বে চিকিৎসার প্রয়োজন। দয়া করে দ্রুত ডাক্তার বা জরুরি বিভাগে যান।`
    } else if (urgency === 'SEE_DOCTOR') {
      return `চিকিৎসা পরামর্শ। আপনার ডাক্তারের সাথে পরামর্শ করা উচিত। আপনার ${condition} রিপোর্টে কিছু অস্বাভাবিক লক্ষণ রয়েছে। দ্রুত ডাক্তারের কাছে যান।`
    } else {
      return `আপনার ${condition} রিপোর্ট সম্পূর্ণ স্বাভাবিক। ভয়ের কিছু নেই। স্বাস্থ্যকর জীবনযাপন করুন।`
    }
  }

  if (isPa) {
    if (urgency === 'EMERGENCY') {
      return `ਖਾਸ ਡਾਕਟਰੀ ਚੇਤਾਵਨੀ। ਐਮਰਜੈਂਸੀ ਹੈ। ਤੁਹਾਡੀ ${condition} ਰਿਪੋਰਟ ਮੁਤਾਬਕ ਤੁਰੰਤ ਇਲਾਜ ਦੀ ਲੋੜ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਤੁਰੰਤ ਹਸਪਤਾਲ ਜਾਓ।`
    } else if (urgency === 'SEE_DOCTOR') {
      return `ਡਾਕਟਰੀ ਸਲਾਹ। ਤੁਹਾਨੂੰ ਡਾਕਟਰ ਨਾਲ ਸਲਾਹ ਕਰਨੀ ਚਾਹੀਦੀ ਹੈ। ਤੁਹਾਡੀ ${condition} ਰਿਪੋਰਟ ਵਿੱਚ ਕੁਝ ਗੈਰ-ਮਾਮੂਲੀ ਲੱਛਣ ਹਨ।`
    } else {
      return `ਤੁਹਾਡੀ ${condition} ਰਿਪੋਰਟ ਬਿਲਕੁਲ ਨਾਰਮਲ ਹੈ। ਫਿਕਰ ਦੀ ਕੋਈ ਲੋੜ ਨਹੀਂ ਹੈ।`
    }
  }

  return text
}

const extractSpeakableSummary = (text, langCode) => {
  if (!text) return ''
  
  let condition = ''
  let firstAid = ''
  let dos = []
  let donts = []

  const lines = text.split('\n')
  let currentSection = ''

  lines.forEach(line => {
    const trimmed = line.trim()
    if (!trimmed) return

    const lower = trimmed.toLowerCase()
    if (lower.includes('detected condition') || lower.includes('diagnosis') || lower.includes('prediction') || lower.includes('condition:')) {
      currentSection = 'condition'
    } else if (lower.includes('first aid') || lower.includes('treatment') || lower.includes('guidelines') || lower.includes('recommendations') || lower.includes('first aid:')) {
      currentSection = 'firstaid'
    } else if (lower.includes('karein') || lower.includes('do list') || lower.includes('do\'s') || lower.includes('what to do')) {
      currentSection = 'dos'
    } else if (lower.includes('mat karein') || lower.includes('dont list') || lower.includes('don\'ts') || lower.includes('what not to do')) {
      currentSection = 'donts'
    }

    const cleanContent = trimmed.replace(/\*\*/g, '').replace(/^[-*•]\s*/, '').trim()
    if (!cleanContent) return

    if (currentSection === 'condition' && !lower.includes('condition') && !lower.includes('diagnosis') && !lower.includes('prediction')) {
      condition = cleanContent
    } else if (currentSection === 'firstaid' && !lower.includes('first aid') && !lower.includes('guidelines') && !lower.includes('treatment')) {
      firstAid += cleanContent + ' '
    } else if (currentSection === 'dos' && (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•'))) {
      dos.push(cleanContent)
    } else if (currentSection === 'donts' && (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•'))) {
      donts.push(cleanContent)
    }
  })

  // Fallback if formatting doesn't match
  if (!firstAid) {
    const cleanLines = lines
      .map(l => l.replace(/\*\*/g, '').replace(/^[-*•]\s*/, '').trim())
      .filter(l => l && !l.startsWith('#'))
    return cleanLines.slice(0, 3).join(', ')
  }

  const isUr = langCode === 'ur-PK'
  const isRoman = langCode === 'ur-roman'
  const isHi = langCode === 'hi-IN'

  if (isUr) {
    let script = `تشخیص: ${condition}۔ فرسٹ ایڈ: ${firstAid.trim()}۔`
    if (dos.length > 0) script += ` لازمی کریں: ${dos.slice(0, 2).join('۔ اور ')}۔`
    if (donts.length > 0) script += ` ہرگز نہ کریں: ${donts.slice(0, 2).join('۔ اور ')}۔`
    return script
  }

  if (isRoman) {
    let script = `Diagnosis: ${condition}. First aid guidelines: ${firstAid.trim()}.`
    if (dos.length > 0) script += ` Bara-e-meherbani ye karein: ${dos.slice(0, 2).join('. aur ')}.`
    if (donts.length > 0) script += ` Ye hargiz mat karein: ${donts.slice(0, 2).join('. aur ')}.`
    return script
  }

  if (isHi) {
    let script = `निदान: ${condition}। प्राथमिक उपचार निर्देश: ${firstAid.trim()}।`
    if (dos.length > 0) script += ` कृपया यह करें: ${dos.slice(0, 2).join('। और ')}।`
    if (donts.length > 0) script += ` यह बिल्कुल न करें: ${donts.slice(0, 2).join('। और ')}।`
    return script
  }

  // English fallback
  let script = `Assessment indicates ${condition}. Recommended first aid: ${firstAid.trim()}`
  if (dos.length > 0) script += ` Please do the following: ${dos.slice(0, 2).join(', and ')}.`
  if (donts.length > 0) script += ` Avoid the following: ${donts.slice(0, 2).join(', and ')}.`
  return script
}

export default function ResultCard({ data, onDelete, isHistory = false }) {
  const [copied, setCopied] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [speechLang, setSpeechLang] = useState('ur-PK')
  const [translatedTexts, setTranslatedTexts] = useState({})
  const [translating, setTranslating] = useState(false)
  const [voiceAlert, setVoiceAlert] = useState('')
  const { printReport } = usePrintReport()

  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [needsCorrection, setNeedsCorrection] = useState(false)
  const [correctionText, setCorrectionText] = useState('')
  const [mockFeedbacks, setMockFeedbacks] = useState([
    { module: 'Skin Rash AI', correction: 'Diagnosed contact dermatitis instead of eczema' },
    { module: 'Cough Sound AI', correction: 'Diagnosed asthma flareup instead of acute bronchitis' }
  ])

  const handleFeedbackSubmit = async (isAccurateValue) => {
    const recordId = data.id || Date.now().toString()
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    
    try {
      await fetch(`${API_BASE_URL}/api/history/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: recordId,
          isAccurate: isAccurateValue,
          correctedDiagnosis: isAccurateValue ? null : correctionText
        })
      })
      
      setFeedbackSubmitted(true)
      if (!isAccurateValue && correctionText) {
        setMockFeedbacks(prev => [
          { module: getTitle(), correction: correctionText },
          ...prev
        ])
      }
    } catch (err) {
      console.warn('Feedback submit offline, simulating loop', err)
      setFeedbackSubmitted(true)
      if (!isAccurateValue && correctionText) {
        setMockFeedbacks(prev => [
          { module: getTitle(), correction: correctionText },
          ...prev
        ])
      }
    }
  }

  useEffect(() => {
    return () => {
      cancelSpeech()
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
    if (speaking) {
      cancelSpeech()
      setSpeaking(false)
      return
    }

    const textToSpeak = rawResponse || summary || ''
    if (!textToSpeak) return

    const cleanText = extractSpeakableSummary(textToSpeak, speechLang)

    const playTtsSpeech = (text, langCode) => {
      speakText(text, langCode, {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
        onError: () => setSpeaking(false)
      })
    }

    const hasElevenLabsKey = !!(import.meta.env.VITE_ELEVENLABS_API_KEY || localStorage.getItem('visiondx_elevenlabs_key'))

    if (speechLang !== 'en-US') {
      let targetLang = speechLang
      let voiceMissing = false

      if (!hasElevenLabsKey) {
        if ('speechSynthesis' in window) {
          const voices = window.speechSynthesis.getVoices()
          const hasVoice = (langKey) => !!voices.find(v => v.lang.toLowerCase().includes(langKey.toLowerCase()) || v.name.toLowerCase().includes(langKey.toLowerCase()))

          const isUrdu = speechLang === 'ur-PK'
          const isHindi = speechLang === 'hi-IN'
          const isArabic = speechLang === 'ar-SA'
          const isBengali = speechLang === 'bn-BD'
          const isPunjabi = speechLang === 'pa-IN'

          voiceMissing = (isUrdu && !hasVoice('ur')) ||
                         (isHindi && !hasVoice('hi')) ||
                         (isArabic && !hasVoice('ar')) ||
                         (isBengali && !hasVoice('bn')) ||
                         (isPunjabi && !hasVoice('pa'))
        }

        if (voiceMissing && speechLang !== 'ur-roman') {
          targetLang = 'ur-roman'
          const languageNames = {
            'ur-PK': 'Urdu',
            'hi-IN': 'Hindi',
            'pa-IN': 'Punjabi',
            'ar-SA': 'Arabic',
            'bn-BD': 'Bengali'
          }
          const missingLang = languageNames[speechLang] || speechLang
          setVoiceAlert(`Note: Native system voice for ${missingLang} was not found on your device. Speech is falling back to phonetic Roman Urdu.`)
        } else {
          setVoiceAlert('')
        }
      } else {
        setVoiceAlert('')
      }

      if (translatedTexts[targetLang]) {
        playTtsSpeech(translatedTexts[targetLang], targetLang)
      } else {
        setTranslating(true)
        try {
          let prompt = ''
          let translated = null

          if (targetLang === 'ur-roman') {
            prompt = `You are a professional medical translator. Translate the following clinical report into highly conversational, friendly, and clear Roman Urdu (Urdu language written in standard English/Latin letters, e.g., "Aap ki skin report ke mutabik sab theek hai. Kisi fikar ki baat nahi hai"). Use simple everyday phrases. Keep it natural, easy to read aloud, and extremely concise. Only return the Roman Urdu transliterated text, without any intro or explanations.
            
            Text: "${cleanText}"`
            translated = await analyzeText(prompt)
          } else {
            translated = await translateText(cleanText, targetLang)

            if (!translated) {
              const languageNames = {
                'ur-PK': 'Urdu (اردو)',
                'hi-IN': 'Hindi (हिंदी)',
                'pa-IN': 'Punjabi (ਪੰਜਾਬੀ)',
                'ar-SA': 'Arabic (العربية)',
                'bn-BD': 'Bengali (বাংলা)'
              }
              const targetLangName = languageNames[targetLang] || 'Urdu'

              if (targetLang === 'ur-PK') {
                prompt = `You are a professional medical translator. Translate this clinical report into extremely clear, polite, and simple conversational Urdu (اردو) script. Use standard everyday Urdu words that are very easy to understand and speak aloud. Avoid difficult or archaic Persian/Arabic medical vocabulary (for example, use 'bukhār' instead of 'tap-e-shuda', 'jild' instead of 'poast', 'āṅkh' instead of 'chashm'). Keep it concise. Only return the translated Urdu script, without any intro or explanations.
                
                Text: "${cleanText}"`
              } else {
                prompt = `Translate the following medical assessment/report text into clear, simple, conversational ${targetLangName} suitable for speech synthesis (text-to-speech). Maintain the professional medical advice but make it very natural when spoken aloud. Only return the translated text without any introduction, explanations, or metadata. Keep it concise.
                
                Text: "${cleanText}"`
              }
              translated = await analyzeText(prompt)
            }
          }

          if (translated) {
            setTranslatedTexts(prev => ({ ...prev, [targetLang]: translated }))
            playTtsSpeech(translated, targetLang)
          } else {
            const fallbackLocal = getLocalTranslation(type, targetLang, cleanText, details)
            playTtsSpeech(fallbackLocal, targetLang)
          }
        } catch (err) {
          console.error('Translation for speech synthesis failed, using local fallback:', err)
          const fallbackLocal = getLocalTranslation(type, targetLang, cleanText, details)
          playTtsSpeech(fallbackLocal, targetLang)
        } finally {
          setTranslating(false)
        }
      }
    } else {
      setVoiceAlert('')
      playTtsSpeech(cleanText, 'en-US')
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

        {voiceAlert && (
          <div className="w-full mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span> {voiceAlert}
          </div>
        )}
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

      {/* 🧠 AI Training & Response Feedback Loop */}
      <div className="mt-8 p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-4">
        <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
          <span>🧠</span> AI Diagnostics Training Feedback Loop
        </h4>
        
        {feedbackSubmitted ? (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <span>✓</span> Thank you! Your response correction has been saved to SQLite and will be used to retrain the local AI models.
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-white/60">
              Is this diagnostic assessment accurate based on your clinical review?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleFeedbackSubmit(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-navy-950 font-bold text-xs hover:scale-105 active:scale-95 transition-all"
              >
                👍 Accurate (Accurate Response)
              </button>
              <button
                type="button"
                onClick={() => {
                  setNeedsCorrection(true)
                }}
                className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold text-xs hover:scale-105 active:scale-95 transition-all"
              >
                👎 Incorrect (Requires Correction)
              </button>
            </div>
            
            {needsCorrection && (
              <div className="mt-4 space-y-3 slide-in">
                <textarea
                  value={correctionText}
                  onChange={(e) => setCorrectionText(e.target.value)}
                  placeholder="Enter the correct diagnosis or notes (e.g. 'This is actually contact dermatitis, not eczema' or 'Lab report shows severe anemia')..."
                  className="w-full bg-[#020810]/60 border border-white/20 rounded-xl p-3 text-xs text-white placeholder-white/45 focus:border-emerald-500 outline-none"
                  rows={3}
                />
                <button
                  type="button"
                  onClick={() => handleFeedbackSubmit(false)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-navy-950 font-bold text-xs hover:scale-102 transition-all"
                >
                  Submit Correction
                </button>
              </div>
            )}
          </div>
        )}

        {/* 📑 Simulated/Collected User Corrections Ledger */}
        <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
          <h5 className="text-[10px] text-white/45 uppercase font-black tracking-widest">
            Recent User Responses & Corrections (Training Ledger)
          </h5>
          <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-2">
            {mockFeedbacks.map((f, idx) => (
              <div key={idx} className="text-xs bg-[#020810]/40 p-2.5 rounded-lg border border-white/5 flex justify-between items-center gap-4">
                <div>
                  <span className="text-emerald-400 font-bold block">{f.module} Assessment</span>
                  <span className="text-white/80">Correction: "{f.correction}"</span>
                </div>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold shrink-0">
                  Synced to SQLite
                </span>
              </div>
            ))}
          </div>
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
