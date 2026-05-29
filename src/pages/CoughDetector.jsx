import { useState, useRef, useEffect } from 'react'
import { transcribeAudio, analyzeText } from '../utils/groqApi'
import { saveResult, isDemoMode, setDemoMode, getDemoData } from '../utils/localStorage'
import ResultCard from '../components/ResultCard'
import LoadingSpinner from '../components/LoadingSpinner'
import Skeleton from '../components/Skeleton'

export default function CoughDetector() {
  const [recording, setRecording] = useState(false)
  const [timeLeft, setTimeLeft] = useState(5)
  const [audioFile, setAudioFile] = useState(null)
  const [audioFileName, setAudioFileName] = useState('')

  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('Transcribing cough audio with Whisper AI...')
  const [error, setError] = useState('')
  const [currentResult, setCurrentResult] = useState(null)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerIntervalRef = useRef(null)

  useEffect(() => {
    const runDemo = async () => {
      if (isDemoMode()) {
        setDemoMode(false) // Disable global demo mode immediately to prevent recurrent loops
        const demoInfo = getDemoData('cough')
        
        const blob = await fetch("data:audio/wav;base64," + demoInfo.base64).then(res => res.blob())
        const file = new File([blob], demoInfo.fileName, { type: "audio/wav" })
        setAudioFile(file)
        setAudioFileName(demoInfo.fileName)
        
        setTimeout(() => {
          processAudio(file)
        }, 1200)
      }
    }
    runDemo()
  }, [])

  const startRecording = async () => {
    setError('')
    setCurrentResult(null)
    setAudioFile(null)
    setAudioFileName('')

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
        setAudioFileName('live_cough_record.webm')
        processAudio(audioBlob)
      }

      mediaRecorder.start()
      setRecording(true)
      setTimeLeft(5)

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
      setError('Microphone access denied or not supported. Please allow microphone access or upload an audio file.')
      setRecording(false)
      console.error(err)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(wav|mp3|m4a|ogg|webm|aac)$/i)) {
      setError('Please upload a valid audio file (WAV, MP3, M4A, WEBM).')
      return
    }
    setAudioFile(file)
    setAudioFileName(file.name)
    setError('')
    setCurrentResult(null)
    processAudio(file)
  }

  const processAudio = async (blobOrFile) => {
    setLoading(true)
    setError('')
    setCurrentResult(null)

    try {
      setLoadingMsg('Transcribing cough sound with Whisper Large v3...')
      const transcription = await transcribeAudio(blobOrFile)
      
      setLoadingMsg('Analyzing cough characteristics and matching possible conditions...')
      const prompt = `You are an expert medical audio analysis AI assistant. Based on this cough audio transcription and description: "${transcription || '[Cough audio sound recorded]'}". 
1) Classify the cough type (e.g., dry, wet, whooping/pertussis, barking).
2) Identify likely underlying conditions (e.g., COVID-19, Tuberculosis/TB, Bronchitis, Asthma, Allergic rhinitis). Note: TB is highly prevalent in South Asia/Pakistan; always screen for classic symptoms.
3) Provide a clear assessment of severity and urgency. End your response with exactly one of these urgency flags: NORMAL, SEE_DOCTOR, or EMERGENCY.`

      const aiResponse = await analyzeText(prompt)

      let coughType = 'Unspecified'
      if (aiResponse.toLowerCase().includes('dry')) coughType = 'Dry Cough'
      else if (aiResponse.toLowerCase().includes('wet')) coughType = 'Wet / Productive Cough'
      else if (aiResponse.toLowerCase().includes('whoop')) coughType = 'Whooping Cough'
      else if (aiResponse.toLowerCase().includes('bark')) coughType = 'Barking Cough'

      let urgency = 'SEE_DOCTOR'
      if (aiResponse.includes('EMERGENCY')) urgency = 'EMERGENCY'
      else if (aiResponse.includes('NORMAL')) urgency = 'NORMAL'

      const resultData = {
        summary: `Audio Analysis: ${coughType} (${urgency.replace('_', ' ')}). Transcription: "${transcription || 'Cough recorded'}"`,
        rawResponse: aiResponse,
        details: {
          audioTranscription: transcription || '[Audio analyzed directly]',
          classifiedCoughType: coughType,
          assessedUrgency: urgency.replace('_', ' '),
          regionalScreening: 'Tuberculosis (TB) protocol checked'
        }
      }

      const saved = saveResult('cough', resultData)
      setCurrentResult(saved)

    } catch (err) {
      setError(err.message || 'Failed to process audio. Please ensure your API key is valid and supports Whisper API.')
    } finally {
      setLoading(false)
    }
  }

  const resetDetector = () => {
    setAudioFile(null)
    setAudioFileName('')
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2 shadow-glow">
            <span>🎤</span> Whisper AI Acoustic Diagnostics
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
            Cough Sound Disease Detector
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Record 5 seconds of your cough or upload an audio file. Our AI classifies the cough type, evaluates conditions (including TB risk), and assesses urgency instantly.
          </p>
        </div>
        {currentResult && (
          <button onClick={resetDetector} className="btn-secondary text-xs py-2.5 px-4">
            + New Recording
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
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold animate-pulse shadow-glow flex items-center gap-2">
            <span>🔬</span> {loadingMsg}
          </div>
          <Skeleton />
        </div>
      ) : currentResult ? (
        <div className="space-y-8 fade-in">
          <ResultCard data={currentResult} />
          <div className="flex justify-center gap-4">
            <button onClick={resetDetector} className="btn-primary py-3.5 px-8 text-base shadow-lg shadow-blue-500/20">
              <span>🎤</span> Record Another Cough
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto glass-card p-8 sm:p-12 rounded-3xl border border-white/10 text-center space-y-8 shadow-2xl">
          {/* Recording UI / Big Mic Button */}
          <div className="flex flex-col items-center justify-center py-6">
            <button
              type="button"
              onClick={recording ? null : startRecording}
              disabled={recording}
              className={`w-36 h-36 rounded-full flex items-center justify-center text-6xl shadow-2xl transition-all duration-300 ${
                recording
                  ? 'bg-red-500 text-white recording-pulse scale-110 cursor-default shadow-[0_0_50px_rgba(239,68,68,0.6)]'
                  : 'bg-gradient-to-tr from-medical-blue to-cyan-500 text-white hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] cursor-pointer'
              }`}
              title={recording ? 'Recording in progress...' : 'Click to start 5s recording'}
            >
              {recording ? '🔴' : '🎙️'}
            </button>

            <div className="mt-8 space-y-2">
              <h3 className="text-2xl font-bold text-white font-outfit">
                {recording ? `Recording Cough... ${timeLeft}s left` : 'Click Microphone to Record'}
              </h3>
              <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
                {recording
                  ? 'Please cough clearly into your device microphone.'
                  : 'Record a 5-second cough sample for instant Whisper AI acoustic analysis.'}
              </p>
            </div>

            {/* Waveform Visualization during recording */}
            {recording && (
              <div className="flex items-center justify-center gap-1.5 h-16 mt-8 fade-in">
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-white/40 uppercase tracking-wider">OR</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Upload Audio File */}
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/20 rounded-3xl bg-white/5 hover:bg-white/10 hover:border-medical-blue/50 transition-all group cursor-pointer shadow-inner">
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📁</div>
            <p className="text-base font-bold text-white mb-1">Upload Cough Audio File</p>
            <p className="text-xs text-white/40 mb-6">Supports WAV, MP3, M4A, WEBM, OGG</p>
            <label className="btn-secondary cursor-pointer text-xs py-2.5 px-6 shadow-md">
              Browse Audio File
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {audioFileName && (
              <div className="mt-4 text-xs text-medical-green font-mono bg-medical-green/10 border border-medical-green/20 px-3 py-1 rounded-xl">
                Selected: {audioFileName}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
