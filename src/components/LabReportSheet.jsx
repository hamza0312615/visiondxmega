import ResultCard from './ResultCard'

export default function LabReportSheet({ currentResult, resetAnalyzer }) {
  if (!currentResult) return null

  return (
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
        <button onClick={() => window.print()} className="btn-primary py-3.5 px-8 text-base shadow-lg shadow-cyan-500/20">
          <span>🖨️</span> Download Report / Print PDF
        </button>
        <button onClick={resetAnalyzer} className="btn-secondary py-3.5 px-8 text-base">
          <span>📸</span> Log Another Report
        </button>
      </div>
    </div>
  )
}
