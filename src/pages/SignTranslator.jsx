import { useState, useEffect, useRef } from 'react'
import { 
  Camera, CameraOff, Volume2, RotateCcw, Trash2, Copy, 
  BookOpen, Sparkles, Sliders, Eye, EyeOff, CheckCircle2, 
  Award, Info, RefreshCw, Settings, HelpCircle, ArrowRight,
  FolderPlus, Download, Database, Trash, Play, CheckCircle
} from 'lucide-react'
import { 
  classifyGesture, 
  PSL_DICTIONARY, 
  URDU_ALPHABETS, 
  classifyUrduAlphabet 
} from '../utils/pslClassifier'
import { getApiKey } from '../utils/localStorage'
import { analyzeText } from '../utils/groqApi'

// Audio Feedback Synth Helper
const playBeep = (freq, duration, type = 'sine') => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    
    osc.type = type
    osc.frequency.value = freq
    
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration)
    
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    
    osc.start()
    osc.stop(audioCtx.currentTime + duration)
  } catch (e) {
    console.warn("Web Audio API blocked or not supported: ", e)
  }
}

// Local Heuristic NLP Compiler for Signed Phrases
const compileLocalSentence = (words) => {
  if (!words || words.length === 0) return null
  const ids = words.map(w => w.id)

  const rules = [
    {
      match: ['assalamualaikum', 'walaikumassalam'],
      english: "Assalam-o-Alaikum. Walaikum Assalam.",
      urdu: "السلام علیکم۔ وعلیکم السلام۔",
      romanUrdu: "Assalam-o-Alaikum. Walaikum Assalam.",
      affective: "polite"
    },
    {
      match: ['comehere', 'please'],
      english: "Come here, please.",
      urdu: "براہ کرم یہاں تشریف لائیں۔",
      romanUrdu: "Bara-e-maherbani yahan tashreef layein.",
      affective: "polite"
    },
    {
      match: ['donttouch', 'mine'],
      english: "Don't touch! It is mine.",
      urdu: "ہاتھ مت لگائیں! یہ میرا ہے۔",
      romanUrdu: "Hath mat lagayein! Yeh mera hai.",
      affective: "urgent"
    },
    {
      match: ['haveagoodday', 'thankyou'],
      english: "Have a good day! Thank you.",
      urdu: "آپ کا دن اچھا گزرے! بہت شکریہ۔",
      romanUrdu: "Aap ka din accha guzray! Boht shukriya.",
      affective: "polite"
    },
    {
      match: ['ihaveacomplaint', 'mobilephone'],
      english: "I have a complaint about the mobile phone.",
      urdu: "مجھے موبائل فون کے بارے میں ایک شکایت ہے۔",
      romanUrdu: "Mujhe mobile phone ke baaray mein ek shikayat hai.",
      affective: "urgent"
    },
    {
      match: ['welcome', 'house'],
      english: "Welcome to my house.",
      urdu: "میرے گھر میں خوش آمدید۔",
      romanUrdu: "Mere ghar mein khush aamdeed.",
      affective: "polite"
    },
    {
      match: ['seeyoulater', 'goodbye'],
      english: "See you later! Goodbye.",
      urdu: "پھر ملیں گے! الوداع۔",
      romanUrdu: "Phir milenge! Alwida.",
      affective: "polite"
    },
    {
      match: ['toothbrush', 'toothpaste'],
      english: "I need a toothbrush and toothpaste.",
      urdu: "مجھے ٹوتھ برش اور ٹوتھ پیسٹ کی ضرورت ہے۔",
      romanUrdu: "Mujhe toothbrush aur toothpaste ki zaroorat hai.",
      affective: "neutral"
    },
    {
      match: ['shampoo', 'shower'],
      english: "I am going to take a shower and wash my hair.",
      urdu: "میں نہانے اور بال دھونے جا رہا ہوں۔",
      romanUrdu: "Mein nahane aur baal dhone ja raha hoon.",
      affective: "neutral"
    },
    {
      match: ['generator', 'bulb'],
      english: "Start the generator and turn on the light bulb.",
      urdu: "جنریٹر شروع کریں اور بلب آن کریں۔",
      romanUrdu: "Generator shuru karein aur bulb on karein.",
      affective: "neutral"
    },
    {
      match: ['emergency', 'policecar'],
      english: "Emergency! Call a police car immediately.",
      urdu: "ہنگامی صورتحال! پولیس کی گاڑی کو فوری طور پر بلائیں۔",
      romanUrdu: "Emergency! Police ki gaari ko fauri tor par bulayein.",
      affective: "urgent"
    }
  ]

  for (const rule of rules) {
    if (ids.join(',') === rule.match.join(',')) {
      return rule
    }
  }

  for (const rule of rules) {
    const isSubset = rule.match.every(m => ids.includes(m))
    if (isSubset) {
      return rule
    }
  }

  const engWords = words.map(w => w.english.split(' / ')[0])
  const urduWords = words.map(w => w.urdu.split(' / ')[0])
  const romanWords = words.map(w => ROMAN_URDU_MAP[w.id] || w.english.split(' / ')[0])
  
  let affective = "neutral"
  if (ids.some(id => ['emergency', 'policecar', 'donttouch', 'ihaveacomplaint'].includes(id))) {
    affective = "urgent"
  } else if (ids.some(id => ['please', 'welcome', 'thankyou', 'haveagoodday', 'seeyoulater'].includes(id))) {
    affective = "polite"
  }

  return {
    english: engWords.join(' ') + ".",
    urdu: urduWords.join(' ') + "۔",
    romanUrdu: romanWords.join(' ') + ".",
    affective
  }
}

