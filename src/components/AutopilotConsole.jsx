import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { speakText, cancelSpeech } from '../utils/ttsService'

const STEPS = [
  { id: 'eye', name: '👁️ Eye Disease Predictor', path: '/eye-predictor' },
  { id: 'skin', name: '🔴 Skin Rash Analyzer', path: '/skin-analyzer' },
  { id: 'wound', name: '🩹 Wound Healing Tracker', path: '/wound-tracker' },
  { id: 'cough', name: '🎤 Cough Sound AI', path: '/cough-detector' },
  { id: 'sleep', name: '😴 Sleep Quality AI', path: '/sleep-analyzer' },
  { id: 'medicine', name: '💊 Medicine Verifier', path: '/medicine-analyzer' },
  { id: 'lab', name: '📄 Lab Report Analyzer', path: '/lab-analyzer' },
  { id: 'hair', name: '💇 Hair Disease AI', path: '/hair-analyzer' },
  { id: 'routine', name: '📅 Daily Routine Analyzer', path: '/routine-analyzer' },
  { id: 'voicedoc', name: '🩺 VoiceDoc Triage AI', path: '/voicedoc' }
]

const NARRATIVES = {
  eye: {
    en: "Analyzing eye image. Conjunctivitis risk identified. Sclera shows active vascular congestion and teary discharge. Recommended: Avoid rubbing the eye, practice strict hand hygiene, and consult an eye specialist.",
    ur: "آنکھ کا معائنہ مکمل۔ آشوبِ چشم کا خطرہ پایا گیا ہے۔ براہِ مہربانی آنکھ کو ملنے سے گریز کریں، ہاتھوں کو صاف رکھیں اور ڈاکٹر سے رجوع کریں۔",
    roman: "Aankh ka muaina mukammal. Ashoob-e-chashm ka khatra paya gaya hai. Bara-e-maherbani aankh ko malne se gurez karein, haathon ko saaf rakhein aur doctor se ruju karein."
  },
  skin: {
    en: "Evaluating skin lesion. Moderate contact dermatitis suspected on the back of the shoulder. Recommended: Apply a cool damp compress, keep the area moisturized, and avoid harsh chemicals or soaps.",
    ur: "جلد کا معائنہ مکمل۔ کندھے پر معتدل الرجی اور سوجن پائی گئی ہے۔ متاثرہ حصے کو صاف اور نم رکھیں اور خارش سے بچنے کے لیے ڈاکٹر سے رجوع کریں۔",
    roman: "Jild ka muaina mukammal. Kandhay par mohtadil allergy aur soojan payi gayi hai. Mutasira hissay ko saaf aur nam rakhein aur kharish se bachne ke liye doctor se ruju karein."
  },
  wound: {
    en: "Tracking wound healing timeline. Surgical incision sutures are clean, well-approximated, and healthy with low infection risk. Recommended: Keep the site clean and dry.",
    ur: "زخم کی ٹریکنگ مکمل۔ ٹانکے بالکل صاف اور صحت مند ہیں اور انفیکشن کا خطرہ نہ ہونے کے برابر ہے۔ زخم کو صاف اور خشک رکھیں۔",
    roman: "Zakham ki tracking mukammal. Taankay bilkul saaf aur sehat-mand hain aur infection ka khatra na hone ke barabar hai. Zakham ko saaf aur khushk rakhein."
  },
  cough: {
    en: "Evaluating cough sound acoustics. Whooping cough pattern detected with paroxysmal breathing spasms. Recommended: Keep warm, stay hydrated, and consult a respiratory doctor.",
    ur: "کھانسی کی آواز کا جائزہ مکمل۔ کالی کھانسی کا خطرہ پایا گیا ہے۔ جسم کو گرم رکھیں، پانی کا استعمال زیادہ کریں اور ڈاکٹر سے رجوع کریں۔",
    roman: "Khansi ki awaz ka jaiza mukammal. Kaali khansi ka khatra paya gaya hai. Jism ko garm rakhein, paani ka istemaal zyada karein aur doctor se ruju karein."
  },
  sleep: {
    en: "Analyzing sleep quality score. High Obstructive Sleep Apnea risk identified due to heavy chronic snoring. Recommended: Avoid sleeping on your back and seek a clinical sleep study.",
    ur: "نیند کا معائنہ مکمل۔ خراٹوں کے باعث سلیپ اپنیا کا شدید خطرہ ہے۔ الٹا یا پیٹھ کے بل سونے سے پرہیز کریں اور معائنہ کروائیں۔",
    roman: "Neend ka muaina mukammal. Kharaaton ke baais sleep apnea ka khatra hai. Ulta ya peeth ke bal sone se parhez karein aur muaina karwayein."
  },
  medicine: {
    en: "Scanning medicine packaging. Verified authentic Metronidazole active anti-infective formulation. Counterfeit risk is low. Warning: Strictly avoid alcohol mixing.",
    ur: "ادویات کی تصدیق مکمل۔ میٹرو نیدازول گولی کی تصدیق ہو گئی ہے اور یہ سو فیصد اصلی ہے۔ دوا کے ساتھ شراب کا استعمال بالکل نہ کریں۔",
    roman: "Adviyat ki tasdeeq mukammal. Metronidazole goli ki tasdeeq ho gayi hai aur yeh sou feesad asli hai. Dawa ke sath sharaab ka istemaal bilkul na karein."
  },
  lab: {
    en: "Breaking down laboratory blood test results. Critical leukocytosis detected with elevated white blood cell counts of 23.75, indicating acute bacterial infection. Seek clinical care immediately.",
    ur: "لیب رپورٹ کا معائنہ مکمل۔ خون میں وائٹ سیلز کی تعداد تیئس اعشاریہ پچہتر ہے جو کہ شدید انفیکشن کی علامت ہے۔ فوری ڈاکٹر سے رجوع کریں۔",
    roman: "Lab report ka jaiza mukammal. Khoon mein white cells ki taadaad 23.75 hai jo ke shadeed infection ki alamat hai. Fauri doctor se ruju karein."
  },
  hair: {
    en: "Analyzing scalp and hair disease. Focal alopecia bald patch detected with no epidermal scarring. Recommended: Avoid hair styling heat and consult a dermatologist.",
    ur: "بالوں کا معائنہ مکمل۔ جلد پر گنج پن کا دائرہ نما نشان پایا گیا ہے۔ بالوں پر استری یا کیمیکل کا استعمال روک دیں اور ڈاکٹر سے ملیں۔",
    roman: "Balon ka muaina mukammal. Jild par ganj-pan ka daera-numa nishan paya gaya hai. Balon par istri ya chemical ka istemaal rok dein aur doctor se milein."
  },
  routine: {
    en: "Compiling daily habit prescription. Wellness score is 50 out of 100. High screen time of 9 hours and low sleep of 5 hours indicates severe fatigue. Recommended: reduce screen time and increase sleep duration.",
    ur: "روزمرہ عادات کا جائزہ مکمل۔ صحت کا اسکور پچاس فیصد ہے۔ نو گھنٹے اسکرین کا استعمال اور پانچ گھنٹے نیند صحت کے لیے نقصان دہ ہے۔ اسکرین کا استعمال کم کریں۔",
    roman: "Rozmarra aadat ka jaiza mukammal. Sehat ka score 50% hai. Nou ghantay screen ka istemaal aur paanch ghantay neend sehat ke liye nuqsandeh hai. Screen ka istemaal kam karein."
  },
  voicedoc: {
    en: "VoiceDoc rural triage completed. Symptom query for high fever processed. Recommended: Keep warm, hydrate with steam inhalation, and check WhatsApp for your referral.",
    ur: "وائس ڈاک دیہی رہنمائی مکمل۔ پریشانی کی کوئی بات نہیں۔ بھاپ کا استعمال کریں اور واٹس ایپ پر ڈاکٹر کی فراہم کردہ ہدایات پر عمل کریں۔",
    roman: "VoiceDoc deehi rehnumai mukammal. Pareshani ki koi baat nahi. Bhaap ka istemaal karein aur WhatsApp par doctor ki farahamakarda hidayat par amal karein."
  }
}

