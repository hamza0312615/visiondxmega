import { useState, useRef, useEffect } from 'react'
import { transcribeAudio, analyzeText } from '../utils/groqApi'
import { saveResult, getWhatsAppConfig } from '../utils/localStorage'
import ResultCard from '../components/ResultCard'
import LoadingSpinner from '../components/LoadingSpinner'
import Skeleton from '../components/Skeleton'

export default function VoiceDoc() {
  const [recording, setRecording] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10)
  const [language, setLanguage] = useState('Urdu / اردو')
  const [audioFile, setAudioFile] = useState(null)
  const [textInput, setTextInput] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('Transcribing voice audio...')
  const [error, setError] = useState('')
  const [currentResult, setCurrentResult] = useState(null)
  const [speaking, setSpeaking] = useState(false)

  // Bot Mode State
  const [activeModeTab, setActiveModeTab] = useState('standard')
  const [botPatientName, setBotPatientName] = useState('')
  const [botPatientAge, setBotPatientAge] = useState('')
  const [botPatientGender, setBotPatientGender] = useState('Male')
  const [botPatientCity, setBotPatientCity] = useState('')
  const [botSymptoms, setBotSymptoms] = useState('')
  const [botDoctorPhone, setBotDoctorPhone] = useState('')

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerIntervalRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)

  useEffect(() => {
    const profile = JSON.parse(localStorage.getItem('visiondx_user') || '{}')
    setBotPatientName(profile.name || 'Abdullah')
    setBotPatientAge(profile.age || '18')
    setBotPatientGender(profile.gender || 'Male')
    setBotPatientCity(profile.city || 'Rahim Yar Khan')
    
    const waConfig = getWhatsAppConfig()
    setBotDoctorPhone(waConfig.doctorPhone || '923001234567')

    const runAutopilot = async () => {
      const isAutopilot = localStorage.getItem('visiondx_autopilot') === 'active' && localStorage.getItem('visiondx_autopilot_step') === 'voicedoc'
      if (isAutopilot) {
        setTextInput("I have high fever and severe dry cough")
        setLanguage("Urdu / اردو")
        
        setTimeout(() => {
          handleTextSubmit(null, "I have high fever and severe dry cough")
        }, 1505)
      }
    }
    runAutopilot()

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  const startRecording = async () => {
    setError('')
    setCurrentResult(null)
    setAudioFile(null)
    if (synthRef.current) synthRef.current.cancel()
    setSpeaking(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())
        setAudioFile(audioBlob)
        processVoice(audioBlob)
      }

      mediaRecorder.start()
      setRecording(true)
      setTimeLeft(10)

      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current)
            mediaRecorder.stop()
            setRecording(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)

    } catch (err) {
      setError('Microphone access denied. Please allow microphone access to use VoiceDoc.')
      setRecording(false)
      console.error(err)
    }
  }

  const stopRecordingEarly = () => {
    if (mediaRecorderRef.current && recording) {
      clearInterval(timerIntervalRef.current)
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const processVoice = async (audioBlob) => {
    setLoading(true)
    setError('')
    setCurrentResult(null)

    try {
      setLoadingMsg('Transcribing patient speech with Whisper AI...')
      const transcription = await transcribeAudio(audioBlob)

      const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : []
      const hasUrduVoice = !!voices.find(v => v.lang.includes('ur') || v.name.includes('Urdu'))
      const useRomanUrdu = language.includes('Roman') || (language.includes('Urdu') && !hasUrduVoice)

      const displayLangName = useRomanUrdu ? 'Roman Urdu / رومن اردو' : language
      setLoadingMsg(`Analyzing triage symptoms and translating response into ${displayLangName}...`)

      let langInstruction = ''
      if (useRomanUrdu) {
        langInstruction = `Translate/generate your compassionate clinical response directly in highly conversational, friendly, and clear Roman Urdu (Urdu language written in standard Latin/English letters, e.g., "Aap ki report ke mutabik sab theek hai. Kisi fikar ki baat nahi hai"). Use simple everyday phrases. Keep it natural, easy to read aloud by an English voice, and extremely concise. Only write in standard Latin letters. Do NOT use Urdu script.`
      } else if (language.includes('Urdu')) {
        langInstruction = `Provide compassionate, clear, and reassuring first-aid or home care advice directly in extremely clear, polite, and simple conversational Urdu (اردو) script. Use standard everyday Urdu words that are very easy to understand and speak aloud. Avoid difficult or archaic Persian/Arabic medical vocabulary (for example, use 'bukhār' instead of 'tap-e-shuda', 'jild' instead of 'poast', 'āṅkh' instead of 'chashm'). Keep it concise.`
      } else {
        langInstruction = `Provide compassionate, clear, and reassuring first-aid or home care advice directly in clear, simple, conversational "${language}". Keep sentences simple and easy to understand when spoken aloud. Keep it concise.`
      }

      const prompt = `You are VoiceDoc, an empathetic, highly skilled AI medical triage doctor designed for rural and remote community healthcare. 
Patient's spoken symptoms (transcribed): "${transcription || '[Voice recorded]'}".
Target Language details: "${displayLangName}".

Instructions:
1) Analyze the reported symptoms and identify potential underlying causes.
2) ${langInstruction}
3) Determine the medical urgency level. End your response with exactly one of these urgency flags in English (on a new line): NORMAL, SEE_DOCTOR, or EMERGENCY.`

      const aiResponse = await analyzeText(prompt)

      let urgency = 'SEE_DOCTOR'
      if (aiResponse.includes('EMERGENCY')) urgency = 'EMERGENCY'
      else if (aiResponse.includes('NORMAL')) urgency = 'NORMAL'

      // Clean response for speech synthesis (strip urgency flag)
      const cleanSpeechText = aiResponse.replace(/(NORMAL|SEE_DOCTOR|EMERGENCY)/g, '').trim()

      const resultData = {
        summary: `VoiceDoc Triage (${displayLangName}): "${transcription || 'Voice Triage'}". Urgency: ${urgency.replace('_', ' ')}.`,
        rawResponse: aiResponse,
        details: {
          spokenTranscription: transcription || '[Voice analyzed]',
          responseLanguage: displayLangName,
          assessedUrgency: urgency.replace('_', ' '),
          ruralTriageNote: 'Designed for low-literacy & remote patient accessibility. Instant WhatsApp doctor routing available below.'
        },
        speechText: cleanSpeechText
      }

      const saved = saveResult('voicedoc', resultData)
      setCurrentResult(saved)

      // Auto-play speech
      speakText(cleanSpeechText, language)

    } catch (err) {
      setError(err.message || 'Failed to process voice triage. Please check your API key or try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTextSubmit = async (e, customText) => {
    if (e) e.preventDefault()
    const activeText = customText || textInput
    if (!activeText.trim()) return

    setLoading(true)
    setError('')
    setCurrentResult(null)

    try {
      const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : []
      const hasUrduVoice = !!voices.find(v => v.lang.includes('ur') || v.name.includes('Urdu'))
      const useRomanUrdu = language.includes('Roman') || (language.includes('Urdu') && !hasUrduVoice)

      const displayLangName = useRomanUrdu ? 'Roman Urdu / رومن اردو' : language
      setLoadingMsg(`Analyzing patient text message and translating response into ${displayLangName}...`)

      let langInstruction = ''
      if (useRomanUrdu) {
        langInstruction = `Translate/generate your compassionate clinical response directly in highly conversational, friendly, and clear Roman Urdu (Urdu language written in standard Latin/English letters, e.g., "Aap ki report ke mutabik sab theek hai. Kisi fikar ki baat nahi hai"). Use simple everyday phrases. Keep it natural, easy to read aloud by an English voice, and extremely concise. Only write in standard Latin letters. Do NOT use Urdu script.`
      } else if (language.includes('Urdu')) {
        langInstruction = `Provide compassionate, clear, and reassuring first-aid or home care advice directly in extremely clear, polite, and simple conversational Urdu (اردو) script. Use standard everyday Urdu words that are very easy to understand and speak aloud. Avoid difficult or archaic Persian/Arabic medical vocabulary (for example, use 'bukhār' instead of 'tap-e-shuda', 'jild' instead of 'poast', 'āṅkh' instead of 'chashm'). Keep it concise.`
      } else {
        langInstruction = `Provide compassionate, clear, and reassuring first-aid or home care advice directly in clear, simple, conversational "${language}". Keep sentences simple and easy to understand when spoken aloud. Keep it concise.`
      }

      const prompt = `You are VoiceDoc, an empathetic, highly skilled AI medical triage doctor designed for rural and remote community healthcare. 
Patient's written symptoms: "${activeText}".
Target Language details: "${displayLangName}".

Instructions:
1) Analyze the reported symptoms and identify potential underlying causes.
2) ${langInstruction}
3) Determine the medical urgency level. End your response with exactly one of these urgency flags in English (on a new line): NORMAL, SEE_DOCTOR, or EMERGENCY.`

      const aiResponse = await analyzeText(prompt)

      let urgency = 'SEE_DOCTOR'
      if (aiResponse.includes('EMERGENCY')) urgency = 'EMERGENCY'
      else if (aiResponse.includes('NORMAL')) urgency = 'NORMAL'

      const cleanSpeechText = aiResponse.replace(/(NORMAL|SEE_DOCTOR|EMERGENCY)/g, '').trim()

      const resultData = {
        summary: `VoiceDoc Chat (${displayLangName}): "${activeText}". Urgency: ${urgency.replace('_', ' ')}.`,
        rawResponse: aiResponse,
        details: {
          spokenTranscription: activeText,
          responseLanguage: displayLangName,
          assessedUrgency: urgency.replace('_', ' '),
          ruralTriageNote: 'Designed for low-literacy & remote patient accessibility. Instant WhatsApp doctor routing available below.'
        },
        speechText: cleanSpeechText
      }

      const saved = saveResult('voicedoc', resultData)
      setCurrentResult(saved)

      // Auto-play speech
      speakText(cleanSpeechText, language)

      if (localStorage.getItem('visiondx_autopilot') === 'active') {
        window.dispatchEvent(new CustomEvent('autopilot-result-ready', { detail: { type: 'voicedoc', result: saved } }))
      }

    } catch (err) {
      setError(err.message || 'Failed to process chat message. Please check your API key or try again.')
    } finally {
      setLoading(false)
    }
  }

  const speakText = (text, lang) => {
    if (!synthRef.current) return
    synthRef.current.cancel()

    if (!text) return

    const utterance = new SpeechSynthesisUtterance(text)
    
    let langCode = 'en-US'
    if (lang.includes('Roman')) langCode = 'ur-roman'
    else if (lang.includes('Urdu')) {
      const voices = synthRef.current.getVoices()
      const hasUrduVoice = !!voices.find(v => v.lang.includes('ur') || v.name.includes('Urdu'))
      langCode = hasUrduVoice ? 'ur-PK' : 'ur-roman'
    }
    else if (lang.includes('Hindi')) langCode = 'hi-IN'
    else if (lang.includes('Punjabi')) langCode = 'pa-IN'
    else if (lang.includes('Pashto')) langCode = 'ps-AF'
    else if (lang.includes('Sindhi')) langCode = 'sd-PK'
    else if (lang.includes('Arabic')) langCode = 'ar-SA'
    else if (lang.includes('Bengali')) langCode = 'bn-BD'

    // If we are speaking Roman Urdu, we use standard English voice
    const targetLangCode = langCode === 'ur-roman' ? 'en-US' : langCode
    utterance.lang = targetLangCode
    utterance.rate = langCode === 'ur-roman' ? 0.88 : 0.9 // slightly slower for Roman Urdu to sound natural

    const voices = synthRef.current.getVoices()
    let bestVoice = voices.find(v => v.lang.toLowerCase() === targetLangCode.toLowerCase()) ||
                     voices.find(v => v.lang.toLowerCase().startsWith(targetLangCode.split('-')[0].toLowerCase()))

    if (langCode === 'ur-PK') {
      bestVoice = voices.find(v => v.lang.includes('ur') || v.name.includes('Urdu')) || bestVoice
    } else if (langCode === 'ur-roman') {
      bestVoice = voices.find(v => v.lang.startsWith('en')) || bestVoice
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

    synthRef.current.speak(utterance)
  }

  const toggleSpeech = () => {
    if (!synthRef.current) return
    if (speaking) {
      synthRef.current.cancel()
      setSpeaking(false)
    } else if (currentResult && currentResult.speechText) {
      speakText(currentResult.speechText, language)
    }
  }

  const handleWhatsAppShare = async () => {
    if (!currentResult) return
    const config = getWhatsAppConfig()
    const phone = config.doctorPhone || '923001234567'
    const transcription = currentResult.details?.spokenTranscription || 'Voice Consultation'
    const lang = currentResult.details?.responseLanguage || 'Urdu'
    const urgency = currentResult.details?.assessedUrgency?.replace(' ', '_').toUpperCase() || 'SEE_DOCTOR'
    const advice = currentResult.speechText || currentResult.rawResponse || 'Please consult a doctor.'

    const backendUrl = import.meta.env.VITE_WA_BACKEND_URL || 'http://localhost:3001'

    try {
      // Try Meta WhatsApp backend first
      const res = await fetch(`${backendUrl}/api/send-triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorPhone: phone, patientSymptoms: transcription, triageAdvice: advice, urgency, language: lang })
      })
      const data = await res.json()
      if (data.success) {
        alert('✅ Triage alert sent to doctor via WhatsApp!')
        return
      }
    } catch {
      // Backend not available — fallback to wa.me
    }

    // Fallback: direct wa.me link
    const text = `*VisionDX VoiceDoc Triage Alert* 🚨\n\n*Symptoms:* "${transcription}"\n*Language:* ${lang}\n*Urgency:* ${urgency}\n\n*AI Advice:* ${advice}\n\n_Sent via VisionDX Mega Platform_`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleBotSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!botSymptoms.trim()) {
      setError('Please describe the patient symptoms.')
      return
    }

    setLoading(true)
    setError('')
    setCurrentResult(null)
    setLoadingMsg('Structuring triage referral template with Llama AI...')

    const prompt = `You are VoiceDoc Triage Bot. Format a professional clinical referral dispatch for:
- Patient: ${botPatientName} (Age ${botPatientAge}, ${botPatientGender})
- Location: ${botPatientCity}
- Symptoms: "${botSymptoms}"

Instructions:
1) Formulate a short medical triage analysis.
2) Assess urgency: NORMAL, SEE_DOCTOR, or EMERGENCY.
3) List 3 immediate local clinical precautions.
4) End your response with exactly one of these urgency flags: NORMAL, SEE_DOCTOR, or EMERGENCY.`

    try {
      const aiResponse = await analyzeText(prompt)
      let urgency = 'SEE_DOCTOR'
      if (aiResponse.includes('EMERGENCY')) urgency = 'EMERGENCY'
      else if (aiResponse.includes('NORMAL')) urgency = 'NORMAL'

      const resultData = {
        summary: `Structured Triage Referral for ${botPatientName}. Urgency: ${urgency.replace('_', ' ')}.`,
        rawResponse: aiResponse,
        details: {
          patientName: botPatientName,
          patientAgeGender: `${botPatientAge} / ${botPatientGender}`,
          location: botPatientCity,
          reportedSymptoms: botSymptoms,
          assessedUrgency: urgency.replace('_', ' ')
        },
        speechText: aiResponse.replace(/(NORMAL|SEE_DOCTOR|EMERGENCY)/g, '').trim()
      }

      const saved = saveResult('voicedoc', resultData)
      setCurrentResult(saved)

      // Automatically trigger WhatsApp share with structured text
      const waText = `🏥 *VISIONDX CLINICAL TRIAGE REFERRAL* 🏥\n--------------------------------\n*Patient Name:* ${botPatientName}\n*Age/Gender:* ${botPatientAge} / ${botPatientGender}\n*Location:* ${botPatientCity}\n*Priority:* ${urgency}\n\n*Symptoms:* "${botSymptoms}"\n\n*AI Clinical Summary & Precautions:*\n${aiResponse.replace(/(NORMAL|SEE_DOCTOR|EMERGENCY)/g, '').trim()}\n\n_Sent via VisionDX Bot Triage dispatcher_`
      window.open(`https://wa.me/${botDoctorPhone}?text=${encodeURIComponent(waText)}`, '_blank')

    } catch (err) {
      setError(err.message || 'Failed to dispatch bot triage. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetDoctor = () => {
    if (synthRef.current) synthRef.current.cancel()
    setSpeaking(false)
    setAudioFile(null)
    setTextInput('')
    setCurrentResult(null)
    setError('')
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    setRecording(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 slide-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2 shadow-glow">
            <span>🗣️</span> Voice & Text AI Doctor Chatbot
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
            VoiceDoc AI Doctor Chatbot
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Speak your symptoms or type a message in Urdu, Punjabi, Pashto, Sindhi, Hindi, or English. Our AI analyzes your condition, answers back in BOTH voice audio and text message, and instantly routes to a WhatsApp doctor.
          </p>
        </div>
        {currentResult && (
          <button onClick={resetDoctor} className="btn-secondary text-xs py-2.5 px-4">
            + New Consultation
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 fade-in shadow-lg">
          <span>⚠️</span> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold animate-pulse shadow-glow flex items-center gap-2">
            <span>🔬</span> {loadingMsg}
          </div>
          <Skeleton />
        </div>
      ) : currentResult ? (
        <div className="space-y-8 fade-in">
          {/* Audio Playback & WhatsApp Action Bar */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-wrap items-center justify-between gap-6 shadow-2xl bg-gradient-to-r from-navy-900 via-emerald-950/20 to-navy-900">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleSpeech}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all ${
                  speaking ? 'bg-amber-500 text-navy-950 animate-pulse shadow-amber-500/30' : 'bg-emerald-500 text-navy-950 hover:scale-105 shadow-emerald-500/30'
                }`}
                title={speaking ? 'Stop Speaking' : 'Listen to AI Advice'}
              >
                {speaking ? '⏸️' : '🔊'}
              </button>
              <div>
                <h3 className="text-lg font-bold text-white font-outfit">
                  {speaking ? 'VoiceDoc is Speaking...' : 'Listen to Triage Advice'}
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  {speaking ? 'Click pause to stop audio playback.' : `Advice generated in ${language}. Click speaker to listen.`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-navy-950 font-extrabold text-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20"
              >
                <span>💬</span> Forward Alert to WhatsApp Doctor
              </button>
              <button
                type="button"
                onClick={resetDoctor}
                className="flex-1 sm:flex-none btn-secondary py-3.5 px-6 text-sm"
              >
                <span>🗣️</span> New Consultation
              </button>
            </div>
          </div>

          <ResultCard data={currentResult} />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Main VoiceDoc Tabs */}
          <div className="flex p-1 rounded-2xl bg-navy-900 border border-white/10 gap-1 shadow-inner max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setActiveModeTab('standard')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeModeTab === 'standard' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-md' : 'text-white/60 hover:text-white'
              }`}
            >
              🎙️ Voice & Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveModeTab('bot')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeModeTab === 'bot' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-md' : 'text-white/60 hover:text-white'
              }`}
            >
              🤖 WhatsApp Bot Mode
            </button>
          </div>

          {activeModeTab === 'standard' ? (
            <div className="glass-card p-8 sm:p-12 rounded-3xl border border-white/10 text-center space-y-8 shadow-2xl fade-in">
              {/* Language Selector */}
              <div className="max-w-xs mx-auto space-y-2">
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">
                  Select Spoken / Written Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="input-field cursor-pointer bg-navy-900 text-center font-bold text-base shadow-inner"
                >
                  <option value="Urdu / اردو">Urdu / اردو</option>
                  <option value="Roman Urdu / رومن اردو">Roman Urdu / رومن اردو</option>
                  <option value="English">English</option>
                  <option value="Punjabi / پنجابی">Punjabi / پنجابی</option>
                  <option value="Pashto / پښتو">Pashto / پښتو</option>
                  <option value="Sindhi / سنڌي">Sindhi / سنڌي</option>
                  <option value="Hindi / हिन्दी">Hindi / हिन्दी</option>
                </select>
              </div>

              {/* Recording UI / Big Mic Button */}
              <div className="flex flex-col items-center justify-center py-6">
                <button
                  type="button"
                  onClick={recording ? stopRecordingEarly : startRecording}
                  className={`w-36 h-36 rounded-full flex items-center justify-center text-6xl shadow-2xl transition-all duration-300 ${
                    recording
                      ? 'bg-red-500 text-white recording-pulse scale-110 cursor-pointer shadow-[0_0_50px_rgba(239,68,68,0.6)]'
                      : 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-navy-950 hover:scale-105 hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] cursor-pointer'
                  }`}
                  title={recording ? 'Click to stop recording early' : 'Click to start 10s recording'}
                >
                  {recording ? '⏹️' : '🎙️'}
                </button>

                <div className="mt-8 space-y-2">
                  <h3 className="text-2xl font-bold text-white font-outfit">
                    {recording ? `Listening to Symptoms... ${timeLeft}s left` : 'Click Microphone to Speak'}
                  </h3>
                  <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
                    {recording
                      ? 'Speak clearly into your device microphone. Click the stop button when finished.'
                      : 'Record up to 10 seconds of your symptoms for instant Whisper AI voice triage.'}
                  </p>
                </div>

                {/* Waveform Visualization during recording */}
                {recording && (
                  <div className="flex items-center justify-center gap-1.5 h-16 mt-8 fade-in">
                    <span className="wave-bar bg-emerald-500" />
                    <span className="wave-bar bg-emerald-500" />
                    <span className="wave-bar bg-emerald-500" />
                    <span className="wave-bar bg-emerald-500" />
                    <span className="wave-bar bg-emerald-500" />
                    <span className="wave-bar bg-emerald-500" />
                    <span className="wave-bar bg-emerald-500" />
                    <span className="wave-bar bg-emerald-500" />
                    <span className="wave-bar bg-emerald-500" />
                    <span className="wave-bar bg-emerald-500" />
                    <span className="wave-bar bg-emerald-500" />
                    <span className="wave-bar bg-emerald-500" />
                  </div>
                )}
              </div>

              {/* Text Chat Option */}
              <div className="w-full max-w-lg mx-auto mt-12 pt-8 border-t border-white/10 space-y-4 fade-in">
                <h4 className="text-sm font-bold text-white/80 font-outfit flex items-center justify-center gap-2">
                  <span>💬</span> Or Type Your Message / Symptoms
                </h4>
                <form onSubmit={handleTextSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Type symptoms in ${language.split(' ')[0]} or English...`}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="input-field flex-1 py-3.5 text-base shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!textInput.trim()}
                    className="btn-primary px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300/90 leading-relaxed max-w-lg mx-auto shadow-inner">
                💡 <b>Rural Healthcare Note:</b> VoiceDoc is optimized for patients with limited literacy or digital access. Triage summaries can be instantly forwarded to local clinic WhatsApp numbers for urgent follow-up.
              </div>
            </div>
          ) : (
            /* Bot Mode Triage Dispatch Form */
            <form onSubmit={handleBotSubmit} className="glass-card p-8 sm:p-10 rounded-3xl border border-white/10 text-left space-y-6 shadow-2xl fade-in">
              <h3 className="text-xl font-bold text-white font-outfit border-b border-white/10 pb-4 flex items-center gap-2">
                <span>🤖</span> WhatsApp Triage Referral Bot
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Patient Name</label>
                  <input
                    type="text"
                    value={botPatientName}
                    onChange={(e) => setBotPatientName(e.target.value)}
                    className="input-field bg-navy-900 border-white/10 hover:border-emerald-500/50"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Age</label>
                    <input
                      type="number"
                      value={botPatientAge}
                      onChange={(e) => setBotPatientAge(e.target.value)}
                      className="input-field bg-navy-900 border-white/10 hover:border-emerald-500/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Gender</label>
                    <select
                      value={botPatientGender}
                      onChange={(e) => setBotPatientGender(e.target.value)}
                      className="input-field bg-navy-900 border-white/10 hover:border-emerald-500/50 cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Location / City</label>
                  <input
                    type="text"
                    value={botPatientCity}
                    onChange={(e) => setBotPatientCity(e.target.value)}
                    className="input-field bg-navy-900 border-white/10 hover:border-emerald-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Doctor WhatsApp Phone</label>
                  <input
                    type="text"
                    value={botDoctorPhone}
                    onChange={(e) => setBotDoctorPhone(e.target.value)}
                    className="input-field bg-navy-900 font-mono border-white/10 hover:border-emerald-500/50"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Patient Symptoms & Clinical Notes</label>
                  <textarea
                    rows={4}
                    value={botSymptoms}
                    onChange={(e) => setBotSymptoms(e.target.value)}
                    placeholder="Describe patient symptoms here (e.g. high fever, productive cough, high WBC counts detected)..."
                    className="input-field bg-navy-900 border-white/10 hover:border-emerald-500/50 text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-navy-950 font-extrabold text-base hover:scale-[1.01] transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20"
              >
                <span>🤖</span> Compile & Send Triage via WhatsApp
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
