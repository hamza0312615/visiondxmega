import { useState, useEffect } from 'react'
import { analyzeImage } from '../utils/groqApi'
import { saveResult, isDemoMode, setDemoMode, getApiKey } from '../utils/localStorage'
import diseaseData from '../data/disease_data.json'
import { demoPresets } from '../data/demoPresets'
import ResultCard from '../components/ResultCard'
import LoadingSpinner from '../components/LoadingSpinner'
import WebcamCapture from '../components/WebcamCapture'
import Skeleton from '../components/Skeleton'

export default function SkinAnalyzer() {
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [activeTab, setActiveTab] = useState('upload') // 'upload' or 'webcam'
  const [location, setLocation] = useState('')
  const [itching, setItching] = useState('Mild') // Mild, Moderate, Severe
  const [presetData, setPresetData] = useState(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentResult, setCurrentResult] = useState(null)

  useEffect(() => {
    const runDemo = async () => {
      const isAutopilot = localStorage.getItem('visiondx_autopilot') === 'active' && localStorage.getItem('visiondx_autopilot_step') === 'skin'
      const storedTrigger = localStorage.getItem('visiondx_nav_preset_trigger')
      
      let preset = null
      if (storedTrigger) {
        const parsed = JSON.parse(storedTrigger)
        if (parsed.page === '/skin-analyzer') {
          preset = demoPresets.skin.find(p => p.id === parsed.presetId)
          localStorage.removeItem('visiondx_nav_preset_trigger')
        }
      }
      
      if (!preset && (isDemoMode() || isAutopilot)) {
        if (isDemoMode()) setDemoMode(false)
        preset = demoPresets.skin[0]
      }
      
      if (preset) {
        const blob = await fetch(preset.image).then(res => res.blob())
        const file = new File([blob], preset.fileName, { type: preset.fileName.endsWith('.jpg') ? "image/jpeg" : "image/png" })
        setImageFile(file)
        setImagePreview(preset.image)
        setLocation(preset.location || '')
        setItching(preset.itching || 'Mild')
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
      setError('Please capture or upload a skin photo to analyze.')
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
        const saved = saveResult('skin', activePreset.fallbackResult)
        setCurrentResult(saved)
        setLoading(false)
        if (localStorage.getItem('visiondx_autopilot') === 'active') {
          window.dispatchEvent(new CustomEvent('autopilot-result-ready', { detail: { type: 'skin', result: saved } }))
        }
      }, 1500)
      return
    }

    const prompt = `You are an expert dermatological AI assistant. Analyze this close-up image of the patient's skin lesion or rash. Location: "${location || 'Unspecified'}". Itching level: "${itching}". 
1) Identify any visible conditions such as Melanoma, Basal-cell carcinoma, Squamous-cell carcinoma, Dermatitis, Psoriasis, Contact dermatitis, Dermatophytosis, Hives, Rosacea, Chickenpox, Measles, Shingles, Impetigo, Scabies, Cellulitis, Acne, or Vitiligo.
2) Evaluate the ABCDE criteria if applicable (Asymmetry, Border irregularity, Color variation, Diameter, Evolving).
3) Provide a clear assessment of severity and urgency. End your response with exactly one of these urgency flags: NORMAL, SEE_DOCTOR, or EMERGENCY.`

    try {
      const aiResponse = await analyzeImage(activeFile, prompt)
      
      // Grounding: Match AI response against diseaseData.skin keys
      const skinConditions = diseaseData.skin || {}
      let matchedCondition = null
      let matchedKey = ''
      const lowerAiResponse = aiResponse.toLowerCase()

      for (const [key, data] of Object.entries(skinConditions)) {
        if (lowerAiResponse.includes(key.toLowerCase())) {
          matchedCondition = data
          matchedKey = key
          break
        }
      }

      // Determine Urgency
      let urgency = 'NORMAL'
      if (aiResponse.includes('EMERGENCY')) urgency = 'EMERGENCY'
      else if (aiResponse.includes('SEE_DOCTOR')) urgency = 'SEE_DOCTOR'

      const resultDetails = {
        detectedCondition: matchedKey || 'General Dermatological Observation',
        urgencyLevel: urgency.replace('_', ' '),
        bodyLocation: location || 'Unspecified',
        itchingReported: itching,
        expertDescription: matchedCondition ? matchedCondition.description : 'Refer to AI observations below.',
        causes: matchedCondition ? matchedCondition.causes : 'Consult a dermatologist.',
        precautions: matchedCondition ? matchedCondition.precautions : 'Avoid scratching and keep the area clean.'
      }

      const resultData = {
        summary: `Skin Analysis: ${matchedKey || 'Observation'} detected. Urgency: ${urgency.replace('_', ' ')}.`,
        rawResponse: aiResponse,
        details: resultDetails
      }

      const saved = saveResult('skin', resultData)
      setCurrentResult(saved)

      if (localStorage.getItem('visiondx_autopilot') === 'active') {
        window.dispatchEvent(new CustomEvent('autopilot-result-ready', { detail: { type: 'skin', result: saved } }))
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze skin image. Please check your API key or try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setImageFile(null)
    setImagePreview('')
    setLocation('')
    setItching('Mild')
    setPresetData(null)
    setCurrentResult(null)
    setError('')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 slide-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-2 shadow-glow">
            <span>🔴</span> Dermatological Vision AI + Expert Knowledge Base
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
            Skin Rash Analyzer
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Instant AI evaluation of skin rashes, moles, and lesions. Cross-references expert data for Melanoma, Dermatitis, Psoriasis, and more with verified precautions.
          </p>
        </div>
        {currentResult && (
          <button onClick={resetForm} className="btn-secondary text-xs py-2.5 px-4">
            + New Skin Scan
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
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold animate-pulse shadow-glow flex items-center gap-2">
            <span>🔬</span> Evaluating lesion asymmetry, border irregularity, and color variation...
          </div>
          <Skeleton />
        </div>
      ) : currentResult ? (
        <div className="space-y-8 fade-in">
          <ResultCard data={currentResult} />
          <div className="flex justify-center">
            <button onClick={resetForm} className="btn-primary py-3.5 px-8 text-base shadow-lg shadow-rose-500/20">
              <span>📸</span> Scan Another Skin Photo
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Input Form */}
          <div className="lg:col-span-2 space-y-6 glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
                <span>📸</span> Capture or Upload Skin Photo
              </h2>
              {/* Tabs */}
              <div className="flex bg-navy-900/80 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'upload' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-md' : 'text-white/60 hover:text-white'
                  }`}
                >
                  📁 Upload
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('webcam')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'webcam' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-md' : 'text-white/60 hover:text-white'
                  }`}
                >
                  ⏺️ Live Camera
                </button>
              </div>
            </div>

            {/* Interactive Demo Presets */}
            {activeTab === 'upload' && !imagePreview && (
              <div className="bg-[#020810]/40 p-5 rounded-2xl border border-white/5 space-y-3">
                <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <span>✨</span> Clinical Demo Presets (No Photo Required):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {demoPresets.skin.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={async () => {
                        const blob = await fetch(preset.image).then(res => res.blob())
                        const file = new File([blob], preset.fileName, { type: 'image/png' })
                        setImageFile(file)
                        setImagePreview(preset.image)
                        setLocation(preset.location)
                        setItching(preset.itching)
                        setPresetData(preset)
                      }}
                      className="p-3.5 text-left rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 transition-all flex flex-col justify-between gap-1.5 group cursor-pointer"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors line-clamp-1">{preset.title}</div>
                      <div className="text-[10px] text-white/50 line-clamp-2 leading-relaxed">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'webcam' ? (
              <WebcamCapture onCapture={handleWebcamCapture} label="Open Live Skin Camera" />
            ) : (
              <div>
                {!imagePreview ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-rose-500/30 rounded-3xl bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/50 transition-all cursor-pointer group"
                  >
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🔴</div>
                    <p className="text-base font-bold text-white mb-1">Drag and drop skin photo here</p>
                    <p className="text-xs text-white/40 mb-6 max-w-xs text-center">Ensure good lighting and a clear, focused view of the rash or lesion</p>
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
                    <img src={imagePreview} alt="Skin Preview" className="max-h-72 object-contain rounded-2xl mb-6 shadow-lg" />
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

            {/* Location & Itching */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                  Body Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Right Forearm, Back of Neck"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                  Itching Severity
                </label>
                <select
                  value={itching}
                  onChange={(e) => setItching(e.target.value)}
                  className="input-field cursor-pointer bg-navy-900"
                >
                  <option value="Mild">Mild Itching</option>
                  <option value="Moderate">Moderate Itching</option>
                  <option value="Severe">Severe Itching / Painful</option>
                </select>
              </div>
            </div>

            {presetData && !currentResult && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-dashed border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-3 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.15)] pt-2">
                <span className="text-xl">💡</span>
                <div>
                  <div className="font-bold text-white text-sm">Demo Case Loaded!</div>
                  <div className="mt-0.5 text-white/70">Click the pulsing <b>"Run High-Fidelity Demo Analysis"</b> button below to execute the AI clinical simulation.</div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!imageFile}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-xl ${
                imageFile
                  ? presetData && !currentResult
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-navy-950 hover:scale-[1.01] animate-bounce shadow-emerald-500/40 ring-4 ring-emerald-400/30'
                    : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:scale-[1.01] shadow-rose-500/20'
                  : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/5'
              }`}
            >
              <span>🔬</span> {presetData && !currentResult ? 'Run High-Fidelity Demo Analysis' : 'Analyze Skin with Vision AI'}
            </button>
          </div>

          {/* Expert Knowledge Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 shadow-xl">
              <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2 border-b border-white/10 pb-4">
                <span>📚</span> Expert Skin Database
              </h2>
              <p className="text-xs text-white/60 leading-relaxed">
                Our AI cross-references your scan with verified clinical guidelines from our medical database. Supported conditions include:
              </p>
              
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {Object.keys(diseaseData.skin || {}).map((cond, i) => (
                  <div key={i} className="glass-panel p-3.5 rounded-2xl border border-white/5 hover:border-rose-500/30 transition-all flex items-center justify-between group">
                    <span className="text-xs font-bold text-white/80 group-hover:text-rose-400 transition-colors">{cond}</span>
                    <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-semibold">Grounded</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 leading-relaxed">
                💡 <b>Clinical Guidance:</b> Moles showing rapid changes in Asymmetry, Border, Color, or Diameter should be evaluated by a dermatologist immediately.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
