export default function OfflineAgent() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 slide-in">
      {/* Header */}
      <div className="border-b border-white/10 pb-6 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
          <span>📵</span> Works Offline • Rural Health
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
          Offline Rural Health Agent
        </h1>
        <p className="text-sm text-white/60 mt-1 max-w-2xl">
          A standalone health assistant that works <strong className="text-emerald-400">without internet</strong>. 
          Designed for rural communities with poor connectivity. Supports Urdu, Punjabi, Pashto, Sindhi, Hindi & English.
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: '📴', title: 'Fully Offline', desc: 'Works with zero internet after first load. All 12+ diseases pre-loaded.' },
          { icon: '🎤', title: 'Voice Input', desc: 'Speak your symptoms in Urdu, Hindi, Pashto or English.' },
          { icon: '📲', title: 'Install on Phone', desc: 'Install as an app on Android — works like a native app, no app store needed.' },
        ].map(c => (
          <div key={c.title} className="glass-card p-5 rounded-2xl border border-white/10">
            <div className="text-3xl mb-3">{c.icon}</div>
            <h3 className="font-bold text-white mb-1">{c.title}</h3>
            <p className="text-sm text-white/60">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Launch Button */}
      <div className="text-center space-y-4">
        <a
          href="/offline-agent/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-navy-950 font-extrabold text-lg hover:scale-[1.03] transition-all shadow-2xl shadow-emerald-500/30"
        >
          <span className="text-2xl">🏥</span>
          Open Offline Health Agent
        </a>
        <p className="text-xs text-white/40">
          Opens in new tab • Works without internet • Install on mobile for best experience
        </p>
      </div>

      {/* How It Works */}
      <div className="mt-12 glass-card p-6 rounded-2xl border border-white/10">
        <h2 className="text-lg font-bold text-white mb-4">How To Install On Mobile (Android)</h2>
        <ol className="space-y-3">
          {[
            'Open the Offline Agent in your phone browser (Chrome recommended)',
            'Tap the 3-dot menu (⋮) in Chrome → "Add to Home screen"',
            'Confirm install — app icon appears on your home screen',
            'Open the installed app — it works offline forever after this!',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-sm text-white/75">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
