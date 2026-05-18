import { useState, useRef, useEffect } from 'react'
import { transcribeAudio, analyzeText } from '../utils/groqApi'
import { saveResult, getWhatsAppConfig } from '../utils/localStorage'
import ResultCard from '../components/ResultCard'
import LoadingSpinner from '../components/LoadingSpinner'

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

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerIntervalRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)

  useEffect(() => {
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

      setLoadingMsg(`Analyzing triage symptoms and translating response into ${language}...`)
      const prompt = `You are VoiceDoc, an empathetic, highly skilled AI medical triage doctor designed for rural and remote community healthcare. 
Patient's spoken symptoms (transcribed): "${transcription || '[Voice recorded]'}".
Requested Output Language: "${language}".

Instructions:
1) Analyze the reported symptoms and identify potential underlying causes.
2) Provide compassionate, clear, and reassuring first-aid or home care advice directly in the requested language ("${language}"). Keep sentences simple and easy to understand when spoken aloud.
3) Determine the medical urgency level. End your response with exactly one of these urgency flags in English (on a new line): NORMAL, SEE_DOCTOR, or EMERGENCY.`

      const aiResponse = await analyzeText(prompt)

      let urgency = 'SEE_DOCTOR'
      if (aiResponse.includes('EMERGENCY')) urgency = 'EMERGENCY'
      else if (aiResponse.includes('NORMAL')) urgency = 'NORMAL'

      // Clean response for speech synthesis (strip urgency flag)
      const cleanSpeechText = aiResponse.replace(/(NORMAL|SEE_DOCTOR|EMERGENCY)/g, '').trim()

      const resultData = {
        summary: `VoiceDoc Triage (${language}): "${transcription || 'Voice Triage'}". Urgency: ${urgency.replace('_', ' ')}.`,
        rawResponse: aiResponse,
        details: {
          spokenTranscription: transcription || '[Voice analyzed]',
          responseLanguage: language,
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

  const handleTextSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!textInput.trim()) return

    setLoading(true)
    setError('')
    setCurrentResult(null)

    try {
      setLoadingMsg(`Analyzing patient text message and translating response into ${language}...`)
      const prompt = `You are VoiceDoc, an empathetic, highly skilled AI medical triage doctor designed for rural and remote community healthcare. 
Patient's written symptoms: "${textInput}".
Requested Output Language: "${language}".

Instructions:
1) Analyze the reported symptoms and identify potential underlying causes.
2) Provide compassionate, clear, and reassuring first-aid or home care advice directly in the requested language ("${language}"). Keep sentences simple and easy to understand when spoken aloud.
3) Determine the medical urgency level. End your response with exactly one of these urgency flags in English (on a new line): NORMAL, SEE_DOCTOR, or EMERGENCY.`

      const aiResponse = await analyzeText(prompt)

      let urgency = 'SEE_DOCTOR'
      if (aiResponse.includes('EMERGENCY')) urgency = 'EMERGENCY'
      else if (aiResponse.includes('NORMAL')) urgency = 'NORMAL'

      const cleanSpeechText = aiResponse.replace(/(NORMAL|SEE_DOCTOR|EMERGENCY)/g, '').trim()

      const resultData = {
        summary: `VoiceDoc Chat (${language}): "${textInput}". Urgency: ${urgency.replace('_', ' ')}.`,
        rawResponse: aiResponse,
        details: {
          spokenTranscription: textInput,
          responseLanguage: language,
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
    
    // Set appropriate language code
    if (lang.includes('Urdu')) utterance.lang = 'ur-PK'
    else if (lang.includes('Hindi')) utterance.lang = 'hi-IN'
    else utterance.lang = 'en-US'

    utterance.rate = 0.9 // slightly slower for clear comprehension
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

  const handleWhatsAppShare = () => {
    if (!currentResult) return
    const config = getWhatsAppConfig()
    const phone = config.doctorPhone || '923001234567'
    const transcription = currentResult.details?.spokenTranscription || currentResult.summary || 'Voice Consultation'
    const lang = currentResult.details?.responseLanguage || currentResult.details?.responseLanguage || 'Urdu / English'
    const urgency = currentResult.details?.assessedUrgency || 'SEE DOCTOR'
    const advice = currentResult.speechText || currentResult.rawResponse || 'Please consult a doctor for further evaluation.'
    
    const text = `*VisionDX VoiceDoc Triage Alert* 🚨\n\n*Patient Symptoms:* "${transcription}"\n*Language:* ${lang}\n*Assessed Urgency:* ${urgency}\n\n*AI Triage Advice:* ${advice}\n\n_Sent via VisionDX Mega Platform_`
    const encoded = encodeURIComponent(text)
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank')
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
        <LoadingSpinner message={loadingMsg} />
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
        <div className="max-w-3xl mx-auto glass-card p-8 sm:p-12 rounded-3xl border border-white/10 text-center space-y-8 shadow-2xl">
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
      )}
    </div>
  )
}
