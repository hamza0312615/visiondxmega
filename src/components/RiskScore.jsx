import React, { useEffect, useState } from 'react'
import { getRiskLog } from '../utils/localStorage'

export default function RiskScore() {
  const [riskScore, setRiskScore] = useState(0)
  const [riskLabel, setRiskLabel] = useState('No Logged Data')
  const [riskColor, setRiskColor] = useState('text-emerald-400')
  const [strokeColor, setStrokeColor] = useState('#10b981')
  const [logCount, setLogCount] = useState(0)

  useEffect(() => {
    const logs = getRiskLog()
    if (logs.length === 0) {
      setRiskScore(20) // Default normal baseline
      setRiskLabel('Healthy Baseline (No Active Risk)')
      setRiskColor('text-emerald-400')
      setStrokeColor('#10b981')
      setLogCount(0)
      return
    }

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Filter logs for the last 7 days
    const recentLogs = logs.filter(log => new Date(log.date) >= sevenDaysAgo)

    let finalScore = 0
    const sourceLogs = recentLogs.length > 0 ? recentLogs : [logs[logs.length - 1]] // Fallback to last logged entry if none in 7 days

    let totalWeight = 0
    let weightedSum = 0

    sourceLogs.forEach(log => {
      const logDate = new Date(log.date)
      const diffTime = Math.abs(now - logDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      // More recent logs get higher weight (7 for today, 1 for 7 days ago)
      const weight = Math.max(1, 8 - diffDays) 
      weightedSum += log.score * weight
      totalWeight += weight
    })

    finalScore = Math.round(weightedSum / totalWeight)
    setRiskScore(finalScore)
    setLogCount(recentLogs.length)

    // Set colors and labels based on score
    if (finalScore <= 30) {
      setRiskLabel('Low Clinical Risk')
      setRiskColor('text-emerald-400')
      setStrokeColor('#10b981')
    } else if (finalScore <= 70) {
      setRiskLabel('Moderate Risk - Monitor')
      setRiskColor('text-amber-400')
      setStrokeColor('#f59e0b')
    } else {
      setRiskLabel('High Risk - See Physician!')
      setRiskColor('text-red-400')
      setStrokeColor('#ef4444')
    }
  }, [])

  // Gauge calculations
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (riskScore / 100) * circumference

  return (
    <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col items-center text-center space-y-4 shadow-xl relative overflow-hidden bg-gradient-to-b from-navy-900 to-[#020810]/80">
      <div className="absolute top-0 right-0 w-32 h-32 bg-medical-green/5 rounded-full blur-2xl pointer-events-none" />
      
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-outfit">
          7-Day Patient Risk Status
        </h3>
        <p className="text-[10px] text-white/40 font-medium">
          Based on {logCount} recent diagnostic triage triggers
        </p>
      </div>

      {/* SVG Gauge */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            className="stroke-white/5"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke={strokeColor}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Central Text */}
        <div className="absolute flex flex-col items-center justify-center space-y-0.5">
          <span className="text-3xl font-extrabold font-outfit text-white">
            {riskScore}%
          </span>
          <span className={`text-[9px] font-black uppercase tracking-widest ${riskColor}`}>
            Score
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <div className={`text-xs font-extrabold uppercase tracking-wide ${riskColor}`}>
          {riskLabel}
        </div>
        <p className="text-[10px] text-white/50 leading-normal max-w-[200px]">
          {riskScore <= 30
            ? 'Vital markers stable. Keep maintaining excellent routine schedules.'
            : riskScore <= 70
            ? 'Elevated parameters. Get a formal checkup if symptoms persist.'
            : 'Immediate action advised. Forward summary reports to a certified physician.'}
        </p>
      </div>
    </div>
  )
}
