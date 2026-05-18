import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getSiteLanguage, setSiteLanguage } from '../utils/localStorage'

const navTranslations = {
  en: {
    dashboard: 'Dashboard',
    eye: 'Eye AI',
    skin: 'Skin AI',
    wound: 'Wound',
    cough: 'Cough',
    sleep: 'Sleep',
    medicine: 'Medicine',
    lab: 'Lab AI',
    voicedoc: 'VoiceDoc',
    history: 'History',
    settings: 'Settings',
    tagline: 'Mega Edition',
    switchLang: '🇵🇰 اردو'
  },
  ur: {
    dashboard: 'ڈیش بورڈ',
    eye: 'آنکھ AI',
    skin: 'جلد AI',
    wound: 'زخم AI',
    cough: 'کھانسی',
    sleep: 'نیند AI',
    medicine: 'ادویات',
    lab: 'لیب AI',
    voicedoc: 'وائس ڈاکٹر',
    history: 'سابقہ ریکارڈ',
    settings: 'ترتیبات',
    tagline: 'میگا ایڈیشن',
    switchLang: '🇺🇸 English'
  }
}

const navItems = [
  { path: '/', key: 'dashboard', icon: '🏠' },
  { path: '/eye-predictor', key: 'eye', icon: '👁️' },
  { path: '/skin-analyzer', key: 'skin', icon: '🔴' },
  { path: '/wound-tracker', key: 'wound', icon: '🩹' },
  { path: '/cough-detector', key: 'cough', icon: '🎤' },
  { path: '/sleep-analyzer', key: 'sleep', icon: '😴' },
  { path: '/medicine-analyzer', key: 'medicine', icon: '💊' },
  { path: '/lab-analyzer', key: 'lab', icon: '📄' },
  { path: '/voicedoc', key: 'voicedoc', icon: '🩺' },
  { path: '/history', key: 'history', icon: '📋' },
  { path: '/settings', key: 'settings', icon: '⚙️' },
]

export default function Navbar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lang, setLang] = useState(getSiteLanguage())

  useEffect(() => {
    const handleLang = () => setLang(getSiteLanguage())
    window.addEventListener('siteLangChange', handleLang)
    return () => window.removeEventListener('siteLangChange', handleLang)
  }, [])

  const toggleLang = () => {
    const nextLang = lang === 'en' ? 'ur' : 'en'
    setSiteLanguage(nextLang)
  }

  const t = navTranslations[lang] || navTranslations.en

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#020810]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-300 group-hover:scale-110 bg-gradient-to-br from-medical-green to-medical-blue shadow-lg shadow-medical-green/20">
              ✚
            </div>
            <div>
              <span className="text-xl font-bold font-outfit tracking-tight gradient-text">VisionDX</span>
              <div className="text-[10px] text-white/40 leading-none uppercase font-semibold tracking-wider mt-0.5">{t.tagline}</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto py-2">
            {navItems.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 shrink-0 ${
                    active
                      ? 'bg-medical-green/10 border border-medical-green/20 text-medical-green shadow-[0_0_15px_rgba(0,212,170,0.15)]'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{t[item.key]}</span>
                </Link>
              )
            })}
          </div>

          {/* Language Toggle Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md hover:border-medical-green/40"
              title="Switch Website Language (English / Urdu)"
            >
              <span>🌐</span> <span className="font-outfit">{t.switchLang}</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle mobile menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`block h-0.5 bg-current transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`block h-0.5 bg-current transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 bg-current transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/5 bg-[#020810]/95 px-4 py-3 space-y-1 max-h-[80vh] overflow-y-auto backdrop-blur-xl">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-medical-green/10 border border-medical-green/20 text-medical-green'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{t[item.key]}</span>
              </Link>
            )
          })}
        </div>
      )}
    </nav>
  )
}
