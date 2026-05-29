import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getSiteLanguage, setSiteLanguage } from '../utils/localStorage'

const navTranslations = {
  en: {
    dashboard: 'Dashboard',
    eye: 'Eye Disease Predictor',
    skin: 'Skin Rash Analyzer',
    wound: 'Wound Healing Tracker',
    cough: 'Cough Sound AI',
    sleep: 'Sleep Quality AI',
    medicine: 'Medicine Verifier',
    lab: 'Lab Report Analyzer',
    hair: 'Hair & Scalp AI',
    routine: 'Daily Routine Analyzer',
    voicedoc: 'VoiceDoc',
    offline: 'Offline Agent',
    suggest: 'Suggest Meds',
    history: 'History Logs',
    timeline: 'Clinical Timeline',
    heatmap: 'Disease Density Map',
    settings: 'Settings',
    tagline: 'Mega Edition',
    switchLang: '🇵🇰 اردو',
    logout: 'Sign Out',
    tools: '⚡ AI Diagnostics',
    portal: '📋 Records & Portal'
  },
  ur: {
    dashboard: 'ڈیش بورڈ',
    eye: 'آنکھ AI',
    skin: 'جلد AI',
    wound: 'زخم AI',
    cough: 'کھانسی AI',
    sleep: 'نیند AI',
    medicine: 'ادویات AI',
    lab: 'لیب AI',
    hair: 'بالوں کا AI',
    routine: 'روزمرہ AI',
    voicedoc: 'وائس ڈاکٹر',
    offline: 'آف لائن ایجنٹ',
    suggest: 'تجویز ادویات',
    history: 'سابقہ ریکارڈ',
    timeline: 'ٹائم لائن',
    heatmap: 'ہیلتھ میپ',
    settings: 'ترتیبات',
    tagline: 'میگا ایڈیشن',
    switchLang: '🇺🇸 English',
    logout: 'سائن آؤٹ',
    tools: '⚡ تشخیصی ٹولز',
    portal: '📋 پورٹل ریکارڈز'
  }
}

const diagnosticTools = [
  { path: '/eye-predictor', key: 'eye', icon: '👁️', color: 'cyan', tag: 'Vision AI' },
  { path: '/skin-analyzer', key: 'skin', icon: '🔴', color: 'rose', tag: 'Derm AI' },
  { path: '/wound-tracker', key: 'wound', icon: '🩹', color: 'green', tag: 'Timeline' },
  { path: '/cough-detector', key: 'cough', icon: '🎤', color: 'blue', tag: 'Audio AI' },
  { path: '/sleep-analyzer', key: 'sleep', icon: '😴', color: 'purple', tag: 'Apnea' },
  { path: '/medicine-analyzer', key: 'medicine', icon: '💊', color: 'teal', tag: 'OCR AI' },
  { path: '/lab-analyzer', key: 'lab', icon: '📄', color: 'amber', tag: 'Biomarkers' },
  { path: '/hair-analyzer', key: 'hair', icon: '💇', color: 'emerald', tag: 'Trichology' },
  { path: '/routine-analyzer', key: 'routine', icon: '📅', color: 'purple', tag: 'Wellness' },
  { path: '/offline-agent', key: 'offline', icon: '📵', color: 'emerald', tag: 'No-WiFi' },
]

const demoPresetItems = [
  {
    page: '/lab-analyzer',
    presetId: 'lab-1',
    label: '📄 Abnormal Lab Report',
    desc: 'Abdullah (18y, WBC 23.75)',
    color: 'amber'
  },
  {
    page: '/skin-analyzer',
    presetId: 'skin-1',
    label: '🔴 Acute Eczema Rash',
    desc: 'Inflammatory papules & dry scaling',
    color: 'rose'
  },
  {
    page: '/eye-predictor',
    presetId: 'eye-1',
    label: '👁️ Bacterial Conjunctivitis',
    desc: 'Pink eye vascular congestion',
    color: 'cyan'
  },
  {
    page: '/medicine-analyzer',
    presetId: 'med-1',
    label: '💊 Flagyl 400mg OCR',
    desc: 'SANOFI Metronidazole validation',
    color: 'teal'
  }
]

const portalItems = [
  { path: '/history', key: 'history', icon: '📋', color: 'cyan', tag: 'Reports log' },
  { path: '/timeline', key: 'timeline', icon: '🧬', color: 'purple', tag: 'Medical progression' },
  { path: '/heatmap', key: 'heatmap', icon: '🗺️', color: 'rose', tag: 'Geospatial stats' },
  { path: '/suggest-medicine', key: 'suggest', icon: '💊', color: 'teal', tag: 'Pill lookup' },
  { path: '/settings', key: 'settings', icon: '⚙️', color: 'amber', tag: 'Configure profile' },
]

