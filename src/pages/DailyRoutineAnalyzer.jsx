import { useState, useEffect } from 'react'
import { analyzeText } from '../utils/groqApi'
import { saveResult, isDemoMode, setDemoMode, getDemoData, getApiKey } from '../utils/localStorage'
import { isApiKeyMissing, executeFallback } from '../utils/fallback'
import { demoPresets } from '../data/demoPresets'
import ResultCard from '../components/ResultCard'
import LoadingSpinner from '../components/LoadingSpinner'
import Skeleton from '../components/Skeleton'

export default function DailyRoutineAnalyzer() {
  const [sleep, setSleep] = useState(7)
  const [water, setWater] = useState(2.0)
  const [activity, setActivity] = useState(30)
  const [diet, setDiet] = useState('Balanced Diet')
  const [screenTime, setScreenTime] = useState(4)
  const [stress, setStress] = useState('Moderate')
  const [goal, setGoal] = useState('General Health & Energy')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentResult, setCurrentResult] = useState(null)

  useEffect(() => {
    const runDemo = async () => {
      const isAutopilot = localStorage.getItem('visiondx_autopilot') === 'active' && localStorage.getItem('visiondx_autopilot_step') === 'routine'
      const storedTrigger = localStorage.getItem('visiondx_nav_preset_trigger')
      
      let preset = false
      if (storedTrigger) {
        const parsed = JSON.parse(storedTrigger)
        if (parsed.page === '/routine-analyzer') {
          preset = true
          localStorage.removeItem('visiondx_nav_preset_trigger')
        }
      }
      
      if (preset || isDemoMode() || isAutopilot) {
        if (isDemoMode()) setDemoMode(false) // Clear global demo mode flag immediately to prevent repeat triggers
        const demoData = getDemoData('routine')
        if (demoData) {
          setSleep(parseFloat(demoData.sleep) || 5)
          setWater(parseFloat(demoData.water) || 3)
          setScreenTime(parseInt(demoData.screenTime) || 9)
          setStress(demoData.stress || 'High')
          setActivity(demoData.activity === 'Sedentary' ? 10 : 30)
          setDiet('Fast Food / Processed Meals')
          setGoal('Mental Focus & Productivity')
          
          if (isAutopilot || preset) {
            setLoading(true)
            setTimeout(() => {
              handleAnalyze()
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

  // Calculate live health score in real-time
  const getLiveScore = () => {
    let sleepScore = sleep >= 7 && sleep <= 9 ? 100 : sleep === 6 || sleep === 10 ? 80 : sleep === 5 || sleep === 11 ? 60 : 40
    let waterScore = water >= 3.0 ? 100 : water >= 2.0 ? 85 : water >= 1.0 ? 60 : 30
    let activityScore = activity >= 60 ? 100 : activity >= 30 ? 90 : activity >= 15 ? 70 : 40
    let screenScore = screenTime <= 2 ? 100 : screenTime <= 4 ? 85 : screenTime <= 7 ? 60 : 30
    let stressScore = stress === 'Low' ? 100 : stress === 'Moderate' ? 70 : 30

    return Math.round(
      (sleepScore * 0.25) +
      (waterScore * 0.20) +
      (activityScore * 0.25) +
      (screenScore * 0.15) +
      (stressScore * 0.15)
    )
  }

  const liveScore = getLiveScore()

  const getScoreColor = (score) => {
    if (score < 60) return { text: 'text-red-400', border: 'border-red-500/20', bg: 'from-red-500/20 to-orange-500/10', circle: '#ef4444', label: 'Needs Improvement / Poor Habits' }
    if (score < 85) return { text: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'from-yellow-500/20 to-amber-500/10', circle: '#eab308', label: 'Moderate Wellness Alignment' }
    return { text: 'text-medical-green', border: 'border-medical-green/20', bg: 'from-medical-green/20 to-teal-500/10', circle: '#00d4aa', label: 'Optimal / Excellent Lifestyle' }
  }

  const scoreMeta = getScoreColor(liveScore)

  const getLiveTips = () => {
    const tips = []
    if (sleep < 6) tips.push('⚠️ High risk of cognitive fatigue. Prioritize 7-8h sleep.')
    else if (sleep >= 7 && sleep <= 9) tips.push('✅ Perfect sleep duration for cell repair!')
    
    if (water < 2.0) tips.push('💧 Hydration deficit. Boost hydration for kidney efficiency.')
    else if (water >= 3.0) tips.push('✅ Superb cellular hydration levels!')

    if (activity < 30) tips.push('🚶 Aim for at least 30 minutes of aerobic exercise.')
    else if (activity >= 60) tips.push('🏋️ Amazing cardiovascular routine!')

    if (screenTime > 6) tips.push('📱 Screen overload. Take 20-20-20 visual breaks.')
    else if (screenTime <= 2) tips.push('✅ Excellent low screen-exposure score!')

    if (stress === 'High') tips.push('🧘 High stress detected. Consider a 10m breathing gap.')
    return tips
  }

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')
    setCurrentResult(null)

    // Preset simulated fallback mode if API keys are missing
    if (isApiKeyMissing()) {
      executeFallback({
        type: 'routine',
        fallbackResult: demoPresets.routine[0].fallbackResult,
        onComplete: (saved) => {
          setCurrentResult(saved)
          setLoading(false)
        }
      })
      return
    }

    const finalScore = liveScore

    const profile = JSON.parse(localStorage.getItem('visiondx_user') || '{}')
    const age = profile.age || '28'
    const gender = profile.gender || 'Male'
    const name = profile.name || 'User'

    const prompt = `You are an expert clinical lifestyle medicine practitioner AI. Analyze the patient's daily routine details:
- Patient Name: ${name}
- Age: ${age}
- Gender: ${gender}
- Primary Health Goal: ${goal}
- Sleep Duration: ${sleep} hours
- Daily Water Intake: ${water} Liters
- Daily Active Physical Exercise: ${activity} minutes
- Typical Diet Style: ${diet}
- Daily Screen Time: ${screenTime} hours
- Daily Stress Level: ${stress}
- Calculated Health Score: ${finalScore}/100

Provide a detailed lifestyle evaluation:
1) Highlight positive aspects of the routine and areas requiring urgent attention.
2) Propose a customized, highly specific hourly daily healthy schedule (from waking up to bedtime) optimized for the user's age (${age}), gender (${gender}), and goal (${goal}). Structure it beautifully with clear emojis.
3) Suggest actionable dietary, physical exercise, and screen-limiting strategies.
4) Suggest basic vitamins or wellness practices (like mindfulness timings, specific meals).
5) End with exactly one of these status flags: NORMAL, SEE_DOCTOR, or EMERGENCY.`

    try {
      const aiResponse = await analyzeText(prompt)

      const resultDetails = {
        patientName: name,
        wellnessScore: `${finalScore}/100`,
        primaryDeficit: finalScore < 60 ? 'Multiple deficit categories' : finalScore < 85 ? 'Moderate habit deviation' : 'Excellent wellness alignment',
        sleepAssessment: `${sleep} Hours per day`,
        hydrationStatus: `${water} Liters per day`,
        activityLevel: `${activity} Minutes per day`
      }

      const resultData = {
        summary: `Daily Routine Analysis for ${name}: Health Score ${finalScore}/100. Goal: ${goal}.`,
        rawResponse: aiResponse,
        details: resultDetails
      }

      const saved = saveResult('routine', resultData)
      setCurrentResult(saved)

      if (localStorage.getItem('visiondx_autopilot') === 'active') {
        window.dispatchEvent(new CustomEvent('autopilot-result-ready', { detail: { type: 'routine', result: saved } }))
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze routine. Please check your API key or try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCurrentResult(null)
    setError('')
  }

  // SVG calculations for dynamic wellness dial
  const radius = 52
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (liveScore / 100) * circumference

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 slide-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2 shadow-glow animate-pulse">
            <span>📅</span> Daily Routine Health & Circadian Optimizer
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
            Daily Routine Analyzer
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Fine-tune your daily habits in real-time. Drag sliders below to watch your wellness index calculate live, and receive personalized medical lifestyle modifications.
          </p>
        </div>
        {currentResult && (
          <button onClick={resetForm} className="btn-secondary text-xs py-2.5 px-4">
            + New Routine Analysis
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
            <span>🔬</span> Calculating wellness scores, comparing parameters against clinical guidelines, and generating customized schedules...
          </div>
          <Skeleton />
        </div>
      ) : currentResult ? (
        <div className="space-y-8 fade-in">
          <ResultCard data={currentResult} />
          <div className="flex justify-center">
            <button onClick={resetForm} className="btn-primary py-3.5 px-8 text-base shadow-lg shadow-purple-500/20">
              <span>📊</span> Run Another Analysis
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Parameters */}
          <form onSubmit={handleAnalyze} className="lg:col-span-7 glass-card p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2 border-b border-white/10 pb-4">
              <span>📝</span> Habits & Routine Parameters
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Primary Goal */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">Primary Wellness Goal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="input-field cursor-pointer bg-navy-900 border-white/10 hover:border-purple-500/50"
                >
                  <option value="General Health & Energy">🔋 General Health & Energy</option>
                  <option value="Weight Loss & Fitness">🏃 Weight Loss & Fitness</option>
                  <option value="Better Sleep & Insomnia Relief">😴 Better Sleep & Insomnia Relief</option>
                  <option value="Anxiety & Stress Management">🧘 Anxiety & Stress Management</option>
                  <option value="Mental Focus & Productivity">🧠 Mental Focus & Productivity</option>
                </select>
              </div>

              {/* Sleep Hours Slider */}
              <div className="space-y-1.5 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all">
                <div className="flex justify-between text-xs font-bold text-white/70 uppercase tracking-wider">
                  <span className="flex items-center gap-1">😴 Sleep</span>
                  <span className="text-purple-400 font-mono font-bold text-sm">{sleep} Hours</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="14"
                  step="0.5"
                  value={sleep}
                  onChange={(e) => setSleep(parseFloat(e.target.value))}
                  className="w-full h-2 bg-navy-950 rounded-lg appearance-none cursor-pointer accent-purple-500 mt-2"
                />
                <div className="text-[10px] text-white/40 mt-1 flex justify-between">
                  <span>3h (Deprived)</span>
                  <span>14h (Excessive)</span>
                </div>
              </div>

              {/* Water Intake Slider */}
              <div className="space-y-1.5 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all">
                <div className="flex justify-between text-xs font-bold text-white/70 uppercase tracking-wider">
                  <span className="flex items-center gap-1">💧 Hydration</span>
                  <span className="text-purple-400 font-mono font-bold text-sm">{water.toFixed(1)} Liters</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6"
                  step="0.1"
                  value={water}
                  onChange={(e) => setWater(parseFloat(e.target.value))}
                  className="w-full h-2 bg-navy-950 rounded-lg appearance-none cursor-pointer accent-purple-500 mt-2"
                />
                <div className="text-[10px] text-white/40 mt-1 flex justify-between">
                  <span>0.5L (Dehydrating)</span>
                  <span>6L (Abundant)</span>
                </div>
              </div>

              {/* Active Minutes Slider */}
              <div className="space-y-1.5 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all">
                <div className="flex justify-between text-xs font-bold text-white/70 uppercase tracking-wider">
                  <span className="flex items-center gap-1">🏋️ Exercise</span>
                  <span className="text-purple-400 font-mono font-bold text-sm">{activity} Mins</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="5"
                  value={activity}
                  onChange={(e) => setActivity(parseInt(e.target.value))}
                  className="w-full h-2 bg-navy-950 rounded-lg appearance-none cursor-pointer accent-purple-500 mt-2"
                />
                <div className="text-[10px] text-white/40 mt-1 flex justify-between">
                  <span>Sedentary</span>
                  <span>3 hours</span>
                </div>
              </div>

              {/* Screen Time Slider */}
              <div className="space-y-1.5 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all">
                <div className="flex justify-between text-xs font-bold text-white/70 uppercase tracking-wider">
                  <span className="flex items-center gap-1">📱 Screen Time</span>
                  <span className="text-purple-400 font-mono font-bold text-sm">{screenTime} Hours</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="18"
                  step="1"
                  value={screenTime}
                  onChange={(e) => setScreenTime(parseInt(e.target.value))}
                  className="w-full h-2 bg-navy-950 rounded-lg appearance-none cursor-pointer accent-purple-500 mt-2"
                />
                <div className="text-[10px] text-white/40 mt-1 flex justify-between">
                  <span>0h (Ideal)</span>
                  <span>18h (Severe)</span>
                </div>
              </div>

              {/* Diet Style */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">Typical Diet</label>
                <select
                  value={diet}
                  onChange={(e) => setDiet(e.target.value)}
                  className="input-field cursor-pointer bg-navy-900 border-white/10 hover:border-purple-500/50"
                >
                  <option value="Balanced Diet">Balanced (Veggies, Proteins, Grains)</option>
                  <option value="High Protein / Low Carb">High Protein / Low Carb</option>
                  <option value="High Carbohydrates / Sweets">High Carb / Sugary Snacks</option>
                  <option value="Vegetarian / Vegan">Vegetarian / Vegan</option>
                  <option value="Fast Food / Processed Meals">Fast Food / Processed Meals</option>
                  <option value="Irregular Meals / Skipping Breakfast">Irregular Meals / Skipping Breakfast</option>
                </select>
              </div>

              {/* Stress Levels */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">Stress Level</label>
                <select
                  value={stress}
                  onChange={(e) => setStress(e.target.value)}
                  className="input-field cursor-pointer bg-navy-900 border-white/10 hover:border-purple-500/50"
                >
                  <option value="Low">Low Stress (Calm/Managed)</option>
                  <option value="Moderate">Moderate Stress (Occasional Tension)</option>
                  <option value="High">High Stress (Overwhelmed/Anxious)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-500 to-medical-blue text-white font-extrabold text-base transition-all flex items-center justify-center gap-2 shadow-2xl hover:scale-[1.01] active:scale-[0.99] shadow-purple-500/20"
            >
              <span>📊</span> Compile Lifestyle Prescription
            </button>
          </form>

          {/* Real-time Circular Wellness Dial */}
          <div className="lg:col-span-5 space-y-6">
            <div className={`glass-card p-8 rounded-3xl border border-white/10 bg-gradient-to-br ${scoreMeta.bg} shadow-2xl relative overflow-hidden transition-all duration-300`}>
              <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <h3 className="text-lg font-bold font-outfit text-white mb-6 flex items-center gap-2">
                <span>⚡</span> Real-time Wellness Index
              </h3>

              <div className="flex flex-col items-center justify-center py-4">
                {/* Glowing Circle Gauge */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background Track */}
                    <circle
                      cx="72"
                      cy="72"
                      r={radius}
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                    />
                    {/* Glowing Accent Arc */}
                    <circle
                      cx="72"
                      cy="72"
                      r={radius}
                      stroke={scoreMeta.circle}
                      strokeWidth={strokeWidth}
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  {/* Central Value */}
                  <div className="absolute flex flex-col items-center">
                    <span className={`text-4xl font-extrabold font-outfit ${scoreMeta.text}`}>
                      {liveScore}
                    </span>
                    <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-0.5">SCORE</span>
                  </div>
                </div>

                <div className="text-center mt-6 space-y-1.5">
                  <div className={`text-sm font-bold ${scoreMeta.text}`}>
                    {scoreMeta.label}
                  </div>
                  <p className="text-xs text-white/55 leading-relaxed max-w-xs mx-auto">
                    Calculated automatically from your hydration levels, workout routines, cortisol stress limits, and sleep circadian rhythms.
                  </p>
                </div>
              </div>
            </div>

            {/* Real-time Tips Panel */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4 shadow-lg">
              <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                <span>💡</span> Live Medical-Grade Micro-Advice
              </h4>
              <div className="space-y-3">
                {getLiveTips().map((tip, idx) => (
                  <div key={idx} className="text-xs text-white/80 leading-relaxed pl-3.5 border-l-2 border-purple-500 py-0.5 bg-white/5 p-2 rounded-r-xl border border-white/5 hover:bg-white/10 transition-colors">
                    {tip}
                  </div>
                ))}
                {getLiveTips().length === 0 && (
                  <div className="text-xs text-medical-green font-semibold py-2 text-center bg-medical-green/10 rounded-xl border border-medical-green/20">
                    🎉 Excellent wellness stats! No alerts active.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
