import { Link } from 'react-router-dom'

export default function FeatureCard({ icon, title, description, path, color, stats }) {
  const colorMap = {
    green: { border: 'hover:border-emerald-500/30', glow: 'rgba(16, 185, 129, 0.15)', badge: 'bg-emerald-500/20 text-emerald-400', icon: 'bg-emerald-500/20' },
    blue: { border: 'hover:border-blue-500/30', glow: 'rgba(59, 130, 246, 0.15)', badge: 'bg-blue-500/20 text-blue-400', icon: 'bg-blue-500/20' },
    purple: { border: 'hover:border-purple-500/30', glow: 'rgba(139, 92, 246, 0.15)', badge: 'bg-purple-500/20 text-purple-400', icon: 'bg-purple-500/20' },
    orange: { border: 'hover:border-orange-500/30', glow: 'rgba(249, 115, 22, 0.15)', badge: 'bg-orange-500/20 text-orange-400', icon: 'bg-orange-500/20' },
    teal: { border: 'hover:border-teal-500/30', glow: 'rgba(20, 184, 166, 0.15)', badge: 'bg-teal-500/20 text-teal-400', icon: 'bg-teal-500/20' },
    rose: { border: 'hover:border-rose-500/30', glow: 'rgba(244, 63, 94, 0.15)', badge: 'bg-rose-500/20 text-rose-400', icon: 'bg-rose-500/20' },
    amber: { border: 'hover:border-amber-500/30', glow: 'rgba(245, 158, 11, 0.15)', badge: 'bg-amber-500/20 text-amber-400', icon: 'bg-amber-500/20' },
    cyan: { border: 'hover:border-cyan-500/30', glow: 'rgba(6, 182, 212, 0.15)', badge: 'bg-cyan-500/20 text-cyan-400', icon: 'bg-cyan-500/20' },
  }

  const c = colorMap[color] || colorMap.green

  return (
    <Link to={path}>
      <div
        className={`glass-card p-6 sm:p-8 rounded-3xl group relative overflow-hidden transition-all duration-300 border border-white/5 hover:scale-[1.02] ${c.border}`}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 20px 60px ${c.glow}` }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at top left, ${c.glow} 0%, transparent 70%)` }} />

        <div className="relative z-10">
          <div className={`w-14 h-14 rounded-2xl ${c.icon} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>

          <h3 className="text-xl font-bold text-white font-outfit mb-2 group-hover:text-white transition-colors">{title}</h3>
          <p className="text-white/60 text-sm leading-relaxed mb-6 line-clamp-2">{description}</p>

          {stats && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {stats.map((stat, i) => (
                <span key={i} className={`px-3 py-1 rounded-full ${c.badge} text-xs font-semibold tracking-wide`}>
                  {stat}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs font-semibold text-white/40 group-hover:text-medical-green transition-colors duration-300">
            Open Tool
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}
