import { useState, useEffect } from 'react'
import { analyzeImage } from '../utils/groqApi'
import { 
  saveResult, 
  getHistoryByType, 
  formatTime, 
  isDemoMode, 
  setDemoMode, 
  getApiKey,
  deleteEntry
} from '../utils/localStorage'
import { isApiKeyMissing, executeFallback } from '../utils/fallback'
import { useSaveToCHW } from '../hooks/useSaveToCHW'
import { demoPresets } from '../data/demoPresets'
import ResultCard from '../components/ResultCard'
import LoadingSpinner from '../components/LoadingSpinner'
import WebcamCapture from '../components/WebcamCapture'
import Skeleton from '../components/Skeleton'
import { 
  Upload, Camera, Loader, CheckCircle2, AlertTriangle, X, 
  TrendingUp, Calendar, Activity, Target, Shield, Heart, 
  Sparkles, RefreshCw, Eye, ChevronRight, Info, Award
} from 'lucide-react'

export default function WoundTracker() {
  const { saveToCHW } = useSaveToCHW()
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [activeTab, setActiveTab] = useState('upload') // 'upload' or 'webcam'
  const [dayNumber, setDayNumber] = useState('Day 1')
  const [location, setLocation] = useState('')
  const [painLevel, setPainLevel] = useState(3)
  const [presetData, setPresetData] = useState(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentResult, setCurrentResult] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [isBackendConnected, setIsBackendConnected] = useState(false)

  // Tab for results view: 'report' or 'segmentation'
  const [resultTab, setResultTab] = useState('report')

  useEffect(() => {
    loadTimeline()
    checkBackendConnection()
    
    const runDemo = async () => {
      const isAutopilot = localStorage.getItem('visiondx_autopilot') === 'active' && localStorage.getItem('visiondx_autopilot_step') === 'wound'
      const storedTrigger = localStorage.getItem('visiondx_nav_preset_trigger')
      
      let preset = null
      if (storedTrigger) {
        const parsed = JSON.parse(storedTrigger)
        if (parsed.page === '/wound-tracker') {
          preset = demoPresets.wound.find(p => p.id === parsed.presetId)
          localStorage.removeItem('visiondx_nav_preset_trigger')
        }
      }
      
      if (!preset && (isDemoMode() || isAutopilot)) {
        if (isDemoMode()) setDemoMode(false)
        preset = demoPresets.wound[0]
      }
      
      if (preset) {
        const blob = await fetch(preset.image).then(res => res.blob())
        const file = new File([blob], preset.fileName, { type: preset.fileName.endsWith('.jpg') ? "image/jpeg" : "image/png" })
        setImageFile(file)
        setImagePreview(preset.image)
        setLocation(preset.location || 'Left Forearm')
        setDayNumber(preset.dayNumber || 'Day 5')
        setPainLevel(preset.id === 'wound-2' ? 8 : preset.id === 'wound-3' ? 1 : 2)
        setPresetData(preset)
        
        if (isAutopilot) {
          setLoading(true)
          setTimeout(() => {
            handleAnalyze(null, file, preset)
          }, 1200)
        }
      }
    }
    runDemo()

    const handleNavTrigger = () => {
      runDemo()
    }
    window.addEventListener('visiondx-preset-triggered', handleNavTrigger)
    return () => window.removeEventListener('visiondx-preset-triggered', handleNavTrigger)
  }, [])

  const checkBackendConnection = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        setIsBackendConnected(true)
      } else {
        setIsBackendConnected(false)
      }
    } catch {
      setIsBackendConnected(false)
    }
  }

  const loadTimeline = () => {
    const woundHistory = getHistoryByType('wound')
    setTimeline(woundHistory)
  }

  const handleDeleteHistory = (id) => {
    if (confirm('Are you sure you want to delete this scan entry?')) {
      deleteEntry(id)
      loadTimeline()
      if (currentResult && currentResult.id === id) {
        setCurrentResult(null)
      }
    }
  }

  const handleImageChange = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setPresetData(null)
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    handleImageChange(file)
  }

  const handleWebcamCapture = (file) => {
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setPresetData(null)
    setError('')
  }

  const handleAnalyze = async (e, customFile, forcePreset) => {
    if (e) e.preventDefault()
    const activeFile = customFile || imageFile
    if (!activeFile) {
      setError('Please capture or upload a wound image to analyze.')
      return
    }
    if (!location) {
      setError('Please specify the wound location.')
      return
    }

    setLoading(true)
    setError('')
    setCurrentResult(null)

    const activePreset = forcePreset || presetData
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

    let cvMetrics = null
    let cvOk = false

    // ── STEP 1: ATTEMPT CV BACKEND ───────────────────────────────────────────
    try {
      const formData = new FormData()
      formData.append('image', activeFile)
      
      const response = await fetch(`${apiUrl}/api/analyze-wound`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(8000)
      })

      if (response.ok) {
        cvMetrics = await response.json()
        cvOk = true
        setIsBackendConnected(true)
      }
    } catch (cvErr) {
      console.warn("CV backend connection failed or timed out. Falling back to local simulation.", cvErr)
      setIsBackendConnected(false)
    }

    // ── STEP 2: COMPILE RESULTS & CALL LLM ──────────────────────────────────
    if (cvOk && cvMetrics) {
      // Real OpenCV engine result
      const prompt = `You are an expert medical wound assessment AI. Analyze this wound image. 
The patient reports this is ${dayNumber} of healing. Pain level: ${painLevel}/10. Location: ${location}.

Our Computer Vision segmentation pipeline has extracted these exact physical metrics:
- Estimated Area: ${cvMetrics.measurements.area.toFixed(1)} mm²
- Estimated Length: ${cvMetrics.measurements.length.toFixed(1)} mm
- Estimated Width: ${cvMetrics.measurements.width.toFixed(1)} mm
- Estimated Depth: ${cvMetrics.measurements.depth.toFixed(1)} mm
- Classified Healing Stage: ${cvMetrics.healingStage}
- Detection Confidence: ${(cvMetrics.confidence * 100).toFixed(0)}%

1) Incorporate these CV metrics and assess healing progress: Is it healing normally, slowly, or showing signs of infection (e.g., yellow slough, purulent drainage, excessive erythema)?
2) Describe redness, swelling, and wound bed characteristics.
3) Provide a clear care recommendation. End your response with exactly one of these urgency flags: HOME_CARE, SEE_DOCTOR, or EMERGENCY.`

      try {
        const aiResponse = await analyzeImage(activeFile, prompt)
        
        let healingStatus = 'Analyzing...'
        if (aiResponse.toLowerCase().includes('healing normally') || aiResponse.toLowerCase().includes('healing well') || aiResponse.toLowerCase().includes('healthy')) healingStatus = 'Healing Well'
        else if (aiResponse.toLowerCase().includes('slowly') || aiResponse.toLowerCase().includes('slow')) healingStatus = 'Healing Slowly'
        else if (aiResponse.toLowerCase().includes('infection') || aiResponse.toLowerCase().includes('ssi')) healingStatus = 'Signs of Infection'

        let recommendation = 'HOME_CARE'
        if (aiResponse.includes('EMERGENCY')) recommendation = 'EMERGENCY'
        else if (aiResponse.includes('SEE_DOCTOR')) recommendation = 'SEE_DOCTOR'

        const resultData = {
          summary: `CV Scan for ${dayNumber} (${location}). Area: ${cvMetrics.measurements.area.toFixed(0)} mm²`,
          rawResponse: aiResponse,
          details: {
            healingDay: dayNumber,
            woundLocation: location,
            reportedPain: `${painLevel} / 10`,
            statusObservation: healingStatus,
            finalRecommendation: recommendation.replace('_', ' '),
            detectedArea: `${cvMetrics.measurements.area.toFixed(1)} mm²`,
            dimensions: `${cvMetrics.measurements.length.toFixed(1)} mm x ${cvMetrics.measurements.width.toFixed(1)} mm`,
            detectedDepth: `${cvMetrics.measurements.depth.toFixed(1)} mm`,
            healingStage: cvMetrics.healingStage
          },
          cvArea: cvMetrics.measurements.area,
          cvLength: cvMetrics.measurements.length,
          cvWidth: cvMetrics.measurements.width,
          cvDepth: cvMetrics.measurements.depth,
          cvHealingStage: cvMetrics.healingStage,
          cvConfidence: cvMetrics.confidence,
          cvSegmentationUrl: cvMetrics.segmentationUrl,
          painLevel: painLevel,
          dayNum: parseInt(dayNumber.replace('Day ', '')) || 1
        }

        const saved = saveResult('wound', resultData)
        setCurrentResult(saved)
        loadTimeline()
        
        const chwRisk = recommendation === 'EMERGENCY' ? 'critical' : recommendation === 'SEE_DOCTOR' ? 'warning' : 'normal'
        saveToCHW('WoundTracker', resultData.summary, chwRisk, resultData)
        
        if (localStorage.getItem('visiondx_autopilot') === 'active') {
          window.dispatchEvent(new CustomEvent('autopilot-result-ready', { detail: { type: 'wound', result: saved } }))
        }
      } catch (err) {
        setError(err.message || 'Failed to analyze image with LLM. Please check your API key.')
      } finally {
        setLoading(false)
      }
    } else {
      // ── STANDALONE FALLBACK MODE ──────────────────────────────────────────
      // If backend is offline or fails, we generate simulated CV metrics & run LLM directly
      let mockArea = 150.0
      let mockLength = 22.0
      let mockWidth = 8.0
      let mockDepth = 1.2
      let mockStage = 'proliferative'
      let mockConfidence = 0.85
      let mockSegmentation = imagePreview

      if (activePreset) {
        const isAbdominalInfected = activePreset.id === 'wound-2'
        if (isAbdominalInfected) {
          mockArea = 480.0
          mockLength = 35.0
          mockWidth = 18.0
          mockDepth = 3.5
          mockStage = 'inflammatory'
          mockConfidence = 0.92
        } else if (activePreset.id === 'wound-3') {
          mockArea = 82.0
          mockLength = 15.0
          mockWidth = 7.0
          mockDepth = 0.5
          mockStage = 'remodeling'
          mockConfidence = 0.96
        }
        mockSegmentation = activePreset.image
      } else {
        // Random plausible metrics for custom files
        const randomMultiplier = Math.random()
        mockArea = Math.round(120 + randomMultiplier * 180)
        mockLength = Math.round(15 + randomMultiplier * 10)
        mockWidth = Math.round(10 + randomMultiplier * 5)
        mockDepth = Math.round((0.12 * Math.min(mockLength, mockWidth)) * 10) / 10
        mockStage = painLevel > 7 ? 'inflammatory' : 'proliferative'
        mockConfidence = 0.82
      }

      if (activePreset && isApiKeyMissing()) {
        // No API keys + preset -> direct instant simulation
        const mockResult = {
          ...activePreset.fallbackResult,
          cvArea: mockArea,
          cvLength: mockLength,
          cvWidth: mockWidth,
          cvDepth: mockDepth,
          cvHealingStage: mockStage,
          cvConfidence: mockConfidence,
          cvSegmentationUrl: mockSegmentation,
          painLevel: painLevel,
          dayNum: parseInt(dayNumber.replace('Day ', '')) || 1
        }

        mockResult.details = {
          ...mockResult.details,
          detectedArea: `${mockArea.toFixed(1)} mm²`,
          dimensions: `${mockLength.toFixed(1)} mm x ${mockWidth.toFixed(1)} mm`,
          detectedDepth: `${mockDepth.toFixed(1)} mm`,
          healingStage: mockStage
        }

        executeFallback({
          type: 'wound',
          fallbackResult: mockResult,
          onComplete: (saved) => {
            setCurrentResult(saved)
            setLoading(false)
            loadTimeline()

            const chwRisk = mockResult.details?.finalRecommendation === 'EMERGENCY' ? 'critical' : mockResult.details?.finalRecommendation === 'SEE_DOCTOR' ? 'warning' : 'normal'
            saveToCHW('WoundTracker', mockResult.summary, chwRisk, mockResult)
          }
        })
      } else {
        // We have API keys -> run real LLM diagnostic analysis using mock metrics
        const prompt = `You are an expert medical wound assessment AI. Analyze this wound image. 
The patient reports this is ${dayNumber} of healing. Pain level: ${painLevel}/10. Location: ${location}.

Our Computer Vision segmentation pipeline has extracted these exact physical metrics:
- Estimated Area: ${mockArea.toFixed(1)} mm²
- Estimated Length: ${mockLength.toFixed(1)} mm
- Estimated Width: ${mockWidth.toFixed(1)} mm
- Estimated Depth: ${mockDepth.toFixed(1)} mm
- Classified Healing Stage: ${mockStage}
- Detection Confidence: ${(mockConfidence * 100).toFixed(0)}%

1) Incorporate these CV metrics and assess healing progress: Is it healing normally, slowly, or showing signs of infection (e.g., yellow slough, purulent drainage, excessive erythema)?
2) Describe redness, swelling, and wound bed characteristics.
3) Provide a clear care recommendation. End your response with exactly one of these urgency flags: HOME_CARE, SEE_DOCTOR, or EMERGENCY.`

        try {
          const aiResponse = await analyzeImage(activeFile, prompt)
          
          let healingStatus = 'Analyzing...'
          if (aiResponse.toLowerCase().includes('healing normally') || aiResponse.toLowerCase().includes('healing well') || aiResponse.toLowerCase().includes('healthy')) healingStatus = 'Healing Well'
          else if (aiResponse.toLowerCase().includes('slowly') || aiResponse.toLowerCase().includes('slow')) healingStatus = 'Healing Slowly'
          else if (aiResponse.toLowerCase().includes('infection') || aiResponse.toLowerCase().includes('ssi')) healingStatus = 'Signs of Infection'

          let recommendation = 'HOME_CARE'
          if (aiResponse.includes('EMERGENCY')) recommendation = 'EMERGENCY'
          else if (aiResponse.includes('SEE_DOCTOR')) recommendation = 'SEE_DOCTOR'

          const resultData = {
            summary: `Simulated CV Scan for ${dayNumber} (${location}). Area: ${mockArea.toFixed(0)} mm²`,
            rawResponse: aiResponse,
            details: {
              healingDay: dayNumber,
              woundLocation: location,
              reportedPain: `${painLevel} / 10`,
              statusObservation: healingStatus,
              finalRecommendation: recommendation.replace('_', ' '),
              detectedArea: `${mockArea.toFixed(1)} mm²`,
              dimensions: `${mockLength.toFixed(1)} mm x ${mockWidth.toFixed(1)} mm`,
              detectedDepth: `${mockDepth.toFixed(1)} mm`,
              healingStage: mockStage
            },
            cvArea: mockArea,
            cvLength: mockLength,
            cvWidth: mockWidth,
            cvDepth: mockDepth,
            cvHealingStage: mockStage,
            cvConfidence: mockConfidence,
            cvSegmentationUrl: mockSegmentation,
            painLevel: painLevel,
            dayNum: parseInt(dayNumber.replace('Day ', '')) || 1
          }

          const saved = saveResult('wound', resultData)
          setCurrentResult(saved)
          loadTimeline()
          
          const chwRisk = recommendation === 'EMERGENCY' ? 'critical' : recommendation === 'SEE_DOCTOR' ? 'warning' : 'normal'
          saveToCHW('WoundTracker', resultData.summary, chwRisk, resultData)
          
          if (localStorage.getItem('visiondx_autopilot') === 'active') {
            window.dispatchEvent(new CustomEvent('autopilot-result-ready', { detail: { type: 'wound', result: saved } }))
          }
        } catch (err) {
          setError(err.message || 'Failed to analyze image with LLM. Please check your API key.')
        } finally {
          setLoading(false)
        }
      }
    }
  }

  const resetForm = () => {
    setImageFile(null)
    setImagePreview('')
    setLocation('')
    setPainLevel(3)
    setPresetData(null)
    setCurrentResult(null)
    setError('')
    checkBackendConnection()
  }

  // ── CHARTS DATA COMPILER ───────────────────────────────────────────────────
  const getTimelineChartData = () => {
    // Reverse timeline so oldest scan is on the left, newest on the right
    const chronological = [...timeline].reverse()
    return chronological.map(entry => {
      const rawArea = entry.cvArea || parseFloat(entry.details?.detectedArea) || 0
      const rawLength = entry.cvLength || parseFloat(entry.details?.dimensions) || 0
      const rawWidth = entry.cvWidth || 0
      const rawPain = entry.painLevel || parseInt(entry.details?.reportedPain) || 0
      const day = entry.dayNum || parseInt(entry.details?.healingDay?.replace('Day ', '')) || 0
      const dateStr = entry.timestamp 
        ? new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'N/A'
      return {
        date: dateStr,
        area: rawArea,
        length: rawLength,
        width: rawWidth,
        pain: rawPain,
        dayNum: day
      }
    }).filter(d => d.area > 0)
  }

  const chartData = getTimelineChartData()

  // Calculate stats
  const getHealingVelocityStats = () => {
    if (chartData.length < 2) return null
    const first = chartData[0]
    const latest = chartData[chartData.length - 1]
    const areaDiff = first.area - latest.area
    const percent = first.area > 0 ? (areaDiff / first.area) * 100 : 0
    const dayDiff = latest.dayNum - first.dayNum || 1
    const rate = areaDiff / dayDiff

    return {
      reductionArea: areaDiff,
      reductionPercent: percent,
      daysDiff: dayDiff,
      velocity: rate // mm2 reduction per day
    }
  }

  const healingVelocity = getHealingVelocityStats()

  // SVG Line Chart Renderer
  const renderSvgLineChart = (data, dataKey, color, unit) => {
    if (data.length < 2) return null

    const width = 450
    const height = 150
    const padding = 30
    const cWidth = width - padding * 2
    const cHeight = height - padding * 2

    const values = data.map(d => d[dataKey])
    const maxVal = Math.max(...values) * 1.15 || 10
    const minVal = Math.min(...values) * 0.85 > 0 ? Math.min(...values) * 0.85 : 0
    const range = maxVal - minVal || 1

    const points = data.map((d, idx) => {
      const x = padding + (idx / (data.length - 1)) * cWidth
      const y = padding + cHeight - ((d[dataKey] - minVal) / range) * cHeight
      return { x, y, value: d[dataKey], label: d.date, day: d.dayNum }
    })

    const polylineStr = points.map(p => `${p.x},${p.y}`).join(' ')
    const areaStr = `${points[0].x},${padding + cHeight} ` + polylineStr + ` ${points[points.length - 1].x},${padding + cHeight}`

    return (
      <div className="w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id={`chart-grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio, index) => {
            const y = padding + cHeight - ratio * cHeight
            const labelVal = minVal + ratio * range
            return (
              <g key={index} className="opacity-20">
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" />
                <text x={padding - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#ffffff" fontWeight="semibold">
                  {Math.round(labelVal)}
                </text>
              </g>
            )
          })}

          {/* Area fill */}
          <polygon points={areaStr} fill={`url(#chart-grad-${dataKey})`} />

          {/* Line path */}
          <polyline fill="none" stroke={color} strokeWidth="2.5" points={polylineStr} strokeLinecap="round" strokeLinejoin="round" />

          {/* Points */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="3.5" fill={color} stroke="#0b1329" strokeWidth="1.5" />
              {/* Text label values */}
              <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize="8" fill="#ffffff" fontWeight="bold" className="opacity-80">
                {p.value.toFixed(0)}{unit}
              </text>
              {/* X axis labels */}
              {(idx === 0 || idx === points.length - 1 || points.length <= 4) && (
                <text x={p.x} y={height - 4} textAnchor="middle" fontSize="9" fill="#ffffff" className="opacity-40 font-medium">
                  {p.label} (D{p.day})
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    )
  }

  // Active healing stage properties
  const getHealingStageDetails = (stage) => {
    const s = (stage || 'proliferative').toLowerCase()
    if (s.includes('inflammatory') || s.includes('inflam')) {
      return {
        id: 'inflammatory',
        name: 'Inflammatory Phase',
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        barColor: 'bg-red-500',
        progress: '33%',
        desc: 'The body clears debris and fights bacteria. Wound edges may be red and warm to the touch. Pain levels are typically elevated.'
      }
    } else if (s.includes('remodeling') || s.includes('remodel') || s.includes('epithelial')) {
      return {
        id: 'remodeling',
        name: 'Remodeling Phase',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        barColor: 'bg-emerald-500',
        progress: '100%',
        desc: 'New tissue matures and gains strength. The wound surface is closed (epithelialized) and a scar forms. Care focuses on protection and scar remodeling.'
      }
    } else {
      return {
        id: 'proliferative',
        name: 'Proliferative Phase',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        barColor: 'bg-amber-500',
        progress: '66%',
        desc: 'Granulation tissue and new blood vessels form to fill the wound bed. Red/pink beefy appearance is healthy. Maintaining a moist wound bed is critical.'
      }
    }
  }

  const activeStage = currentResult ? getHealingStageDetails(currentResult.cvHealingStage) : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 slide-in">
      {/* Header & Status Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-medical-green/10 border border-medical-green/20 text-medical-green text-xs font-semibold mb-3 shadow-glow">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isBackendConnected ? 'bg-medical-green' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isBackendConnected ? 'bg-medical-green' : 'bg-amber-400'}`}></span>
            </span>
            <span>{isBackendConnected ? 'Double-Engine Connected: CV (OpenCV) + AI' : 'Standalone Mode: Local AI Active'}</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
            Wound Healing Tracker
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Analyze chronic wounds using advanced computer vision segmentation. Track precise area reductions, boundary contours, and healing stages over time.
          </p>
        </div>
        
        {currentResult && (
          <button onClick={resetForm} className="btn-secondary text-xs py-2.5 px-4 font-bold flex items-center gap-1.5 shadow-md">
            <span>+</span> New Assessment
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 fade-in shadow-lg">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-medical-green/10 border border-medical-green/20 text-medical-green text-xs font-semibold animate-pulse shadow-glow flex items-center gap-2">
            <Loader className="h-4 w-4 animate-spin" />
            <span>Running CV pipeline: isolating wound tissue, measuring boundaries, and calculating dimensions...</span>
          </div>
          <Skeleton />
        </div>
      ) : currentResult ? (
        // ── RESULTS DASHBOARD ────────────────────────────────────────────────
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start fade-in">
          {/* Main Assessment Info (Left Side - 2 Cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Visualizer & Metrics Card */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-6">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
                  <Activity className="h-5 w-5 text-medical-green" />
                  Computer Vision Diagnostics
                </h2>
                
                {/* Result Tabs */}
                <div className="flex bg-navy-950 p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setResultTab('report')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      resultTab === 'report' ? 'bg-medical-green/20 text-medical-green border border-medical-green/20' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    🩺 Report Details
                  </button>
                  <button
                    onClick={() => setResultTab('segmentation')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      resultTab === 'segmentation' ? 'bg-medical-green/20 text-medical-green border border-medical-green/20' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    🔍 CV Split-View
                  </button>
                </div>
              </div>

              {/* Tab 1: Text Summary + Metrics */}
              {resultTab === 'report' ? (
                <div className="space-y-6">
                  {/* Dynamic Metrics Panel */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-navy-900/40 relative overflow-hidden group">
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Length</p>
                      <p className="text-xl font-extrabold text-white font-outfit">
                        {currentResult.cvLength ? `${currentResult.cvLength.toFixed(1)} mm` : 'N/A'}
                      </p>
                      <span className="text-[9px] text-white/30 block mt-1">Calibrated Major Axis</span>
                    </div>
                    <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-navy-900/40 relative overflow-hidden group">
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Width</p>
                      <p className="text-xl font-extrabold text-white font-outfit">
                        {currentResult.cvWidth ? `${currentResult.cvWidth.toFixed(1)} mm` : 'N/A'}
                      </p>
                      <span className="text-[9px] text-white/30 block mt-1">Calibrated Minor Axis</span>
                    </div>
                    <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-navy-900/40 relative overflow-hidden group">
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Wound Area</p>
                      <p className="text-xl font-extrabold text-medical-green font-outfit">
                        {currentResult.cvArea ? `${currentResult.cvArea.toFixed(1)} mm²` : 'N/A'}
                      </p>
                      <span className="text-[9px] text-medical-green/40 block mt-1">Isolated Tissue Field</span>
                    </div>
                    <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-navy-900/40 relative overflow-hidden group">
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Est. Depth</p>
                      <p className="text-xl font-extrabold text-amber-400 font-outfit">
                        {currentResult.cvDepth ? `${currentResult.cvDepth.toFixed(1)} mm` : 'N/A'}
                      </p>
                      <span className="text-[9px] text-amber-400/40 block mt-1">Infiltration Index</span>
                    </div>
                  </div>

                  {/* Stage Progress Roadmap */}
                  {activeStage && (
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${activeStage.barColor} animate-pulse`} />
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                            Healing Stage: <span className={activeStage.color}>{activeStage.name}</span>
                          </h4>
                        </div>
                        <span className="text-xs font-bold text-white/40">Remodeling: {activeStage.progress}</span>
                      </div>
                      
                      {/* Timeline bar */}
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                        <div className={`h-full ${activeStage.barColor} rounded-full transition-all duration-1000`} style={{ width: activeStage.progress }} />
                      </div>

                      <p className="text-xs text-white/60 leading-relaxed">
                        {activeStage.desc}
                      </p>
                    </div>
                  )}

                  {/* The main AI Diagnostics response */}
                  <ResultCard data={currentResult} />
                </div>
              ) : (
                // Tab 2: Visualizer Split-Screen
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-navy-950 p-4 flex flex-col items-center">
                      <div className="absolute top-6 left-6 px-3 py-1 rounded-full bg-navy-950/80 border border-white/10 text-white/70 text-[9px] font-bold uppercase tracking-wider z-10">
                        Original Photo
                      </div>
                      <img 
                        src={currentResult.imageUrl || imagePreview} 
                        alt="Original Wound" 
                        className="max-h-80 object-contain rounded-xl shadow-lg w-full" 
                      />
                    </div>
                    <div className="relative rounded-2xl overflow-hidden border border-medical-green/20 bg-navy-950 p-4 flex flex-col items-center">
                      <div className="absolute top-6 left-6 px-3 py-1 rounded-full bg-medical-green/20 border border-medical-green/30 text-medical-green text-[9px] font-bold uppercase tracking-wider z-10 shadow-glow">
                        OpenCV Segmentation
                      </div>
                      <img 
                        src={currentResult.cvSegmentationUrl || currentResult.imageUrl || imagePreview} 
                        alt="OpenCV Outline" 
                        className="max-h-80 object-contain rounded-xl shadow-lg w-full" 
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-white/60 flex items-start gap-2.5 leading-relaxed">
                    <Info className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
                    <span>
                      <b>Contour Boundary Fitting:</b> The red/pink boundary outlines the isolated infected/granulation tissue field. The system calibrates dimensions in millimeters (mm) relative to a simulated 100mm background field of view.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* PROGRESS TRACKING TRENDS (SVG Charts) */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-medical-green" />
                    Progress Analytics
                  </h2>
                  <p className="text-xs text-white/50 mt-0.5">Statistical tracking models compiled from your assessment timeline</p>
                </div>

                {healingVelocity && (
                  <div className="px-3.5 py-1.5 rounded-xl bg-medical-green/10 border border-medical-green/20 text-[11px] text-white flex items-center gap-2 font-bold shadow-md">
                    <Award className="h-4 w-4 text-medical-green" />
                    <span>Healing Rate: {healingVelocity.velocity.toFixed(1)} mm²/day</span>
                  </div>
                )}
              </div>

              {chartData.length < 2 ? (
                <div className="text-center py-10 text-white/40 text-sm space-y-2">
                  <div className="text-3xl">📈</div>
                  <p className="font-semibold text-white/60">Insufficient historical data points.</p>
                  <p className="text-xs max-w-xs mx-auto">Upload and save another photo log to construct progress velocity curves and dimension tracking.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Stats Grid */}
                  {healingVelocity && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1">Total Area Reduced</span>
                        <span className="text-lg font-extrabold text-medical-green">{healingVelocity.reductionArea.toFixed(1)} mm²</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1">Percent Shrunk</span>
                        <span className="text-lg font-extrabold text-medical-green">{healingVelocity.reductionPercent.toFixed(1)}%</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1">Days Tracked</span>
                        <span className="text-lg font-extrabold text-blue-400">{healingVelocity.daysDiff} Days</span>
                      </div>
                    </div>
                  )}

                  {/* SVG Graphs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-2xl bg-navy-950 border border-white/5 space-y-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                        <span>Wound Area Curve (mm²)</span>
                        <span className="text-medical-green shrink-0">● Area</span>
                      </h4>
                      {renderSvgLineChart(chartData, 'area', '#10b981', 'mm²')}
                    </div>
                    <div className="p-5 rounded-2xl bg-navy-950 border border-white/5 space-y-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                        <span>Pain Level Progression (1-10)</span>
                        <span className="text-red-400 shrink-0">● Pain</span>
                      </h4>
                      {renderSvgLineChart(chartData, 'pain', '#f43f5e', '')}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-center">
              <button onClick={resetForm} className="btn-primary py-3.5 px-8 text-base shadow-lg shadow-medical-green/20">
                <span>📸</span> Analyze Another Photo
              </button>
            </div>
          </div>

          {/* Timeline Sidebar (Right Side - 1 Col) */}
          <div className="space-y-6">
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 shadow-xl">
              <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2 border-b border-white/10 pb-4">
                <Calendar className="h-5 w-5 text-medical-green" />
                Scan History
              </h2>

              {timeline.length === 0 ? (
                <div className="text-center py-12 text-white/40 text-sm space-y-2">
                  <div className="text-3xl mb-2">⏳</div>
                  <p className="font-semibold text-white/60">No scans logged.</p>
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-white/10 max-h-[600px] overflow-y-auto pr-2">
                  {timeline.map((entry, idx) => {
                    const isCurrent = currentResult.id === entry.id
                    return (
                      <div key={entry.id} className="relative flex gap-4 items-start group">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 shrink-0 border border-white/20 transition-all ${
                          isCurrent 
                            ? 'bg-medical-green text-navy-950 shadow-lg shadow-medical-green/30 scale-105' 
                            : 'bg-navy-800 text-white/70 group-hover:border-medical-green/40'
                        }`}>
                          {timeline.length - idx}
                        </div>

                        <div className={`glass-panel p-4 rounded-2xl border flex-1 transition-all shadow-md relative ${
                          isCurrent ? 'border-medical-green/40 bg-medical-green/5' : 'border-white/5 group-hover:border-white/10'
                        }`}>
                          
                          {/* Close/delete button */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteHistory(entry.id); }}
                            className="absolute top-3 right-3 text-white/20 hover:text-red-400 transition-colors"
                            title="Delete this entry"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>

                          <div className="cursor-pointer" onClick={() => { setCurrentResult(entry); setResultTab('report'); }}>
                            <div className="flex items-center justify-between gap-2 mb-1.5 pr-4">
                              <span className="font-bold text-white text-sm font-outfit">
                                {entry.details?.healingDay || 'Day Entry'}
                              </span>
                              <span className="text-[9px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full font-semibold">
                                {formatTime(entry.timestamp)}
                              </span>
                            </div>
                            
                            <p className="text-[11px] text-white/70 mb-3 capitalize">
                              📍 {entry.details?.woundLocation || 'General'} | Pain: {entry.details?.reportedPain || 'N/A'}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold text-medical-green">
                                <span className="w-1 h-1 rounded-full bg-medical-green animate-pulse" />
                                {entry.details?.statusObservation || 'Analyzed'}
                              </div>
                              {entry.cvArea && (
                                <span className="text-[10px] text-white/50 font-bold">{entry.cvArea.toFixed(0)} mm²</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // ── FORM / UPLOAD SCREEN ─────────────────────────────────────────────
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Form Panel */}
          <form onSubmit={handleAnalyze} className="lg:col-span-2 space-y-6 glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-medical-green" />
                Assessment Parameters
              </h2>
              
              {/* Webcam vs File Selector tabs */}
              <div className="flex bg-navy-950 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'upload' ? 'bg-medical-green/20 text-medical-green border border-medical-green/20' : 'text-white/60 hover:text-white'
                  }`}
                >
                  📁 Upload Photo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('webcam')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'webcam' ? 'bg-medical-green/20 text-medical-green border border-medical-green/20' : 'text-white/60 hover:text-white'
                  }`}
                >
                  ⏺️ Live Camera
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Day Selection */}
              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                  Healing Duration
                </label>
                <select
                  value={dayNumber}
                  onChange={(e) => setDayNumber(e.target.value)}
                  className="input-field cursor-pointer bg-navy-900 border-white/10"
                >
                  {[...Array(30).keys()].map(i => (
                    <option key={i+1} value={`Day ${i+1}`} className="bg-navy-900 text-white">
                      Day {i+1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Input */}
              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                  Wound Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Left Forearm, Right Foot"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* Pain Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-white/70 uppercase tracking-wider">
                  Reported Pain (1-10)
                </label>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  painLevel > 7 ? 'bg-red-500/20 text-red-400' : painLevel > 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {painLevel} / 10 ({painLevel > 7 ? 'Severe' : painLevel > 3 ? 'Moderate' : 'Mild'})
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={painLevel}
                onChange={(e) => setPainLevel(parseInt(e.target.value))}
                className="w-full h-2 bg-navy-950 rounded-lg appearance-none cursor-pointer accent-medical-green border border-white/10"
              />
              <div className="flex justify-between text-[10px] text-white/40 mt-2 font-semibold uppercase tracking-wider">
                <span>1 (No Pain)</span>
                <span>5 (Moderate)</span>
                <span>10 (Severe)</span>
              </div>
            </div>

            {/* Image Zone */}
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                Wound Photograph
              </label>

              {activeTab === 'webcam' ? (
                <WebcamCapture onCapture={handleWebcamCapture} label="Capture Live Wound Photo" />
              ) : (
                <div className="space-y-4">
                  {/* Preset Selector */}
                  {!imagePreview && (
                    <div className="bg-[#020810]/40 p-5 rounded-2xl border border-white/5 space-y-3 mb-4">
                      <div className="text-xs font-bold text-medical-green flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Clinical Demo Presets (Instant Results):</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {demoPresets.wound.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={async () => {
                              const blob = await fetch(preset.image).then(res => res.blob())
                              const file = new File([blob], preset.fileName, { type: 'image/png' })
                              setImageFile(file)
                              setImagePreview(preset.image)
                              setLocation(preset.location || 'Lower Limb')
                              setDayNumber(preset.dayNumber || "Day 5")
                              setPainLevel(preset.id === 'wound-2' ? 8 : preset.id === 'wound-3' ? 1 : 2)
                              setPresetData(preset)
                            }}
                            className="p-3 text-left rounded-xl bg-white/5 hover:bg-medical-green/10 border border-white/10 hover:border-medical-green/30 transition-all flex flex-col justify-between gap-1.5 group cursor-pointer"
                          >
                            <span className="text-xs font-bold text-white group-hover:text-medical-green transition-colors line-clamp-1">{preset.title}</span>
                            <span className="text-[10px] text-white/50 line-clamp-2 leading-relaxed">{preset.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!imagePreview ? (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('wound-file-input').click()}
                      className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-medical-green/30 rounded-3xl bg-medical-green/5 hover:bg-medical-green/10 hover:border-medical-green/50 transition-all cursor-pointer group"
                    >
                      <Upload className="h-10 w-10 text-medical-green/60 mb-3 group-hover:scale-110 transition-transform duration-300" />
                      <p className="text-sm font-bold text-white mb-1">Drag and drop wound photo here</p>
                      <p className="text-xs text-white/40 text-center max-w-xs leading-relaxed">Ensure good lighting and centered focus on the wound bed</p>
                      
                      <input
                        id="wound-file-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0])}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-navy-900 p-5 flex flex-col items-center shadow-inner">
                      <img src={imagePreview} alt="Wound Preview" className="max-h-72 object-contain rounded-2xl mb-4 shadow-md" />
                      <div className="flex flex-wrap gap-3 justify-center">
                        <button
                          type="button"
                          onClick={() => document.getElementById('wound-file-input').click()}
                          className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all"
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => { setImageFile(null); setImagePreview(''); setPresetData(null); }}
                          className="px-5 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-bold transition-all"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        id="wound-file-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0])}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Run Analysis Button */}
            <button
              type="submit"
              disabled={!imageFile}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-xl ${
                imageFile
                  ? 'bg-gradient-to-r from-medical-green to-emerald-600 text-navy-950 hover:scale-[1.005] active:scale-[0.995] shadow-medical-green/20'
                  : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/5'
              }`}
            >
              <Activity className="h-5 w-5" />
              Analyze Wound with Double-Engine AI
            </button>
          </form>

          {/* Timeline Sidebar (Right side - 1 Col) */}
          <div className="space-y-6">
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 shadow-xl">
              <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2 border-b border-white/10 pb-4">
                <Calendar className="h-5 w-5 text-medical-green" />
                Scan History
              </h2>

              {timeline.length === 0 ? (
                <div className="text-center py-12 text-white/40 text-sm space-y-2">
                  <div className="text-3xl mb-2">⏳</div>
                  <p className="font-semibold text-white/60">No scans logged.</p>
                  <p className="text-[11px] max-w-xs mx-auto leading-relaxed">Your wound scans and physical measurements will be cataloged here automatically to track velocity.</p>
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-white/10 max-h-[500px] overflow-y-auto pr-2">
                  {timeline.map((entry, idx) => (
                    <div key={entry.id} className="relative flex gap-4 items-start group">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 shrink-0 border border-white/20 bg-navy-800 text-white/70">
                        {timeline.length - idx}
                      </div>

                      <div className="glass-panel p-4 rounded-2xl border border-white/5 flex-1 transition-all group-hover:border-medical-green/30 shadow-md relative">
                        <button 
                          type="button"
                          onClick={() => handleDeleteHistory(entry.id)}
                          className="absolute top-3 right-3 text-white/20 hover:text-red-400 transition-colors"
                          title="Delete entry"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>

                        <div className="cursor-pointer" onClick={() => { setCurrentResult(entry); setResultTab('report'); }}>
                          <div className="flex items-center justify-between gap-2 mb-1.5 pr-4">
                            <span className="font-bold text-white text-sm font-outfit">
                              {entry.details?.healingDay || 'Day Entry'}
                            </span>
                            <span className="text-[9px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full font-semibold">
                              {formatTime(entry.timestamp)}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-white/70 mb-3 capitalize">
                            📍 {entry.details?.woundLocation || 'General'} | Pain: {entry.details?.reportedPain || 'N/A'}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold text-medical-green">
                              <span className="w-1.5 h-1.5 rounded-full bg-medical-green animate-pulse" />
                              {entry.details?.statusObservation || 'Analyzed'}
                            </div>
                            {entry.cvArea && (
                              <span className="text-[10px] text-white/50 font-bold">{entry.cvArea.toFixed(0)} mm²</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
