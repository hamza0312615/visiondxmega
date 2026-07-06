import { useState, useEffect, useRef } from 'react'

export default function OfflineAgent() {
  const [healthData, setHealthData] = useState(null)
  const [currentLang, setCurrentLang] = useState('ur')
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [listeningText, setListeningText] = useState('Listening... speak now')
  const [speakingId, setSpeakingId] = useState(null)
  
  const recognitionRef = useRef(null)

  // Load health data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/offline-agent/health-data.json')
        if (res.ok) {
          const data = await res.json()
          setHealthData(data)
        }
      } catch (err) {
        console.error('Failed to load offline health data:', err)
      }
    }
    fetchData()

    // Initialize Web Speech API
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRec) {
      const rec = new SpeechRec()
      rec.continuous = false
      rec.interimResults = false
      rec.lang = 'ur-PK'

      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript
        setSearchQuery(transcript)
        runSearch(transcript)
        setIsRecording(false)
      }

      rec.onend = () => {
        setIsRecording(false)
      }

      rec.onerror = () => {
        setIsRecording(false)
      }

      recognitionRef.current = rec
    }

    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  // Dynamic search runner
  const runSearch = (query) => {
    if (!query || !healthData) return
    const q = query.trim().toLowerCase()
    const matches = healthData.diseases.filter(d =>
      d.symptoms.some(s => q.includes(s) || s.includes(q)) ||
      d.nameEn.toLowerCase().includes(q) ||
      d.id.includes(q)
    )
    setResults(matches.length ? matches : [])
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    runSearch(searchQuery)
  }

  const handleQuickSearch = (id) => {
    if (!healthData) return
    const match = healthData.diseases.find(x => x.id === id)
    setResults(match ? [match] : [])
  }

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in this browser. Try Chrome or Edge.')
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      const langMap = { ur: 'ur-PK', en: 'en-US', pa: 'pa-IN', ps: 'ps-AF', hi: 'hi-IN' }
      recognitionRef.current.lang = langMap[currentLang] || 'ur-PK'
      recognitionRef.current.start()
      setIsRecording(true)
      setListeningText(currentLang === 'en' ? 'Listening... speak symptoms' : 'بولیے، سن رہا ہوں...')
    }
  }

  const handleSpeakAdvice = (id, text) => {
    window.speechSynthesis.cancel()
    
    if (speakingId === id) {
      setSpeakingId(null)
      return
    }

    const utter = new SpeechSynthesisUtterance(text)
    const langMap = { ur: 'ur-PK', en: 'en-US', pa: 'pa-IN', ps: 'ps-AF', hi: 'hi-IN' }
    utter.lang = langMap[currentLang] || 'ur-PK'
    utter.rate = 0.85
    
    utter.onstart = () => setSpeakingId(id)
    utter.onend = () => setSpeakingId(null)
    utter.onerror = () => setSpeakingId(null)
    
    window.speechSynthesis.speak(utter)
  }

  const clearResults = () => {
    setResults(null)
    setSearchQuery('')
    window.speechSynthesis.cancel()
    setSpeakingId(null)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 slide-in">
      {/* Header */}
      <div className="border-b border-white/10 pb-6 mb-8 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <span>📵</span> Integrated Offline Assistant • Rural Health
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
            Offline Health Diagnostics Agent
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            A built-in diagnostic agent loaded from local assets. Search symptoms or speak in your regional language. Works instantly even if you disconnect from the internet.
          </p>
        </div>
        
        {/* Language Selection */}
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-2xl p-1 shadow-inner">
          {[
            { code: 'ur', label: 'اردو' },
            { code: 'en', label: 'English' },
            { code: 'pa', label: 'پنجابی' },
            { code: 'ps', label: 'پښتو' },
            { code: 'hi', label: 'हिंदी' }
          ].map(lang => (
            <button
              key={lang.code}
              onClick={() => setCurrentLang(lang.code)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase transition-all duration-300 ${
                currentLang === lang.code
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-navy-950 font-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Search Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Search Input / Quick Buttons */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSearchSubmit} className="glass-card p-6 rounded-3xl border border-emerald-500/20 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-emerald-400 font-outfit flex items-center gap-2">
              <span>🔍</span> Apni Takleef Batayein / Describe Your Symptoms
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={currentLang === 'en' ? "e.g. fever, headache, stomach pain..." : "مثال: بخار، سر درد، پیٹ درد، زخم..."}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-base outline-none focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all"
              />
              <button
                type="submit"
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-navy-950 font-extrabold hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Search
              </button>
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`px-5 py-4 rounded-2xl border text-xl flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-red-500 border-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                }`}
                title="Voice Search"
              >
                🎙️
              </button>
            </div>

            {isRecording && (
              <div className="text-center text-sm text-emerald-400 font-bold animate-pulse flex items-center justify-center gap-2">
                <span>🔴</span> {listeningText}
              </div>
            )}
          </form>

          {results !== null ? (
            /* Results Panel */
            <div className="space-y-6 fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white font-outfit">
                  Diagnostic Results ({results.length})
                </h3>
                <button
                  onClick={clearResults}
                  className="px-4 py-2 border border-white/10 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all"
                >
                  ← Go Back
                </button>
              </div>

              {results.length === 0 ? (
                <div className="glass-card p-12 text-center rounded-3xl border border-white/5 space-y-4">
                  <div className="text-5xl">🔍</div>
                  <h4 className="text-lg font-bold text-white">No matches found for "{searchQuery}"</h4>
                  <p className="text-sm text-white/40 max-w-sm mx-auto">
                    Try searching simple terms like "bukhar", "dast", "khansi", "chot", or check the quick options.
                  </p>
                </div>
              ) : (
                results.map(d => {
                  const advice = currentLang === 'en' ? d.firstAidEn : d.firstAid
                  const urgencyColors = {
                    emergency: 'bg-red-500 text-white border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]',
                    high: 'bg-amber-500 text-black border-amber-500/30',
                    medium: 'bg-blue-500 text-white border-blue-500/30',
                    low: 'bg-emerald-500 text-white border-emerald-500/30'
                  }
                  return (
                    <div
                      key={d.id}
                      className={`glass-card p-6 sm:p-8 rounded-3xl border transition-all ${
                        d.urgency === 'emergency' ? 'border-red-500/30 bg-red-500/5' : 'border-white/10'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <h4 className="text-2xl font-bold text-white font-outfit flex items-center gap-2.5">
                          <span>{d.emoji}</span> {currentLang === 'en' ? d.nameEn : d.name}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border tracking-wider ${urgencyColors[d.urgency]}`}>
                          {d.urgency}
                        </span>
                      </div>

                      <div className="space-y-4 text-sm text-white/80">
                        <div>
                          <span className="text-[10px] text-emerald-400 uppercase font-extrabold tracking-wider block mb-1">Potential Causes</span>
                          <p className="leading-relaxed">{d.causes}</p>
                        </div>

                        <div>
                          <span className="text-[10px] text-emerald-400 uppercase font-extrabold tracking-wider block mb-1">First Aid Guidelines</span>
                          <p className="leading-relaxed text-base text-white">{advice}</p>
                        </div>

                        {/* Do / Don't Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                            <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <span>✅</span> Kya Karein (Do)
                            </h5>
                            <ul className="list-disc pl-4 space-y-1 text-xs text-white/70">
                              {d.doList.map((item, idx) => <li key={idx}>{item}</li>)}
                            </ul>
                          </div>

                          <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                            <h5 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <span>❌</span> Mat Karein (Don't)
                            </h5>
                            <ul className="list-disc pl-4 space-y-1 text-xs text-white/70">
                              {d.dontList.map((item, idx) => <li key={idx}>{item}</li>)}
                            </ul>
                          </div>
                        </div>

                        {/* Read Advice Audio Button */}
                        <button
                          type="button"
                          onClick={() => handleSpeakAdvice(d.id, advice)}
                          className={`w-full mt-6 py-3.5 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                            speakingId === d.id
                              ? 'bg-emerald-500 border-emerald-500 text-navy-950 animate-pulse'
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25'
                          }`}
                        >
                          {speakingId === d.id ? '⏸️ Click to Stop Audio' : '🔊 Sunaiye / Listen to First Aid Advice'}
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            /* Quick Search Button Grid */
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">
                Quick Diagnostic Categories
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'fever', emoji: '🌡️', title: 'Fever / bukhar' },
                  { id: 'diarrhea', emoji: '🚨', title: 'Diarrhea / Dast' },
                  { id: 'cough', emoji: '😷', title: 'Cough / Khansi' },
                  { id: 'stomach_pain', emoji: '🤢', title: 'Stomach / Pait' },
                  { id: 'headache', emoji: '🤕', title: 'Headache / Sar' },
                  { id: 'cut_wound', emoji: '🩹', title: 'Wound / Zakhm' },
                  { id: 'burn', emoji: '🔥', title: 'Burns / Jalna' },
                  { id: 'chest_pain', emoji: '❤️', title: 'Chest / Seena' },
                  { id: 'snake_bite', emoji: '🐍', title: 'Snake / Saanp' },
                  { id: 'malaria', emoji: '🦟', title: 'Malaria' },
                  { id: 'dehydration', emoji: '💧', title: 'Pani ki kami' },
                  { id: 'eye_problem', emoji: '👁️', title: 'Eye / Aankh' },
                ].map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleQuickSearch(c.id)}
                    className="glass-card p-4 rounded-2xl border border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all text-center space-y-2 group"
                  >
                    <span className="text-3xl block group-hover:scale-110 transition-transform">{c.emoji}</span>
                    <span className="text-xs font-bold text-white/70 block truncate">{c.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info Panels (ORS & Emergency Contacts) */}
        <div className="space-y-6">
          
          {/* ORS Card */}
          <div className="glass-card p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
            <h3 className="text-base font-bold text-emerald-400 font-outfit flex items-center gap-2">
              <span>💊</span> ORS Home Remedy Recipe
            </h3>
            <div className="text-sm text-white/80 space-y-3 leading-relaxed">
              <div>
                <strong className="text-emerald-400 block text-xs uppercase tracking-wider mb-1">🇵🇰 Urdu:</strong>
                <p>1 Litre saaf pani + 6 Chamach cheeni + 1 Chamach namak (Milao aur piyo)</p>
              </div>
              <div className="border-t border-emerald-500/10 pt-2">
                <strong className="text-emerald-400 block text-xs uppercase tracking-wider mb-1">🇬🇧 English:</strong>
                <p>1 Litre clean water + 6 tsp sugar + 1 tsp salt (Mix and drink)</p>
              </div>
              <p className="text-xs text-emerald-400/80 bg-emerald-500/10 p-2.5 rounded-xl text-center font-semibold">
                🥤 Har dast ke baad 1 glass piyo • Drink 1 glass after each loose stool
              </p>
            </div>
          </div>

          {/* Pakistan Emergency Contacts */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white font-outfit flex items-center gap-2">
              <span>🚨</span> Pakistan Rescue Lines
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { number: '1122', label: 'Ambulance / Rescue' },
                { number: '115', label: 'Edhi Foundation' },
                { number: '1166', label: 'Health Helpline' },
                { number: '15', label: 'Police Rescue' }
              ].map(n => (
                <a
                  key={n.number}
                  href={`tel:${n.number}`}
                  className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/40 hover:bg-red-500/10 transition-all text-center"
                >
                  <span className="text-xl font-extrabold text-red-400 block font-outfit">{n.number}</span>
                  <span className="text-[10px] text-white/50 block font-semibold leading-tight">{n.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Installation Instructions */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white font-outfit flex items-center gap-2">
              <span>📲</span> Mobile Installation Help
            </h3>
            <ol className="space-y-3.5 text-xs text-white/70">
              {[
                'Open this portal in your phone browser (Chrome/Safari)',
                'Tap browser menu/share icon (⋮ / 📤)',
                'Select "Add to Home Screen" option',
                'Launch from home screen — works completely offline!'
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-normal">{step}</span>
                </li>
              ))}
            </ol>
          </div>

        </div>
      </div>
    </div>
  )
}