export default function Navbar({ user, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lang, setLang] = useState(getSiteLanguage())
  const [toolsOpen, setToolsOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const [portalOpen, setPortalOpen] = useState(false)
  
  const dropdownRef = useRef(null)
  const demoDropdownRef = useRef(null)
  const portalDropdownRef = useRef(null)

  useEffect(() => {
    const handleLang = () => setLang(getSiteLanguage())
    window.addEventListener('siteLangChange', handleLang)
    return () => window.removeEventListener('siteLangChange', handleLang)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setToolsOpen(false)
      }
      if (demoDropdownRef.current && !demoDropdownRef.current.contains(event.target)) {
        setDemoOpen(false)
      }
      if (portalDropdownRef.current && !portalDropdownRef.current.contains(event.target)) {
        setPortalOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleLang = () => {
    const nextLang = lang === 'en' ? 'ur' : 'en'
    setSiteLanguage(nextLang)
  }

  const handlePresetClick = (pagePath, presetId) => {
    localStorage.setItem('visiondx_nav_preset_trigger', JSON.stringify({ page: pagePath, presetId: presetId }))
    setDemoOpen(false)
    navigate(pagePath)
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('visiondx-preset-triggered'))
    }, 100)
  }

  const t = navTranslations[lang] || navTranslations.en

  // Color mappings for neon indicator glows
  const getColorClasses = (color) => {
    switch (color) {
      case 'cyan': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]'
      case 'rose': return 'text-rose-400 bg-rose-500/10 border-rose-500/20 group-hover:border-rose-400 group-hover:shadow-[0_0_15px_rgba(251,113,133,0.2)]'
      case 'green': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-400 group-hover:shadow-[0_0_15px_rgba(52,211,153,0.2)]'
      case 'blue': return 'text-blue-400 bg-blue-500/10 border-blue-500/20 group-hover:border-blue-400 group-hover:shadow-[0_0_15px_rgba(96,165,250,0.2)]'
      case 'purple': return 'text-purple-400 bg-purple-500/10 border-purple-500/20 group-hover:border-purple-400 group-hover:shadow-[0_0_15px_rgba(192,132,252,0.2)]'
      case 'teal': return 'text-teal-400 bg-teal-500/10 border-teal-500/20 group-hover:border-teal-400 group-hover:shadow-[0_0_15px_rgba(45,212,191,0.2)]'
      case 'amber': return 'text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:border-amber-400 group-hover:shadow-[0_0_15px_rgba(251,191,36,0.2)]'
      case 'emerald': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-400 group-hover:shadow-[0_0_15px_rgba(52,211,153,0.2)]'
      default: return 'text-white bg-white/5 border-white/10 group-hover:border-white'
    }
  }

  const isToolActive = () => {
    return diagnosticTools.some(tool => location.pathname === tool.path)
  }

  const isPortalActive = () => {
    return portalItems.some(item => location.pathname === item.path)
  }

  return (
    <nav className="fixed top-3 left-4 right-4 z-50 rounded-2xl border border-white/10 bg-[#020810]/75 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Platform Info */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(0,212,170,0.4)] bg-gradient-to-br from-medical-green to-medical-blue text-navy-950 font-sans shadow-lg shadow-medical-green/10">
              ✚
            </div>
            <div>
              <span className="text-xl font-bold font-outfit tracking-tight gradient-text group-hover:brightness-110 transition-all duration-300">VisionDX</span>
              <div className="text-[10px] text-white/40 leading-none uppercase font-semibold tracking-wider mt-0.5">{t.tagline}</div>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center gap-2">
            
            {/* 1. Dashboard Link */}
            <Link
              to="/"
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                location.pathname === '/'
                  ? 'bg-medical-green/10 border border-medical-green/20 text-medical-green shadow-[0_0_15px_rgba(0,212,170,0.1)]'
                  : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span>🏠</span>
              <span>{t.dashboard}</span>
              {location.pathname === '/' && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-medical-green rounded-full shadow-[0_0_8px_rgba(0,212,170,1)]" />
              )}
            </Link>

            {/* 2. Interactive "AI Diagnostics" Dropdown / Mega Menu */}
            <div 
              ref={dropdownRef}
              className="relative"
              onMouseEnter={() => setToolsOpen(true)}
              onMouseLeave={() => setToolsOpen(false)}
            >
              <button
                type="button"
                onClick={() => setToolsOpen(!toolsOpen)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 border ${
                  isToolActive()
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                    : 'text-white/80 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <span>⚡</span>
                <span>{t.tools}</span>
                <span className={`text-[10px] opacity-60 transition-transform duration-300 inline-block ${toolsOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* Dynamic Dropping Grid (Frosted Glass Panel) */}
              {toolsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[440px] bg-[#020810]/95 border border-white/10 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl grid grid-cols-2 gap-3 fade-in duration-300 z-50">
                  <div className="absolute inset-0 bg-gradient-to-tr from-medical-green/5 to-purple-500/5 rounded-2xl pointer-events-none" />
                  
                  {diagnosticTools.map(tool => {
                    const active = location.pathname === tool.path
                    const indicator = getColorClasses(tool.color)
                    return (
                      <Link
                        key={tool.path}
                        to={tool.path}
                        onClick={() => setToolsOpen(false)}
                        className={`group flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 relative z-10 ${
                          active
                            ? 'bg-white/10 border-medical-green/30 text-medical-green shadow-md shadow-medical-green/5'
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-white'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border transition-all ${indicator}`}>
                          {tool.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate group-hover:text-medical-green transition-colors font-outfit">
                            {t[tool.key]?.split(' ')[0]} {t[tool.key]?.split(' ').slice(1).join(' ')}
                          </div>
                          <span className="text-[9px] text-white/40 font-semibold uppercase tracking-wider block mt-0.5">
                            {tool.tag}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 3. Try Clinical Demo Dropdown */}
            <div 
              ref={demoDropdownRef}
              className="relative"
              onMouseEnter={() => setDemoOpen(true)}
              onMouseLeave={() => setDemoOpen(false)}
            >
              <button
                type="button"
                onClick={() => setDemoOpen(!demoOpen)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 border ${
                  demoOpen
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                    : 'text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20'
                }`}
              >
                <span>🔬</span>
                <span>Try Clinical Demo</span>
                <span className={`text-[10px] opacity-60 transition-transform duration-300 inline-block ${demoOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* Demo Menu Grid */}
              {demoOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[420px] bg-[#020810]/95 border border-emerald-500/30 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl space-y-2.5 z-50 fade-in duration-300">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-2xl pointer-events-none" />
                  
                  <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider px-1 pb-1 border-b border-white/10 flex justify-between items-center">
                    <span>🔬 Clinical Case Presets</span>
                    <span className="text-[9px] text-white/40 normal-case font-normal">Real Image Fallbacks</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 relative z-10">
                    {demoPresetItems.map(item => {
                      const active = location.pathname === item.page
                      return (
                        <button
                          key={item.presetId}
                          type="button"
                          onClick={() => handlePresetClick(item.page, item.presetId)}
                          className={`group w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-300 ${
                            active
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-emerald-500/30 text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{item.label.split(' ')[0]}</span>
                            <div>
                              <div className="text-xs font-bold font-outfit group-hover:text-emerald-400 transition-colors">
                                {item.label.split(' ').slice(1).join(' ')}
                              </div>
                              <div className="text-[10px] text-white/50 font-medium">
                                {item.desc}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-bold uppercase group-hover:scale-105 transition-all">
                            Load Demo
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 4. VoiceDoc Link */}
            <Link
              to="/voicedoc"
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                location.pathname === '/voicedoc'
                  ? 'bg-medical-green/10 border border-medical-green/20 text-medical-green shadow-[0_0_15px_rgba(0,212,170,0.1)]'
                  : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span>🩺</span>
              <span>{t.voicedoc}</span>
              {location.pathname === '/voicedoc' && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-medical-green rounded-full shadow-[0_0_8px_rgba(0,212,170,1)]" />
              )}
            </Link>

            {/* 5. Records & Settings Portal Dropdown */}
            <div 
              ref={portalDropdownRef}
              className="relative"
              onMouseEnter={() => setPortalOpen(true)}
              onMouseLeave={() => setPortalOpen(false)}
            >
              <button
                type="button"
                onClick={() => setPortalOpen(!portalOpen)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 border ${
                  isPortalActive()
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                    : 'text-white/80 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <span>📁</span>
                <span>{t.portal}</span>
                <span className={`text-[10px] opacity-60 transition-transform duration-300 inline-block ${portalOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* Portal Menu Dropdown */}
              {portalOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[280px] bg-[#020810]/95 border border-white/10 rounded-2xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl space-y-1.5 z-50 fade-in duration-300">
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent rounded-2xl pointer-events-none" />
                  
                  {portalItems.map(item => {
                    const active = location.pathname === item.path
                    const classes = getColorClasses(item.color)
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setPortalOpen(false)}
                        className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 relative z-10 ${
                          active
                            ? 'bg-white/10 border-cyan-500/30 text-cyan-400'
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-white'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base border transition-all ${classes}`}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold group-hover:text-cyan-400 transition-colors font-outfit">
                            {t[item.key]}
                          </div>
                          <span className="text-[8px] text-white/35 font-semibold block mt-0.5 truncate uppercase">
                            {item.tag}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

          </div>

          {/* User Profile, Lang Toggle, Sign Out */}
          <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
            
            {/* User Greeting Status Badge */}
            {user && (
              <div className="hidden md:flex items-center gap-2.5 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl text-xs shadow-inner shrink-0 whitespace-nowrap">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-medical-green opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-medical-green" />
                </span>
                <span className="text-white/80 font-bold font-outfit shrink-0 whitespace-nowrap">
                  {user.name} <span className="text-white/40 font-semibold font-sans">({user.age}y, {user.gender[0]})</span>
                </span>
              </div>
            )}

            {/* Language Switch Button */}
            <button
              onClick={toggleLang}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md hover:border-medical-green/30 active:scale-[0.98] shrink-0 whitespace-nowrap"
              title="Switch Website Language (English / Urdu)"
            >
              <span>🌐</span> <span className="font-outfit uppercase tracking-wider shrink-0 whitespace-nowrap">{t.switchLang}</span>
            </button>

            {/* Sign Out Button */}
            {user && (
              <button
                onClick={onLogout}
                className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 font-bold text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-[0.98] shrink-0 whitespace-nowrap"
                title="Sign Out"
              >
                <span>🔑</span> <span className="font-outfit shrink-0 whitespace-nowrap">{t.logout}</span>
              </button>
            )}

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

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/5 bg-[#020810]/95 px-4 py-4 space-y-1.5 max-h-[80vh] overflow-y-auto backdrop-blur-2xl rounded-b-2xl">
          {user && (
            <div className="px-4 py-2.5 mb-2 rounded-xl bg-white/5 border border-white/5 text-xs text-white/80 font-bold">
              👤 {user.name} ({user.age} Years, {user.gender})
            </div>
          )}

          {/* Mobile Try Clinical Demo Selector */}
          <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider px-4 py-1 mt-1">🔬 Clinical Demo Presets</div>
          {demoPresetItems.map(item => {
            return (
              <button
                key={item.presetId}
                type="button"
                onClick={() => {
                  setMobileOpen(false)
                  handlePresetClick(item.page, item.presetId)
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 mt-1 hover:bg-emerald-500/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.label.split(' ')[0]}</span>
                  <div>
                    <div className="text-xs font-bold font-outfit">{item.label.split(' ').slice(1).join(' ')}</div>
                    <div className="text-[9px] text-emerald-400/60 font-medium">{item.desc}</div>
                  </div>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold uppercase">Load</span>
              </button>
            )
          })}
          
          <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider px-4 py-1 pt-3 border-t border-white/5 mt-2">Main System Hubs</div>
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              location.pathname === '/'
                ? 'bg-medical-green/10 border border-medical-green/20 text-medical-green'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-base">🏠</span>
            <span>{t.dashboard}</span>
          </Link>
          <Link
            to="/voicedoc"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              location.pathname === '/voicedoc'
                ? 'bg-medical-green/10 border border-medical-green/20 text-medical-green'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-base">🩺</span>
            <span>{t.voicedoc}</span>
          </Link>

          <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider px-4 py-1 pt-3 border-t border-white/5 mt-2">Patient Records & Settings</div>
          {portalItems.map(item => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{t[item.key]}</span>
              </Link>
            )
          })}

          <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider px-4 py-1 pt-3 border-t border-white/5 mt-2">Clinical Diagnostics</div>
          {diagnosticTools.map(tool => {
            const active = location.pathname === tool.path
            return (
              <Link
                key={tool.path}
                to={tool.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base">{tool.icon}</span>
                <span>{t[tool.key]}</span>
              </Link>
            )
          })}
        </div>
      )}
    </nav>
  )
}
