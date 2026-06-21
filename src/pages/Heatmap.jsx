import { useState, useEffect } from 'react'
import { getHeatmapData, saveHeatmapEntry, getHeatmapOptIn, setHeatmapOptIn } from '../utils/localStorage'

export default function Heatmap() {
  const [optIn, setOptIn] = useState(false)
  const [heatmapData, setHeatmapData] = useState([])
  const [selectedCity, setSelectedCity] = useState(null)
  const [useSampleData, setUseSampleData] = useState(true)

  // Standard Pakistan cities with SVG coordinates (scaled to 800x600 viewport)
  const cities = [
    { id: 'gilgit', name: 'Gilgit', x: 530, y: 55, region: 'Gilgit-Baltistan' },
    { id: 'islamabad', name: 'Islamabad', x: 440, y: 130, region: 'Capital Territory' },
    { id: 'peshawar', name: 'Peshawar', x: 375, y: 145, region: 'Khyber Pakhtunkhwa' },
    { id: 'lahore', name: 'Lahore', x: 495, y: 250, region: 'Punjab' },
    { id: 'faisalabad', name: 'Faisalabad', x: 445, y: 255, region: 'Punjab' },
    { id: 'multan', name: 'Multan', x: 380, y: 325, region: 'Punjab' },
    { id: 'quetta', name: 'Quetta', x: 210, y: 335, region: 'Balochistan' },
    { id: 'ryk', name: 'Rahim Yar Khan', x: 315, y: 395, region: 'Punjab' },
    { id: 'hyderabad', name: 'Hyderabad', x: 220, y: 495, region: 'Sindh' },
    { id: 'karachi', name: 'Karachi', x: 180, y: 525, region: 'Sindh' },
    { id: 'gwadar', name: 'Gwadar', x: 75, y: 515, region: 'Balochistan' }
  ]

  // Topological network connections for the stylized mesh
  const connections = [
    { from: 'gwadar', to: 'karachi' },
    { from: 'gwadar', to: 'quetta' },
    { from: 'karachi', to: 'hyderabad' },
    { from: 'karachi', to: 'quetta' },
    { from: 'hyderabad', to: 'ryk' },
    { from: 'hyderabad', to: 'quetta' },
    { from: 'quetta', to: 'multan' },
    { from: 'ryk', to: 'multan' },
    { from: 'multan', to: 'faisalabad' },
    { from: 'multan', to: 'lahore' },
    { from: 'faisalabad', to: 'lahore' },
    { from: 'faisalabad', to: 'islamabad' },
    { from: 'peshawar', to: 'islamabad' },
    { from: 'peshawar', to: 'quetta' },
    { from: 'islamabad', to: 'lahore' },
    { from: 'islamabad', to: 'gilgit' }
  ]

  // Beautiful sample datasets to make it immediately visual
  const sampleData = [
    { city: 'Karachi', condition: 'Conjunctivitis', date: '2026-05-28' },
    { city: 'Karachi', condition: 'Eczema Rash', date: '2026-05-28' },
    { city: 'Karachi', condition: 'Sleep Apnea Risk', date: '2026-05-27' },
    { city: 'Lahore', condition: 'Cough acoustics (Bronchitis)', date: '2026-05-29' },
    { city: 'Lahore', condition: 'Alopecia Crown Hair', date: '2026-05-28' },
    { city: 'Islamabad', condition: 'Insomnia / Sleep deprivation', date: '2026-05-28' },
    { city: 'Islamabad', condition: 'Allergic Conjunctivitis', date: '2026-05-26' },
    { city: 'Peshawar', condition: 'Post-op Wound Infection', date: '2026-05-27' },
    { city: 'Peshawar', condition: 'Pertussis Cough', date: '2026-05-25' },
    { city: 'Quetta', condition: 'Dehydration / Sunstroke', date: '2026-05-29' },
    { city: 'Rahim Yar Khan', condition: 'Severe Leukocytosis (WBC 23.75)', date: '2026-05-29' },
    { city: 'Rahim Yar Khan', condition: 'Neutrophilia (Neutrophils 91%)', date: '2026-05-29' },
    { city: 'Rahim Yar Khan', condition: 'Chronic Cough', date: '2026-05-26' },
    { city: 'Multan', condition: 'Scabies Rash', date: '2026-05-28' },
    { city: 'Faisalabad', condition: 'Hypertension circadian index', date: '2026-05-27' },
    { city: 'Gwadar', condition: 'Cataract Observation', date: '2026-05-24' }
  ]

  useEffect(() => {
    setOptIn(getHeatmapOptIn())
    loadData()
  }, [])

  const loadData = () => {
    setHeatmapData(getHistoryData())
  }

  const getHistoryData = () => {
    const local = getHeatmapData()
    if (useSampleData) {
      return [...local, ...sampleData]
    }
    return local
  }

  useEffect(() => {
    setHeatmapData(getHistoryData())
  }, [useSampleData])

  const handleOptInToggle = () => {
    const nextVal = !optIn
    setOptIn(nextVal)
    setHeatmapOptIn(nextVal)
  }

  // Get frequency of cases per city
  const getCityMetrics = (cityName) => {
    const cityCases = heatmapData.filter(item => item.city.toLowerCase() === cityName.toLowerCase())
    const count = cityCases.length

    // Group conditions
    const conditions = {}
    cityCases.forEach(item => {
      conditions[item.condition] = (conditions[item.condition] || 0) + 1
    })

    const topConditions = Object.entries(conditions)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])

    return { count, topConditions }
  }

  // Inject a simulated check-in for diagnostic demonstration
  const handleSimulateCase = (cityName, conditionName) => {
    if (!optIn) {
      alert('Please enable "Heatmap Sharing" in settings or on this page first.')
      return
    }
    saveHeatmapEntry(cityName, conditionName)
    loadData()
    // Select this city to show update
    setSelectedCity(cityName)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 slide-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-medical-blue/10 border border-medical-blue/20 text-medical-blue text-xs font-semibold mb-2 shadow-glow animate-pulse">
            <span>🗺️</span> Epidemiological Disease Tracking
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
            Pakistan Regional Disease Heatmap
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Monitor localized symptom flare-ups, seasonal cataracts, and respiratory trends across Pakistan in real-time. Built on fully privacy-preserving localized reporting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all shadow-md select-none">
            <span className="text-xs font-bold text-white/80">Heatmap Data Sharing:</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={optIn}
                onChange={handleOptInToggle}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/40 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-medical-green peer-checked:after:bg-navy-950" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${optIn ? 'bg-medical-green/20 text-medical-green border border-medical-green/30' : 'bg-white/10 text-white/40 border border-white/5'}`}>
              {optIn ? 'ACTIVE' : 'OPTED OUT'}
            </span>
          </label>

          <button
            onClick={() => setUseSampleData(!useSampleData)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border shadow-md ${
              useSampleData
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
            }`}
          >
            {useSampleData ? '🧪 Hiding Real Data' : '🧪 Preload Demo Data'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SVG Interactive Map Grid */}
        <div className="lg:col-span-7 glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 right-0 w-60 h-60 bg-medical-blue/5 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-xl font-bold font-outfit text-white mb-6 w-full flex items-center justify-between border-b border-white/10 pb-4">
            <span>🗺️ Stylized Epidemiological Network Mesh</span>
            <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Click nodes to investigate</span>
          </h2>

          <div className="w-full aspect-[4/3] bg-navy-950/40 rounded-2xl border border-white/5 p-4 shadow-inner relative flex items-center justify-center">
            {/* Legend inside map */}
            <div className="absolute bottom-4 left-4 bg-navy-900/90 border border-white/10 p-3.5 rounded-2xl text-[10px] font-semibold space-y-2 z-10 shadow-lg">
              <p className="text-white/40 uppercase tracking-widest border-b border-white/5 pb-1">Triage Severity Scale</p>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 animate-pulse" />
                <span className="text-white/80">High Frequency (&gt;5 cases)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="text-white/80">Moderate Flare (2-4 cases)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-500/80" />
                <span className="text-white/80">Minimal / Trace (1 case)</span>
              </div>
            </div>

            <svg viewBox="0 0 600 580" className="w-full h-full text-white/10">
              {/* Mesh Connection Network Lines */}
              {connections.map((conn, idx) => {
                const c1 = cities.find(c => c.id === conn.from)
                const c2 = cities.find(c => c.id === conn.to)
                if (!c1 || !c2) return null
                return (
                  <line
                    key={idx}
                    x1={c1.x}
                    y1={c1.y}
                    x2={c2.x}
                    y2={c2.y}
                    stroke="rgba(0, 212, 170, 0.08)"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                )
              })}

              {/* Interactive City Nodes */}
              {cities.map(city => {
                const metrics = getCityMetrics(city.name)
                const { count } = metrics
                
                // Radius calculations based on log frequency
                const baseRadius = 6
                const multiplier = count > 5 ? 12 : count > 2 ? 8 : count > 0 ? 5 : 0
                const pulseRadius = baseRadius + multiplier
                
                // Color scaling
                let nodeColor = 'fill-cyan-400 stroke-cyan-400'
                let pulseColor = 'bg-cyan-500/30'
                if (count > 5) {
                  nodeColor = 'fill-red-500 stroke-red-500'
                  pulseColor = 'bg-red-500/30 animate-ping'
                } else if (count >= 2) {
                  nodeColor = 'fill-yellow-500 stroke-yellow-500'
                  pulseColor = 'bg-yellow-500/30 animate-pulse'
                } else if (count === 0) {
                  nodeColor = 'fill-white/20 stroke-white/20'
                  pulseColor = 'hidden'
                }

                const isSelected = selectedCity === city.name

                return (
                  <g
                    key={city.id}
                    onClick={() => setSelectedCity(city.name)}
                    className="cursor-pointer group"
                  >
                    {/* Outer glow ring for simulated cases */}
                    {isSelected && (
                      <circle
                        cx={city.x}
                        cy={city.y}
                        r={pulseRadius + 12}
                        className="fill-transparent stroke-purple-500/50 stroke-1 stroke-dasharray animate-spin"
                        style={{ transformOrigin: `${city.x}px ${city.y}px` }}
                      />
                    )}

                    {/* Animated Pulsing Epidemic Radius */}
                    {count > 0 && (
                      <circle
                        cx={city.x}
                        cy={city.y}
                        r={pulseRadius}
                        className={`${pulseColor} opacity-20`}
                      />
                    )}

                    {/* Center Core dot */}
                    <circle
                      cx={city.x}
                      cy={city.y}
                      r={isSelected ? 6 : 4}
                      className={`${nodeColor} transition-all duration-300 group-hover:scale-125`}
                    />

                    {/* City Label */}
                    <text
                      x={city.x + 8}
                      y={city.y + 4}
                      className={`text-[9px] font-bold font-mono tracking-wide ${isSelected ? 'fill-purple-400' : 'fill-white/60'} group-hover:fill-white transition-colors`}
                    >
                      {city.name} {count > 0 && `(${count})`}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        {/* Investigative Panel & Logger Simulation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-6">
            <h3 className="text-xl font-bold font-outfit text-white border-b border-white/10 pb-4 flex items-center gap-2">
              <span>🩺</span> Investigative Panel
            </h3>

            {selectedCity ? (
              (() => {
                const metrics = getCityMetrics(selectedCity)
                const cityMeta = cities.find(c => c.name === selectedCity)
                return (
                  <div className="space-y-6 fade-in">
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div>
                        <h4 className="text-lg font-bold text-white">{selectedCity}</h4>
                        <p className="text-[10px] font-bold text-white/45 uppercase tracking-wider font-mono">{cityMeta?.region}</p>
                      </div>
                      <span className="text-2xl font-extrabold text-medical-blue">{metrics.count} Cases</span>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Top Detected Conditions:</p>
                      {metrics.topConditions.length > 0 ? (
                        <div className="space-y-2">
                          {metrics.topConditions.map((cond, i) => (
                            <div key={i} className="flex justify-between items-center bg-[#020810]/40 p-3 rounded-xl border border-white/5 text-xs text-white/80">
                              <span className="font-semibold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-medical-blue" />
                                {cond}
                              </span>
                              <span className="font-mono bg-white/5 px-2 py-0.5 rounded-md border border-white/5 font-bold">Grounded</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-white/40 italic">No symptoms or infections recorded in this region.</p>
                      )}
                    </div>

                    {/* Quick Simulator Tool */}
                    <div className="border-t border-white/10 pt-4 space-y-4">
                      <p className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                        <span>🧪</span> Simulate Local Case
                      </p>
                      <p className="text-[11px] text-white/50 leading-relaxed">
                        Manually report an anonymous clinical category to see the regional heatmap scale dynamically. (Requires Heatmap Sharing).
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSimulateCase(selectedCity, 'Conjunctivitis')}
                          className="flex-1 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-bold transition-all"
                        >
                          👁️ Conjunctivitis
                        </button>
                        <button
                          onClick={() => handleSimulateCase(selectedCity, 'Respiratory Cough')}
                          className="flex-1 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold transition-all"
                        >
                          🎤 Cough Infection
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })()
            ) : (
              <div className="text-center py-12 text-white/45 space-y-3">
                <div className="text-5xl animate-pulse">👆</div>
                <h4 className="font-bold text-white/60">Select a City Node</h4>
                <p className="text-xs max-w-xs mx-auto leading-relaxed">
                  Click on any interactive city coordinate dot on the Pakistan map to explore regional condition frequencies, top infections, and run local diagnostic simulation tracking.
                </p>
              </div>
            )}
          </div>

          {/* Privacy Grounding disclaimer */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-white/50 leading-relaxed space-y-2">
            <p className="font-bold text-white/70">🔒 Zero-Server Privacy-First Network</p>
            <p>
              All epidemiological logs are fully simulated and calculated locally on your device's browser `localStorage`. No patient telemetry, IP addresses, or location coordinates are uploaded to external tracking servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
