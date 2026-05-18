import { useState } from 'react'
import { analyzeImage } from '../utils/groqApi'
import { saveResult } from '../utils/localStorage'
import ResultCard from '../components/ResultCard'
import LoadingSpinner from '../components/LoadingSpinner'
import WebcamCapture from '../components/WebcamCapture'

export default function LabReportAnalyzer() {
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [activeTab, setActiveTab] = useState('upload') // 'upload' or 'webcam'
  const [reportType, setReportType] = useState('General / Complete Blood Count (CBC)')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentResult, setCurrentResult] = useState(null)

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

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault()
    if (!imageFile) {
      setError('Please capture or upload a lab report photo to analyze.')
      return
    }

    setLoading(true)
    setError('')
    setCurrentResult(null)

    const prompt = `You are an expert clinical pathologist AI assistant. Analyze this medical lab report image. Report Type specified by patient: "${reportType}".
1) Perform optical character recognition to extract key test parameters, patient results, and reference ranges.
2) Clearly identify and list all abnormal values (e.g., High/Low flags).
3) Explain what these abnormal values indicate in simple, patient-friendly terms, potential underlying causes, and suggested dietary/lifestyle modifications.
4) Provide clear clinical advice and determine medical urgency. End your response with exactly one of these urgency flags: NORMAL, SEE_DOCTOR, or EMERGENCY.`

    try {
      const aiResponse = await analyzeImage(imageFile, prompt)

      let abnormalSummary = 'Analyzing parameters...'
      if (aiResponse.toLowerCase().includes('normal') && !aiResponse.toLowerCase().includes('abnormal') && !aiResponse.toLowerCase().includes('high') && !aiResponse.toLowerCase().includes('low')) {
        abnormalSummary = 'All Key Parameters Appear Within Normal Reference Ranges'
      } else {
        abnormalSummary = 'Abnormal Values / Out-of-Range Parameters Detected'
      }

      let urgency = 'SEE_DOCTOR'
      if (aiResponse.includes('EMERGENCY')) urgency = 'EMERGENCY'
      else if (aiResponse.includes('NORMAL')) urgency = 'NORMAL'

      const resultData = {
        summary: `Lab Report Analysis (${reportType}): ${abnormalSummary}. Urgency: ${urgency.replace('_', ' ')}.`,
        rawResponse: aiResponse,
        details: {
          reportCategory: reportType,
          parameterAssessment: abnormalSummary,
          assessedUrgency: urgency.replace('_', ' '),
          pathologistNote: 'Always share these AI observations with your ordering physician for definitive clinical correlation.'
        }
      }

      const saved = saveResult('lab', resultData)
      setCurrentResult(saved)

    } catch (err) {
      setError(err.message || 'Failed to analyze lab report image. Please check your API key or try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetAnalyzer = () => {
    setImageFile(null)
    setImagePreview('')
    setCurrentResult(null)
    setError('')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 slide-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2 shadow-glow">
            <span>📊</span> Clinical Pathology Vision AI
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
            Lab Report AI Analyzer
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Upload or capture a photo of your medical lab reports (CBC, Lipid Panel, LFT, KFT, Urinalysis). Our AI extracts test parameters, flags abnormal values, and explains clinical significance in simple terms.
          </p>
        </div>
        {currentResult && (
          <button onClick={resetAnalyzer} className="btn-secondary text-xs py-2.5 px-4">
            + New Lab Analysis
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 fade-in shadow-lg">
          <span>⚠️</span> {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Extracting lab parameters, reference ranges, matching pathologist database, and evaluating abnormal flags..." />
      ) : currentResult ? (
        <div className="space-y-8 fade-in">
          <ResultCard data={currentResult} />
          <div className="flex justify-center">
            <button onClick={resetAnalyzer} className="btn-primary py-3.5 px-8 text-base shadow-lg shadow-cyan-500/20">
              <span>📸</span> Analyze Another Lab Report
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto glass-card p-8 sm:p-12 rounded-3xl border border-white/10 shadow-2xl space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
              <span>📸</span> Capture or Upload Lab Report
            </h2>
            {/* Tabs */}
            <div className="flex bg-navy-900/80 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'upload' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                📁 Upload
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('webcam')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'webcam' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                ⏺️ Live Camera
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                Select Report Category
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="input-field cursor-pointer bg-navy-900"
              >
                <option value="General / Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                <option value="Lipid Panel / Cholesterol">Lipid Panel (Cholesterol, Triglycerides)</option>
                <option value="Liver Function Test (LFT)">Liver Function Test (LFT)</option>
                <option value="Kidney Function Test (KFT / Electrolytes)">Kidney Function Test (KFT / Electrolytes)</option>
                <option value="Blood Sugar / HbA1c / Diabetes Panel">Blood Sugar / HbA1c / Diabetes Panel</option>
                <option value="Thyroid Panel (TSH, T3, T4)">Thyroid Panel (TSH, T3, T4)</option>
                <option value="Urinalysis / Routine Urine Test">Urinalysis / Routine Urine Test</option>
                <option value="Other Medical Lab Report">Other Medical Lab Report</option>
              </select>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Ensure the test names, patient results, and reference ranges are clearly visible and well-lit for accurate AI optical character recognition.
            </p>
          </div>

          {activeTab === 'webcam' ? (
            <WebcamCapture onCapture={handleWebcamCapture} label="Open Live Lab Report Camera" />
          ) : (
            <div>
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

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!imageFile}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-xl ${
              imageFile
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:scale-[1.01] shadow-cyan-500/20'
                : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/5'
            }`}
          >
            <span>🔬</span> Analyze Lab Report with Vision AI
          </button>
        </div>
      )}
    </div>
  )
}
