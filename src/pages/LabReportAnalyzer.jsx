import { useState, useEffect } from 'react'
import { isDemoMode, setDemoMode } from '../utils/localStorage'
import { demoPresets } from '../data/demoPresets'
import { labTemplates } from '../data/labTemplates'
import { analyzeLabReport } from '../utils/labAnalyzerService'
import LabManualEntry from '../components/LabManualEntry'
import LabReportSheet from '../components/LabReportSheet'
import LoadingSpinner from '../components/LoadingSpinner'
import WebcamCapture from '../components/WebcamCapture'
import Skeleton from '../components/Skeleton'

export default function LabReportAnalyzer() {
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [activeTab, setActiveTab] = useState('upload') // 'upload', 'webcam', or 'manual'
  const [reportType, setReportType] = useState('General / Complete Blood Count (CBC)')
  const [presetData, setPresetData] = useState(null)
  
  // Manual Entry States
  const [manualParams, setManualParams] = useState([])
  const [newParam, setNewParam] = useState({ name: '', value: '', unit: '', refRange: '' })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentResult, setCurrentResult] = useState(null)

  useEffect(() => {
    const runDemo = async () => {
      const isAutopilot = localStorage.getItem('visiondx_autopilot') === 'active' && localStorage.getItem('visiondx_autopilot_step') === 'lab'
      const storedTrigger = localStorage.getItem('visiondx_nav_preset_trigger')
      
      let preset = null
      if (storedTrigger) {
        const parsed = JSON.parse(storedTrigger)
        if (parsed.page === '/lab-analyzer') {
          preset = demoPresets.lab.find(p => p.id === parsed.presetId)
          localStorage.removeItem('visiondx_nav_preset_trigger')
        }
      }
      
      if (!preset && (isDemoMode() || isAutopilot)) {
        if (isDemoMode()) setDemoMode(false)
        preset = demoPresets.lab[0]
      }
      
      if (preset) {
        const blob = await fetch(preset.image).then(res => res.blob())
        const file = new File([blob], preset.fileName, { type: preset.fileName.endsWith('.jpg') ? "image/jpeg" : "image/png" })
        setImageFile(file)
        setImagePreview(preset.image)
        setActiveTab('upload')
        setReportType('General / Complete Blood Count (CBC)')
        setPresetData(preset)
        
        if (isAutopilot) {
          setLoading(true)
          setTimeout(() => {
            handleAnalyze(null, null, file, preset)
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

  // Pre-fill parameters when category changes
  useEffect(() => {
    if (labTemplates[reportType]) {
      setManualParams(labTemplates[reportType])
    } else {
      setManualParams([])
    }
  }, [reportType])

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

  const handleAddParam = () => {
    if (!newParam.name || !newParam.value) {
      setError('Parameter name and value are required.')
      return
    }
    setManualParams([...manualParams, newParam])
    setNewParam({ name: '', value: '', unit: '', refRange: '' })
    setError('')
  }

  const handleRemoveParam = (index) => {
    setManualParams(manualParams.filter((_, i) => i !== index))
  }

  const handleParamChange = (index, field, val) => {
    const updated = [...manualParams]
    updated[index][field] = val
    setManualParams(updated)
  }

  const handleAnalyze = async (e, customParams, customFile, forcePreset) => {
    if (e) e.preventDefault()
    
    setLoading(true)
    setError('')
    setCurrentResult(null)

    try {
      const saved = await analyzeLabReport({
        activeTab,
        reportType,
        manualParams,
        imageFile,
        presetData,
        customParams,
        customFile,
        forcePreset
      })
      setCurrentResult(saved)
    } catch (err) {
      setError(err.message || 'Failed to analyze lab report. Please check your API key or try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetAnalyzer = () => {
    setImageFile(null)
    setImagePreview('')
    setPresetData(null)
    setCurrentResult(null)
    setError('')
    if (labTemplates[reportType]) {
      setManualParams(labTemplates[reportType])
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 slide-in printable-area">
      {/* CSS print utility overlay */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          nav, footer, button, .no-print, .upload-zone, .input-field, select, input {
            display: none !important;
          }
          .printable-area {
            margin: 0 !important;
            padding: 0 !important;
          }
          .glass-card {
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .glass-panel {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            color: black !important;
          }
          .text-white {
            color: black !important;
          }
          .text-white\\/60, .text-white\\/50, .text-white\\/40 {
            color: #475569 !important;
          }
          .gradient-text {
            background: none !important;
            -webkit-text-fill-color: black !important;
            color: black !important;
          }
          .bg-navy-950, .bg-[#020810], .bg-navy-900\\/50 {
            background: white !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            color: black !important;
            padding: 8px !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6 no-print">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2 shadow-glow">
            <span>📊</span> Clinical Pathology Vision & Manual Analyzer
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
            Lab Report AI Analyzer
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Upload images/PDFs of reports, or manually log your test values. Compile parameters into a certified clinical report sheet ready to download or print.
          </p>
        </div>
        {currentResult && (
          <button onClick={resetAnalyzer} className="btn-secondary text-xs py-2.5 px-4">
            + New Lab Analysis
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 fade-in shadow-lg no-print">
          <span>⚠️</span> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold animate-pulse shadow-glow flex items-center gap-2">
            <span>🔬</span> Evaluating biomarkers, cross-referencing physiological levels, and generating certified lab report sheet...
          </div>
          <Skeleton />
        </div>
      ) : currentResult ? (
        <LabReportSheet currentResult={currentResult} resetAnalyzer={resetAnalyzer} />
      ) : (
        <div className="max-w-3xl mx-auto glass-card p-8 sm:p-12 rounded-3xl border border-white/10 shadow-2xl space-y-8 no-print">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-4">
            <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
              <span>📄</span> Report Inputs
            </h2>
            {/* Tabs */}
            <div className="flex bg-navy-900/80 p-1 rounded-xl border border-white/10 gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'upload' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                📁 Upload Photo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('webcam')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'webcam' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                ⏺️ Camera Scan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'manual' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                ✍️ Manual Log
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="input-field cursor-pointer bg-navy-900"
              >
                <option value="General / Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                <option value="Lipid Panel / Cholesterol">Lipid Panel (Cholesterol, Triglycerides)</option>
                <option value="Blood Sugar / HbA1c / Diabetes Panel">Blood Sugar / HbA1c / Diabetes Panel</option>
                <option value="Liver Function Test (LFT)">Liver Function Test (LFT)</option>
                <option value="Kidney Function Test (KFT / Electrolytes)">Kidney Function Test (KFT / Electrolytes)</option>
                <option value="Other Medical Lab Report">Other Medical Lab Report</option>
              </select>
            </div>
          </div>

          {activeTab === 'manual' ? (
            <LabManualEntry
              manualParams={manualParams}
              newParam={newParam}
              setNewParam={setNewParam}
              handleParamChange={handleParamChange}
              handleRemoveParam={handleRemoveParam}
              handleAddParam={handleAddParam}
            />
          ) : activeTab === 'webcam' ? (
            <WebcamCapture onCapture={handleWebcamCapture} label="Open Live Lab Report Camera" />
          ) : (
            <div>
              {/* Interactive Demo Presets */}
              {!imagePreview && (
                <div className="bg-[#020810]/40 p-5 rounded-2xl border border-white/5 space-y-3 mb-4">
                  <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <span>✨</span> Clinical Demo Presets (No Photo Required):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {demoPresets.lab.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={async () => {
                          const blob = await fetch(preset.image).then(res => res.blob())
                          const file = new File([blob], preset.fileName, { type: 'image/png' })
                          setImageFile(file)
                          setImagePreview(preset.image)
                          setReportType(preset.id === 'lab-1' ? 'General / Complete Blood Count (CBC)' : 'Lipid Panel / Cholesterol')
                          setPresetData(preset)
                        }}
                        className="p-3.5 text-left rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between gap-1.5 group cursor-pointer"
                      >
                        <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">{preset.title}</div>
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
                  className="upload-zone flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/20 rounded-3xl bg-white/5 hover:bg-white/10 hover:border-cyan-500/50 transition-all cursor-pointer group shadow-inner"
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📊</div>
                  <p className="text-base font-bold text-white mb-1">Drag & Drop lab report photo here</p>
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
                  <img src={imagePreview} alt="Lab Report Preview" className="max-h-80 object-contain rounded-2xl mb-6 shadow-2xl" />
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
            disabled={activeTab === 'manual' ? manualParams.length === 0 : !imageFile}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-xl ${
              (activeTab === 'manual' ? manualParams.length > 0 : imageFile)
                ? presetData && !currentResult
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-navy-950 hover:scale-[1.01] animate-bounce shadow-emerald-500/40 ring-4 ring-emerald-400/30'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:scale-[1.01] shadow-cyan-500/20'
                : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/5'
            }`}
          >
            <span>🔬</span> {presetData && !currentResult ? 'Run High-Fidelity Demo Analysis' : activeTab === 'manual' ? 'Analyze & Generate Clinical Report Sheet' : 'Extract & Analyze Lab Report'}
          </button>
        </div>
      )}
    </div>
  )
}