export default function AutopilotConsole() {
  const [isActive, setIsActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Initializing Autopilot...')
  const [countdown, setCountdown] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('en') // 'en' or 'ur'
  const [showCelebration, setShowCelebration] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const timerRef = useRef(null)
  const speechUtteranceRef = useRef(null)

  // Listen for starting autopilot
  useEffect(() => {
    const handleStart = () => {
      localStorage.setItem('visiondx_autopilot', 'active')
      localStorage.setItem('visiondx_autopilot_step', STEPS[0].id)
      setIsActive(true)
      setCurrentStepIndex(0)
      setIsPaused(false)
      setStatusMessage('Directing to Eye Disease Predictor...')
      setCountdown(3)
    }

    const handleStop = () => {
      cleanUp()
    }

    window.addEventListener('autopilot-start', handleStart)
    window.addEventListener('autopilot-stop', handleStop)

    // Check if active on mount (e.g. page refresh during tour)
    const isAutopilotActive = localStorage.getItem('visiondx_autopilot') === 'active'
    if (isAutopilotActive) {
      const savedStep = localStorage.getItem('visiondx_autopilot_step') || 'eye'
      const index = STEPS.findIndex(s => s.id === savedStep)
      setIsActive(true)
      setCurrentStepIndex(index >= 0 ? index : 0)
      setStatusMessage(`Resuming ${STEPS[index >= 0 ? index : 0].name}...`)
    }

    return () => {
      window.removeEventListener('visiondx-preset-triggered', handleStart)
      window.removeEventListener('visiondx-preset-triggered', handleStop)
      cancelSpeech()
    }
  }, [])

  // Action loop triggered when countdown or status changes
  useEffect(() => {
    if (!isActive || isPaused) return

    if (countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
    } else if (countdown === 0 && statusMessage.startsWith('Directing')) {
      const step = STEPS[currentStepIndex]
      setStatusMessage(`🤖 AUTOPILOT: Scanning ${step.name}...`)
      localStorage.setItem('visiondx_autopilot_step', step.id)
      navigate(step.path)
    }

    return () => clearTimeout(timerRef.current)
  }, [countdown, isActive, isPaused, statusMessage])

  // Listen for results loaded from individual pages
  useEffect(() => {
    const handleResultReady = (e) => {
      if (!isActive) return
      const { type } = e.detail
      const currentStep = STEPS[currentStepIndex]

      if (type === currentStep.id) {
        setStatusMessage(`📢 Diagnosed! Speaking Results...`)
        speakNarrative(type)
      }
    }

    window.addEventListener('autopilot-result-ready', handleResultReady)
    return () => window.removeEventListener('autopilot-result-ready', handleResultReady)
  }, [isActive, currentStepIndex])

  const speakNarrative = (stepId) => {
    cancelSpeech()
    setSpeaking(true)
    setCurrentLanguage('en')

    const narrative = NARRATIVES[stepId]
    if (!narrative) {
      handleStepComplete()
      return
    }

    speakText(narrative.en, 'en-US', {
      onStart: () => {
        setSpeaking(true)
        setCurrentLanguage('en')
      },
      onEnd: () => {
        const hasElevenLabsKey = !!(import.meta.env.VITE_ELEVENLABS_API_KEY || localStorage.getItem('visiondx_elevenlabs_key'))
        let targetText = narrative.ur
        let targetLang = 'ur-PK'

        if (!hasElevenLabsKey) {
          if ('speechSynthesis' in window) {
            const voices = window.speechSynthesis.getVoices()
            const hasUrduVoice = voices.some(v => v.lang.startsWith('ur') || v.lang.startsWith('ar') || v.name.includes('Urdu'))
            if (!hasUrduVoice) {
              targetText = narrative.roman
              targetLang = 'ur-roman'
            }
          }
        }

        speakText(targetText, targetLang, {
          onStart: () => {
            setSpeaking(true)
            setCurrentLanguage('ur')
          },
          onEnd: () => {
            setSpeaking(false)
            handleStepComplete()
          },
          onError: () => {
            setSpeaking(false)
            handleStepComplete()
          }
        })
      },
      onError: () => {
        setSpeaking(false)
        handleStepComplete()
      }
    })
  }

  const handleStepComplete = () => {
    if (currentStepIndex < STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1
      setCurrentStepIndex(nextIndex)
      setStatusMessage(`Directing to ${STEPS[nextIndex].name}...`)
      setCountdown(4)
    } else {
      // Autopilot Tour Completed!
      setShowCelebration(true)
      cleanUp()
    }
  }

  const cleanUp = () => {
    setIsActive(false)
    setIsPaused(false)
    setSpeaking(false)
    localStorage.removeItem('visiondx_autopilot')
    localStorage.removeItem('visiondx_autopilot_step')
    cancelSpeech()
  }

  const handleTogglePause = () => {
    if (isPaused) {
      setIsPaused(false)
      if (statusMessage.startsWith('Directing')) {
        setCountdown(3)
      } else if (statusMessage.startsWith('📢')) {
        speakNarrative(STEPS[currentStepIndex].id)
      } else {
        const step = STEPS[currentStepIndex]
        setStatusMessage(`🤖 AUTOPILOT: Scanning ${step.name}...`)
        navigate(step.path)
      }
    } else {
      setIsPaused(true)
      clearTimeout(timerRef.current)
      cancelSpeech()
      setSpeaking(false)
    }
  }

  const handleSkipStep = () => {
    cancelSpeech()
    setSpeaking(false)
    handleStepComplete()
  }

  if (showCelebration) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/90 backdrop-blur-xl fade-in">
        {/* Celebration CSS Confetti animations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="confetti absolute top-0 left-1/4 w-3 h-3 bg-medical-green rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '3s' }} />
          <div className="confetti absolute top-0 left-1/2 w-4 h-4 bg-cyan-400 rounded-lg rotate-12 animate-bounce" style={{ animationDelay: '0.6s', animationDuration: '4s' }} />
          <div className="confetti absolute top-0 left-3/4 w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s', animationDuration: '2.5s' }} />
          <div className="confetti absolute top-0 left-1/3 w-3.5 h-3.5 bg-yellow-400 rounded-md rotate-45 animate-bounce" style={{ animationDelay: '0.9s', animationDuration: '3.5s' }} />
          <div className="confetti absolute top-0 left-2/3 w-4 h-4 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '4.5s' }} />
        </div>

        <div className="relative glass-card max-w-lg p-8 sm:p-10 rounded-3xl border border-medical-green/40 shadow-2xl text-center space-y-6 bg-gradient-to-b from-navy-900 via-navy-950 to-[#020810]/95 max-w-md w-full scale-in">
          <div className="w-20 h-20 rounded-full bg-medical-green/10 border border-medical-green/30 flex items-center justify-center text-4xl mx-auto shadow-glow">
            🏆
          </div>
          
          <h2 className="text-3xl font-extrabold text-white font-outfit">
            Autopilot Tour Complete!
          </h2>
          <p className="text-sm text-white/70 leading-relaxed">
            Congratulations! You have experienced the full diagnostic capabilities of the <b>VisionDX Mega Platform</b>. 
            All clinical vision modules, API integrations, and bilingual speech guides executed perfectly.
          </p>

          <div className="p-4 bg-medical-green/5 border border-medical-green/10 rounded-2xl text-xs text-medical-green font-semibold">
            🇵🇰 پاکستان کا ڈیجیٹل ڈاکٹر - پاکستان کا فخر
          </div>

          <button
            onClick={() => { setShowCelebration(false); navigate('/') }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-medical-green to-teal-500 text-navy-950 font-extrabold text-base transition-all flex items-center justify-center gap-2 shadow-xl shadow-medical-green/20 hover:scale-[1.01]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!isActive) return null

  const stepProgress = ((currentStepIndex) / STEPS.length) * 100
  const activeStep = STEPS[currentStepIndex]

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-sm w-80 bg-navy-900/90 backdrop-blur-lg border border-medical-green/30 rounded-3xl p-5 shadow-2xl shadow-navy-950/80 slide-in-up">
      {/* Radial indicator or top bar */}
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPaused ? 'bg-amber-400' : 'bg-medical-green'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPaused ? 'bg-amber-400' : 'bg-medical-green'}`}></span>
          </span>
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">VisionDX Autopilot</span>
        </div>
        <div className="text-[10px] font-bold text-medical-green font-mono bg-medical-green/10 px-2 py-0.5 rounded-full border border-medical-green/20">
          Step {currentStepIndex + 1} of {STEPS.length}
        </div>
      </div>

      <div className="space-y-4">
        {/* Step Name */}
        <div>
          <h4 className="text-sm font-extrabold text-white font-outfit truncate">{activeStep.name}</h4>
          <p className="text-[11px] text-white/60 mt-1 font-semibold leading-relaxed line-clamp-2">
            {isPaused ? '⏸️ Autopilot Paused' : countdown > 0 ? `🚀 Navigating in ${countdown}s...` : speaking ? `🎙️ Speaking Narration (${currentLanguage === 'en' ? 'English' : 'Urdu اردو'})` : '🔬 Auto-scanning and analyzing...'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-medical-green to-teal-400 rounded-full transition-all duration-500 shadow-glow" 
            style={{ width: `${stepProgress || 5}%` }}
          />
        </div>

        {/* Voice and assistant details */}
        {speaking && (
          <div className="p-2.5 rounded-xl bg-medical-green/5 border border-medical-green/15 text-[10px] text-medical-green font-semibold animate-pulse flex items-center gap-1.5">
            <span className="text-sm">🗣️</span> {currentLanguage === 'en' ? 'Narrating English diagnosis...' : 'پاکستان کا ڈیجیٹل ڈاکٹر: اردو ترجمہ جاری ہے...'}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2 pt-1.5 border-t border-white/5">
          <button
            onClick={handleTogglePause}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md ${
              isPaused 
                ? 'bg-medical-green text-navy-950 hover:bg-medical-green/80' 
                : 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/10'
            }`}
          >
            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
          <button
            onClick={handleSkipStep}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-bold transition-all"
            title="Skip this step"
          >
            Skip ⏭️
          </button>
          <button
            onClick={cleanUp}
            className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-white text-xs font-bold transition-all"
            title="Quit Autopilot Tour"
          >
            Quit ⏹️
          </button>
        </div>
      </div>
    </div>
  )
}
