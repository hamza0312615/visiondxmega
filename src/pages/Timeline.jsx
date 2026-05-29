import { useState, useEffect } from 'react'
import { getHistory, deleteEntry, formatTime } from '../utils/localStorage'
import ResultCard from '../components/ResultCard'
import { Link } from 'react-router-dom'

export default function Timeline() {
  const [history, setHistory] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [filterUrgency, setFilterUrgency] = useState('all')

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = () => {
    // Sort history chronologically (latest first, but timeline goes downwards)
    setHistory(getHistory())
  }

  const handleDelete = (id) => {
    deleteEntry(id)
    loadHistory()
    if (expandedId === id) setExpandedId(null)
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  // Helper to extract urgency color pills
  const getUrgencyPill = (rawText = '') => {
    const text = rawText.toUpperCase()
    if (text.includes('EMERGENCY')) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-red-500/20 text-red-400 border border-red-500/30 shadow-md tracking-wider">
          🚨 Emergency
        </span>
      )
    }
    if (text.includes('SEE_DOCTOR') || text.includes('SEE DOCTOR')) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-md tracking-wider">
          ⚠️ See Doctor
        </span>
      )
    }
    return (
      <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md tracking-wider">
        ✅ Normal
      </span>
    )
  }

  // Get module configuration
  const getModuleMeta = (type) => {
    switch (type) {
      case 'eye':
        return { label: 'Ophthalmic Eye Scan', emoji: '👁️', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' }
      case 'skin':
        return { label: 'Skin Lesion Scan', emoji: '🔴', color: 'text-red-400 bg-red-500/10 border-red-500/20' }
      case 'wound':
        return { label: 'Wound Infection Scan', emoji: '🩹', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' }
      case 'hair':
        return { label: 'Hair & Scalp Scan', emoji: '💇', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
      case 'medicine':
        return { label: 'Pill Analyzer', emoji: '💊', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
      case 'lab':
        return { label: 'Lab Report (CBC)', emoji: '📊', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' }
      case 'cough':
        return { label: 'Cough Sound Scan', emoji: '🎤', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
      case 'sleep':
        return { label: 'Sleep Apnea evaluation', emoji: '😴', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' }
      case 'routine':
        return { label: 'Daily Lifestyle Wellness', emoji: '📅', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
      case 'voicedoc':
        return { label: 'VoiceDoc Triage', emoji: '🗣️', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' }
      default:
        return { label: 'Clinical Assessment', emoji: '📋', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' }
    }
  }

  // Filter history by urgency
  const filteredHistory = history.filter(item => {
    if (filterUrgency === 'all') return true
    
    // Safely retrieve urgency from the item structure
    let itemUrgency = 'NORMAL'
    if (item.details?.urgencyLevel) itemUrgency = item.details.urgencyLevel
    else if (item.details?.assessedUrgency) itemUrgency = item.details.assessedUrgency
    else if (item.rawResponse) {
      if (item.rawResponse.includes('EMERGENCY')) itemUrgency = 'EMERGENCY'
      else if (item.rawResponse.includes('SEE_DOCTOR')) itemUrgency = 'SEE_DOCTOR'
    }
    
    const standardUrgency = itemUrgency.toUpperCase().replace(' ', '_')
    if (filterUrgency === 'emergency') return standardUrgency.includes('EMERGENCY')
    if (filterUrgency === 'doctor') return standardUrgency.includes('SEE_DOCTOR')
    if (filterUrgency === 'normal') return standardUrgency.includes('NORMAL')
    return true
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 slide-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2 shadow-glow">
            <span>🧬</span> Chronological Patient Timeline
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
            Family Wellness Timeline
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Trace your health trajectory chronologically. Expand entries to review complete medical-grade recommendations and diagnostic report sheets.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-navy-900 border border-white/10 p-1.5 rounded-2xl shadow-inner">
          <button
            onClick={() => setFilterUrgency('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterUrgency === 'all' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-white/60 hover:text-white'
            }`}
          >
            All Logs
          </button>
          <button
            onClick={() => setFilterUrgency('emergency')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterUrgency === 'emergency' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-white/60 hover:text-white'
            }`}
          >
            Red Triage
          </button>
          <button
            onClick={() => setFilterUrgency('doctor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterUrgency === 'doctor' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'text-white/60 hover:text-white'
            }`}
          >
            Orange Triage
          </button>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center border border-white/5 space-y-6 shadow-2xl">
          <div className="text-6xl animate-pulse">📅</div>
          <h3 className="text-2xl font-bold text-white font-outfit tracking-tight">No Timeline Records</h3>
          <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
            {filterUrgency === 'all'
              ? "You haven't run any evaluations yet. Navigate to any diagnostic engine from the dashboard to create your first card."
              : "No diagnostic logs match the selected filter criteria."}
          </p>
          <div className="pt-2">
            <Link to="/" className="inline-flex btn-primary text-sm py-3.5 px-8 shadow-lg shadow-purple-500/20">
              Go to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="relative border-l border-white/10 pl-6 sm:pl-10 ml-4 space-y-12">
          {/* Central Vertical Timeline Indicator Bar */}
          <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-gradient-to-b from-purple-500 via-indigo-500 to-transparent pointer-events-none" />

          {filteredHistory.map((item, index) => {
            const meta = getModuleMeta(item.type)
            const isExpanded = expandedId === item.id
            const timeStr = formatTime(item.timestamp)
            const urgency = item.details?.urgencyLevel || item.details?.assessedUrgency || (item.rawResponse?.includes('EMERGENCY') ? 'EMERGENCY' : item.rawResponse?.includes('SEE_DOCTOR') ? 'SEE_DOCTOR' : 'NORMAL')

            return (
              <div key={item.id || index} className="relative group fade-in">
                {/* Glowing Timeline Indicator Node */}
                <div className="absolute -left-[30px] sm:-left-[46px] top-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#020810] border-2 border-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-400 animate-ping absolute" />
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500" />
                </div>

                {/* Timeline Card Wrapper */}
                <div className={`glass-card p-5 sm:p-6 rounded-3xl border border-white/5 bg-gradient-to-r from-navy-950/45 to-navy-900/10 hover:border-white/10 transition-all shadow-xl space-y-4 ${isExpanded ? 'ring-1 ring-purple-500/30' : ''}`}>
                  
                  {/* Top Header details */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-2xl border font-bold text-xs uppercase tracking-wider ${meta.color} flex items-center gap-1.5`}>
                        <span>{meta.emoji}</span>
                        <span>{meta.label}</span>
                      </div>
                      <span className="text-xs text-white/45 font-mono">{timeStr}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {getUrgencyPill(urgency)}
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className={`text-xs font-bold py-1.5 px-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-white/70 flex items-center gap-1.5 ${isExpanded ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : ''}`}
                      >
                        <span>{isExpanded ? 'Collapse' : 'View Report'}</span>
                        <span className="text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary / Description Snippet */}
                  <div className="text-sm text-white/75 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                    {item.summary || (item.details?.patientSymptoms ? `Evaluation for reported symptoms: ${item.details.patientSymptoms}` : 'AI assessment completed successfully.')}
                  </div>

                  {/* Accordion Expandable Detailed Result Card */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-white/10 fade-in">
                      <ResultCard data={item} onDelete={handleDelete} isHistory={true} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
