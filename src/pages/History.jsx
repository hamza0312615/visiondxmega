import { useState, useEffect } from 'react'
import { getHistory, deleteEntry, clearHistory } from '../utils/localStorage'
import ResultCard from '../components/ResultCard'
import { Link } from 'react-router-dom'

export default function History() {
  const [history, setHistory] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = () => {
    setHistory(getHistory())
  }

  const handleDelete = (id) => {
    deleteEntry(id)
    loadHistory()
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all diagnostic history?')) {
      clearHistory()
      loadHistory()
    }
  }

  const filteredHistory = filter === 'all' 
    ? history 
    : history.filter(item => item.type === filter)

  const tabs = [
    { id: 'all', label: 'All Scans' },
    { id: 'eye', label: '👁️ Eye' },
    { id: 'skin', label: '🔴 Skin' },
    { id: 'wound', label: '🩹 Wound' },
    { id: 'cough', label: '🎤 Cough' },
    { id: 'sleep', label: '😴 Sleep' },
    { id: 'medicine', label: '💊 Medicine' },
    { id: 'lab', label: '📊 Lab' },
    { id: 'voicedoc', label: '🗣️ VoiceDoc' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 slide-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-3">
            <span>📋</span> Diagnostic History Logs
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Review your past AI assessments, eye scans, skin evaluations, wound tracking logs, cough classifications, sleep scores, lab reports, and VoiceDoc triage alerts.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="px-5 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 text-xs font-bold transition-all shadow-md"
          >
            🗑️ Clear All History
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-navy-900 border border-white/10 rounded-2xl max-w-full overflow-x-auto shadow-inner">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap shadow-sm ${
              filter === tab.id
                ? 'bg-gradient-to-r from-medical-green to-emerald-600 text-navy-950 shadow-lg shadow-medical-green/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center border border-white/5 space-y-6 shadow-2xl">
          <div className="text-6xl animate-bounce">📭</div>
          <h3 className="text-2xl font-bold text-white font-outfit tracking-tight">No Diagnostic Logs Found</h3>
          <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
            {filter === 'all' 
              ? "You haven't performed any AI assessments yet. Select a diagnostic module from the dashboard to run your first AI scan." 
              : `No history found for ${filter} assessments.`}
          </p>
          <div className="pt-2">
            <Link to="/" className="inline-flex btn-primary text-sm py-3.5 px-8 shadow-lg shadow-medical-green/20">
              Go to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredHistory.map(item => (
            <ResultCard key={item.id} data={item} onDelete={handleDelete} isHistory={true} />
          ))}
        </div>
      )}
    </div>
  )
}
