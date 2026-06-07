import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { 
  Camera, CameraOff, Volume2, RotateCcw, Trash2, Copy, 
  BookOpen, Sparkles, Sliders, Eye, EyeOff, CheckCircle2, 
  Award, Info, RefreshCw, Settings, HelpCircle, ArrowRight,
  FolderPlus, Download, Database, Trash
} from 'lucide-react';
import { classifyGesture, PSL_DICTIONARY, URDU_ALPHABETS, classifyUrduAlphabet } from '../utils/pslClassifier';
import { translateText } from '../utils/translationService';
import './SignTranslator.css';

// Audio Feedback Synth Helper
const playBeep = (freq, duration, type = 'sine') => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Web Audio API blocked or not supported: ", e);
  }
};

// Local Heuristic NLP Compiler for Signed Phrases (Customized to Dynamic Dataset)
const compileLocalSentence = (words) => {
  if (!words || words.length === 0) return null;
  const ids = words.map(w => w.id);

  // Exact Match Dictionary for Sign Pairs/Triplets
  const rules = [
    {
      match: ['assalamualaikum', 'walaikumassalam'],
      english: "Assalam-o-Alaikum. Walaikum Assalam.",
      urdu: "السلام علیکم۔ وعلیکم السلام۔",
      affective: "polite"
    },
    {
      match: ['comehere', 'please'],
      english: "Come here, please.",
      urdu: "براہ کرم یہاں تشریف لائیں۔",
      affective: "polite"
    },
    {
      match: ['donttouch', 'mine'],
      english: "Don't touch! It is mine.",
      urdu: "ہاتھ مت لگائیں! یہ میرا ہے۔",
      affective: "urgent"
    },
    {
      match: ['haveagoodday', 'thankyou'],
      english: "Have a good day! Thank you.",
      urdu: "آپ کا دن اچھا گزرے! بہت شکریہ۔",
      affective: "polite"
    },
    {
      match: ['ihaveacomplaint', 'mobilephone'],
      english: "I have a complaint about the mobile phone.",
      urdu: "مجھے موبائل فون کے بارے میں ایک شکایت ہے۔",
      affective: "urgent"
    },
    {
      match: ['welcome', 'house'],
      english: "Welcome to my house.",
      urdu: "میرے گھر میں خوش آمدید۔",
      affective: "polite"
    },
    {
      match: ['seeyoulater', 'goodbye'],
      english: "See you later! Goodbye.",
      urdu: "پھر ملیں گے! الوداع۔",
      affective: "polite"
    },
    {
      match: ['toothbrush', 'toothpaste'],
      english: "I need a toothbrush and toothpaste.",
      urdu: "مجھے ٹوتھ برش اور ٹوتھ پیسٹ کی ضرورت ہے۔",
      affective: "neutral"
    },
    {
      match: ['shampoo', 'shower'],
      english: "I am going to take a shower and wash my hair.",
      urdu: "میں نہانے اور بال دھونے جا رہا ہوں۔",
      affective: "neutral"
    },
    {
      match: ['generator', 'bulb'],
      english: "Start the generator and turn on the light bulb.",
      urdu: "جنریٹر شروع کریں اور بلب آن کریں۔",
      affective: "neutral"
    },
    {
      match: ['emergency', 'policecar'],
      english: "Emergency! Call a police car immediately.",
      urdu: "ہنگامی صورتحال! پولیس کی گاڑی کو فوری طور پر بلائیں۔",
      affective: "urgent"
    }
  ];

  // 1. Check exact sequence matches
  for (const rule of rules) {
    if (ids.join(',') === rule.match.join(',')) {
      return rule;
    }
  }

  // 2. Check subset sequence matches
  for (const rule of rules) {
    const isSubset = rule.match.every(m => ids.includes(m));
    if (isSubset) {
      return rule;
    }
  }

  // 3. Fallback: Parse features of the sign array to stitch grammatically
  const engWords = words.map(w => w.english.split(' / ')[0]);
  const urduWords = words.map(w => w.urdu.split(' / ')[0]);
  
  // Categorize sentence tone
  let affective = "neutral";
  if (ids.some(id => ['emergency', 'policecar', 'donttouch', 'ihaveacomplaint'].includes(id))) {
    affective = "urgent";
  } else if (ids.some(id => ['please', 'welcome', 'thankyou', 'haveagoodday', 'seeyoulater'].includes(id))) {
    affective = "polite";
  }

  let engSent = engWords.join(' ') + ".";
  let urduSent = urduWords.join(' ') + "۔";

  return {
    english: engSent,
    urdu: urduSent,
    affective
  };
};

