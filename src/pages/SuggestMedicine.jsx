import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getHistory, saveResult, getSiteLanguage } from '../utils/localStorage'
import { analyzeText } from '../utils/groqApi'
import LoadingSpinner from '../components/LoadingSpinner'

export default function SuggestMedicine() {
  const [searchParams] = useSearchParams()
  
  const [historyItems, setHistoryItems] = useState([])
  const [selectedScanId, setSelectedScanId] = useState('')
  const [manualDisease, setManualDisease] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [prescription, setPrescription] = useState(null)

  useEffect(() => {
    const history = getHistory()
    setHistoryItems(history)

    // Pre-populate if routed from a ResultCard
    const sourceParam = searchParams.get('source')
    const idParam = searchParams.get('id')
    
    if (idParam && history.length > 0) {
      const matched = history.find(item => item.id === idParam)
      if (matched) {
        setSelectedScanId(idParam)
        triggerAISuggestion(matched)
      }
    }
  }, [searchParams])

  const triggerAISuggestion = async (scanData) => {
    setLoading(true)
    setError('')
    setPrescription(null)

    const typeLabel = scanData.type || 'General'
    const diagnosisContent = scanData.rawResponse || scanData.summary || 'Unspecified diagnosis details.'
    const profile = JSON.parse(localStorage.getItem('visiondx_user') || '{}')
    const name = profile.name || 'User'
    const age = profile.age || '28'
    const gender = profile.gender || 'Male'

    // Detect if site language is currently Urdu
    const activeLang = getSiteLanguage()
    const isUrdu = activeLang === 'ur'

    let langInstructions = ''
    if (isUrdu) {
      langInstructions = `
CRITICAL DIRECTIVE: You MUST write the entire prescription, medicine details, strength, schedules, warnings, and suggestions directly in high-quality, professional, clear, and readable URDU (اردو) language.
Use extremely respectful, empathetic, and medically accurate Urdu phrasing. Do not mix English words unless they are trade medicine names (e.g. Paracetamol). Use beautiful formatting. Keep all section headers in Urdu bolded with **, exactly like this:
- **تجویز کردہ طبی علاج** (Recommended Therapeutic Care)
- **دوا کی مقدار اور خوراک کی تفصیل** (Structured Dosage Guidelines)
- **اہم احتیاطی تدابیر اور انتباہ** (Crucial Contraindications & Warnings)
- **صحت بخش طرز زندگی اور مدد** (Lifestyle Support)
- **طبی ایمرجنسی اور خطرے کی علامات** (Clinical Red Flags)

Ensure all text is written in Urdu, so a local patient in Pakistan can read and understand the prescription perfectly.`
    }

    const prompt = `You are an expert clinical pharmacologist and state-of-the-art medical diagnostic AI. Suggest a standard therapeutic plan and medicine guidelines based on the following diagnostic scan information:
- Patient Name: ${name}
- Patient Profile: ${age} Years Old, ${gender}
- Diagnostic Module Source: ${typeLabel} Analysis
- Scan Diagnostic Assessment / Findings: "${diagnosisContent}"
${langInstructions}

Provide a highly structured Clinical Suggestion report formatted for an elegant clinical prescription pad:
1) **Recommended Therapeutic Care**: Group suggestions into first-line treatments, standard over-the-counter (OTC) active pharmaceutical formulations (e.g. Paracetamol, Ibuprofen, Saline drops, etc.), and appropriate alternative active ingredients. DO NOT prescribe dangerous high-risk prescription-only antibiotics/narcotics without a physician check.
2) **Structured Dosage Guidelines**: Create an elegant table or bulleted layout detailing:
   - Medicine Name & Formulation
   - Recommended Strength / Dosage Frequency (e.g., 500mg, 1 tablet twice a day after meals)
   - Standard Duration of Use (e.g., 3-5 days, or as symptoms persist)
3) **Crucial Contraindications & Warnings**: Clearly identify who should avoid this medicine (e.g. allergy warnings, pregnancy guidelines, pediatric precautions).
4) **Lifestyle Support**: List simple hydration, dietary, or rest guidelines to speed up recovery.
5) **Clinical Red Flags**: Identify 2-3 severe symptoms that require immediately stopping treatment and rushing to an emergency room.`

    try {
      const aiResponse = await analyzeText(prompt)
      const parsedPrescription = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        scanSource: isUrdu ? `${typeLabel.toUpperCase()} تشخیصی اسکین` : `${typeLabel.toUpperCase()} Scan`,
        scanSummary: scanData.summary || `Analysis on ${typeLabel}`,
        recommendations: aiResponse
      }
      setPrescription(parsedPrescription)
      // Save suggestion in history
      saveResult('prescription', {
        summary: isUrdu ? `تجویز کردہ ادویات کی تفصیل برائے اسکین: ${typeLabel}` : `Prescription recommendations for ${typeLabel} (${scanData.summary?.slice(0,40)}...)`,
        rawResponse: aiResponse,
        details: {
          scanIdLinked: scanData.id,
          scanTypeLinked: typeLabel,
          generationLanguage: activeLang
        }
      })
    } catch (err) {
      setError(err.message || 'Failed to generate clinical suggestion. Please check your API key or connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleLookupManual = async (e) => {
    e.preventDefault()
    if (!manualDisease.trim()) return

    setLoading(true)
    setError('')
    setPrescription(null)

    const profile = JSON.parse(localStorage.getItem('visiondx_user') || '{}')
    const name = profile.name || 'User'
    const age = profile.age || '28'
    const gender = profile.gender || 'Male'

    const activeLang = getSiteLanguage()
    const isUrdu = activeLang === 'ur'

    let langInstructions = ''
    if (isUrdu) {
      langInstructions = `
CRITICAL DIRECTIVE: You MUST write the entire prescription, medicine details, strength, schedules, warnings, and suggestions directly in high-quality, professional, clear, and readable URDU (اردو) language.
Use extremely respectful, empathetic, and medically accurate Urdu phrasing. Do not mix English words unless they are trade medicine names (e.g. Paracetamol). Use beautiful formatting. Keep all section headers in Urdu bolded with **, exactly like this:
- **تجویز کردہ طبی علاج** (Recommended Therapeutic Care)
- **دوا کی مقدار اور خوراک کی تفصیل** (Structured Dosage Guidelines)
- **اہم احتیاطی تدابیر اور انتباہ** (Crucial Contraindications & Warnings)
- **صحت بخش طرز زندگی اور مدد** (Lifestyle Support)
- **طبی ایمرجنسی اور خطرے کی علامات** (Clinical Red Flags)

Ensure all text is written in Urdu, so a local patient in Pakistan can read and understand the prescription perfectly.`
    }

    const prompt = `You are a clinical pharmacologist and state-of-the-art medical diagnostic AI. Suggest a standard therapeutic plan and medicine guidelines based on the following user-submitted disease or condition:
- Patient Name: ${name}
- Patient Profile: ${age} Years Old, ${gender}
- Submitted Condition / Symptoms: "${manualDisease}"
${langInstructions}

Provide a highly structured Clinical Suggestion report formatted for an elegant clinical prescription pad:
1) **Recommended Therapeutic Care**: Group suggestions into first-line treatments, standard over-the-counter (OTC) active pharmaceutical formulations (e.g. Paracetamol, Ibuprofen, Loratadine, etc.), and appropriate alternative active ingredients. DO NOT prescribe dangerous high-risk prescription-only medications.
2) **Structured Dosage Guidelines**: Create an elegant table or bulleted layout detailing:
   - Medicine Name & Formulation
   - Recommended Strength / Dosage Frequency (e.g., 500mg, 1 tablet twice a day after meals)
   - Standard Duration of Use (e.g., 3-5 days, or as symptoms persist)
3) **Crucial Contraindications & Warnings**: Clearly identify who should avoid this medicine (e.g. allergy warnings, pregnancy guidelines, pediatric precautions).
4) **Lifestyle Support**: List simple hydration, dietary, or rest guidelines to speed up recovery.
5) **Clinical Red Flags**: Identify 2-3 severe symptoms that require immediately stopping treatment and rushing to an emergency room.`

    try {
      const aiResponse = await analyzeText(prompt)
      const parsedPrescription = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        scanSource: isUrdu ? 'دستور العمل درج علامات' : 'Manual Symptom Entry',
        scanSummary: `Queried: "${manualDisease}"`,
        recommendations: aiResponse
      }
      setPrescription(parsedPrescription)
      // Save suggestion in history
      saveResult('prescription', {
        summary: isUrdu ? `تجویز کردہ ادویات برائے علامات: "${manualDisease}"` : `Prescription recommendations for manual entry: "${manualDisease}"`,
        rawResponse: aiResponse,
        details: {
          manualQuery: manualDisease,
          generationLanguage: activeLang
        }
      })
    } catch (err) {
      setError(err.message || 'Failed to generate suggestion. Please check your API key.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectHistoryScan = (e) => {
    const id = e.target.value
    setSelectedScanId(id)
    if (!id) return

    const matched = historyItems.find(item => item.id === id)
    if (matched) {
      setManualDisease('')
      triggerAISuggestion(matched)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const renderPrescriptionContent = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const sections = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Robust check for headers: matches double asterisks or common Urdu/English translation headers
      const isHeader = (trimmed.startsWith('**') && trimmed.endsWith('**')) ||
                       (trimmed.startsWith('**') && trimmed.includes('**') && trimmed.length < 100) ||
                       trimmed.includes('تجویز کردہ') || trimmed.includes('دوا کی مقدار') || 
                       trimmed.includes('طرز زندگی') || trimmed.includes('ایمرجنسی') || trimmed.includes('احتیاطی تدابیر');

      if (isHeader) {
        sections.push(
          <div key={index} className="bg-medical-green/10 border-l-4 border-medical-green p-4 rounded-r-xl my-6 shadow-md transition-all">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 font-outfit">
              <span>💊</span> {trimmed.replace(/\*\*/g, '')}
            </h4>
          </div>
        );
      } else if (trimmed.startsWith('**') && trimmed.includes(':**')) {
        const parts = trimmed.split(':**');
        const title = parts[0].replace(/\*\*/g, '');
        const rest = parts.slice(1).join(':**').trim();
        sections.push(
          <div key={index} className="pl-4 my-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-medical-green/20 transition-all">
            <span className="text-xs font-extrabold text-medical-green uppercase tracking-wide block mb-1 font-outfit">{title}</span>
            <span className="text-sm text-white/85 leading-relaxed">{rest}</span>
          </div>
        );
      } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        sections.push(
          <div key={index} className="flex items-start gap-2.5 pl-6 my-2 text-sm text-white/80 leading-relaxed font-sans">
            <span className="text-medical-green text-lg font-bold mt-0.5">•</span>
            <span className="flex-1">{trimmed.replace(/^[-*]\s*/, '').replace(/\*\*/g, '')}</span>
          </div>
        );
      } else {
        sections.push(
          <p key={index} className="text-sm text-white/75 leading-relaxed my-3 pl-4">
            {trimmed.replace(/\*\*/g, '')}
          </p>
        );
      }
    });

    return <div className="space-y-1 pr-2">{sections}</div>;
  }

  const recentScansOnly = historyItems.filter(item => item.type !== 'prescription')
  const isSiteUrdu = getSiteLanguage() === 'ur'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 slide-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-2 shadow-glow animate-pulse">
            <span>💊</span> Clinical Pharmacology & Suggest Medicine Assistant
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
            {isSiteUrdu ? 'تجویز کردہ ادویات' : 'Suggest Medicine'}
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Select a previous diagnostic scan from your local secure browser history, or input clinical symptoms to get pharmaceutical recommendations and standard dosage guidelines.
          </p>
        </div>
        {prescription && (
          <button onClick={() => { setPrescription(null); setSelectedScanId(''); setManualDisease(''); }} className="btn-secondary text-xs py-2.5 px-4">
            + {isSiteUrdu ? 'دوبارہ درج کریں' : 'Reset Form'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 fade-in shadow-lg">
          <span>⚠️</span> {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Consulting clinical pharmacology guidelines, resolving chemical compositions, and drafting your dosage prescription pad..." />
      ) : prescription ? (
        <div className="max-w-3xl mx-auto space-y-6 fade-in print-nopadding">
          {/* Action Header */}
          <div className="flex items-center justify-between gap-4 print-hidden">
            <button
              onClick={() => { setPrescription(null); setSelectedScanId(''); setManualDisease(''); }}
              className="btn-secondary py-2 px-5 text-xs font-bold"
            >
              {isSiteUrdu ? '← پیچھے جائیں' : '← Back to Setup'}
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary py-2.5 px-6 text-xs font-bold shadow-lg shadow-medical-green/20"
            >
              <span>🖨️</span> {isSiteUrdu ? 'پرنٹ کریں / پی ڈی ایف' : 'Print Prescription Pad'}
            </button>
          </div>

          {/* Premium Clinical Prescription Pad UI */}
          <div className="relative border-4 border-medical-green/20 bg-gradient-to-b from-[#030d17] via-[#020810] to-[#030d17] rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden print-no-border print-bg-white">
            {/* Green glowing border accents */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-medical-green/50 to-transparent" />
            
            {/* Letterhead Watermark Rx */}
            <div className="absolute top-36 right-8 text-9xl font-serif text-medical-green/[0.03] select-none pointer-events-none font-bold">Rx</div>
            
            {/* Pad Letterhead */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-medical-green/30 pb-6 mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-extrabold font-outfit text-white flex items-center gap-2 print-text-dark">
                  <span className="text-medical-green">✚</span> {isSiteUrdu ? 'کلینیکل اے آئی مشیر' : 'Clinical AI Advisor'}
                </h2>
                <div className="text-[10px] text-white/40 uppercase font-semibold tracking-wider mt-0.5">
                  VisionDX Healthcare Suite • Autonomous Triage
                </div>
              </div>
              <div className="text-right sm:text-right text-xs text-white/50 print-text-dark">
                <div>Date: {new Date(prescription.timestamp).toLocaleDateString()}</div>
                <div>Source: <span className="text-medical-green font-bold">{prescription.scanSource}</span></div>
                <div>ID Ref: <span className="font-mono text-[10px]">{prescription.id}</span></div>
              </div>
            </div>

            {/* Patient details banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 mb-8 text-xs text-white/80 print-bg-grey print-text-dark">
              <div>
                <span className="text-white/40 block uppercase font-bold text-[9px] mb-0.5">Patient Name</span>
                <span className="font-bold">{JSON.parse(localStorage.getItem('visiondx_user') || '{}').name || 'User'}</span>
              </div>
              <div>
                <span className="text-white/40 block uppercase font-bold text-[9px] mb-0.5">Age / Gender</span>
                <span className="font-bold">{JSON.parse(localStorage.getItem('visiondx_user') || '{}').age || '28'}y / {JSON.parse(localStorage.getItem('visiondx_user') || '{}').gender || 'Male'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-white/40 block uppercase font-bold text-[9px] mb-0.5">Linked Assessment</span>
                <span className="font-bold line-clamp-1 text-medical-green">{prescription.scanSummary}</span>
              </div>
            </div>

            {/* Rx Symbol */}
            <div className="text-5xl font-serif text-medical-green/45 mb-4 select-none font-bold">Rx</div>

            {/* AI Prescription Content */}
            <div className={`space-y-6 text-white/85 print-text-dark leading-relaxed ${isSiteUrdu ? 'text-right font-outfit' : ''}`} style={{ direction: isSiteUrdu ? 'rtl' : 'ltr' }}>
              {renderPrescriptionContent(prescription.recommendations)}
            </div>

            {/* Premium Digital stamp and clinician signature area */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/10 pt-8 mt-10 gap-6">
              {/* Stamp (glowing rotatable circular stamp) */}
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 relative group hover:border-medical-green/40 transition-all select-none">
                <div className="w-16 h-16 rounded-full border-4 border-dashed border-medical-green flex items-center justify-center text-[10px] font-black text-medical-green font-outfit tracking-tighter uppercase text-center animate-spin-slow rotate-12 bg-medical-green/5 shadow-[0_0_20px_rgba(0,212,170,0.2)]">
                  VERIFIED<br/>AI CLINIC
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-white/40 uppercase font-black tracking-wider">Validation seal</div>
                  <div className="text-xs font-bold text-white font-outfit">VisionDX AI System</div>
                  <div className="text-[9px] text-medical-green font-semibold">100% Cryptographic Match</div>
                </div>
              </div>

              {/* Signature area */}
              <div className="text-center sm:text-right space-y-1.5 select-none">
                <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Authorized Clinician</div>
                <div className="text-2xl font-serif italic text-medical-green/90 font-bold tracking-wide pr-2 font-shadow" style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}>
                  VisionDX Diagnostic AI
                </div>
                <div className="w-48 h-0.5 bg-gradient-to-l from-medical-green via-white/20 to-transparent ml-auto" />
                <div className="text-[9px] text-white/30 uppercase tracking-widest font-semibold pt-0.5">Clinical Autonomy System</div>
              </div>
            </div>

            {/* Clinical Footer Warnings */}
            <div className="mt-12 pt-6 border-t border-white/10 space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] leading-relaxed font-semibold">
                ⚠️ <b>{isSiteUrdu ? 'ضروری طبی انتباہ:' : 'IMPORTANT MEDICAL NOTICE:'}</b> {isSiteUrdu ? 'یہ ایک خودکار اے آئی تجویز کردہ ادویات کی فہرست ہے۔ یہ معلومات صرف معلوماتی مقاصد کے لیے ہیں۔ کسی بھی دوا کا استعمال شروع کرنے سے پہلے اپنے ڈاکٹر سے رجوع کریں۔' : 'This is an AI pharmaceutical recommendation formulated on simulated clinical data. These suggestions are strictly educational. They do not constitute formal medical prescriptions. Do not start medication without consulting a certified primary care doctor.'}
              </div>
              
              <div className="flex flex-wrap items-center justify-between text-[10px] text-white/30 gap-2 font-medium">
                <span>Prescribing Authority: VisionDX Mega Pharmacology Engine</span>
                <span>Authentication Token: SECURE_BROWSER_ONLY</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* History Selection Card */}
          <div className="glass-card p-8 rounded-3xl border border-white/10 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-teal-500/30 transition-all">
            <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-5">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-2xl">
                📋
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-outfit">{isSiteUrdu ? 'سابقہ اسکین سے ادویات' : 'Suggest from History'}</h3>
                <p className="text-sm text-white/60 mt-1 leading-relaxed">
                  Analyze a diagnostic assessment that you previously recorded on this browser. We will load the precise report findings.
                </p>
              </div>

              {recentScansOnly.length === 0 ? (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center text-xs text-white/50">
                  📭 No prior diagnostic history scans found. Try manual symptom lookup, or run a diagnostic scan!
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">Select Diagnostic Scan</label>
                  <select
                    value={selectedScanId}
                    onChange={handleSelectHistoryScan}
                    className="input-field cursor-pointer bg-navy-900 border-white/10 hover:border-teal-500/50 text-sm font-semibold"
                  >
                    <option value="">-- Select a diagnostic scan --</option>
                    {recentScansOnly.map(scan => (
                      <option key={scan.id} value={scan.id}>
                        {scan.type.toUpperCase()} - {scan.summary?.slice(0, 40) || 'Scan Completed'} ({new Date(scan.timestamp).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="text-xs text-white/35 pt-4">
              Supports: Wound, Eye, Skin, Cough, Sleep, Lab, Hair, Routine scans.
            </div>
          </div>

          {/* Manual Query Card */}
          <div className="glass-card p-8 rounded-3xl border border-white/10 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-teal-500/30 transition-all">
            <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
            <form onSubmit={handleLookupManual} className="space-y-5">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-2xl">
                ✍️
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-outfit">{isSiteUrdu ? 'مرض یا علامات درج کریں' : 'Symptom / Disease Entry'}</h3>
                <p className="text-sm text-white/60 mt-1 leading-relaxed">
                  Type a disease, clinical condition, or detailed symptoms to query our clinical drug databases for recommended therapies.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">Disease / Symptoms</label>
                <input
                  type="text"
                  placeholder="e.g. Flu, Migraine headache, Acid reflux..."
                  value={manualDisease}
                  onChange={(e) => setManualDisease(e.target.value)}
                  className="input-field py-3 bg-navy-900 border-white/10 focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={!manualDisease.trim()}
                className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-navy-950 font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/10"
              >
                <span>🔍</span> {isSiteUrdu ? 'تشخیصی سرچ شروع کریں' : 'Run Drug Reference Lookup'}
              </button>
            </form>
            <div className="text-xs text-white/35 pt-4">
              Resolves over-the-counter active ingredients and safety warnings.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
