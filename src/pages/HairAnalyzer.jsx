import { useState, useEffect } from 'react'
import { analyzeImage } from '../utils/groqApi'
import { saveResult, isDemoMode, setDemoMode } from '../utils/localStorage'
import { hasAnyApiKey, handleSimulationFallback } from '../utils/analyzerUtils'
import { useSaveToCHW } from '../hooks/useSaveToCHW'
import { demoPresets } from '../data/demoPresets'
import ResultCard from '../components/ResultCard'
import LoadingSpinner from '../components/LoadingSpinner'
import WebcamCapture from '../components/WebcamCapture'
import Skeleton from '../components/Skeleton'

export default function HairAnalyzer() {
  const { saveToCHW } = useSaveToCHW()
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [activeTab, setActiveTab] = useState('upload') // 'upload' or 'webcam'
  const [symptoms, setSymptoms] = useState('')
  const [presetData, setPresetData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentResult, setCurrentResult] = useState(null)

  useEffect(() => {
    const runDemo = async () => {
      const isAutopilot = localStorage.getItem('visiondx_autopilot') === 'active' && localStorage.getItem('visiondx_autopilot_step') === 'hair'
      const storedTrigger = localStorage.getItem('visiondx_nav_preset_trigger')
      
      let preset = null
      if (storedTrigger) {
        const parsed = JSON.parse(storedTrigger)
        if (parsed.page === '/hair-analyzer') {
          preset = demoPresets.hair.find(p => p.id === parsed.presetId)
          localStorage.removeItem('visiondx_nav_preset_trigger')
        }
      }
      
      if (!preset && (isDemoMode() || isAutopilot)) {
        if (isDemoMode()) setDemoMode(false)
        preset = demoPresets.hair[0]
      }
      
      if (preset) {
        const blob = await fetch(preset.image).then(res => res.blob())
        const file = new File([blob], preset.fileName, { type: preset.fileName.endsWith('.jpg') ? "image/jpeg" : "image/png" })
        setImageFile(file)
        setImagePreview(preset.image)
        setSymptoms(preset.symptoms || '')
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

  const handleImageChange = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
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
    setError('')
  }

  const handleAnalyze = async (e, customFile, forcePreset) => {
    if (e) e.preventDefault()
    const activeFile = customFile || imageFile
    if (!activeFile) {
      setError('Please capture or upload a hair or scalp photo to analyze.')
      return
    }

    setLoading(true)
    setError('')
    setCurrentResult(null)

    // Preset simulated fallback mode if API keys are missing
    const activePreset = forcePreset || presetData
    if (activePreset && activeFile.name === activePreset.fileName && !hasAnyApiKey()) {
      handleSimulationFallback({
        type: 'hair',
        fallbackResult: activePreset.fallbackResult,
        setLoading,
        setCurrentResult
      })
      return
    }

    const prompt = `You are an expert trichologist (hair and scalp specialist) AI assistant. Analyze this close-up image of the patient's hair and scalp. Patient reported symptoms: "${symptoms || 'None reported'}".
1) Identify visible hair or scalp conditions such as Alopecia Areata, Androgenetic Alopecia (pattern baldness), Tinea Capitis (scalp fungal infection), Seborrheic Dermatitis (Dandruff), premature graying (white hairs), changes in hair color/texture, hair damage, or follicle inflammation.
2) Describe the appearance of the hair shaft, density, color, and the skin of the scalp.
3) Provide trichological recommendations, early-use care, safe hair-care routines, and determine urgency. End your response with exactly one of these urgency flags: NORMAL, SEE_DOCTOR, or EMERGENCY.`

    try {
      const aiResponse = await analyzeImage(activeFile, prompt)
      
      let condition = 'Hair & Scalp Observation'
      const lowerRes = aiResponse.toLowerCase()
      if (lowerRes.includes('alopecia')) {
        condition = 'Alopecia (Hair Loss)'
      } else if (lowerRes.includes('graying') || lowerRes.includes('white hair')) {
        condition = 'Premature Graying (Canities)'
      } else if (lowerRes.includes('dandruff') || lowerRes.includes('dermatitis')) {
        condition = 'Seborrheic Dermatitis / Dandruff'
      } else if (lowerRes.includes('thinning')) {
        condition = 'Hair Thinning'
      } else if (lowerRes.includes('tinea')) {
        condition = 'Scalp Infection'
      }

      let urgency = 'NORMAL'
      if (aiResponse.includes('EMERGENCY')) urgency = 'EMERGENCY'
      else if (aiResponse.includes('SEE_DOCTOR')) urgency = 'SEE_DOCTOR'

      // Pre-fill profile if available
      const profile = JSON.parse(localStorage.getItem('visiondx_user') || '{}')

      const resultDetails = {
        patientName: profile.name || 'Patient',
        detectedCondition: condition,
        urgencyLevel: urgency.replace('_', ' '),
        symptomsReported: symptoms || 'None reported',
        scalpAnalysis: 'AI assessment of scalp skin and hair shaft density.',
        suggestedCare: 'Refer to early care suggestions below.'
      }

      const resultData = {
        summary: `Hair/Scalp Analysis: ${condition} identified. Urgency: ${urgency.replace('_', ' ')}.`,
        rawResponse: aiResponse,
        details: resultDetails
      }

      const saved = saveResult('hair', resultData)
      setCurrentResult(saved)

      const chwRisk = urgency === 'EMERGENCY' ? 'critical' : urgency === 'SEE_DOCTOR' ? 'warning' : 'normal'
      saveToCHW('HairAnalyzer', resultData.summary, chwRisk, resultData)

      if (localStorage.getItem('visiondx_autopilot') === 'active') {
        window.dispatchEvent(new CustomEvent('autopilot-result-ready', { detail: { type: 'hair', result: saved } }))
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze hair image. Please check your API key or try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setImageFile(null)
    setImagePreview('')
    setSymptoms('')
    setPresetData(null)
    setCurrentResult(null)
    setError('')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 slide-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2 shadow-glow">
            <span>💇</span> AI Trichology (Hair & Scalp) Analyzer
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
            Hair & Scalp AI Analyzer
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Analyze white hairs, premature graying, hair thinning, bald patches, and scalp irritation. Upload a photo or capture a close-up image for immediate analysis.
          </p>
        </div>
        {currentResult && (
          <button onClick={resetForm} className="btn-secondary text-xs py-2.5 px-4">
            + New Hair Scan
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
            <span>🔬</span> Scanning scalp surface, hair follicle density, and evaluating color shifts...
          </div>
          <Skeleton />
        </div>
      ) : currentResult ? (
        <div className="space-y-8 fade-in">
          <ResultCard data={currentResult} />
          <div className="flex justify-center">
            <button onClick={resetForm} className="btn-primary py-3.5 px-8 text-base shadow-lg shadow-emerald-500/20">
              <span>📸</span> Scan Another Photo
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Input Form */}
          <div className="lg:col-span-2 space-y-6 glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
                <span>📸</span> Capture or Upload Hair Photo
              </h2>
              {/* Tabs */}
              <div className="flex bg-navy-900/80 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'upload' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md' : 'text-white/60 hover:text-white'
                  }`}
                >
                  📁 Upload
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('webcam')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'webcam' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md' : 'text-white/60 hover:text-white'
                  }`}
                >
                  ⏺️ Live Camera
                </button>
              </div>
            </div>

            {/* Interactive Demo Presets */}
            {activeTab === 'upload' && !imagePreview && (
              <div className="bg-[#020810]/40 p-5 rounded-2xl border border-white/5 space-y-3">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>✨</span> Clinical Demo Presets (No Photo Required):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {demoPresets.hair.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={async () => {
                        const blob = await fetch(preset.image).then(res => res.blob())
                        const file = new File([blob], preset.fileName, { type: 'image/png' })
                        setImageFile(file)
                        setImagePreview(preset.image)
                        setSymptoms(preset.symptoms)
                        setPresetData(preset)
                      }}
                      className="p-3.5 text-left rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between gap-1.5 group cursor-pointer"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">{preset.title}</div>
                      <div className="text-[10px] text-white/50 line-clamp-2 leading-relaxed">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'webcam' ? (
              <WebcamCapture onCapture={handleWebcamCapture} label="Open Live Hair Camera" />
            ) : (
              <div>
                {!imagePreview ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-emerald-500/30 rounded-3xl bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all cursor-pointer group"
                  >
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">💇</div>
                    <p className="text-base font-bold text-white mb-1">Drag and drop hair photo here</p>
                    <p className="text-xs text-white/40 mb-6 max-w-xs text-center">Ensure good lighting and a clear view of the hair shaft or scalp area</p>
                    <label className="btn-secondary cursor-pointer text-xs py-2.5 px-6 shadow-md">
                      Browse Files
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="relative rounded-3xl overflow-hidden border border-white/20 bg-navy-900 flex flex-col items-center p-6 shadow-inner">
                    <img src={imagePreview} alt="Hair Preview" className="max-h-72 object-contain rounded-2xl mb-6 shadow-lg" />
                    <div className="flex flex-wrap gap-4 w-full justify-center">
                      <label className="btn-secondary cursor-pointer text-xs py-2.5 px-6 shadow-md">
                        Change Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(''); }}
                        className="px-6 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-bold transition-all shadow-md"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Optional Symptoms Input */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">
                Symptom Notes & Hair Care History
              </label>
              <textarea
                rows={3}
                placeholder="e.g. White hairs spreading in front, scalp itchiness, heavy hair fall since 3 months..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="input-field text-sm"
              />
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!imageFile}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-xl ${
                imageFile
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:scale-[1.01] shadow-emerald-500/20'
                  : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/5'
              }`}
            >
              <span>🔬</span> Analyze Hair with Trichology AI
            </button>
          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 shadow-xl">
              <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2 border-b border-white/10 pb-4">
                <span>📚</span> Hair AI Capabilities
              </h2>
              
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                  <span className="text-xs font-bold text-emerald-400">Premature Graying (Canities)</span>
                  <span className="text-[11px] text-white/60">Identify premature white hairs and melanin loss root causes.</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                  <span className="text-xs font-bold text-emerald-400">Alopecia & Hair Fall</span>
                  <span className="text-[11px] text-white/60">Scan bald patches, patterns, and determine inflammation status.</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                  <span className="text-xs font-bold text-emerald-400">Scalp Health</span>
                  <span className="text-[11px] text-white/60">Detect seborrheic dermatitis scales, dandruff density, or fungal signs.</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 leading-relaxed">
                💡 <b>Tip for Scans:</b> Separate hair strands to make scalp surface visible if checking for bald spots or seborrheic dandruff.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
