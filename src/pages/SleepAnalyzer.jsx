import { useState, useEffect } from 'react'
import { analyzeText, transcribeAudio } from '../utils/groqApi'
import { saveResult, getHistoryByType, formatTime, isDemoMode, setDemoMode, getDemoData, getApiKey } from '../utils/localStorage'
import { useSaveToCHW } from '../hooks/useSaveToCHW'
import { demoPresets } from '../data/demoPresets'
import ResultCard from '../components/ResultCard'
import LoadingSpinner from '../components/LoadingSpinner'
import Skeleton from '../components/Skeleton'

export default function SleepAnalyzer() {
  const { saveToCHW } = useSaveToCHW()
  const [activeTab, setActiveTab] = useState('form') // 'form' or 'audio'

  // Form State
  const [bedtime, setBedtime] = useState('22:30')
  const [waketime, setWaketime] = useState('06:30')
  const [snoring, setSnoring] = useState('No')
  const [rested, setRested] = useState(7)
  const [breathingDiff, setBreathingDiff] = useState('No')
  const [wakings, setWakings] = useState(1)

  // Audio State
  const [audioFile, setAudioFile] = useState(null)
  const [audioFileName, setAudioFileName] = useState('')

  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('Analyzing sleep parameters...')
  const [error, setError] = useState('')
  const [currentResult, setCurrentResult] = useState(null)
  const [weeklyHistory, setWeeklyHistory] = useState([])

  useEffect(() => {
    loadWeeklyHistory()
    
    const runDemo = async () => {
      const isAutopilot = localStorage.getItem('visiondx_autopilot') === 'active' && localStorage.getItem('visiondx_autopilot_step') === 'sleep'
      const storedTrigger = localStorage.getItem('visiondx_nav_preset_trigger')
      
      let preset = false
      if (storedTrigger) {
        const parsed = JSON.parse(storedTrigger)
        if (parsed.page === '/sleep-analyzer') {
          preset = true
          localStorage.removeItem('visiondx_nav_preset_trigger')
        }
      }
      
      if (preset || isDemoMode() || isAutopilot) {
        if (isDemoMode()) setDemoMode(false)
        const demoData = getDemoData('sleep')
        if (demoData) {
          // Fill form parameters based on demoData
          setBedtime('23:30')
          setWaketime('04:30') // 5 hours slept
          setSnoring('Yes')
          setBreathingDiff('Yes')
          setWakings(3)
          setRested(2)
          
          if (isAutopilot || preset) {
            setLoading(true)
            setTimeout(() => {
              handleFormAnalyze()
            }, 1200)
          }
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

  const loadWeeklyHistory = () => {
    const sleepHistory = getHistoryByType('sleep')
    setWeeklyHistory(sleepHistory.slice(0, 7)) // last 7 days
  }

  const calculateHours = () => {
    const [bHour, bMin] = bedtime.split(':').map(Number)
    const [wHour, wMin] = waketime.split(':').map(Number)
    let minutes = (wHour * 60 + wMin) - (bHour * 60 + bMin)
    if (minutes < 0) minutes += 24 * 60 // cross midnight
    return (minutes / 60).toFixed(1)
  }

  const handleFormAnalyze = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')
    setCurrentResult(null)
    setLoadingMsg('Analyzing sleep cycles, apnea risks, and calculating sleep score...')

    // Preset simulated fallback mode if API keys are missing
    const hasKey = getApiKey() || localStorage.getItem('visiondx_gemini_key')
    if (!hasKey) {
      setTimeout(() => {
        const saved = saveResult('sleep', demoPresets.sleep[0].fallbackResult)
        setCurrentResult(saved)
        setLoading(false)
        if (localStorage.getItem('visiondx_autopilot') === 'active') {
          window.dispatchEvent(new CustomEvent('autopilot-result-ready', { detail: { type: 'sleep', result: saved } }))
        }
      }, 1500)
      return
    }

    const hoursSlept = calculateHours()
    const prompt = `You are an expert sleep medicine AI assistant. Analyze this patient's sleep data: Bedtime: ${bedtime}, Wake time: ${waketime}, Hours slept: ${hoursSlept}, Snoring: ${snoring}, Rested feeling: ${rested}/10, Night wakings: ${wakings}, Breathing difficulty: ${breathingDiff}. 
1) Calculate a composite Sleep Score out of 100 based on sleep duration, awakenings, and rested feeling.
2) Evaluate sleep quality and identify potential conditions (e.g., Obstructive Sleep Apnea, Insomnia, Sleep fragmentation, Poor sleep hygiene). Note: Sleep apnea is severely undiagnosed in South Asia/Pakistan; flag immediately if gasping/choking or heavy snoring is reported.
3) Provide actionable sleep hygiene tips and determine medical urgency. End your response with exactly one of these urgency flags: NORMAL, SEE_DOCTOR, or EMERGENCY.`

    try {
      const aiResponse = await analyzeText(prompt)
      processAIResponse(aiResponse, `Form Analysis: ${hoursSlept}h slept. Rested: ${rested}/10. Snoring: ${snoring}.`)
    } catch (err) {
      setError(err.message || 'Failed to analyze sleep data. Please check your API key.')
      setLoading(false)
    }
  }

  const handleAudioAnalyze = async (e) => {
    e.preventDefault()
    if (!audioFile) {
      setError('Please upload a sleep audio recording.')
      return
    }

    setLoading(true)
    setError('')
    setCurrentResult(null)

    // Preset simulated fallback mode if API keys are missing
    const hasKey = getApiKey() || localStorage.getItem('visiondx_gemini_key')
    if (!hasKey) {
      setTimeout(() => {
        const saved = saveResult('sleep', demoPresets.sleep[0].fallbackResult)
        setCurrentResult(saved)
        setLoading(false)
        if (localStorage.getItem('visiondx_autopilot') === 'active') {
          window.dispatchEvent(new CustomEvent('autopilot-result-ready', { detail: { type: 'sleep', result: saved } }))
        }
      }, 1500)
      return
    }

    try {
      setLoadingMsg('Transcribing sleep sound recording with Whisper AI...')
      const transcription = await transcribeAudio(audioFile)

      setLoadingMsg('Analyzing acoustic sleep markers, snoring, and apnea indicators...')
      const prompt = `You are an expert sleep medicine AI assistant. Analyze this nighttime sleep audio transcription/description: "${transcription || '[Sleep audio sound recorded]'}". 
1) Estimate a Sleep Score out of 100 based on acoustic markers (e.g., snoring frequency, breathing pauses, restless movements).
2) Evaluate sleep quality and identify potential conditions (e.g., Obstructive Sleep Apnea, Severe snoring, Upper airway resistance). Note: Sleep apnea is severely undiagnosed in South Asia/Pakistan; flag immediately if breathing pauses or loud snoring are present.
3) Provide clear clinical advice and determine medical urgency. End your response with exactly one of these urgency flags: NORMAL, SEE_DOCTOR, or EMERGENCY.`

      const aiResponse = await analyzeText(prompt)
      processAIResponse(aiResponse, `Acoustic Analysis. Transcription: "${transcription || 'Sleep audio analyzed'}"`)

    } catch (err) {
      setError(err.message || 'Failed to analyze sleep audio. Please check your API key.')
      setLoading(false)
    }
  }

  const processAIResponse = (aiResponse, summaryPrefix) => {
    let score = 75
    const scoreMatch = aiResponse.match(/score[\s:=]+(\d+)/i) || aiResponse.match(/(\d+)\/100/)
    if (scoreMatch && scoreMatch[1]) {
      score = parseInt(scoreMatch[1])
    }

    let quality = 'Good Quality'
    if (aiResponse.toLowerCase().includes('excellent')) quality = 'Excellent Quality'
    else if (aiResponse.toLowerCase().includes('poor')) quality = 'Poor Quality'
    else if (aiResponse.toLowerCase().includes('dangerous') || aiResponse.toLowerCase().includes('apnea')) quality = 'High Apnea Risk'

    let urgency = 'NORMAL'
    if (aiResponse.includes('EMERGENCY')) urgency = 'EMERGENCY'
    else if (aiResponse.includes('SEE_DOCTOR')) urgency = 'SEE_DOCTOR'

    const resultData = {
      summary: summaryPrefix,
      rawResponse: aiResponse,
      sleepScore: score,
      details: {
        sleepScoreCalculated: `${score} / 100`,
        qualityRating: quality,
        assessedUrgency: urgency.replace('_', ' '),
        regionalScreening: 'Obstructive Sleep Apnea (OSA) screening checked'
      }
    }

    const saved = saveResult('sleep', resultData)
    setCurrentResult(saved)
    
    const chwRisk = urgency === 'EMERGENCY' ? 'critical' : urgency === 'SEE_DOCTOR' ? 'warning' : 'normal'
    saveToCHW('SleepAnalyzer', resultData.summary, chwRisk, resultData)
    
    loadWeeklyHistory()
    setLoading(false)

    if (localStorage.getItem('visiondx_autopilot') === 'active') {
      window.dispatchEvent(new CustomEvent('autopilot-result-ready', { detail: { type: 'sleep', result: saved } }))
    }
  }

  const resetAnalyzer = () => {
    setCurrentResult(null)
    setAudioFile(null)
    setAudioFileName('')
    setError('')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 slide-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2 shadow-glow">
            <span>😴</span> AI Sleep Medicine Engine
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
            Sleep Quality Analyzer
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Evaluate your sleep architecture, snoring severity, and sleep apnea risk. Fill out the quick clinical form or upload nighttime audio for Whisper AI evaluation.
          </p>
        </div>
        {currentResult && (
          <button onClick={resetAnalyzer} className="btn-secondary text-xs py-2.5 px-4">
            + New Sleep Analysis
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
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold animate-pulse shadow-glow flex items-center gap-2">
            <span>🔬</span> {loadingMsg}
          </div>
          <Skeleton />
        </div>
      ) : currentResult ? (
        <div className="space-y-8 fade-in">
          {/* Circular Score Indicator */}
          <div className="glass-card p-8 sm:p-12 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-center justify-center gap-10 shadow-2xl bg-gradient-to-tr from-navy-900 to-purple-950/30">
            <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke={currentResult.sleepScore > 79 ? '#10b981' : currentResult.sleepScore > 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10" strokeDasharray="314.16"
                  strokeDashoffset={314.16 - (314.16 * currentResult.sleepScore) / 100}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-5xl font-extrabold font-outfit text-white tracking-tight">{currentResult.sleepScore}</span>
                <span className="text-xs text-white/40 uppercase font-bold tracking-widest mt-1">Score / 100</span>
              </div>
            </div>

            <div className="space-y-4 text-center sm:text-left max-w-lg">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md ${
                currentResult.sleepScore > 79 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : currentResult.sleepScore > 50 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                <span>✨</span> {currentResult.details?.qualityRating || 'Analyzed'}
              </div>
              <h3 className="text-3xl font-extrabold text-white font-outfit tracking-tight">Sleep Architecture Assessment</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Your sleep parameters have been evaluated. Check the comprehensive clinical breakdown below for apnea screening, sleep fragmentation insights, and medical recommendations.
              </p>
            </div>
          </div>

          <ResultCard data={currentResult} />

          <div className="flex justify-center">
            <button onClick={resetAnalyzer} className="btn-primary py-3.5 px-8 text-base shadow-lg shadow-purple-500/20">
              <span>🔄</span> Perform Another Sleep Analysis
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Tabs & Form / Audio Input */}
          <div className="lg:col-span-2 space-y-6 glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl">
            {/* Tab Navigation */}
            <div className="flex p-1 rounded-2xl bg-navy-900 border border-white/10 gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'form' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                📝 Quick Clinical Form
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('audio')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'audio' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                🎙️ Upload Sleep Audio
              </button>
            </div>

            {/* Quick Form Tab */}
            {activeTab === 'form' ? (
              <form onSubmit={handleFormAnalyze} className="space-y-6 fade-in pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Bedtime</label>
                    <input
                      type="time"
                      value={bedtime}
                      onChange={(e) => setBedtime(e.target.value)}
                      className="input-field cursor-pointer bg-navy-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Wake time</label>
                    <input
                      type="time"
                      value={waketime}
                      onChange={(e) => setWaketime(e.target.value)}
                      className="input-field cursor-pointer bg-navy-900"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Did you snore?</label>
                    <select
                      value={snoring}
                      onChange={(e) => setSnoring(e.target.value)}
                      className="input-field cursor-pointer bg-navy-900"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                      <option value="Not sure">Not sure</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Breathing Difficulty?</label>
                    <select
                      value={breathingDiff}
                      onChange={(e) => setBreathingDiff(e.target.value)}
                      className="input-field cursor-pointer bg-navy-900"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes (Gasping/Choking)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Night Wakings</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={wakings}
                      onChange={(e) => setWakings(parseInt(e.target.value) || 0)}
                      className="input-field bg-navy-900"
                    />
                  </div>
                </div>

                {/* Rested Feeling Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Rested Feeling (1-10)</label>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      rested > 7 ? 'bg-emerald-500/20 text-emerald-400' : rested > 4 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {rested} / 10 ({rested > 7 ? 'Well Rested' : rested > 4 ? 'Somewhat Rested' : 'Exhausted'})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={rested}
                    onChange={(e) => setRested(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#020810] rounded-lg appearance-none cursor-pointer accent-purple-500 border border-white/10"
                  />
                  <div className="flex justify-between text-[10px] text-white/40 mt-1.5 font-semibold uppercase tracking-wider">
                    <span>1 (Exhausted)</span>
                    <span>5 (Moderate)</span>
                    <span>10 (Fully Rested)</span>
                  </div>
                </div>

                <button type="submit" className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:scale-[1.01] transition-all flex items-center justify-center gap-2 shadow-xl shadow-purple-500/20">
                  <span>🔬</span> Analyze Sleep Quality
                </button>
              </form>
            ) : (
              /* Upload Sleep Audio Tab */
              <form onSubmit={handleAudioAnalyze} className="space-y-6 fade-in pt-2">
                <div className="p-10 border-2 border-dashed border-white/20 rounded-3xl bg-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all text-center cursor-pointer group shadow-inner">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🎙️</div>
                  <p className="text-base font-bold text-white mb-1">Upload Nighttime Sleep Audio</p>
                  <p className="text-xs text-white/40 mb-6 max-w-sm mx-auto">Upload a short recording of snoring or breathing sounds (WAV, MP3, M4A, WEBM)</p>
                  <label className="btn-secondary cursor-pointer text-xs py-2.5 px-6 shadow-md inline-block">
                    Browse Sleep Audio
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) { setAudioFile(file); setAudioFileName(file.name); }
                      }}
                      className="hidden"
                    />
                  </label>
                  {audioFileName && (
                    <div className="mt-4 text-xs text-purple-300 font-mono bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-xl inline-block">
                      Selected: {audioFileName}
                    </div>
                  )}
                </div>

                <button type="submit" className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:scale-[1.01] transition-all flex items-center justify-center gap-2 shadow-xl shadow-purple-500/20">
                  <span>🔬</span> Analyze Sleep Audio with Whisper AI
                </button>
              </form>
            )}
          </div>

          {/* Weekly History Chart Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 shadow-xl">
              <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2 border-b border-white/10 pb-4">
                <span>📊</span> Weekly Sleep History
              </h2>

              {weeklyHistory.length === 0 ? (
                <div className="text-center py-12 text-white/40 text-sm space-y-2">
                  <div className="text-3xl mb-2">⏳</div>
                  <p className="font-semibold text-white/60">No sleep history recorded yet.</p>
                  <p className="text-xs max-w-xs mx-auto">Your sleep scores will build a beautiful bar chart here over time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-end justify-between gap-3 h-48 pt-4 px-2 border-b border-white/10">
                    {weeklyHistory.slice().reverse().map((entry, idx) => {
                      const score = entry.sleepScore || 70
                      const isGood = score > 79
                      const isMed = score > 50
                      return (
                        <div key={entry.id || idx} className="flex flex-col items-center gap-2 flex-1 group relative h-full justify-end">
                          {/* Tooltip */}
                          <div className="absolute -top-10 bg-navy-900 border border-white/10 text-white text-[10px] py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl font-bold">
                            Score: {score} | {formatTime(entry.timestamp)}
                          </div>
                          {/* Bar */}
                          <div
                            className={`w-full rounded-t-xl transition-all duration-500 group-hover:opacity-80 shadow-md ${
                              isGood ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : isMed ? 'bg-gradient-to-t from-yellow-600 to-yellow-400' : 'bg-gradient-to-t from-red-600 to-red-400'
                            }`}
                            style={{ height: `${score}%` }}
                          />
                          <span className="text-[10px] text-white/40 block truncate max-w-full font-semibold">
                            {formatTime(entry.timestamp).split(',')[0]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/40 pt-2 font-bold uppercase tracking-wider">
                    <span>Older</span>
                    <span>Recent</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
