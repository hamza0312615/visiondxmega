import { useState, useEffect } from 'react'
import { analyzeImage, analyzeText } from '../utils/groqApi'
import { saveResult, isDemoMode, setDemoMode, getApiKey } from '../utils/localStorage'
import { demoPresets } from '../data/demoPresets'
import ResultCard from '../components/ResultCard'
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

  // Default templates for manual entry parameters
  const templates = {
    'General / Complete Blood Count (CBC)': [
      { name: 'Hemoglobin', value: '13.5', unit: 'g/dL', refRange: '12.0 - 16.0' },
      { name: 'White Blood Cell (WBC)', value: '7.5', unit: 'x10^3/uL', refRange: '4.0 - 11.0' },
      { name: 'Red Blood Cell (RBC)', value: '4.8', unit: 'x10^6/uL', refRange: '4.2 - 5.4' },
      { name: 'Platelet Count', value: '250', unit: 'x10^3/uL', refRange: '150 - 450' }
    ],
    'Lipid Panel / Cholesterol': [
      { name: 'Total Cholesterol', value: '210', unit: 'mg/dL', refRange: '< 200' },
      { name: 'HDL (Good) Cholesterol', value: '45', unit: 'mg/dL', refRange: '> 40' },
      { name: 'LDL (Bad) Cholesterol', value: '135', unit: 'mg/dL', refRange: '< 100' },
      { name: 'Triglycerides', value: '160', unit: 'mg/dL', refRange: '< 150' }
    ],
    'Blood Sugar / HbA1c / Diabetes Panel': [
      { name: 'Fasting Blood Sugar', value: '98', unit: 'mg/dL', refRange: '70 - 99' },
      { name: 'Post-Prandial Glucose', value: '145', unit: 'mg/dL', refRange: '< 140' },
      { name: 'HbA1c (Glycated Hb)', value: '6.1', unit: '%', refRange: '< 5.7' }
    ],
    'Liver Function Test (LFT)': [
      { name: 'Bilirubin Total', value: '0.9', unit: 'mg/dL', refRange: '0.2 - 1.2' },
      { name: 'SGOT / AST', value: '38', unit: 'U/L', refRange: '8 - 48' },
      { name: 'SGPT / ALT', value: '42', unit: 'U/L', refRange: '7 - 56' },
      { name: 'Alkaline Phosphatase', value: '90', unit: 'U/L', refRange: '44 - 147' }
    ],
    'Kidney Function Test (KFT / Electrolytes)': [
      { name: 'Serum Creatinine', value: '1.1', unit: 'mg/dL', refRange: '0.6 - 1.2' },
      { name: 'Blood Urea Nitrogen (BUN)', value: '16', unit: 'mg/dL', refRange: '7 - 20' },
      { name: 'Serum Sodium', value: '140', unit: 'mEq/L', refRange: '135 - 145' },
      { name: 'Serum Potassium', value: '4.2', unit: 'mEq/L', refRange: '3.5 - 5.0' }
    ]
  }

  // Pre-fill parameters when category changes
  useEffect(() => {
    if (templates[reportType]) {
      setManualParams(templates[reportType])
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
    
    const activeFile = customFile || imageFile
    const activeParams = customParams || manualParams

    if (activeTab !== 'manual' && !activeFile) {
      setError('Please capture or upload a lab report photo to analyze.')
      return
    }

    if (activeTab === 'manual' && activeParams.length === 0) {
      setError('Please enter at least one lab parameter to analyze.')
      return
    }

    setLoading(true)
    setError('')
    setCurrentResult(null)

    // Preset simulated fallback mode if API keys are missing
    const activePreset = forcePreset || presetData
    const hasKey = getApiKey() || localStorage.getItem('visiondx_gemini_key')
    if (activePreset && activeFile && activeFile.name === activePreset.fileName && !hasKey) {
      setTimeout(() => {
        const saved = saveResult('lab', activePreset.fallbackResult)
        setCurrentResult(saved)
        setLoading(false)
        
        if (localStorage.getItem('visiondx_autopilot') === 'active') {
          window.dispatchEvent(new CustomEvent('autopilot-result-ready', { detail: { type: 'lab', result: saved } }))
        }
      }, 1500)
      return
    }

    // Load active patient profile
    const profile = JSON.parse(localStorage.getItem('visiondx_user') || '{"name":"John Doe","age":"30","gender":"Male"}')

    let aiResponse = ''
    try {
      if (activeTab === 'manual') {
        const textPrompt = `You are an expert clinical pathologist AI assistant. A patient has manually logged their lab report results.
Patient Details:
- Name: ${profile.name}
- Age: ${profile.age} years
- Gender: ${profile.gender}
Report Type: ${reportType}

Entered Parameters:
${activeParams.map(p => `- ${p.name}: ${p.value} ${p.unit} (Ref Range: ${p.refRange || 'Not specified'})`).join('\n')}

Analyze these medical parameters:
1) Identify all abnormal/out-of-range values. Match them against the specified reference ranges.
2) In a section titled "**Diagnostics Interpretation**", explain what these abnormal values indicate in simple, patient-friendly terms, potential underlying causes, and suggested dietary/lifestyle modifications.
3) In a section titled "**Suggested Precautions & Early Care**", suggest generic early care precautions or nutritional advice to follow in the absence of a doctor.
4) End your response with exactly one of these urgency flags: NORMAL, SEE_DOCTOR, or EMERGENCY.`

        aiResponse = await analyzeText(textPrompt)
      } else {
        const visionPrompt = `You are an expert clinical pathologist AI assistant. Analyze this medical lab report image. Report Type specified by patient: "${reportType}".
Patient Profile context: Name: ${profile.name}, Age: ${profile.age}, Gender: ${profile.gender}.
1) Perform optical character recognition to extract key test parameters, patient results, and reference ranges.
2) Clearly identify and list all abnormal values (e.g., High/Low flags).
3) In a section titled "**Diagnostics Interpretation**", explain what these abnormal values indicate in simple, patient-friendly terms, potential underlying causes, and suggested dietary/lifestyle modifications.
4) In a section titled "**Suggested Precautions & Early Care**", suggest generic early care precautions or nutritional advice to follow in the absence of a doctor.
5) Provide clear clinical advice and determine medical urgency. End your response with exactly one of these urgency flags: NORMAL, SEE_DOCTOR, or EMERGENCY.`

        aiResponse = await analyzeImage(activeFile, visionPrompt)
      }

      let abnormalSummary = 'Analyzing parameters...'
      const lowerRes = aiResponse.toLowerCase()
      if (lowerRes.includes('normal') && !lowerRes.includes('abnormal') && !lowerRes.includes('high') && !lowerRes.includes('low')) {
        abnormalSummary = 'All Key Parameters Appear Within Normal Reference Ranges'
      } else {
        abnormalSummary = 'Abnormal Values / Out-of-Range Parameters Detected'
      }

      let urgency = 'SEE_DOCTOR'
      if (aiResponse.includes('EMERGENCY')) urgency = 'EMERGENCY'
      else if (aiResponse.includes('NORMAL')) urgency = 'NORMAL'

      const resultDetails = {
        patientName: profile.name,
        patientAge: `${profile.age} Years`,
        patientGender: profile.gender,
        reportCategory: reportType,
        parameterAssessment: abnormalSummary,
        assessedUrgency: urgency.replace('_', ' ')
      }

      // Add manual params data to history if entered manually, so we can re-render the table
      const resultData = {
        summary: `Lab Report Analysis (${reportType}): ${abnormalSummary}. Urgency: ${urgency.replace('_', ' ')}.`,
        rawResponse: aiResponse,
        details: resultDetails,
        loggedParameters: activeTab === 'manual' ? activeParams : null
      }

      const saved = saveResult('lab', resultData)
      setCurrentResult(saved)

      if (localStorage.getItem('visiondx_autopilot') === 'active') {
        window.dispatchEvent(new CustomEvent('autopilot-result-ready', { detail: { type: 'lab', result: saved } }))
      }

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
    if (templates[reportType]) {
      setManualParams(templates[reportType])
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
        <div className="space-y-8 fade-in">
          {/* Custom Pathology Print Sheet */}
          <div className="glass-card p-6 sm:p-10 rounded-3xl border border-white/10 shadow-2xl space-y-8 bg-[#0a192f]/45">
            {/* Lab Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-cyan-500/30 pb-6 gap-4">
              <div className="space-y-1">
                <div className="text-2xl font-extrabold font-outfit text-white flex items-center gap-2">
                  <span className="text-cyan-400">✚</span> VisionDX Labs
                </div>
                <p className="text-xs text-white/50">ISO 9001:2015 Certified Diagnostic Services</p>
              </div>
              <div className="text-left sm:text-right text-xs text-white/50">
                <p>Requisition ID: <span className="font-mono text-cyan-300 font-bold">VDX-{Math.floor(100000 + Math.random() * 900000)}</span></p>
                <p>Date Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Patient Credentials */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 bg-white/5 border border-white/10 p-5 rounded-2xl">
              <div>
                <span className="block text-[10px] uppercase font-bold text-white/40 tracking-wider">Patient Name</span>
                <span className="text-sm font-semibold text-white">{currentResult.details.patientName}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-white/40 tracking-wider">Age / Gender</span>
                <span className="text-sm font-semibold text-white">{currentResult.details.patientAge} / {currentResult.details.patientGender}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="block text-[10px] uppercase font-bold text-white/40 tracking-wider">Report Category</span>
                <span className="text-sm font-semibold text-cyan-400">{currentResult.details.reportCategory}</span>
              </div>
            </div>

            {/* Parameters Table if Logged Manually */}
            {currentResult.loggedParameters && currentResult.loggedParameters.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white font-outfit">Biomarker Log Table</h3>
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-[10px] uppercase font-bold text-white/60 border-b border-white/10">
                        <th className="p-4">Parameter Name</th>
                        <th className="p-4">Result Value</th>
                        <th className="p-4">Unit</th>
                        <th className="p-4">Reference Range</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-semibold text-white/80 division-y division-white/5">
                      {currentResult.loggedParameters.map((p, idx) => {
                        // Rough checker for status highlight
                        const val = parseFloat(p.value)
                        let isHigh = false
                        let isLow = false
                        if (p.refRange && p.refRange.includes('-')) {
                          const parts = p.refRange.split('-')
                          const min = parseFloat(parts[0])
                          const max = parseFloat(parts[1])
                          if (!isNaN(val)) {
                            if (!isNaN(min) && val < min) isLow = true
                            if (!isNaN(max) && val > max) isHigh = true
                          }
                        } else if (p.refRange && p.refRange.startsWith('<')) {
                          const max = parseFloat(p.refRange.replace('<', '').trim())
                          if (!isNaN(val) && !isNaN(max) && val > max) isHigh = true
                        } else if (p.refRange && p.refRange.startsWith('>')) {
                          const min = parseFloat(p.refRange.replace('>', '').trim())
                          if (!isNaN(val) && !isNaN(min) && val < min) isLow = true
                        }

                        return (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4 font-bold text-white">{p.name}</td>
                            <td className="p-4 font-mono">{p.value}</td>
                            <td className="p-4 text-white/50">{p.unit}</td>
                            <td className="p-4 text-white/50">{p.refRange}</td>
                            <td className="p-4">
                              {isHigh ? (
                                <span className="px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[10px]">▲ HIGH</span>
                              ) : isLow ? (
                                <span className="px-2.5 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px]">▼ LOW</span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px]">✓ NORMAL</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AI pathology breakdown */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white font-outfit border-b border-white/5 pb-2">AI Diagnostic Analysis & Suggestions</h3>
              <ResultCard data={currentResult} />
            </div>
          </div>
          
          <div className="flex justify-center gap-4 no-print">
            <button onClick={window.print} className="btn-primary py-3.5 px-8 text-base shadow-lg shadow-cyan-500/20">
              <span>🖨️</span> Download Report / Print PDF
            </button>
            <button onClick={resetAnalyzer} className="btn-secondary py-3.5 px-8 text-base">
              <span>📸</span> Log Another Report
            </button>
          </div>
        </div>
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
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">Log Biomarker Values</h3>
                <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md font-semibold">Template Pre-filled</span>
              </div>

              {/* Param Input List */}
              <div className="space-y-3">
                {manualParams.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => handleParamChange(idx, 'name', e.target.value)}
                        placeholder="Parameter (e.g. Hemoglobin)"
                        className="w-full bg-transparent border-b border-white/10 text-white placeholder:text-white/20 text-xs focus:outline-none focus:border-cyan-400 py-1 font-bold"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={p.value}
                        onChange={(e) => handleParamChange(idx, 'value', e.target.value)}
                        placeholder="Value (e.g. 13.5)"
                        className="w-full bg-transparent border-b border-white/10 text-white placeholder:text-white/20 text-xs text-center font-mono focus:outline-none focus:border-cyan-400 py-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={p.unit}
                        onChange={(e) => handleParamChange(idx, 'unit', e.target.value)}
                        placeholder="Unit (e.g. g/dL)"
                        className="w-full bg-transparent border-b border-white/10 text-white placeholder:text-white/20 text-xs text-center focus:outline-none focus:border-cyan-400 py-1"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={p.refRange}
                        onChange={(e) => handleParamChange(idx, 'refRange', e.target.value)}
                        placeholder="Ref (e.g. 12.0 - 16.0)"
                        className="w-full bg-transparent border-b border-white/10 text-white placeholder:text-white/20 text-xs text-center focus:outline-none focus:border-cyan-400 py-1"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveParam(idx)}
                        className="text-red-400 hover:text-red-300 text-sm font-bold p-1"
                        title="Remove row"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Row Box */}
              <div className="grid grid-cols-12 gap-3 items-center bg-cyan-500/5 p-4 rounded-xl border border-dashed border-cyan-500/20">
                <div className="col-span-4">
                  <input
                    type="text"
                    value={newParam.name}
                    onChange={(e) => setNewParam({ ...newParam, name: e.target.value })}
                    placeholder="New Parameter"
                    className="w-full bg-transparent border-b border-cyan-500/20 text-white placeholder:text-white/20 text-xs focus:outline-none focus:border-cyan-400 py-1"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={newParam.value}
                    onChange={(e) => setNewParam({ ...newParam, value: e.target.value })}
                    placeholder="Value"
                    className="w-full bg-transparent border-b border-cyan-500/20 text-white placeholder:text-white/20 text-xs text-center focus:outline-none focus:border-cyan-400 py-1"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={newParam.unit}
                    onChange={(e) => setNewParam({ ...newParam, unit: e.target.value })}
                    placeholder="Unit"
                    className="w-full bg-transparent border-b border-cyan-500/20 text-white placeholder:text-white/20 text-xs text-center focus:outline-none focus:border-cyan-400 py-1"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    value={newParam.refRange}
                    onChange={(e) => setNewParam({ ...newParam, refRange: e.target.value })}
                    placeholder="Ref Range"
                    className="w-full bg-transparent border-b border-cyan-500/20 text-white placeholder:text-white/20 text-xs text-center focus:outline-none focus:border-cyan-400 py-1"
                  />
                </div>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={handleAddParam}
                    className="text-cyan-400 hover:text-cyan-300 font-extrabold text-lg p-1"
                    title="Add Parameter"
                  >
                    ＋
                  </button>
                </div>
              </div>
            </div>
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
