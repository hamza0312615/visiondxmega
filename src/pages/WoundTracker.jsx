import { useState, useEffect } from 'react'
import { analyzeImage } from '../utils/groqApi'
import { saveResult, getHistoryByType, formatTime, isDemoMode, setDemoMode, getApiKey } from '../utils/localStorage'
import { demoPresets } from '../data/demoPresets'
import ResultCard from '../components/ResultCard'
import WebcamCapture from '../components/WebcamCapture'
import Skeleton from '../components/Skeleton'

export default function WoundTracker() {
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

  useEffect(() => {
    loadTimeline()
    
    // Demo auto-run hook
    const runDemo = async () => {
      if (isDemoMode()) {
        setDemoMode(false) // Disable global demo mode immediately to prevent recurrent loops
        const preset = demoPresets.wound[0]
        const blob = await fetch(preset.image).then(res => res.blob())
        const file = new File([blob], preset.fileName, { type: "image/png" })
        setImageFile(file)
        setImagePreview(preset.image)
        setLocation(preset.location)
        setDayNumber(preset.dayNumber || "Day 5")
        setPainLevel(2)
        setPresetData(preset)
        
        setTimeout(() => {
          handleAnalyze(null, file, preset)
        }, 1200)
      }
    }
    runDemo()
  }, [])

  const loadTimeline = () => {
    const woundHistory = getHistoryByType('wound')
    setTimeline(woundHistory)
  }

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

    // Preset simulated fallback mode if API keys are missing
    const activePreset = forcePreset || presetData
    const hasKey = getApiKey() || localStorage.getItem('visiondx_gemini_key')
    if (activePreset && activeFile.name === activePreset.fileName && !hasKey) {
      setTimeout(() => {
        const saved = saveResult('wound', activePreset.fallbackResult)
        setCurrentResult(saved)
        setLoading(false)
        loadTimeline()
      }, 1500)
      return
    }

    const prompt = `You are an expert medical wound assessment AI. Analyze this wound image. The patient reports this is ${dayNumber} of healing. Pain level: ${painLevel}/10. Location: ${location}. 
1) Assess healing progress: Is it healing normally, slowly, or showing signs of infection (e.g., yellow slough, purulent drainage, excessive erythema)?
2) Describe redness, swelling, and wound bed characteristics.
3) Provide a clear care recommendation. End your response with exactly one of these urgency flags: HOME_CARE, SEE_DOCTOR, or EMERGENCY.`

    try {
      const aiResponse = await analyzeImage(activeFile, prompt)
      
      let healingStatus = 'Analyzing...'
      if (aiResponse.toLowerCase().includes('healing normally') || aiResponse.toLowerCase().includes('healing well')) healingStatus = 'Healing Well'
      else if (aiResponse.toLowerCase().includes('slowly') || aiResponse.toLowerCase().includes('slow')) healingStatus = 'Healing Slowly'
      else if (aiResponse.toLowerCase().includes('infection')) healingStatus = 'Signs of Infection'

      let recommendation = 'HOME_CARE'
      if (aiResponse.includes('EMERGENCY')) recommendation = 'EMERGENCY'
      else if (aiResponse.includes('SEE_DOCTOR')) recommendation = 'SEE_DOCTOR'

      const resultData = {
        summary: `Assessment for ${dayNumber} (${location}). Pain: ${painLevel}/10.`,
        rawResponse: aiResponse,
        details: {
          healingDay: dayNumber,
          woundLocation: location,
          reportedPain: `${painLevel} / 10`,
          statusObservation: healingStatus,
          finalRecommendation: recommendation.replace('_', ' ')
        }
      }

      const saved = saveResult('wound', resultData)
      setCurrentResult(saved)
      loadTimeline()
    } catch (err) {
      setError(err.message || 'Failed to analyze wound image. Please check your API key or try again.')
    } finally {
      setLoading(false)
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
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 slide-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-medical-green/10 border border-medical-green/20 text-medical-green text-xs font-semibold mb-2 shadow-glow">
            <span>🩹</span> Vision AI Diagnostics + Timeline Tracking
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
            Wound Healing Tracker
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Upload daily photos of your wound. Our AI assesses healing rate, redness, swelling, and provides immediate care recommendations while building a visual progress timeline.
          </p>
        </div>
        {currentResult && (
          <button onClick={resetForm} className="btn-secondary text-xs py-2.5 px-4">
            + New Wound Assessment
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
          <div className="p-4 rounded-2xl bg-medical-green/10 border border-medical-green/20 text-medical-green text-xs font-semibold animate-pulse shadow-glow flex items-center gap-2">
            <span>🔬</span> Analyzing wound bed characteristics, erythema, and exudate levels...
          </div>
          <Skeleton />
        </div>
      ) : currentResult ? (
        <div className="space-y-8 fade-in">
          <ResultCard data={currentResult} />
          <div className="flex justify-center">
            <button onClick={resetForm} className="btn-primary py-3.5 px-8 text-base shadow-lg shadow-medical-green/20">
              <span>📸</span> Analyze Another Wound Photo
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Form & Upload */}
          <form onSubmit={handleAnalyze} className="lg:col-span-2 space-y-6 glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
                <span>📋</span> Assessment Details & Photo
              </h2>
              {/* Tabs */}
              <div className="flex bg-navy-900/80 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'upload' ? 'bg-medical-green/20 text-medical-green border border-medical-green/30 shadow-md' : 'text-white/60 hover:text-white'
                  }`}
                >
                  📁 Upload
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('webcam')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'webcam' ? 'bg-medical-green/20 text-medical-green border border-medical-green/30 shadow-md' : 'text-white/60 hover:text-white'
                  }`}
                >
                  ⏺️ Live Camera
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Day Number */}
              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                  Healing Day
                </label>
                <select
                  value={dayNumber}
                  onChange={(e) => setDayNumber(e.target.value)}
                  className="input-field cursor-pointer bg-navy-900"
                >
                  {[...Array(30).keys()].map(i => (
                    <option key={i+1} value={`Day ${i+1}`} className="bg-navy-900 text-white">
                      Day {i+1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                  Wound Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Left Forearm, Right Shin"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* Pain Level Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-white/70 uppercase tracking-wider">
                  Pain Level (1-10)
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
                className="w-full h-2 bg-[#020810] rounded-lg appearance-none cursor-pointer accent-medical-green border border-white/10"
              />
              <div className="flex justify-between text-[10px] text-white/40 mt-1.5 font-semibold uppercase tracking-wider">
                <span>1 (No Pain)</span>
                <span>5 (Moderate)</span>
                <span>10 (Severe Pain)</span>
              </div>
            </div>

            {/* Photo Capture / Upload Zone */}
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                Wound Image
              </label>
              
              {activeTab === 'webcam' ? (
                <WebcamCapture onCapture={handleWebcamCapture} label="Open Live Wound Camera" />
              ) : (
                <div>
                  {/* Interactive Demo Presets */}
                  {!imagePreview && (
                    <div className="bg-[#020810]/40 p-5 rounded-2xl border border-white/5 space-y-3 mb-4">
                      <div className="text-xs font-bold text-medical-green flex items-center gap-1.5">
                        <span>✨</span> Clinical Demo Presets (No Photo Required):
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
                              setLocation(preset.location)
                              setDayNumber(preset.dayNumber || "Day 5")
                              setPainLevel(preset.id === 'wound-2' ? 8 : preset.id === 'wound-3' ? 1 : 2)
                              setPresetData(preset)
                            }}
                            className="p-3.5 text-left rounded-xl bg-white/5 hover:bg-medical-green/10 border border-white/10 hover:border-medical-green/30 transition-all flex flex-col justify-between gap-1.5 group cursor-pointer"
                          >
                            <div className="text-xs font-bold text-white group-hover:text-medical-green transition-colors line-clamp-1">{preset.title}</div>
                            <div className="text-[10px] text-white/50 line-clamp-2 leading-relaxed">{preset.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!imagePreview ? (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-medical-green/30 rounded-3xl bg-medical-green/5 hover:bg-medical-green/10 hover:border-medical-green/50 transition-all cursor-pointer group"
                    >
                      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📸</div>
                      <p className="text-base font-bold text-white mb-1">Drag and drop wound photo here</p>
                      <p className="text-xs text-white/40 mb-6 max-w-xs text-center">Ensure good lighting and a clear, focused view of the wound bed</p>
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
                      <img src={imagePreview} alt="Wound Preview" className="max-h-72 object-contain rounded-2xl mb-6 shadow-lg" />
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
            </div>

            <button
              type="submit"
              disabled={!imageFile}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-xl ${
                imageFile
                  ? 'bg-gradient-to-r from-medical-green to-emerald-600 text-navy-950 hover:scale-[1.01] shadow-medical-green/20'
                  : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/5'
              }`}
            >
              <span>🔬</span> Analyze Wound with Vision AI
            </button>
          </form>

          {/* Timeline Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 shadow-xl">
              <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2 border-b border-white/10 pb-4">
                <span>📈</span> Progress Timeline
              </h2>

              {timeline.length === 0 ? (
                <div className="text-center py-12 text-white/40 text-sm space-y-2">
                  <div className="text-3xl mb-2">⏳</div>
                  <p className="font-semibold text-white/60">No timeline history found.</p>
                  <p className="text-xs max-w-xs mx-auto">Your wound assessments will be logged here automatically to track healing velocity.</p>
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-white/10 max-h-[600px] overflow-y-auto pr-2">
                  {timeline.map((entry, idx) => (
                    <div key={entry.id} className="relative flex gap-4 items-start group">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 shrink-0 border border-white/20 ${
                        idx === 0 ? 'bg-medical-green text-navy-950 shadow-lg shadow-medical-green/30' : 'bg-navy-800 text-white/70'
                      }`}>
                        {timeline.length - idx}
                      </div>

                      <div className="glass-panel p-4 rounded-2xl border border-white/5 flex-1 transition-all group-hover:border-medical-green/30 shadow-md">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-bold text-white text-sm font-outfit">
                            {entry.details?.healingDay || 'Day Entry'}
                          </span>
                          <span className="text-[10px] text-white/40 bg-white/5 px-2.5 py-1 rounded-full font-semibold">
                            {formatTime(entry.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-white/70 mb-3 capitalize leading-relaxed">
                          📍 {entry.details?.woundLocation || 'General'} | Pain: {entry.details?.reportedPain || 'N/A'}
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-medical-green">
                          <span className="w-1.5 h-1.5 rounded-full bg-medical-green animate-pulse" />
                          {entry.details?.statusObservation || 'Analyzed'}
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