export default function SignTranslator() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const handsRef = useRef(null)
  const cameraRef = useRef(null)

  // Core App State
  const [status, setStatus] = useState("Initializing Native Hand Tracker...")
  const [isInitializing, setIsInitializing] = useState(true)
  const [activeGesture, setActiveGesture] = useState(null)
  const [confidence, setConfidence] = useState(0.65)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [isMirrored, setIsMirrored] = useState(true)
  const [isCameraActive, setIsCameraActive] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)

  // Sentence Stitching State
  const [historyLog, setHistoryLog] = useState([])
  const [compiledSentence, setCompiledSentence] = useState(null)
  const [isTranslating, setIsTranslating] = useState(false)

  // Dictionary Tab filtering
  const [activeCategory, setActiveCategory] = useState("All")

  // Settings state
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('visiondx_gemini_key') || '')
  const [apiType, setApiType] = useState(() => localStorage.getItem('paksign_api_type') || 'gemini')

  // Practice Mode state
  const [practiceSign, setPracticeSign] = useState(null)
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false)
  const [practiceScore, setPracticeScore] = useState(0)

  // Workspaces
  const [activeTab, setActiveTab] = useState('translator') // 'translator', 'learning', 'collector'
  const [translationMode, setTranslationMode] = useState('words') // 'words', 'alphabets'
  
  // Learning Center
  const [learningIndex, setLearningIndex] = useState(0)
  const [learningLetter, setLearningLetter] = useState(URDU_ALPHABETS[0])
  const [learningStatus, setLearningStatus] = useState('pending')
  const [learningScore, setLearningScore] = useState(0)
  
  // Sign Collector
  const [collectorLabel, setCollectorLabel] = useState('')
  const [isCollecting, setIsCollecting] = useState(false)
  const [collectRemaining, setCollectRemaining] = useState(0)
  const [collectedSamples, setCollectedSamples] = useState([])
  const currentFrameLandmarksRef = useRef(null)

  // Expose refs to let functions read them dynamically without stale closures
  const activeTabRef = useRef(activeTab)
  const translationModeRef = useRef(translationMode)
  const learningLetterRef = useRef(learningLetter)
  const learningStatusRef = useRef(learningStatus)
  const showSkeletonRef = useRef(showSkeleton)
  const isMirroredRef = useRef(isMirrored)
  const practiceSignRef = useRef(practiceSign)

  useEffect(() => { activeTabRef.current = activeTab }, [activeTab])
  useEffect(() => { translationModeRef.current = translationMode }, [translationMode])
  useEffect(() => { learningLetterRef.current = learningLetter }, [learningLetter])
  useEffect(() => { learningStatusRef.current = learningStatus }, [learningStatus])
  useEffect(() => { showSkeletonRef.current = showSkeleton }, [showSkeleton])
  useEffect(() => { isMirroredRef.current = isMirrored }, [isMirrored])
  useEffect(() => { practiceSignRef.current = practiceSign }, [practiceSign])

  // Debouncing
  const lastAddedGestureRef = useRef({ combined: "", Left: "", Right: "" })
  const candidateGestureRef = useRef({ combined: "", Left: "", Right: "" })
  const candidateCountRef = useRef({ combined: 0, Left: 0, Right: 0 })

  const resetAllDebouncers = () => {
    candidateGestureRef.current = { combined: "", Left: "", Right: "" }
    candidateCountRef.current = { combined: 0, Left: 0, Right: 0 }
    lastAddedGestureRef.current = { combined: "", Left: "", Right: "" }
  }

  const confidenceRef = useRef(confidence)
  useEffect(() => {
    confidenceRef.current = confidence
  }, [confidence])

  // Preload TTS voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices()
      }
    }
  }, [])

  const ROMAN_URDU_MAP = {
    'assalamualaikum': 'Assalam-o-Alaikum',
    'walaikumassalam': 'Walaikum Assalam',
    'hi/hello': 'Hello',
    'thankyou': 'Shukriya',
    'goodbye': 'Alwida',
    'excuseme': 'Maaf kijiyega',
    'please': 'Bara-e-maherbani',
    'welcome': 'Khush aamdeed',
    'goodmorning': 'Subah bakhair',
    'goodafternoon': 'Seh pahar bakhair',
    'goodnight': 'Shab bakhair',
    'haveagoodday': 'Aap ka din accha guzre',
    'seeyoulater': 'Phir milenge',
    'welldone': 'Shabash',
    'you': 'Aap',
    'we': 'Hum',
    'mine': 'Mera',
    'all': 'Sab',
    'both': 'Dono',
    'absolutely': 'Bilkul',
    'also': 'Bhi',
    'fan': 'Pankha',
    'water': 'Paani',
    'bulb': 'Bulb',
    'mobilephone': 'Mobile phone',
    'generator': 'Generator',
    'door': 'Darwaza',
    'garden': 'Baagh',
    'bed': 'Bister',
    'cupboard': 'Almari',
    'bedroom': 'Sone ka kamra',
    'bench': 'Bench',
    'atm': 'ATM',
    'nailcutter': 'Naakhun tarash',
    'shampoo': 'Shampoo',
    'razor': 'Ustura',
    'shower': 'Shower',
    'tissuepaper': 'Tissue paper',
    'toothbrush': 'Toothbrush',
    'toothpaste': 'Toothpaste',
    'beard': 'Daarhi',
    'facelotion': 'Face lotion',
    'bald': 'Ganja',
    'policecar': 'Police ki gaari',
    'bicycle': 'Cycle',
    'bridge': 'Pul',
    'beach': 'Sahil-e-samundar',
    'sunglasses': 'Dhoop ki ainak',
    'lifejacket': 'Life jacket',
    'umbrella': 'Chhatri',
    'tide': 'Jawar bhaata',
    'dog': 'Kutta',
    'bear': 'Reechh',
    'chimpanzee': 'Chimpanzee',
    'elephant': 'Haathi',
    'cow': 'Gaaye',
    'deer': 'Hiran',
    'peacock': 'Mor',
    'penguin': 'Penguin',
    'beak': 'Choanch',
    'crow': 'Kawa',
    'bring': 'Lana',
    'goaway': 'Door ho jao',
    'comehere': 'Yahan aao',
    'airplane': 'Hawai jahaz',
    'aircrash': 'Hawai jahaz ka hadsa',
    'arrival': 'Aamad',
    'conveyor-belt': 'Conveyor belt',
    'donttouch': 'Hath mat lagayein',
    'ihaveacomplaint': 'Meri ek shikayat hai',
    'cartoon': 'Cartoon',
    'coloredpencils': 'Rangeen pencils'
  }

  const getRomanUrduPhonetic = (text) => {
    if (!text) return ""
    const lowerText = text.toLowerCase().trim()
    
    // Check Urdu Alphabets
    const alphabetMatch = URDU_ALPHABETS.find(a => a.letter === text || a.id === lowerText)
    if (alphabetMatch) return alphabetMatch.english
    
    // Check Dictionary
    if (ROMAN_URDU_MAP[lowerText]) return ROMAN_URDU_MAP[lowerText]
    
    const dictMatch = PSL_DICTIONARY.find(d => d.urdu === text || d.id === lowerText || d.english.toLowerCase() === lowerText)
    if (dictMatch) return ROMAN_URDU_MAP[dictMatch.id] || dictMatch.english.split(' / ')[0]
    
    return text
  }

  // Text to Speech
  const speakText = (text, langCode, romanText = null) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const voices = window.speechSynthesis.getVoices()
      const hasUrduVoice = !!voices.find(v => v.lang.startsWith('ur') || v.lang.startsWith('ar') || v.name.includes('Urdu'))

      let utteranceText = text
      let targetLang = 'en-US'

      if (langCode === 'ur') {
        if (hasUrduVoice) {
          targetLang = 'ur-PK'
          const urduVoice = voices.find(v => v.lang.startsWith('ur') || v.lang.startsWith('ar') || v.name.includes('Urdu'))
          const utterance = new SpeechSynthesisUtterance(utteranceText)
          utterance.lang = targetLang
          if (urduVoice) utterance.voice = urduVoice
          utterance.rate = 0.95
          window.speechSynthesis.speak(utterance)
          return
        } else {
          // Fallback to Roman Urdu using English Voice
          targetLang = 'en-US'
          utteranceText = romanText || getRomanUrduPhonetic(text)
        }
      } else {
        targetLang = 'en-US'
      }

      const utterance = new SpeechSynthesisUtterance(utteranceText)
      utterance.lang = targetLang
      utterance.rate = 0.88 // slightly slower for Roman Urdu
      const englishVoice = voices.find(v => v.lang.startsWith('en'))
      if (englishVoice) utterance.voice = englishVoice
      window.speechSynthesis.speak(utterance)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    playBeep(600, 0.1)
  }

  const handleSaveSettings = () => {
    localStorage.setItem('visiondx_gemini_key', apiKey)
    localStorage.setItem('paksign_api_type', apiType)
    setShowSettings(false)
    playBeep(500, 0.1, 'sine')
  }

  const handleSynthesizeSentence = async () => {
    if (historyLog.length === 0) return
    setIsTranslating(true)
    playBeep(440, 0.1, 'sine')

    const wordsList = historyLog.map(w => w.english.split(' / ')[0]).join(', ')
    const key = apiKey || localStorage.getItem('visiondx_gemini_key') || localStorage.getItem('visiondx_api_key')
    
    if (!key) {
      setTimeout(() => {
        const compiled = compileLocalSentence(historyLog)
        setCompiledSentence(compiled)
        setIsTranslating(false)
        playBeep(520, 0.1, 'triangle')
      }, 600)
      return
    }

    try {
      const prompt = `You are an expert translator for Pakistan Sign Language (PSL). Translate this sequence of raw signed words into a single coherent, grammatically correct, natural, and expressive (affective) sentence in English, Urdu (Nastaliq script), and a Roman Urdu transliteration (Urdu written in standard Latin/English letters). Output the result strictly in JSON format: { "english": "Polished English sentence", "urdu": "پالش شدہ اردو جملہ", "romanUrdu": "Polished Roman Urdu transliteration", "affective": "polite/urgent/question/neutral" }. Raw signed words: [${wordsList}].`
      const responseDataText = await analyzeText(prompt, key)
      const parsed = JSON.parse(responseDataText.trim())
      setCompiledSentence(parsed)
      playBeep(700, 0.15, 'sine')
    } catch (err) {
      console.warn("AI Synthesis failed, falling back to local NLP rules...", err)
      const compiled = compileLocalSentence(historyLog)
      setCompiledSentence(compiled)
      playBeep(520, 0.1, 'triangle')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleToggleCamera = () => {
    if (isCameraActive) {
      if (cameraRef.current) {
        cameraRef.current.stop()
        cameraRef.current = null
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
      setIsCameraActive(false)
      setStatus("Camera paused by user.")
    } else {
      setIsCameraActive(true)
      setStatus("Resuming camera stream...")
    }
  }

  const clearTimeline = () => {
    setHistoryLog([])
    setCompiledSentence(null)
    resetAllDebouncers()
    playBeep(300, 0.15)
  }

  const triggerLearningSuccess = () => {
    if (learningStatusRef.current === 'correct') return
    setLearningStatus('correct')
    setShowSuccessCelebration(true)
    setLearningScore(prev => prev + 10)
    playBeep(880, 0.15, 'sine')
    setTimeout(() => playBeep(1100, 0.2, 'sine'), 100)
    setTimeout(() => setShowSuccessCelebration(false), 1200)
    
    setTimeout(() => {
      setLearningIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % URDU_ALPHABETS.length
        setLearningLetter(URDU_ALPHABETS[nextIndex])
        setLearningStatus('pending')
        return nextIndex
      })
    }, 1500)
  }

  const triggerPracticeSuccess = () => {
    setPracticeScore(prev => prev + 10)
    setShowSuccessCelebration(true)
    playBeep(880, 0.15, 'sine')
    setTimeout(() => playBeep(1100, 0.2, 'sine'), 100)
    setTimeout(() => {
      setShowSuccessCelebration(false)
      setPracticeSign(null)
    }, 1200)
  }

  const handleStartPractice = (sign) => {
    if (practiceSign && practiceSign.id === sign.id) {
      setPracticeSign(null)
    } else {
      setPracticeSign(sign)
      playBeep(450, 0.1, 'triangle')
    }
  }

  // MediaPipe Hand Tracking Setup
  useEffect(() => {
    if (!window.Hands || !window.Camera) {
      setStatus("Error: MediaPipe SDK scripts failed to load. Check your network.")
      setErrorMessage("MediaPipe SDK CDNs could not be resolved. Please reload this page.")
      setIsInitializing(false)
      return
    }

    const hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    })

    handsRef.current = hands
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })

    hands.onResults((results) => {
      if (!canvasRef.current || !videoRef.current) return
      
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      const video = videoRef.current

      if (video.readyState !== 4) return // wait for metadata

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        currentFrameLandmarksRef.current = results.multiHandLandmarks[0]

        if (activeTabRef.current === 'collector') {
          setStatus("Collector active. Hand detected. Ready to capture dataset.")
          setActiveGesture(null)
          resetAllDebouncers()
        } else {
          let gestureResult = classifyGesture(results.multiHandLandmarks, results.multiHandedness, confidenceRef.current)

          if (gestureResult) {
            if (translationModeRef.current === 'alphabets') {
              if (gestureResult.type === 'combined') {
                const mapped = classifyUrduAlphabet(gestureResult.gesture.id)
                if (mapped) {
                  gestureResult.gesture = {
                    id: mapped.id,
                    english: mapped.english,
                    urdu: mapped.letter,
                    description: mapped.description
                  }
                } else {
                  gestureResult = null
                }
              } else {
                const mappedGestures = gestureResult.gestures.map(g => {
                  const mapped = classifyUrduAlphabet(g.gesture.id)
                  return mapped ? {
                    gesture: {
                      id: mapped.id,
                      english: mapped.english,
                      urdu: mapped.letter,
                      description: mapped.description
                    },
                    handedness: g.handedness
                  } : null
                }).filter(Boolean)
                
                gestureResult.gestures = mappedGestures
                if (mappedGestures.length === 0) gestureResult = null
              }
            }
          }

          if (gestureResult) {
            if (activeTabRef.current === 'learning') {
              let matched = false
              if (gestureResult.type === 'combined') {
                const mapped = classifyUrduAlphabet(gestureResult.gesture.id) || gestureResult.gesture
                if (mapped.id === learningLetterRef.current.id) {
                  matched = true
                }
              } else {
                matched = gestureResult.gestures.some(g => {
                  const mapped = classifyUrduAlphabet(g.gesture.id) || g.gesture
                  return mapped.id === learningLetterRef.current.id
                })
              }
              if (matched) {
                triggerLearningSuccess()
              }
            }

            setActiveGesture(gestureResult)

            if (gestureResult.type === 'combined') {
              const gesture = gestureResult.gesture
              setStatus(`${results.multiHandLandmarks.length} Hands active. Combined gesture: "${gesture.english}"`)

              candidateGestureRef.current.Left = ""
              candidateCountRef.current.Left = 0
              candidateGestureRef.current.Right = ""
              candidateCountRef.current.Right = 0
              lastAddedGestureRef.current.Left = ""
              lastAddedGestureRef.current.Right = ""

              if (candidateGestureRef.current.combined === gesture.id) {
                candidateCountRef.current.combined += 1
                
                if (candidateCountRef.current.combined >= 12 && lastAddedGestureRef.current.combined !== gesture.id) {
                  if (activeTabRef.current === 'translator') {
                    if (practiceSignRef.current && practiceSignRef.current.id === gesture.id) {
                      triggerPracticeSuccess()
                    } else {
                      setHistoryLog(prev => [...prev, { ...gesture, timestamp: new Date().toLocaleTimeString() }])
                      playBeep(520, 0.08, 'triangle')
                    }
                  }
                  lastAddedGestureRef.current.combined = gesture.id
                }
              } else {
                candidateGestureRef.current.combined = gesture.id
                candidateCountRef.current.combined = 0
              }
            } else {
              candidateGestureRef.current.combined = ""
              candidateCountRef.current.combined = 0
              lastAddedGestureRef.current.combined = ""

              const activeHandednessList = gestureResult.gestures.map(g => g.handedness)
              const gestureNames = gestureResult.gestures.map(g => `"${g.gesture.english}" (${g.handedness})`).join(', ')
              setStatus(`${results.multiHandLandmarks.length} Hand(s) active. Gestures: ${gestureNames || 'None'}`)

              gestureResult.gestures.forEach(({ gesture, handedness }) => {
                if (candidateGestureRef.current[handedness] === gesture.id) {
                  candidateCountRef.current[handedness] += 1
                  
                  if (candidateCountRef.current[handedness] >= 12 && lastAddedGestureRef.current[handedness] !== gesture.id) {
                    if (activeTabRef.current === 'translator') {
                      if (practiceSignRef.current && practiceSignRef.current.id === gesture.id) {
                        triggerPracticeSuccess()
                      } else {
                        setHistoryLog(prev => [...prev, { ...gesture, timestamp: new Date().toLocaleTimeString() }])
                        playBeep(520, 0.08, 'triangle')
                      }
                    }
                    lastAddedGestureRef.current[handedness] = gesture.id
                  }
                } else {
                  candidateGestureRef.current[handedness] = gesture.id
                  candidateCountRef.current[handedness] = 0
                }
              })

              ['Left', 'Right'].forEach(side => {
                if (!activeHandednessList.includes(side)) {
                  candidateGestureRef.current[side] = ""
                  candidateCountRef.current[side] = 0
                  lastAddedGestureRef.current[side] = ""
                }
              })
            }
          } else {
            setActiveGesture(null)
            resetAllDebouncers()
          }
        }

        if (showSkeletonRef.current) {
          const connections = [
            [0,1], [1,2], [2,3], [3,4],       
            [0,5], [5,6], [6,7], [7,8],       
            [5,9], [9,10], [10,11], [11,12],  
            [9,13], [13,14], [14,15], [15,16], 
            [13,17], [0,17], [17,18], [18,19], [19,20] 
          ]

          results.multiHandLandmarks.forEach((landmarks) => {
            ctx.strokeStyle = "#10b981"
            ctx.lineWidth = 4
            connections.forEach(([start, end]) => {
              const pt1 = landmarks[start]
              const pt2 = landmarks[end]
              ctx.beginPath()
              
              const x1 = isMirroredRef.current ? (1 - pt1.x) * canvas.width : pt1.x * canvas.width
              const x2 = isMirroredRef.current ? (1 - pt2.x) * canvas.width : pt2.x * canvas.width
              
              ctx.moveTo(x1, pt1.y * canvas.height)
              ctx.lineTo(x2, pt2.y * canvas.height)
              ctx.stroke()
            })

            landmarks.forEach((point) => {
              ctx.beginPath()
              const x = isMirroredRef.current ? (1 - point.x) * canvas.width : point.x * canvas.width
              ctx.arc(x, point.y * canvas.height, 5, 0, 2 * Math.PI)
              ctx.fillStyle = "#ffffff"
              ctx.fill()
              ctx.strokeStyle = "#3b82f6"
              ctx.lineWidth = 2.5
              ctx.stroke()
            })
          })
        }
      } else {
        setActiveGesture(null)
        resetAllDebouncers()
        setStatus("Place hand(s) in camera view...")
      }
    })

    setIsInitializing(false)

    return () => {
      hands.close()
    }
  }, [])

  // Camera acquisition and stream lifecycle
  useEffect(() => {
    if (!isCameraActive || isInitializing || errorMessage) return

    let camera = null
    const startCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && handsRef.current && isCameraActive) {
              await handsRef.current.send({ image: videoRef.current })
            }
          },
          width: 640,
          height: 480
        })
        cameraRef.current = camera
        await camera.start()
        setStatus("Camera feed online. Real-time translation ready.")
      } catch (e) {
        console.error("Camera acquisition failed:", e)
        setErrorMessage("Failed to acquire webcam. Check browser permissions and system settings.")
        setStatus("Error: Webcam access denied.")
      }
    }

    const timer = setTimeout(() => {
      startCameraStream()
    }, 500)

    return () => {
      clearTimeout(timer)
      if (camera) {
        camera.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [isCameraActive, isInitializing, errorMessage])

  const streamRef = useRef(null)

  const filteredDictionary = PSL_DICTIONARY.filter(sign => {
    if (activeCategory === "All") return true
    return sign.category === activeCategory
  })

  const handleStartCapture = (seconds) => {
    if (isCollecting || !collectorLabel) return
    setIsCollecting(true)
    setCollectRemaining(seconds)
    
    let count = 0
    const interval = setInterval(() => {
      count++
      setCollectRemaining(prev => prev - 1)
      
      if (currentFrameLandmarksRef.current) {
        setCollectedSamples(prev => [...prev, {
          id: `sample_${Date.now()}_${count}`,
          label: collectorLabel,
          landmarks: currentFrameLandmarksRef.current,
          timestamp: new Date().toLocaleTimeString()
        }])
        playBeep(600, 0.1, 'sine')
      } else {
        playBeep(300, 0.15, 'sawtooth')
      }
      
      if (count >= seconds) {
        clearInterval(interval)
        setIsCollecting(false)
        playBeep(880, 0.25, 'sine')
      }
    }, 1000)
  }

  const handleExportDataset = () => {
    try {
      const dataStr = JSON.stringify(collectedSamples, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      const exportFileDefaultName = `${collectorLabel.replace(/\s+/g, '_')}_psl_dataset.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      playBeep(700, 0.15, 'sine')
    } catch (e) {
      console.error("Export dataset failed:", e)
    }
  }

  const MiniCanvas = ({ landmarks }) => {
    const ref = useRef(null)
    useEffect(() => {
      if (!ref.current || !landmarks) return
      const canvas = ref.current
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#0b1329'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      const connections = [
        [0,1], [1,2], [2,3], [3,4],       
        [0,5], [5,6], [6,7], [7,8],       
        [5,9], [9,10], [10,11], [11,12],  
        [9,13], [13,14], [14,15], [15,16], 
        [13,17], [0,17], [17,18], [18,19], [19,20] 
      ]
      
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 1.5
      connections.forEach(([start, end]) => {
        const pt1 = landmarks[start]
        const pt2 = landmarks[end]
        ctx.beginPath()
        ctx.moveTo((1 - pt1.x) * canvas.width, pt1.y * canvas.height)
        ctx.lineTo((1 - pt2.x) * canvas.width, pt2.y * canvas.height)
        ctx.stroke()
      })
      
      landmarks.forEach(point => {
        ctx.beginPath()
        ctx.arc((1 - point.x) * canvas.width, point.y * canvas.height, 1.5, 0, 2 * Math.PI)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
      })
    }, [landmarks])
    
    return <canvas ref={ref} width={100} height={75} className="rounded-lg border border-white/10" />
  }

  const categories = ["All", "Greetings", "Pronouns", "Household", "Bathroom", "Beach", "Animals", "Birds", "Airport", "Sentences"]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 slide-in relative overflow-hidden">
      
      {/* Success Animation Flash */}
      {showSuccessCelebration && (
        <div className="absolute inset-0 bg-medical-green/10 pointer-events-none z-50 animate-pulse border-4 border-medical-green/45 rounded-3xl" />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-medical-green/10 border border-medical-green/20 text-medical-green text-xs font-semibold mb-2 shadow-glow">
            <span>🖐️</span> Real-Time skeletal hand pose tracking
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
            PSL Gesture Translator
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Translate Pakistani Sign Language (PSL) gestures and Urdu alphabets in real-time. Stitch signs into coherent sentences via local NLP rules or generative AI model compilation.
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 ${showSettings ? 'bg-medical-green/20 text-medical-green border-medical-green/30' : ''}`}
          >
            <Settings size={14} />
            AI Config
          </button>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex border-b border-white/10 pb-1 gap-2">
        <button 
          onClick={() => { setActiveTab('translator'); setActiveGesture(null); resetAllDebouncers(); }}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'translator' ? 'border-medical-green text-medical-green' : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <Sparkles size={16} />
          Translator Hub
        </button>
        <button 
          onClick={() => { setActiveTab('learning'); setActiveGesture(null); resetAllDebouncers(); setLearningStatus('pending'); }}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'learning' ? 'border-medical-green text-medical-green' : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <BookOpen size={16} />
          Urdu Learning Hub
        </button>
        <button 
          onClick={() => { setActiveTab('collector'); setActiveGesture(null); resetAllDebouncers(); }}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'collector' ? 'border-medical-green text-medical-green' : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <Database size={16} />
          Sign Collector
        </button>
      </div>

      {/* Settings Drawer Panel */}
      {showSettings && (
        <div className="glass-card p-6 rounded-3xl border border-white/10 shadow-xl space-y-4 animate-slide-down">
          <h3 className="text-base font-bold text-white font-outfit border-b border-white/10 pb-2">
            AI Sentence Synthesizer Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">API Provider</label>
              <select 
                className="input-field bg-navy-900"
                value={apiType}
                onChange={(e) => setApiType(e.target.value)}
              >
                <option value="gemini">Google Gemini AI (gemini-1.5-flash)</option>
                <option value="groq">Groq AI (llama-3.3-70b-versatile)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                Access Key
                <span className="text-[10px] lowercase text-white/40 ml-1 font-normal">(saved locally)</span>
              </label>
              <input 
                type="password"
                className="input-field"
                placeholder={apiType === 'gemini' ? "Enter Gemini API Key..." : "Enter Groq API Key..."}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary text-xs" onClick={() => setShowSettings(false)}>Cancel</button>
            <button className="btn-primary text-xs" onClick={handleSaveSettings}>Save Configuration</button>
          </div>
        </div>
      )}

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <Info size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {practiceSign && (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Award className="text-blue-400 animate-bounce" size={20} />
            <div>
              <span className="font-bold">Practice Mode Active:</span> Sign <strong className="text-white">"{practiceSign.english}"</strong> ({practiceSign.urdu}) to match.
              <span className="text-xs text-white/55 block mt-0.5">Description: {practiceSign.description}</span>
            </div>
          </div>
          <button className="px-3.5 py-1.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-bold transition-all shrink-0" onClick={() => setPracticeSign(null)}>
            Cancel Practice
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Webcam Feed & controls (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col items-center">
            
            <div className="flex items-center justify-between w-full border-b border-white/10 pb-4 mb-4">
              <h2 className="text-lg font-bold text-white font-outfit flex items-center gap-2">
                <Camera size={18} className="text-medical-green" />
                Live Camera Capture
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/55 uppercase font-bold tracking-wider">
                {isCameraActive ? 'Active' : 'Offline'}
              </span>
            </div>

            {/* Camera Viewport */}
            <div className="relative rounded-2xl overflow-hidden bg-navy-950/60 border border-white/5 w-full aspect-video flex items-center justify-center max-h-[50vh]">
              
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
              />
              
              <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full"
                style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }} 
              />
              
              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 gap-2 bg-[#020810]/90">
                  <CameraOff size={40} />
                  <span className="text-xs font-semibold">Camera feed paused</span>
                </div>
              )}
            </div>

            {/* Float Controls */}
            <div className="flex flex-wrap justify-center gap-3 w-full mt-5">
              <button 
                type="button"
                onClick={() => setShowSkeleton(!showSkeleton)}
                className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                  showSkeleton ? 'bg-medical-green/10 border-medical-green/30 text-medical-green' : 'bg-white/5 border-white/5 text-white/60 hover:text-white'
                }`}
              >
                {showSkeleton ? <Eye size={14} /> : <EyeOff size={14} />}
                Skeleton Connections
              </button>

              <button 
                type="button"
                onClick={() => setIsMirrored(!isMirrored)}
                className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isMirrored ? 'bg-medical-green/10 border-medical-green/30 text-medical-green' : 'bg-white/5 border-white/5 text-white/60 hover:text-white'
                }`}
              >
                <RefreshCw size={14} />
                Mirror View
              </button>

              <button 
                type="button"
                onClick={handleToggleCamera}
                disabled={!!errorMessage}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <CameraOff size={14} />
                {isCameraActive ? "Pause Stream" : "Resume Stream"}
              </button>
            </div>

            {/* Threshold slider */}
            <div className="w-full mt-6 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-white/70">
                <span className="flex items-center gap-1">
                  <Sliders size={14} className="text-blue-400" />
                  Classification Match Rate
                </span>
                <span>{(confidence * 100).toFixed(0)}% Certainty</span>
              </div>
              <input 
                type="range"
                min="0.4"
                max="0.9"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-navy-950 rounded-lg appearance-none cursor-pointer accent-medical-green border border-white/10"
              />
            </div>

          </div>
        </div>

        {/* Right Column: Dynamic tab cards (1 col) */}
        <div className="space-y-6">
          
          {/* TAB 1: Real-time Translator Workspace */}
          {activeTab === 'translator' && (
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-6">
              
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                <h2 className="text-lg font-bold text-white font-outfit flex items-center gap-2">
                  <Sparkles size={18} className="text-blue-400" />
                  Classification HUD
                </h2>

                {practiceScore > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center gap-1">
                    <Award size={12} />
                    {practiceScore} XP
                  </span>
                )}
              </div>

              {/* Translation modes selector */}
              <div className="flex bg-navy-950 p-1 rounded-xl border border-white/5 justify-between">
                <button 
                  onClick={() => { setTranslationMode('words'); clearTimeline(); }}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all w-1/2 ${
                    translationMode === 'words' ? 'bg-medical-green/20 text-medical-green border border-medical-green/20' : 'text-white/60 hover:text-white'
                  }`}
                >
                  PSL Dictionary Words
                </button>
                <button 
                  onClick={() => { setTranslationMode('alphabets'); clearTimeline(); }}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all w-1/2 ${
                    translationMode === 'alphabets' ? 'bg-medical-green/20 text-medical-green border border-medical-green/20' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Urdu Alphabets
                </button>
              </div>

              {/* Active Gesture display card */}
              <div className={`p-6 rounded-2xl border transition-all duration-300 min-h-[160px] flex flex-col items-center justify-center text-center ${
                activeGesture 
                  ? 'border-medical-green/30 bg-medical-green/5 shadow-lg shadow-medical-green/5' 
                  : 'border-white/5 bg-white/5'
              }`}>
                {activeGesture ? (
                  activeGesture.type === 'combined' ? (
                    <div className="space-y-4 w-full">
                      <span className="px-2.5 py-0.5 rounded-full bg-medical-green/20 text-medical-green border border-medical-green/30 text-[9px] font-black uppercase tracking-widest">
                        2-Hand Sign
                      </span>
                      
                      <div>
                        <span className="text-[10px] text-white/40 block uppercase tracking-wider font-bold mb-1">English</span>
                        <div className="text-lg font-bold text-white flex items-center justify-center gap-1.5">
                          {activeGesture.gesture.english}
                          <button onClick={() => speakText(activeGesture.gesture.english, 'en')} className="p-1 text-white/50 hover:text-white transition-colors" title="Speak English">
                            <Volume2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="w-12 h-px bg-white/10 mx-auto" />

                      <div>
                        <span className="text-[10px] text-white/40 block uppercase tracking-wider font-bold mb-1">Urdu</span>
                        <div className="text-2xl font-bold text-medical-green font-urdu flex items-center justify-center gap-3">
                          {activeGesture.gesture.urdu}
                          <button onClick={() => speakText(activeGesture.gesture.urdu, 'ur', ROMAN_URDU_MAP[activeGesture.gesture.id])} className="p-1 text-white/50 hover:text-white transition-colors" title="Speak Urdu">
                            <Volume2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-[10px] text-white/50 bg-navy-950/65 p-2 rounded-lg inline-block select-none leading-relaxed">
                        <b>Instruction:</b> {activeGesture.gesture.description}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 w-full">
                      {activeGesture.gestures.map(({ gesture, handedness }, idx) => (
                        <div key={idx} className="space-y-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            handedness === 'Left' 
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          }`}>
                            {handedness} Hand
                          </span>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] text-white/40 block uppercase tracking-wider font-bold">English</span>
                              <span className="text-sm font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                                {gesture.english}
                                <button onClick={() => speakText(gesture.english, 'en')} className="p-0.5 text-white/45 hover:text-white">
                                  <Volume2 size={12} />
                                </button>
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-white/40 block uppercase tracking-wider font-bold">Urdu</span>
                              <span className="text-lg font-bold text-medical-green font-urdu flex items-center justify-center gap-1.5 mt-0.5">
                                {gesture.urdu}
                                <button onClick={() => speakText(gesture.urdu, 'ur', ROMAN_URDU_MAP[gesture.id])} className="p-0.5 text-white/45 hover:text-white">
                                  <Volume2 size={12} />
                                </button>
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="space-y-2 select-none">
                    <p className="text-white/30 text-sm font-medium">Place hands in view to translate</p>
                    <p className="text-[10px] text-white/20 max-w-[200px] mx-auto leading-relaxed">
                      Waving hello, Thumbs Up, and Water signs are loaded.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Detection Stability</span>
                <div className="h-1.5 w-full bg-navy-950 rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full bg-medical-green transition-all duration-300 ${activeGesture ? 'w-[95%]' : 'w-0'}`} />
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Urdu Alphabet Learning Hub Workspace */}
          {activeTab === 'learning' && (
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-6 animate-slide-up">
              
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                <h2 className="text-lg font-bold text-white font-outfit flex items-center gap-2">
                  <BookOpen size={18} className="text-medical-green" />
                  Urdu Alphabet Learning
                </h2>
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center gap-1">
                  <Award size={12} />
                  {learningScore} XP
                </span>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center space-y-4">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Target Sign Alphabet</span>
                <div className="text-6xl font-black text-white font-urdu select-none flex items-center justify-center gap-3">
                  {learningLetter.letter}
                  <button 
                    type="button" 
                    onClick={() => speakText(learningLetter.letter, 'ur', learningLetter.english)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    title="Speak Alphabet Sound"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
                <div>
                  <span className="text-xl font-bold text-medical-green block font-outfit">{learningLetter.english}</span>
                  <span className="text-[10px] text-white/40 block mt-0.5">Urdu Sound: {learningLetter.english}</span>
                </div>
                
                <p className="text-xs text-white/60 leading-relaxed bg-navy-950/40 p-3.5 rounded-xl border border-white/5 max-w-xs">
                  <strong>Instruction:</strong> {learningLetter.description}
                </p>
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col items-center justify-center text-center gap-3 ${
                learningStatus === 'correct' ? 'border-medical-green/30 bg-medical-green/5' : 'border-white/5 bg-white/5'
              }`}>
                {learningStatus === 'correct' ? (
                  <>
                    <CheckCircle2 size={32} className="text-medical-green animate-bounce" />
                    <div>
                      <div className="text-sm font-bold text-medical-green">Sign Matched Successfully!</div>
                      <div className="text-[10px] text-white/45 mt-0.5">Moving to next alphabet...</div>
                    </div>
                  </>
                ) : (
                  <>
                    <RefreshCw size={24} className="text-blue-400 animate-spin" />
                    <div>
                      <div className="text-sm font-bold text-white/80">Perform sign to match</div>
                      {activeGesture ? (
                        <div className="text-[11px] text-white/50 bg-navy-950/65 py-1 px-3.5 rounded-lg inline-block mt-2">
                          We see: <strong className="text-blue-400 uppercase">
                            {activeGesture.type === 'combined'
                              ? (classifyUrduAlphabet(activeGesture.gesture.id)?.english || activeGesture.gesture.english)
                              : activeGesture.gestures.map(g => classifyUrduAlphabet(g.gesture.id)?.english || g.gesture.english).join(', ')}
                          </strong>
                        </div>
                      ) : (
                        <div className="text-[10px] text-white/35 mt-1">Detecting hand joints...</div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between gap-4 pt-2">
                <button 
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 text-xs font-bold transition-all w-1/2" 
                  onClick={() => {
                    setLearningIndex(prevIndex => {
                      const nextIndex = (prevIndex - 1 + URDU_ALPHABETS.length) % URDU_ALPHABETS.length
                      setLearningLetter(URDU_ALPHABETS[nextIndex])
                      setLearningStatus('pending')
                      return nextIndex
                    })
                  }}
                >
                  Previous
                </button>
                <button 
                  className="px-4 py-2 rounded-xl bg-medical-green/15 hover:bg-medical-green/20 border border-medical-green/25 text-medical-green text-xs font-bold transition-all w-1/2 flex items-center justify-center gap-1"
                  onClick={() => {
                    setLearningIndex(prevIndex => {
                      const nextIndex = (prevIndex + 1) % URDU_ALPHABETS.length
                      setLearningLetter(URDU_ALPHABETS[nextIndex])
                      setLearningStatus('pending')
                      return nextIndex
                    })
                  }}
                >
                  Skip / Next
                  <ArrowRight size={12} />
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: Sign Collector Workspace */}
          {activeTab === 'collector' && (
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-6 animate-slide-up">
              
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                <h2 className="text-lg font-bold text-white font-outfit flex items-center gap-2">
                  <Database size={18} className="text-medical-green" />
                  PSL Dataset Collector
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-medical-green/10 border border-medical-green/20 text-medical-green text-[10px] font-bold">
                  Samples: {collectedSamples.length}
                </span>
              </div>

              <p className="text-xs text-white/50 leading-relaxed">
                Build your own Pakistani Sign Language skeletal coordinates dataset. Type the sign label, capture joints frame-by-frame, and export as JSON.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Sign Label Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Enter sign name (e.g. Water)..." 
                    value={collectorLabel}
                    onChange={(e) => setCollectorLabel(e.target.value)}
                    disabled={isCollecting}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button 
                    className="px-4 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 flex-1 select-none disabled:opacity-50"
                    disabled={isCollecting || !collectorLabel}
                    onClick={() => handleStartCapture(10)}
                    style={{ background: isCollecting ? '#ef4444' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#0b1329' }}
                  >
                    {isCollecting ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} />
                        Recording ({collectRemaining}s)
                      </>
                    ) : (
                      <>
                        <FolderPlus size={14} />
                        Record 10s Sequence
                      </>
                    )}
                  </button>

                  <button 
                    className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-30"
                    onClick={handleExportDataset}
                    disabled={collectedSamples.length === 0 || isCollecting}
                    title="Export as JSON"
                  >
                    <Download size={14} />
                    Export
                  </button>

                  <button 
                    className="px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-30"
                    onClick={() => { setCollectedSamples([]); playBeep(300, 0.15); }}
                    disabled={collectedSamples.length === 0 || isCollecting}
                    title="Clear captured frames"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>

              {/* Gallery */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Captured Frames
                </h3>

                {collectedSamples.length > 0 ? (
                  <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 border border-white/5 p-2.5 rounded-xl bg-navy-950/40">
                    <div className="grid grid-cols-2 gap-2.5">
                      {collectedSamples.slice().reverse().map((sample) => (
                        <div key={sample.id} className="p-2 rounded-xl bg-navy-900 border border-white/5 flex flex-col items-center relative group">
                          <MiniCanvas landmarks={sample.landmarks} />
                          <div className="text-[9px] text-white/50 font-bold truncate mt-1 w-full text-center">
                            {sample.label} ({sample.timestamp.split(' ')[0]})
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              setCollectedSamples(prev => prev.filter(s => s.id !== sample.id))
                              playBeep(400, 0.1, 'sawtooth')
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500/20 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-white/10 rounded-xl text-[10px] text-white/30 select-none">
                    Gallery is empty. Start recording frames.
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* TIMELINE SENTENCE STITCHER PANEL */}
      {activeTab === 'translator' && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
                <BookOpen size={18} className="text-medical-green" />
                Sign Translation Timeline
              </h2>
              <p className="text-xs text-white/50 mt-0.5">Chronological log of sign gestures held in camera view</p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleSynthesizeSentence}
                disabled={historyLog.length === 0 || isTranslating}
                className="px-4 py-2 rounded-xl bg-medical-green/15 hover:bg-medical-green/20 border border-medical-green/25 text-medical-green hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-medical-green/5 disabled:opacity-50"
              >
                {isTranslating ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    Stitching...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Stitch Coherent Sentence
                  </>
                )}
              </button>
              <button 
                onClick={clearTimeline}
                disabled={historyLog.length === 0}
                className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40"
              >
                <Trash2 size={14} />
                Clear
              </button>
            </div>
          </div>

          {/* Timeline Timeline words */}
          <div className="p-5 rounded-2xl bg-navy-950/60 border border-white/5 min-h-[70px] flex flex-wrap gap-2.5 items-center">
            {historyLog.length > 0 ? (
              historyLog.map((word, idx) => (
                <span 
                  key={idx} 
                  className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs text-white font-bold inline-flex items-center gap-1.5 animate-pulse"
                >
                  {word.english.split(' / ')[0]}
                  <span className="text-[10px] text-white/40">({word.urdu})</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-white/30 select-none">
                Timeline is empty. Held signs will append here automatically.
              </span>
            )}
          </div>

          {/* Synthesized Result */}
          {compiledSentence && (
            <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-4 animate-slide-down">
              
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-xs font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles size={14} className="text-indigo-400" />
                  Stitched Coherent Output
                </span>
                
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  compiledSentence.affective === 'urgent'
                    ? 'bg-red-500/25 text-red-400'
                    : compiledSentence.affective === 'polite'
                      ? 'bg-emerald-500/25 text-emerald-400'
                      : 'bg-white/10 text-white/60'
                }`}>
                  {compiledSentence.affective || 'neutral'} tone
                </span>
              </div>

              {/* English */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">English Output</span>
                <div className="text-sm text-white font-medium flex items-center justify-between gap-3 bg-navy-950/30 p-3 rounded-xl border border-white/5">
                  <span>{compiledSentence.english}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => speakText(compiledSentence.english, 'en')}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                      title="Speak English"
                    >
                      <Volume2 size={13} />
                    </button>
                    <button 
                      onClick={() => copyToClipboard(compiledSentence.english)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                      title="Copy English"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Urdu Nastaliq */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Urdu Nastaliq Output</span>
                <div className="text-2xl font-bold text-medical-green font-urdu flex items-center justify-between gap-3 bg-navy-950/30 p-3 rounded-xl border border-white/5" style={{ direction: 'rtl' }}>
                  <span>{compiledSentence.urduDisplay || compiledSentence.urdu}</span>
                  <div className="flex gap-2" style={{ direction: 'ltr' }}>
                    <button 
                      onClick={() => speakText(compiledSentence.urdu, 'ur', compiledSentence.romanUrdu)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                      title="Speak Urdu"
                    >
                      <Volume2 size={13} />
                    </button>
                    <button 
                      onClick={() => copyToClipboard(compiledSentence.urdu)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                      title="Copy Urdu"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* LEARNING DICTIONARY (71 WORDS) */}
      {activeTab === 'translator' && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-6">
          
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
              <BookOpen size={18} className="text-medical-green" />
              Pakistani Sign Language Learning Dictionary ({PSL_DICTIONARY.length} Signs)
            </h2>
            <p className="text-xs text-white/50 mt-1">
              Select category tabs to filter signs. Click "Practice Sign" to test your poses in camera view.
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2.5">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  activeCategory === cat 
                    ? 'bg-medical-green/10 border-medical-green/20 text-medical-green' 
                    : 'bg-white/5 border-white/5 text-white/60 hover:text-white hover:border-white/15'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Dictionary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredDictionary.map((sign) => {
              const isPracticing = practiceSign && practiceSign.id === sign.id
              return (
                <div 
                  key={sign.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-4 ${
                    isPracticing 
                      ? 'border-indigo-500/40 bg-indigo-500/5 shadow-md shadow-indigo-500/5' 
                      : 'border-white/5 bg-white/5 hover:bg-[#0b1329]/55 hover:border-white/10'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-sm font-bold text-white block group-hover:text-medical-green transition-colors">{sign.english.split(' / ')[0]}</span>
                        <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-full text-white/45 font-bold uppercase tracking-wider inline-block mt-1">{sign.category}</span>
                      </div>
                      <span className="text-xl font-bold text-medical-green font-urdu">{sign.urdu}</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed font-medium">{sign.description}</p>
                  </div>

                  <button 
                    type="button"
                    onClick={() => handleStartPractice(sign)}
                    className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                      isPracticing 
                        ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30' 
                        : 'bg-[#020810]/80 border-white/10 text-white/60 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {isPracticing ? "Cancel Practice" : "Practice Sign"}
                  </button>
                </div>
              )
            })}
          </div>

        </div>
      )}

    </div>
  )
}
