import { useState, useEffect } from 'react'
import { analyzeImage, analyzeText } from '../utils/groqApi'
import { saveResult, getHistoryByType, formatTime, isDemoMode, setDemoMode } from '../utils/localStorage'
import { hasAnyApiKey, triggerFallbackMode } from '../utils/fallback'
import { useSaveToCHW } from '../hooks/useSaveToCHW'
import { demoPresets } from '../data/demoPresets'
import ResultCard from '../components/ResultCard'
import LoadingSpinner from '../components/LoadingSpinner'
import WebcamCapture from '../components/WebcamCapture'
import Skeleton from '../components/Skeleton'

export default function MedicineAnalyzer() {
  const { saveToCHW } = useSaveToCHW()
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('upload') // 'upload', 'webcam', or 'manual'
  const [presetData, setPresetData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentResult, setCurrentResult] = useState(null)

  useEffect(() => {
    const runDemo = async () => {
      const isAutopilot = localStorage.getItem('visiondx_autopilot') === 'active' && localStorage.getItem('visiondx_autopilot_step') === 'medicine'
      const storedTrigger = localStorage.getItem('visiondx_nav_preset_trigger')
      
      let preset = null
      if (storedTrigger) {
        const parsed = JSON.parse(storedTrigger)
        if (parsed.page === '/medicine-analyzer') {
          preset = demoPresets.medicine.find(p => p.id === parsed.presetId)
          localStorage.removeItem('visiondx_nav_preset_trigger')
        }
      }
      
      if (!preset && (isDemoMode() || isAutopilot)) {
        if (isDemoMode()) setDemoMode(false)
        preset = demoPresets.medicine[0]
      }
      
      if (preset) {
        const blob = await fetch(preset.image).then(res => res.blob())
        const file = new File([blob], preset.fileName, { type: preset.fileName.endsWith('.jpg') ? "image/jpeg" : "image/png" })
        setImageFile(file)
        setImagePreview(preset.image)
        setActiveTab('upload')
        setPresetData(preset)
        
        if (isAutopilot) {
          setLoading(true)
          setTimeout(() => {
            handleAnalyze(null, preset.title, file, preset)
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

  const handleAnalyze = async (e, customQuery, customFile, forcePreset) => {
    if (e) e.preventDefault()
    
    const activeFile = customFile || imageFile
    const activeQuery = customQuery || searchQuery

    if (activeTab !== 'manual' && !activeFile) {
      setError('Please capture or upload a medicine photo to analyze.')
      return
    }
    if (activeTab === 'manual' && !activeQuery.trim()) {
      setError('Please enter a medication name or active ingredient to search.')
      return
    }

    setLoading(true)
    setError('')
    setCurrentResult(null)

    // Preset simulated fallback mode if API keys are missing
    const activePreset = forcePreset || presetData
    if (activePreset && activeFile && activeFile.name === activePreset.fileName && !hasAnyApiKey()) {
      triggerFallbackMode({
        type: 'medicine',
        fallbackResult: activePreset.fallbackResult,
        setLoading,
        setCurrentResult
      })
      return
    }

    let medName = activeQuery.trim()
    let aiResponse = ''
    let apiSource = activeTab === 'manual' ? 'Manual Search' : 'Groq Vision OCR'

    try {
      if (activeTab === 'manual') {
        const textPrompt = `You are an expert pharmacist AI assistant. Analyze the medication named "${medName}".
1) Identify active ingredients and primary therapeutic class.
2) Explain what condition it treats, standard adult dosage, common side effects, and critical contraindications/warnings.
3) Suggested Medicines & Early Care (in absence of doctor): Provide home care tips, non-prescription precautions, or generic early-use suggested alternative medicines to consider if a doctor is not immediately reachable. Add a clear disclaimer that these suggestions are for temporary relief/education and need verification.
4) Provide clear patient guidance and determine medical urgency. End your response with exactly one of these urgency flags: NORMAL, SEE_DOCTOR, or EMERGENCY.`
        
        aiResponse = await analyzeText(textPrompt)
      } else {
        const visionPrompt = `You are an expert pharmacist AI assistant. Analyze this image of a medicine box, pill bottle, or prescription. 
1) Identify the medicine name, active ingredients, and primary therapeutic class.
2) Explain what condition it treats, standard adult dosage, common side effects, and critical contraindications/warnings.
3) Perform a counterfeit packaging screening (look for packaging irregularities, font inconsistencies, spelling errors, or missing security seals).
4) Suggested Medicines & Early Care (in absence of doctor): Provide home care tips, non-prescription precautions, or generic early-use suggested alternative medicines to consider if a doctor is not immediately reachable. Add a clear disclaimer that these suggestions are for temporary relief/education and need verification.
5) Provide clear patient guidance and determine medical urgency. End your response with exactly one of these urgency flags: NORMAL, SEE_DOCTOR, or EMERGENCY.`
 
        aiResponse = await analyzeImage(activeFile, visionPrompt)

        const nameMatch = aiResponse.match(/(?:name|identify|medicine|drug|active ingredient)[\s:=]+([^\n.,;]+)/i)
        if (nameMatch && nameMatch[1]) {
          medName = nameMatch[1].replace(/[^a-zA-Z0-9\s-]/g, '').trim()
        } else {
          medName = 'Prescription / Medication'
        }
      }

      // External API Verification: openFDA API & RxNorm API by NIH / NLM
      let fdaData = null
      let rxNormData = null

      if (medName && medName !== 'Prescription / Medication') {
        try {
          const cleanSearch = encodeURIComponent(medName.split(' ')[0]) // Search first word/brand name
          
          // 1. Try openFDA API first
          const fdaRes = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${cleanSearch}"+OR+openfda.generic_name:"${cleanSearch}"&limit=1`)
          if (fdaRes.ok) {
            const fdaJson = await fdaRes.json()
            if (fdaJson.results && fdaJson.results.length > 0) {
              fdaData = fdaJson.results[0]
              apiSource = activeTab === 'manual' ? 'openFDA + Manual Search' : 'openFDA Official Database'
            }
          }

          // 2. If openFDA didn't return data, fallback to RxNorm API by NIH / NLM
          if (!fdaData) {
            const rxRes = await fetch(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${cleanSearch}`)
            if (rxRes.ok) {
              const rxJson = await rxRes.json()
              if (rxJson.idGroup && rxJson.idGroup.rxnormId && rxJson.idGroup.rxnormId.length > 0) {
                const rxcui = rxJson.idGroup.rxnormId[0]
                rxNormData = { rxcui, note: `Verified via NIH / NLM RxNorm Concept ID: ${rxcui}` }
                apiSource = activeTab === 'manual' ? 'NIH RxNorm + Manual Search' : 'NIH RxNorm Official Database'
              }
            }
          }
        } catch (apiErr) {
          console.warn('External API Lookup Warning:', apiErr)
        }
      }

      // Construct enriched response combining Groq AI + FDA/NIH
      let enrichedResponse = aiResponse
      if (fdaData) {
        const brand = fdaData.openfda?.brand_name?.[0] || medName
        const generic = fdaData.openfda?.generic_name?.[0] || 'N/A'
        const indications = fdaData.indications_and_usage?.[0] || 'See package insert.'
        const warnings = fdaData.warnings?.[0] || fdaData.boxed_warning?.[0] || 'Consult physician.'
        
        enrichedResponse += `\n\n### 🏛️ openFDA Official Database Match\n- **Brand Name**: ${brand}\n- **Generic Name**: ${generic}\n- **Indications & Usage**: ${indications}\n- **Warnings**: ${warnings}`
      } else if (rxNormData) {
        enrichedResponse += `\n\n### 🏛️ NIH / NLM RxNorm Database Match\n- **Medication Concept**: ${medName}\n- **RxCUI Code**: ${rxNormData.rxcui}\n- **Verification Status**: Official National Library of Medicine drug registry match.`
      }

      let fakeRisk = activeTab === 'manual' ? 'N/A (Manual Search)' : 'Low Risk (Appears Authentic)'
      if (activeTab !== 'manual' && (aiResponse.toLowerCase().includes('counterfeit') || aiResponse.toLowerCase().includes('irregularit') || aiResponse.toLowerCase().includes('fake') || aiResponse.toLowerCase().includes('suspicious') || aiResponse.toLowerCase().includes('inconsisten'))) {
        fakeRisk = 'High Risk / Potential Counterfeit Irregularities Detected'
      }

      let urgency = 'NORMAL'
      if (aiResponse.includes('EMERGENCY')) urgency = 'EMERGENCY'
      else if (aiResponse.includes('SEE_DOCTOR')) urgency = 'SEE_DOCTOR'

      const resultData = {
        summary: `Medication Analysis: ${medName}. Verification: ${apiSource}. Counterfeit Risk: ${fakeRisk}.`,
        rawResponse: enrichedResponse,
        details: {
          identifiedMedication: medName,
          databaseVerification: apiSource,
          counterfeitVerification: fakeRisk,
          assessedUrgency: urgency.replace('_', ' '),
          pharmacistGuidance: 'Refer to original packaging insert for full details and verify with a licensed pharmacist.'
        }
      }

      const saved = saveResult('medicine', resultData)
      setCurrentResult(saved)

      const chwRisk = urgency === 'EMERGENCY' ? 'critical' : urgency === 'SEE_DOCTOR' ? 'warning' : 'normal'
      saveToCHW('MedicineAnalyzer', resultData.summary, chwRisk, resultData)

      if (localStorage.getItem('visiondx_autopilot') === 'active') {
        window.dispatchEvent(new CustomEvent('autopilot-result-ready', { detail: { type: 'medicine', result: saved } }))
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze medicine. Please check your API key or try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetAnalyzer = () => {
    setImageFile(null)
    setImagePreview('')
    setSearchQuery('')
    setPresetData(null)
    setCurrentResult(null)
    setError('')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 slide-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-2 shadow-glow">
            <span>💊</span> Llama 3.3 AI + openFDA & NIH RxNorm Verifier
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
            Medicine AI Verifier & Analyzer
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Search manually or upload/capture a photo of any medicine. Our AI identifies active ingredients, verifies them against openFDA and NIH databases, explains dosages, warnings, and screens for counterfeit risks.
          </p>
        </div>
        {currentResult && (
          <button onClick={resetAnalyzer} className="btn-secondary text-xs py-2.5 px-4">
            + New Analysis
          </button>
        )}
      </div>

      {/* Educational Purpose Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs sm:text-sm font-semibold flex items-start gap-3 shadow-lg">
        <span className="text-xl shrink-0">⚠️</span>
        <div className="space-y-1">
          <p className="font-bold text-white uppercase tracking-wider">Educational & Informational Purpose Only</p>
          <p className="text-white/70 leading-relaxed font-normal">
            This project is designed strictly for educational and informational purposes. The suggestions, early care precautions, and medicine lists are simulated guidelines to consider only if a doctor is not immediately reachable. They do not constitute formal medical advice. Always consult a licensed medical professional before starting or stopping any medication.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 fade-in shadow-lg">
          <span>⚠️</span> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold animate-pulse shadow-glow flex items-center gap-2">
            <span>🔬</span> {activeTab === 'manual' ? `Querying openFDA & NIH RxNorm databases for "${searchQuery}"...` : "Analyzing medicine packaging, fonts, active ingredients, and matching pharmaceutical database..."}
          </div>
          <Skeleton />
        </div>
      ) : currentResult ? (
        <div className="space-y-8 fade-in">
          <ResultCard data={currentResult} />
          <div className="flex justify-center">
            <button onClick={resetAnalyzer} className="btn-primary py-3.5 px-8 text-base shadow-lg shadow-teal-500/20">
              <span>📸</span> Verify Another Medication
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto glass-card p-8 sm:p-12 rounded-3xl border border-white/10 shadow-2xl space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-4">
            <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
              <span>📸</span> Medication Verification & Analysis
            </h2>
            {/* Tabs */}
            <div className="flex bg-navy-900/80 p-1 rounded-xl border border-white/10 gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'upload' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                📁 Upload
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('webcam')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'webcam' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                ⏺️ Live Camera
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'manual' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                🔍 Manual Search
              </button>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
              {activeTab === 'manual' 
                ? 'Type any medication name or active ingredient to instantly verify it against openFDA and NIH RxNorm databases.'
                : 'Ensure the medication label, active ingredients, and packaging are clearly visible and well-lit for accurate AI optical character recognition.'}
            </p>
          </div>

          {activeTab === 'manual' ? (
            <div className="space-y-4 py-6">
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider text-left">
                Enter Medication Name or Active Ingredient
              </label>
              <input
                type="text"
                placeholder="e.g. Paracetamol, Lisinopril, Amoxicillin, Aspirin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field text-base py-4"
              />
            </div>
          ) : activeTab === 'webcam' ? (
            <WebcamCapture onCapture={handleWebcamCapture} label="Open Live Medicine Camera" />
          ) : (
            <div>
              {/* Interactive Demo Presets */}
              {!imagePreview && (
                <div className="bg-[#020810]/40 p-5 rounded-2xl border border-white/5 space-y-3 mb-4">
                  <div className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                    <span>✨</span> Clinical Demo Presets (No Photo Required):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {demoPresets.medicine.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={async () => {
                          const blob = await fetch(preset.image).then(res => res.blob())
                          const file = new File([blob], preset.fileName, { type: 'image/png' })
                          setImageFile(file)
                          setImagePreview(preset.image)
                          setPresetData(preset)
                        }}
                        className="p-3.5 text-left rounded-xl bg-white/5 hover:bg-teal-500/10 border border-white/10 hover:border-teal-500/30 transition-all flex flex-col justify-between gap-1.5 group cursor-pointer"
                      >
                        <div className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-1">{preset.title}</div>
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
                  className="upload-zone flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/20 rounded-3xl bg-white/5 hover:bg-white/10 hover:border-teal-500/50 transition-all cursor-pointer group shadow-inner"
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">💊</div>
                  <p className="text-base font-bold text-white mb-1">Drag & Drop medicine box or pill photo</p>
                  <p className="text-xs text-white/40 mb-6">Supports JPEG, PNG, WEBP</p>
                  <label className="btn-secondary cursor-pointer text-xs py-3 px-6 shadow-md">
                    Browse Device Files
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
                  <img src={imagePreview} alt="Medicine Preview" className="max-h-80 object-contain rounded-2xl mb-6 shadow-2xl" />
                  <div className="flex gap-4 w-full justify-center">
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

          {presetData && !currentResult && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-dashed border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-3 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.15)] mt-4">
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
            disabled={activeTab === 'manual' ? !searchQuery.trim() : !imageFile}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-xl ${
              (activeTab === 'manual' ? searchQuery.trim() : imageFile)
                ? presetData && !currentResult
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-navy-950 hover:scale-[1.01] animate-bounce shadow-emerald-500/40 ring-4 ring-emerald-400/30'
                  : 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:scale-[1.01] shadow-teal-500/20'
                : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/5'
            }`}
          >
            <span>🔬</span> {presetData && !currentResult ? 'Run High-Fidelity Demo Analysis' : activeTab === 'manual' ? 'Verify Medication via openFDA & NIH' : 'Identify & Analyze Medicine'}
          </button>
        </div>
      )}
    </div>
  )
}