export default function SignTranslator() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);

  // Core App State
  const [status, setStatus] = useState("Initializing Native Hand Tracker...");
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeGesture, setActiveGesture] = useState(null);
  const [confidence, setConfidence] = useState(0.65);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [isMirrored, setIsMirrored] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Sentence Stitching State
  const [historyLog, setHistoryLog] = useState([]);
  const [compiledSentence, setCompiledSentence] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Dictionary Tab filtering
  const [activeCategory, setActiveCategory] = useState("All");

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('visiondx_gemini_key') || '');
  const [apiType, setApiType] = useState(() => localStorage.getItem('paksign_api_type') || 'gemini');

  // Practice Mode state
  const [practiceSign, setPracticeSign] = useState(null);
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false);
  const [practiceScore, setPracticeScore] = useState(0);

  // New Merged Workspace State
  const [activeTab, setActiveTab] = useState('translator'); // 'translator', 'learning', 'collector'
  const [translationMode, setTranslationMode] = useState('words'); // 'words', 'alphabets'
  
  // Learning Center state
  const [learningIndex, setLearningIndex] = useState(0);
  const [learningLetter, setLearningLetter] = useState(URDU_ALPHABETS[0]);
  const [learningStatus, setLearningStatus] = useState('pending');
  const [learningScore, setLearningScore] = useState(0);
  
  // Sign Collector state
  const [collectorLabel, setCollectorLabel] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectRemaining, setCollectRemaining] = useState(0);
  const [collectedSamples, setCollectedSamples] = useState([]);
  const currentFrameLandmarksRef = useRef(null);

  // Expose refs to let functions read them dynamically without stale closures
  const activeTabRef = useRef(activeTab);
  const translationModeRef = useRef(translationMode);
  const learningLetterRef = useRef(learningLetter);
  const learningStatusRef = useRef(learningStatus);
  const showSkeletonRef = useRef(showSkeleton);
  const isMirroredRef = useRef(isMirrored);
  const practiceSignRef = useRef(practiceSign);

  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { translationModeRef.current = translationMode; }, [translationMode]);
  useEffect(() => { learningLetterRef.current = learningLetter; }, [learningLetter]);
  useEffect(() => { learningStatusRef.current = learningStatus; }, [learningStatus]);
  useEffect(() => { showSkeletonRef.current = showSkeleton; }, [showSkeleton]);
  useEffect(() => { isMirroredRef.current = isMirrored; }, [isMirrored]);
  useEffect(() => { practiceSignRef.current = practiceSign; }, [practiceSign]);

  // Debouncing for translation log addition (separate combined vs individual hands)
  const lastAddedGestureRef = useRef({ combined: "", Left: "", Right: "" });
  const candidateGestureRef = useRef({ combined: "", Left: "", Right: "" });
  const candidateCountRef = useRef({ combined: 0, Left: 0, Right: 0 });

  const resetAllDebouncers = () => {
    candidateGestureRef.current = { combined: "", Left: "", Right: "" };
    candidateCountRef.current = { combined: 0, Left: 0, Right: 0 };
    lastAddedGestureRef.current = { combined: "", Left: "", Right: "" };
  };

  const confidenceRef = useRef(confidence);
  useEffect(() => {
    confidenceRef.current = confidence;
  }, [confidence]);

  // Text to Speech Helper
  const speakText = (text, langCode) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      
      if (langCode === 'ur') {
        utterance.lang = 'ur-PK';
        const voices = window.speechSynthesis.getVoices();
        const urduVoice = voices.find(v => v.lang.startsWith('ur') || v.lang.startsWith('ar'));
        if (urduVoice) utterance.voice = urduVoice;
      } else {
        utterance.lang = 'en-US';
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  // Copy coherent sentence or timeline to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    playBeep(600, 0.1);
  };

  // Save API Config to localStorage
  const handleSaveSettings = () => {
    localStorage.setItem('visiondx_gemini_key', apiKey);
    localStorage.setItem('paksign_api_type', apiType);
    setShowSettings(false);
    playBeep(500, 0.1, 'sine');
  };

  // AI Sentence Synthesizer Request
  const handleSynthesizeSentence = async () => {
    if (historyLog.length === 0) return;
    setIsTranslating(true);
    playBeep(440, 0.1, 'sine');

    const wordsList = historyLog.map(w => w.english.split(' / ')[0]).join(', ');
    
    if (!apiKey) {
      const compiled = compileLocalSentence(historyLog);
      try {
        const translatedUrdu = await translateText(compiled.english, 'ur');
        if (translatedUrdu) {
          compiled.urdu = translatedUrdu;
        }
      } catch (err) {
        console.warn("MyMemory translation fallback for local compilation failed:", err);
      }
      setCompiledSentence(compiled);
      setIsTranslating(false);
      playBeep(520, 0.1, 'triangle');
      return;
    }

    try {
      let responseDataText = "";
      
      if (apiType === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an expert translator for Pakistan Sign Language (PSL). Translate this sequence of raw signed words into a single coherent, grammatically correct, natural, and expressive (affective) sentence in both English and Urdu (Nastaliq script). Output the result strictly in JSON format: { "english": "Polished English sentence", "urdu": "پالش شدہ اردو جملہ", "affective": "polite/urgent/question/neutral" }. Raw signed words: [${wordsList}].`
              }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (!res.ok) throw new Error(`Gemini Error: ${res.status}`);
        const data = await res.json();
        responseDataText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else {
        const url = `https://api.groq.com/openai/v1/chat/completions`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{
              role: 'user',
              content: `Translate these raw signed words into a coherent, natural, and expressive sentence in both English and Urdu. Output strictly in JSON format: { "english": "Polished English sentence", "urdu": "پالش شدہ اردو جملہ", "affective": "polite/urgent/question/neutral" }. Raw signed words: [${wordsList}].`
            }],
            response_format: { type: "json_object" }
          })
        });

        if (!res.ok) throw new Error(`Groq Error: ${res.status}`);
        const data = await res.json();
        responseDataText = data.choices?.[0]?.message?.content || "";
      }

      const parsed = JSON.parse(responseDataText.trim());
      setCompiledSentence(parsed);
      playBeep(700, 0.15, 'sine');
    } catch (err) {
      console.warn("AI Synthesis failed, falling back to local NLP rules...", err);
      const compiled = compileLocalSentence(historyLog);
      try {
        const translatedUrdu = await translateText(compiled.english, 'ur');
        if (translatedUrdu) {
          compiled.urdu = translatedUrdu;
        }
      } catch (transErr) {
        console.warn("MyMemory translation fallback for local compilation failed:", transErr);
      }
      setCompiledSentence(compiled);
      playBeep(520, 0.1, 'triangle');
    } finally {
      setIsTranslating(false);
    }
  };

  // Toggle Camera state
  const handleToggleCamera = () => {
    if (isCameraActive) {
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      setIsCameraActive(false);
      setStatus("Camera paused by user.");
    } else {
      setIsCameraActive(true);
      setStatus("Resuming camera stream...");
    }
  };

  // Clear timeline log
  const clearTimeline = () => {
    setHistoryLog([]);
    setCompiledSentence(null);
    resetAllDebouncers();
    playBeep(300, 0.15);
  };

  const triggerLearningSuccess = () => {
    if (learningStatusRef.current === 'correct') return;
    setLearningStatus('correct');
    setShowSuccessCelebration(true);
    setLearningScore(prev => prev + 10);
    playBeep(880, 0.15, 'sine');
    setTimeout(() => playBeep(1100, 0.2, 'sine'), 100);
    setTimeout(() => setShowSuccessCelebration(false), 1200);
    
    setTimeout(() => {
      setLearningIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % URDU_ALPHABETS.length;
        setLearningLetter(URDU_ALPHABETS[nextIndex]);
        setLearningStatus('pending');
        return nextIndex;
      });
    }, 1500);
  };

  const triggerPracticeSuccess = () => {
    setPracticeScore(prev => prev + 10);
    setShowSuccessCelebration(true);
    playBeep(880, 0.15, 'sine');
    setTimeout(() => playBeep(1100, 0.2, 'sine'), 100);
    setTimeout(() => {
      setShowSuccessCelebration(false);
      setPracticeSign(null);
    }, 1200);
  };

  // Trigger Practice mode for a sign
  const handleStartPractice = (sign) => {
    if (practiceSign && practiceSign.id === sign.id) {
      setPracticeSign(null);
    } else {
      setPracticeSign(sign);
      playBeep(450, 0.1, 'triangle');
    }
  };

  useEffect(() => {
    if (!window.Hands || !window.Camera) {
      setStatus("Error: MediaPipe SDK scripts failed to load. Check your network.");
      setErrorMessage("MediaPipe SDK CDNs could not be resolved. Please reload this page.");
      setIsInitializing(false);
      return;
    }

    const hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    handsRef.current = hands;

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults((results) => {
      if (!canvasRef.current || !webcamRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const video = webcamRef.current.video;

      if (!video) return;

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        currentFrameLandmarksRef.current = results.multiHandLandmarks[0];

        if (activeTabRef.current === 'collector') {
          setStatus("Collector active. Hand detected. Ready to capture dataset.");
          setActiveGesture(null);
          resetAllDebouncers();
        } else {
          let gestureResult = classifyGesture(results.multiHandLandmarks, results.multiHandedness, confidenceRef.current);

          if (gestureResult) {
            // Apply Urdu Alphabet mode translation mapping if selected
            if (translationModeRef.current === 'alphabets') {
              if (gestureResult.type === 'combined') {
                const mapped = classifyUrduAlphabet(gestureResult.gesture.id);
                if (mapped) {
                  gestureResult.gesture = {
                    id: mapped.id,
                    english: mapped.english,
                    urdu: mapped.letter,
                    description: mapped.description
                  };
                } else {
                  gestureResult = null; // no matching alphabet mapping
                }
              } else {
                const mappedGestures = gestureResult.gestures.map(g => {
                  const mapped = classifyUrduAlphabet(g.gesture.id);
                  return mapped ? {
                    gesture: {
                      id: mapped.id,
                      english: mapped.english,
                      urdu: mapped.letter,
                      description: mapped.description
                    },
                    handedness: g.handedness
                  } : null;
                }).filter(Boolean);
                
                gestureResult.gestures = mappedGestures;
                if (mappedGestures.length === 0) gestureResult = null;
              }
            }
          }

          if (gestureResult) {
            // Verify learning sign if learning center is active
            if (activeTabRef.current === 'learning') {
              let matched = false;
              if (gestureResult.type === 'combined') {
                const mapped = classifyUrduAlphabet(gestureResult.gesture.id) || gestureResult.gesture;
                if (mapped.id === learningLetterRef.current.id) {
                  matched = true;
                }
              } else {
                matched = gestureResult.gestures.some(g => {
                  const mapped = classifyUrduAlphabet(g.gesture.id) || g.gesture;
                  return mapped.id === learningLetterRef.current.id;
                });
              }
              if (matched) {
                triggerLearningSuccess();
              }
            }

            setActiveGesture(gestureResult);

            if (gestureResult.type === 'combined') {
              const gesture = gestureResult.gesture;
              setStatus(`${results.multiHandLandmarks.length} Hands active. Combined gesture: "${gesture.english}"`);

              // Reset individual hand candidates
              candidateGestureRef.current.Left = "";
              candidateCountRef.current.Left = 0;
              candidateGestureRef.current.Right = "";
              candidateCountRef.current.Right = 0;
              lastAddedGestureRef.current.Left = "";
              lastAddedGestureRef.current.Right = "";

              if (candidateGestureRef.current.combined === gesture.id) {
                candidateCountRef.current.combined += 1;
                
                if (candidateCountRef.current.combined >= 12 && lastAddedGestureRef.current.combined !== gesture.id) {
                  if (activeTabRef.current === 'translator') {
                    if (practiceSignRef.current && practiceSignRef.current.id === gesture.id) {
                      triggerPracticeSuccess();
                    } else {
                      setHistoryLog(prev => [...prev, { ...gesture, timestamp: new Date().toLocaleTimeString() }]);
                      playBeep(520, 0.08, 'triangle');
                    }
                  }
                  lastAddedGestureRef.current.combined = gesture.id;
                }
              } else {
                candidateGestureRef.current.combined = gesture.id;
                candidateCountRef.current.combined = 0;
              }
            } else {
              // Reset combined candidate
              candidateGestureRef.current.combined = "";
              candidateCountRef.current.combined = 0;
              lastAddedGestureRef.current.combined = "";

              const activeHandednessList = gestureResult.gestures.map(g => g.handedness);
              const gestureNames = gestureResult.gestures.map(g => `"${g.gesture.english}" (${g.handedness})`).join(', ');
              setStatus(`${results.multiHandLandmarks.length} Hand(s) active. Gestures: ${gestureNames || 'None'}`);

              // Process individual gestures
              gestureResult.gestures.forEach(({ gesture, handedness }) => {
                if (candidateGestureRef.current[handedness] === gesture.id) {
                  candidateCountRef.current[handedness] += 1;
                  
                  if (candidateCountRef.current[handedness] >= 12 && lastAddedGestureRef.current[handedness] !== gesture.id) {
                    if (activeTabRef.current === 'translator') {
                      if (practiceSignRef.current && practiceSignRef.current.id === gesture.id) {
                        triggerPracticeSuccess();
                      } else {
                        setHistoryLog(prev => [...prev, { ...gesture, timestamp: new Date().toLocaleTimeString() }]);
                        playBeep(520, 0.08, 'triangle');
                      }
                    }
                    lastAddedGestureRef.current[handedness] = gesture.id;
                  }
                } else {
                  candidateGestureRef.current[handedness] = gesture.id;
                  candidateCountRef.current[handedness] = 0;
                }
              });

              // Reset inactive hands
              ['Left', 'Right'].forEach(side => {
                if (!activeHandednessList.includes(side)) {
                  candidateGestureRef.current[side] = "";
                  candidateCountRef.current[side] = 0;
                  lastAddedGestureRef.current[side] = "";
                }
              });
            }
          } else {
            setActiveGesture(null);
            resetAllDebouncers();
          }
        }

        // Draw connections and landmarks if checked
        if (showSkeletonRef.current) {
          const connections = [
            [0,1], [1,2], [2,3], [3,4],       
            [0,5], [5,6], [6,7], [7,8],       
            [5,9], [9,10], [10,11], [11,12],  
            [9,13], [13,14], [14,15], [15,16], 
            [13,17], [0,17], [17,18], [18,19], [19,20] 
          ];

          results.multiHandLandmarks.forEach((landmarks) => {
            // Draw skeleton lines
            ctx.strokeStyle = "#10b981";
            ctx.lineWidth = 4;
            connections.forEach(([start, end]) => {
              const pt1 = landmarks[start];
              const pt2 = landmarks[end];
              ctx.beginPath();
              
              const x1 = isMirroredRef.current ? (1 - pt1.x) * canvas.width : pt1.x * canvas.width;
              const x2 = isMirroredRef.current ? (1 - pt2.x) * canvas.width : pt2.x * canvas.width;
              
              ctx.moveTo(x1, pt1.y * canvas.height);
              ctx.lineTo(x2, pt2.y * canvas.height);
              ctx.stroke();
            });

            // Draw joint nodes
            landmarks.forEach((point) => {
              ctx.beginPath();
              const x = isMirroredRef.current ? (1 - point.x) * canvas.width : point.x * canvas.width;
              ctx.arc(x, point.y * canvas.height, 5, 0, 2 * Math.PI);
              ctx.fillStyle = "#ffffff";
              ctx.fill();
              ctx.strokeStyle = "#3b82f6";
              ctx.lineWidth = 2.5;
              ctx.stroke();
            });
          });
        }
      } else {
        setActiveGesture(null);
        resetAllDebouncers();
        setStatus("Place hand(s) in camera view...");
      }
    });

    setIsInitializing(false);

    return () => {
      hands.close();
    };
  }, []);

  // Handle camera start/stop lifecycles
  useEffect(() => {
    if (!isCameraActive || isInitializing || errorMessage) return;

    let camera = null;
    const startCamera = async () => {
      if (webcamRef.current && webcamRef.current.video) {
        camera = new window.Camera(webcamRef.current.video, {
          onFrame: async () => {
            if (webcamRef.current && webcamRef.current.video && handsRef.current) {
              await handsRef.current.send({ image: webcamRef.current.video });
            }
          },
          width: 640,
          height: 480
        });
        cameraRef.current = camera;
        try {
          await camera.start();
          setStatus("Camera feed online. Real-time translation ready.");
        } catch (e) {
          console.error("Camera acquisition failed:", e);
          setErrorMessage("Failed to acquire webcam. Check browser permissions and system settings.");
          setStatus("Error: Webcam access denied.");
        }
      }
    };

    const timer = setTimeout(() => {
      startCamera();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (camera) {
        camera.stop();
      }
    };
  }, [isCameraActive, isInitializing, errorMessage]);

  // Filter dictionary items
  const filteredDictionary = PSL_DICTIONARY.filter(sign => {
    if (activeCategory === "All") return true;
    return sign.category === activeCategory;
  });

  const handleStartCapture = (seconds) => {
    if (isCollecting || !collectorLabel) return;
    setIsCollecting(true);
    setCollectRemaining(seconds);
    
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setCollectRemaining(prev => prev - 1);
      
      if (currentFrameLandmarksRef.current) {
        setCollectedSamples(prev => [...prev, {
          id: `sample_${Date.now()}_${count}`,
          label: collectorLabel,
          landmarks: currentFrameLandmarksRef.current,
          timestamp: new Date().toLocaleTimeString()
        }]);
        playBeep(600, 0.1, 'sine');
      } else {
        console.warn("No hand in frame during this capture tick!");
        playBeep(300, 0.15, 'sawtooth');
      }
      
      if (count >= seconds) {
        clearInterval(interval);
        setIsCollecting(false);
        playBeep(880, 0.25, 'sine');
      }
    }, 1000);
  };

  const handleExportDataset = () => {
    try {
      const dataStr = JSON.stringify(collectedSamples, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `${collectorLabel.replace(/\s+/g, '_')}_psl_dataset.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      playBeep(700, 0.15, 'sine');
    } catch (e) {
      console.error("Export dataset failed:", e);
    }
  };

  const MiniCanvas = ({ landmarks }) => {
    const ref = useRef(null);
    useEffect(() => {
      if (!ref.current || !landmarks) return;
      const canvas = ref.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const connections = [
        [0,1], [1,2], [2,3], [3,4],       
        [0,5], [5,6], [6,7], [7,8],       
        [5,9], [9,10], [10,11], [11,12],  
        [9,13], [13,14], [14,15], [15,16], 
        [13,17], [0,17], [17,18], [18,19], [19,20] 
      ];
      
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      connections.forEach(([start, end]) => {
        const pt1 = landmarks[start];
        const pt2 = landmarks[end];
        ctx.beginPath();
        ctx.moveTo((1 - pt1.x) * canvas.width, pt1.y * canvas.height);
        ctx.lineTo((1 - pt2.x) * canvas.width, pt2.y * canvas.height);
        ctx.stroke();
      });
      
      landmarks.forEach(point => {
        ctx.beginPath();
        ctx.arc((1 - point.x) * canvas.width, point.y * canvas.height, 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });
    }, [landmarks]);
    
    return <canvas ref={ref} width={100} height={75} className="thumbnail-canvas" style={{ borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }} />;
  };

  const categories = ["All", "Greetings", "Pronouns", "Household", "Bathroom", "Beach", "Animals", "Birds", "Airport", "Sentences"];

  return (
    <div className="paksign-container">
      {/* Visual Success Celebratory Overlay */}
      {showSuccessCelebration && <div className="practice-success-flash" />}

      {/* Header Module */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-glow">
            <Sparkles size={26} />
          </div>
          <h1 className="app-title">PakSign Portal</h1>
        </div>
        <p className="app-subtitle">Real-time Pakistani Sign Language (PSL) Translator with Coherent Sentence Stitching</p>
        
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
          <div className={`status-pill ${errorMessage ? 'error' : ''}`} style={{ marginTop: 0 }}>
            <span className="status-indicator-dot" />
            <span>{status}</span>
          </div>
          <button 
            className={`btn-secondary ${showSettings ? 'active' : ''}`} 
            onClick={() => setShowSettings(!showSettings)}
            style={{ padding: '6px 14px', borderRadius: 20 }}
          >
            <Settings size={14} />
            <span>API Config</span>
          </button>
        </div>

        <div className="workspace-tabs-container">
          <button 
            className={`workspace-tab-btn ${activeTab === 'translator' ? 'active' : ''}`}
            onClick={() => { setActiveTab('translator'); setActiveGesture(null); resetAllDebouncers(); }}
          >
            <Sparkles size={16} />
            <span>Real-time Translator</span>
          </button>
          <button 
            className={`workspace-tab-btn ${activeTab === 'learning' ? 'active' : ''}`}
            onClick={() => { setActiveTab('learning'); setActiveGesture(null); resetAllDebouncers(); setLearningStatus('pending'); }}
          >
            <BookOpen size={16} />
            <span>Urdu Learning Hub</span>
          </button>
          <button 
            className={`workspace-tab-btn ${activeTab === 'collector' ? 'active' : ''}`}
            onClick={() => { setActiveTab('collector'); setActiveGesture(null); resetAllDebouncers(); }}
          >
            <Database size={16} />
            <span>Sign Collector (Dev)</span>
          </button>
        </div>

        {activeTab === 'translator' && (
          <div className="translation-mode-selector animate-slide-down">
            <button 
              className={`mode-toggle-btn ${translationMode === 'words' ? 'active' : ''}`}
              onClick={() => { setTranslationMode('words'); clearTimeline(); }}
            >
              PSL Word Translation
            </button>
            <button 
              className={`mode-toggle-btn ${translationMode === 'alphabets' ? 'active' : ''}`}
              onClick={() => { setTranslationMode('alphabets'); clearTimeline(); }}
            >
              Urdu Alphabet Translation
            </button>
          </div>
        )}</header>

      {/* Settings Drawer Panel */}
      {showSettings && (
        <section className="settings-drawer animate-slide-down">
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
            AI Sentence Synthesizer Settings
          </h3>
          <div className="settings-input-group">
            <label className="settings-label">API Model Provider</label>
            <select 
              className="settings-input"
              value={apiType}
              onChange={(e) => setApiType(e.target.value)}
            >
              <option value="gemini">Google Gemini AI (gemini-1.5-flash)</option>
              <option value="groq">Groq AI (llama-3.3-70b-versatile)</option>
            </select>
          </div>
          <div className="settings-input-group">
            <label className="settings-label">
              API Access Key 
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b', marginLeft: 8 }}>
                (Saved locally. If empty, local NLP rules will be used)
              </span>
            </label>
            <input 
              type="password"
              className="settings-input"
              placeholder={apiType === 'gemini' ? "Enter Gemini API Key..." : "Enter Groq API Key..."}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setShowSettings(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSaveSettings}>Save Configuration</button>
          </div>
        </section>
      )}

      {/* Quick Alerts for Errors */}
      {errorMessage && (
        <div className="practice-banner" style={{ background: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' }}>
          <div className="practice-banner-info">
            <Info size={20} style={{ color: '#ef4444' }} />
            <div>
              <div className="practice-banner-title" style={{ color: '#f87171' }}>System Diagnostic Error</div>
              <div className="practice-banner-desc" style={{ color: '#fca5a5' }}>{errorMessage}</div>
            </div>
          </div>
        </div>
      )}

      {/* Practice Mode Banner */}
      {practiceSign && (
        <div className="practice-banner">
          <div className="practice-banner-info">
            <Award size={22} className="animate-pulse" style={{ color: '#60a5fa' }} />
            <div>
              <div className="practice-banner-title">Practice Mode Active</div>
              <div className="practice-banner-desc">
                Sign **{practiceSign.english}** ({practiceSign.urdu}) to match.
                <span className="italic ml-2 text-white/50">Hint: {practiceSign.description}</span>
              </div>
            </div>
          </div>
          <button className="btn-danger" onClick={() => setPracticeSign(null)}>
            Cancel Practice
          </button>
        </div>
      )}

      {/* Main Dashboard Section */}
      <div className="dashboard-grid">
        
        {/* Left Column: Camera and feed overlay */}
        <section className="glass-panel camera-card">
          <div className="live-translation-header" style={{ width: '100%' }}>
            <h2 className="card-title">
              <Camera size={20} style={{ color: '#10b981' }} />
              Live AI Video Feed
            </h2>
            <div className="status-pill" style={{ margin: 0, padding: '4px 10px', fontSize: '0.75rem' }}>
              FPS ~30 / Active
            </div>
          </div>

          <div className="camera-container">
            {isCameraActive && !errorMessage ? (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                mirrored={isMirrored}
                className="webcam-feed"
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: "user"
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                <CameraOff size={48} style={{ marginBottom: 12 }} />
                <span>Webcam feed is currently offline.</span>
              </div>
            )}
            <canvas ref={canvasRef} className="overlay-canvas" />
          </div>

          {/* Camera Controls Panel */}
          <div className="control-float-bar">
            <button 
              className={`btn-secondary ${showSkeleton ? 'active' : ''}`}
              onClick={() => setShowSkeleton(!showSkeleton)}
              title="Toggle Skeleton Overlay"
            >
              {showSkeleton ? <Eye size={18} /> : <EyeOff size={18} />}
              <span>Skeleton Connections</span>
            </button>

            <button 
              className={`btn-secondary ${isMirrored ? 'active' : ''}`}
              onClick={() => setIsMirrored(!isMirrored)}
              title="Toggle Mirror Mode"
            >
              <RefreshCw size={18} />
              <span>Mirror Stream</span>
            </button>

            <button 
              className="btn-secondary"
              onClick={handleToggleCamera}
              title="Toggle Camera Stream"
              disabled={!!errorMessage}
            >
              <CameraOff size={18} />
              <span>{isCameraActive ? "Pause Camera" : "Resume Camera"}</span>
            </button>
          </div>

          {/* Sensitivity Setting */}
          <div style={{ width: '100%', maxWidth: '640px', marginTop: 24, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.88rem', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sliders size={16} style={{ color: '#3b82f6' }} />
                Gesture Detection Threshold
              </span>
              <span className="text-white/60">{(confidence * 100).toFixed(0)}% Match Rate</span>
            </div>
            <input 
              type="range"
              min="0.4"
              max="0.9"
              step="0.05"
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
            />
          </div>
        </section>

        {/* Right Column: Dynamic workspace panels */}
        {activeTab === 'translator' && (
          <section className="glass-panel translator-card">
            <div>
              <div className="live-translation-header">
                <h2 className="card-title">
                  <Sparkles size={20} style={{ color: '#3b82f6' }} />
                  Real-Time Translation
                </h2>
                {practiceScore > 0 && (
                  <div className="status-pill" style={{ color: '#818cf8', borderColor: 'rgba(129, 140, 248, 0.2)', background: 'rgba(129, 140, 248, 0.1)', margin: 0 }}>
                    <Award size={14} style={{ marginRight: 4 }} />
                    Practice Score: {practiceScore} XP
                  </div>
                )}
              </div>

              {/* Glowing Translation Card */}
              <div className={`active-gesture-wrapper ${activeGesture ? 'detected' : ''}`}>
                {activeGesture ? (
                  activeGesture.type === 'combined' ? (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span className="hand-badge combined">2-Hand Sign</span>
                      
                      {/* English Label Card */}
                      <span className="translation-label">English Word Translation</span>
                      <div className="translation-value">
                        {activeGesture.gesture.english}
                        <button 
                          className="tts-speaker-btn" 
                          onClick={() => speakText(activeGesture.gesture.english, 'en')}
                          title="Speak English"
                        >
                          <Volume2 size={16} />
                        </button>
                      </div>
                      
                      {/* Divider */}
                      <div style={{ width: '80%', height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '16px 0' }} />

                      {/* Urdu Label Card */}
                      <span className="translation-label">Urdu Word Translation</span>
                      <div className="translation-value urdu">
                        {activeGesture.gesture.urdu}
                        <button 
                          className="tts-speaker-btn" 
                          onClick={() => speakText(activeGesture.gesture.urdu, 'ur')}
                          title="Speak Urdu"
                          style={{ marginRight: 12 }}
                        >
                          <Volume2 size={16} />
                        </button>
                      </div>

                      {/* Descriptions */}
                      <p style={{ marginTop: 24, fontSize: '0.85rem', color: '#94a3b8', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px' }}>
                        <span className="font-bold text-white/70">Gesture Action:</span> {activeGesture.gesture.description}
                      </p>
                    </div>
                  ) : (
                    <div className="gestures-display-dual" style={{ width: '100%' }}>
                      {activeGesture.gestures.length > 0 ? (
                        activeGesture.gestures.map(({ gesture, handedness }, index) => (
                          <div key={index} className="gesture-display-half">
                            <span className={`hand-badge ${handedness.toLowerCase()}`}>
                              {handedness} Hand
                            </span>
                            
                            <span className="translation-label">English Translation</span>
                            <div className="translation-value sub-val">
                              {gesture.english}
                              <button 
                                className="tts-speaker-btn" 
                                onClick={() => speakText(gesture.english, 'en')}
                                title="Speak English"
                              >
                                <Volume2 size={14} />
                              </button>
                            </div>
                            
                            <div className="divider-line" />
                            
                            <span className="translation-label">Urdu Translation</span>
                            <div className="translation-value urdu sub-val">
                              {gesture.urdu}
                              <button 
                                className="tts-speaker-btn" 
                                onClick={() => speakText(gesture.urdu, 'ur')}
                                title="Speak Urdu"
                                style={{ marginRight: 8 }}
                              >
                                <Volume2 size={14} />
                              </button>
                            </div>

                            <p className="gesture-desc">
                              {gesture.description}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div>
                          <div className="no-gesture-text">AI is active. Place a PSL sign gesture in front of the camera to translate.</div>
                          <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: 12 }}>Make gestures like Thumbs Up (Good), salute (Hello), or flat palm (Stop) to begin.</p>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div>
                    <div className="no-gesture-text">AI is active. Place a PSL sign gesture in front of the camera to translate.</div>
                    <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: 12 }}>Make gestures like Thumbs Up (Good), salute (Hello), or flat palm (Stop) to begin.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Real-time Stability display bar */}
            <div style={{ textAlign: 'left', marginBottom: 16 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Detection Stability</span>
              <div className="confidence-gauge-container">
                <div 
                  className="confidence-gauge-fill" 
                  style={{ width: activeGesture ? '95%' : '0%' }}
                />
              </div>
            </div>
          </section>
        )}

        {activeTab === 'learning' && (
          <section className="glass-panel learning-center-card animate-slide-up">
            <div className="live-translation-header">
              <h2 className="card-title">
                <BookOpen size={20} style={{ color: '#10b981' }} />
                Urdu Alphabet Learning Center
              </h2>
              <div className="status-pill" style={{ color: '#818cf8', borderColor: 'rgba(129, 140, 248, 0.2)', background: 'rgba(129, 140, 248, 0.1)', margin: 0 }}>
                <Award size={14} style={{ marginRight: 4 }} />
                Learning Score: {learningScore} XP
              </div>
            </div>

            <div className="learning-target-wrapper">
              <span className="translation-label">Target Urdu Alphabet</span>
              <div className="learning-letter-big font-urdu">
                {learningLetter.letter}
              </div>
              <div className="learning-letter-details">
                <span className="learning-letter-eng">{learningLetter.english}</span>
                <span className="learning-letter-name">({learningLetter.english})</span>
              </div>
              <p className="learning-hint">
                <strong>Gesture Action:</strong> {learningLetter.description}
              </p>
            </div>

            <div className={`learning-status-box ${learningStatus}`}>
              {learningStatus === 'correct' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={36} style={{ color: '#10b981' }} className="animate-bounce" />
                  <span style={{ fontWeight: 700, color: '#10b981' }}>Excellent! Sign Matched!</span>
                  <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Moving to next alphabet...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <RefreshCw size={28} className="animate-spin text-blue-400" style={{ color: '#3b82f6' }} />
                  <span style={{ fontWeight: 600, color: '#cbd5e1' }}>Perform this sign to verify</span>
                  
                  {activeGesture ? (
                    <div style={{ marginTop: 8, padding: '6px 12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8, fontSize: '0.82rem' }}>
                      We see: <strong style={{ color: '#3b82f6' }}>
                        {activeGesture.type === 'combined' 
                          ? (classifyUrduAlphabet(activeGesture.gesture.id)?.english || activeGesture.gesture.english)
                          : activeGesture.gestures.map(g => classifyUrduAlphabet(g.gesture.id)?.english || g.gesture.english).join(', ')}
                      </strong>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Place your hand in camera feed</span>
                  )}
                </div>
              )}
            </div>

            {/* Navigation / Control */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 12 }}>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setLearningIndex(prevIndex => {
                    const nextIndex = (prevIndex - 1 + URDU_ALPHABETS.length) % URDU_ALPHABETS.length;
                    setLearningLetter(URDU_ALPHABETS[nextIndex]);
                    setLearningStatus('pending');
                    return nextIndex;
                  });
                }}
              >
                Previous Letter
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setLearningIndex(prevIndex => {
                    const nextIndex = (prevIndex + 1) % URDU_ALPHABETS.length;
                    setLearningLetter(URDU_ALPHABETS[nextIndex]);
                    setLearningStatus('pending');
                    return nextIndex;
                  });
                }}
              >
                Skip / Next Letter <ArrowRight size={14} style={{ marginLeft: 4 }} />
              </button>
            </div>
          </section>
        )}

        {activeTab === 'collector' && (
          <section className="glass-panel collector-card animate-slide-up">
            <div className="live-translation-header">
              <h2 className="card-title">
                <Database size={20} style={{ color: '#10b981' }} />
                PSL Sign Collector (Dev Portal)
              </h2>
              <div className="status-pill" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.1)', margin: 0 }}>
                Samples: {collectedSamples.length}
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: 20 }}>
              Build your custom sign language dataset. Type a sign label, place your hand in front of the camera, and start recording. This records the 21-landmark skeletal coordinates frame-by-frame.
            </p>

            <div className="collector-inputs">
              <div className="settings-input-group">
                <label className="settings-label">Sign Label (e.g. "Water", "Hello")</label>
                <input 
                  type="text" 
                  className="settings-input" 
                  placeholder="Enter sign name..." 
                  value={collectorLabel}
                  onChange={(e) => setCollectorLabel(e.target.value)}
                  disabled={isCollecting}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button 
                  className="btn-primary"
                  style={{ flex: 1, background: isCollecting ? '#ef4444' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: isCollecting ? 'none' : '0 4px 15px rgba(16, 185, 129, 0.3)' }}
                  onClick={() => handleStartCapture(10)}
                  disabled={isCollecting || !collectorLabel}
                >
                  {isCollecting ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      <span>Recording... ({collectRemaining}s)</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus size={16} />
                      <span>Start 10s Record</span>
                    </>
                  )}
                </button>

                <button 
                  className="btn-secondary"
                  onClick={handleExportDataset}
                  disabled={collectedSamples.length === 0 || isCollecting}
                  title="Download dataset as JSON file"
                >
                  <Download size={16} />
                  <span>Export JSON</span>
                </button>

                <button 
                  className="btn-danger"
                  onClick={() => { setCollectedSamples([]); playBeep(300, 0.15); }}
                  disabled={collectedSamples.length === 0 || isCollecting}
                  title="Clear all samples"
                >
                  <Trash size={16} />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            {/* Gallery of captured samples */}
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Database size={16} style={{ color: '#3b82f6' }} />
                Captured Samples Gallery
              </h3>
              
              {collectedSamples.length > 0 ? (
                <div className="dataset-gallery-scroller">
                  <div className="dataset-gallery-grid">
                    {collectedSamples.map((sample) => (
                      <div key={sample.id} className="thumbnail-card">
                        <MiniCanvas landmarks={sample.landmarks} />
                        <div className="thumbnail-info">
                          <span className="thumbnail-label-text">{sample.label}</span>
                          <span className="thumbnail-time">{sample.timestamp}</span>
                        </div>
                        <button 
                          className="thumbnail-delete-btn"
                          onClick={() => {
                            setCollectedSamples(prev => prev.filter(s => s.id !== sample.id));
                            playBeep(400, 0.1, 'sawtooth');
                          }}
                          title="Delete sample"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="timeline-placeholder" style={{ padding: '30px 16px', background: 'rgba(255, 255, 255, 0.01)', borderRadius: 12, border: '1px dashed rgba(255, 255, 255, 0.05)' }}>
                  No samples recorded yet. Enter a label and start capturing.
                </div>
              )}
            </div>
          </section>
        )}

      </div>

      {/* History Timeline Logger */}
      {activeTab === 'translator' && (
        <section className="glass-panel timeline-card">
          <div className="timeline-header">
            <h2 className="card-title">
              <BookOpen size={20} style={{ color: '#6366f1' }} />
              Sign Sentence Timeline
            </h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className="btn-primary" 
                onClick={handleSynthesizeSentence} 
                disabled={historyLog.length === 0 || isTranslating}
                title="Translate words into a full coherent sentence"
              >
                {isTranslating ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Translate Sentence</span>
                  </>
                )}
              </button>
              <button 
                className="btn-danger" 
                onClick={clearTimeline} 
                disabled={historyLog.length === 0}
                title="Clear Timeline"
              >
                <Trash2 size={16} />
                Clear Log
              </button>
            </div>
          </div>

          <div className="timeline-content-area">
            {historyLog.length > 0 ? (
              <div>
                {historyLog.map((item, idx) => (
                  <span key={idx} className="timeline-word-pill">
                    {item.english.split(' / ')[0]}
                    <span style={{ fontSize: '0.72rem', opacity: 0.5, fontWeight: 400 }}>({item.urdu})</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="timeline-placeholder">
                Timeline is empty. Registered signs will form a sentence chronologically here.
              </div>
            )}
          </div>

          {/* Coherent translation result panel */}
          {compiledSentence && (
            <div className="compiled-sentence-panel">
              <div className="compiled-sentence-header">
                <span className="font-bold text-white/90" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} style={{ color: '#6366f1' }} />
                  Coherent Translated Sentence
                </span>
                <span className={`affective-badge ${compiledSentence.affective || 'neutral'}`}>
                  {compiledSentence.affective || 'neutral'}
                </span>
              </div>

              <div className="sentence-translation-block">
                <span className="translation-label" style={{ fontSize: '0.75rem' }}>English Translation</span>
                <div className="sentence-text">
                  {compiledSentence.english}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      className="tts-speaker-btn" 
                      onClick={() => speakText(compiledSentence.english, 'en')}
                      title="Speak English Sentence"
                    >
                      <Volume2 size={14} />
                    </button>
                    <button 
                      className="tts-speaker-btn" 
                      onClick={() => copyToClipboard(compiledSentence.english)}
                      title="Copy English Sentence"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '16px 0' }} />

              <div className="sentence-translation-block">
                <span className="translation-label" style={{ fontSize: '0.75rem' }}>Urdu Translation</span>
                <div className="sentence-text urdu">
                  {compiledSentence.urdu}
                  <div style={{ display: 'flex', gap: 8, direction: 'ltr', marginRight: 12 }}>
                    <button 
                      className="tts-speaker-btn" 
                      onClick={() => speakText(compiledSentence.urdu, 'ur')}
                      title="Speak Urdu Sentence"
                    >
                      <Volume2 size={14} />
                    </button>
                    <button 
                      className="tts-speaker-btn" 
                      onClick={() => copyToClipboard(compiledSentence.urdu)}
                      title="Copy Urdu Sentence"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Learning Dictionary Section */}
      {activeTab === 'translator' && (
        <section className="glass-panel learning-hub-card">
          <div className="live-translation-header" style={{ flexDirection: 'column', alignItems: 'flex-start', borderBottom: 'none', paddingBottom: 0 }}>
            <h2 className="card-title">
              <BookOpen size={20} style={{ color: '#10b981' }} />
              Pakistani Sign Language Learning Dictionary (71 Words)
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: 6 }}>
              Click <strong>"Practice"</strong> on any sign card to test yourself. Use the tabs below to filter signs by category.
            </p>
          </div>

          {/* Category Filters */}
          <div className="category-filters-container">
            {categories.map(cat => (
              <button 
                key={cat} 
                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="dictionary-grid">
            {filteredDictionary.map((sign) => {
              const isPracticingThis = practiceSign && practiceSign.id === sign.id;
              return (
                <div 
                  key={sign.id} 
                  className={`sign-card ${isPracticingThis ? 'practicing' : ''}`}
                >
                  <div>
                    <div className="sign-title-group">
                      <span className="sign-card-eng">{sign.english.split(' / ')[0]}</span>
                      <span className="sign-card-urdu">{sign.urdu}</span>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <span className="affective-badge neutral" style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4 }}>
                        {sign.category}
                      </span>
                    </div>
                    <p className="sign-card-desc">{sign.description}</p>
                  </div>
                  <button 
                    className="btn-card-action"
                    onClick={() => handleStartPractice(sign)}
                  >
                    {isPracticingThis ? "Cancel Practice" : "Practice Sign"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}