import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getHistory, getWhatsAppConfig, formatTime, setDemoMode, getSiteLanguage } from '../utils/localStorage'
import FeatureCard from '../components/FeatureCard'
import RiskScore from '../components/RiskScore'

const dashboardTranslations = {
  en: {
    heroTitle: "VisionDX Mega Platform",
    heroSubtitle: "Experience clinical AI diagnostics. 12 powerful tools unified into a single client-side platform.",
    scansCompleted: "Over {count} diagnostic scans completed 100% privately.",
    launchBtn: "Launch Diagnostics",
    demoBtn: "Try Active Demo Mode",
    historyBtn: "View Patient History",
    aiModules: "12 AI Modules",
    aiModulesSub: "Acoustic & Vision AI",
    private: "100% Private",
    privateSub: "Zero Backend Storage",
    offline: "Works Offline",
    offlineSub: "Service Worker Pre-Loaded",
    waTitle: "VoiceDoc WhatsApp Sandbox",
    waSubtitle: "Instant Rural Triage via WhatsApp",
    waDesc: "Connect to our automated WhatsApp bot for immediate medical guidance and triage. Send the code below to our sandbox number to get started instantly.",
    waSend: "1. Send this message:",
    waTo: "2. To WhatsApp Number:",
    waBotBtn: "WhatsApp Bot",
    diagTitle: "Diagnostic AI Modules",
    diagSub: "Select a specialized medical AI tool below to start an analysis",
    recentTitle: "Recent Diagnostic Activity",
    recentSub: "Your latest AI assessments stored securely in local browser storage",
    viewAllHistory: "View All History",
    noScans: "No Recent Scans Found",
    noScansDesc: "You haven't performed any diagnostic analyses yet. Choose one of the tools above to run your first AI scan!",
    viewFullReport: "View Full Report",
    analysis: "Analysis",
    recentActivityPlaceholder: "AI assessment completed.",
    chwBtn: "Community Health Worker Platform"
  },
  ur: {
    heroTitle: "VisionDX میگا پلیٹ فارم",
    heroSubtitle: "کلینیکل اے آئی تشخیص کا تجربہ کریں۔ 12 طاقتور ٹولز ایک ہی کلائنٹ سائڈ پلیٹ فارم میں متحد۔",
    scansCompleted: "100٪ رازداری کے ساتھ {count} سے زائد تشخیصی اسکین مکمل ہو گئے۔",
    launchBtn: "تشخیص شروع کریں",
    demoBtn: "ڈیمو موڈ آزمائیں",
    historyBtn: "مریض کا ریکارڈ دیکھیں",
    aiModules: "12 اے آئی ماڈیولز",
    aiModulesSub: "صوتی اور بصری اے آئی",
    private: "100٪ نجی",
    privateSub: "کوئی بیک اینڈ اسٹوریج نہیں",
    offline: "آف لائن کام کرتا ہے",
    offlineSub: "سروس ورکر پری لوڈڈ ہے",
    waTitle: "وائس ڈاکٹر واٹس ایپ سینڈ باکس",
    waSubtitle: "واٹس ایپ سے فوری دیہی علاج",
    waDesc: "فوری طبی رہنمائی اور تشخیص کے لیے ہمارے خودکار واٹس ایپ بوٹ سے جڑیں۔ فوری شروع کرنے کے لیے نیچے دیا گیا کوڈ ہمارے سینڈ باکس نمبر پر بھیجیں۔",
    waSend: "1۔ یہ پیغام بھیجیں:",
    waTo: "2۔ اس واٹس ایپ نمبر پر:",
    waBotBtn: "واٹس ایپ بوٹ",
    diagTitle: "تشخیصی اے آئی ماڈیولز",
    diagSub: "تجزیہ شروع کرنے کے لیے نیچے سے ایک مخصوص طبی اے آئی ٹول منتخب کریں",
    recentTitle: "حالیہ تشخیصی سرگرمی",
    recentSub: "آپ کے تازہ ترین اے آئی تجزیے محفوظ طریقے سے مقامی براؤزر اسٹوریج میں محفوظ ہیں",
    viewAllHistory: "سارا ریکارڈ دیکھیں",
    noScans: "کوئی حالیہ اسکین نہیں ملا",
    noScansDesc: "آپ نے ابھی تک کوئی تشخیصی تجزیہ نہیں کیا ہے۔ اپنا پہلا اے آئی اسکین چلانے کے لیے اوپر کے ٹولز میں سے ایک کا انتخاب کریں!",
    viewFullReport: "مکمل رپورٹ دیکھیں",
    analysis: "کا تجزیہ",
    recentActivityPlaceholder: "اے آئی جائزہ مکمل ہو گیا۔",
    chwBtn: "کمیونٹی ہیلتھ ورکر پلیٹ فارم"
  }
}

export default function Dashboard() {
  const [recentScans, setRecentScans] = useState([])
  const [whatsapp, setWhatsapp] = useState({ phone: '15556734869', joinCode: '' })
  const navigate = useNavigate()
  const lang = getSiteLanguage()
  const t = dashboardTranslations[lang] || dashboardTranslations.en

  useEffect(() => {
    setRecentScans(getHistory().slice(0, 4))
    setWhatsapp(getWhatsAppConfig())
  }, [])

  const handleActivateDemo = () => {
    window.dispatchEvent(new Event('autopilot-start'))
  }

  const features = [
    {
      title: lang === 'ur' ? "آنکھ کی بیماریوں کا اسکین" : "Eye Disease Predictor",
      description: lang === 'ur' ? "اے آئی تجزیہ کے لیے آنکھوں کی تصاویر اپ لوڈ کریں۔ آشوب چشم، موتیابند، گلوکوما، اور مزید کے لیے ماہرانہ معلومات فراہم کی جاتی ہے۔" : "Upload eye photos for AI analysis. Cross-references expert knowledge for Conjunctivitis, Cataracts, Glaucoma, and more.",
      icon: "👁️",
      path: "/eye-predictor",
      color: "cyan",
      stats: lang === 'ur' ? ["بصری اے آئی", "ماہرانہ گائیڈ"] : ["Vision AI", "Expert Grounded"]
    },
    {
      title: lang === 'ur' ? "جلد کے امراض کا تجزیہ" : "Skin Rash Analyzer",
      description: lang === 'ur' ? "میلانومہ، بی سی سی، خارش اور الرجی کے لیے طبی احتیاطی تدابیر کے ساتھ فوری طبی جائزہ لیں۔" : "Instant dermatological assessment for Melanoma, BCC, Dermatitis, and rashes with verified medical precautions.",
      icon: "🔴",
      path: "/skin-analyzer",
      color: "rose",
      stats: lang === 'ur' ? ["بصری اے آئی", "طبی تدابیر"] : ["Vision AI", "Precautions"]
    },
    {
      title: lang === 'ur' ? "زخم کے ٹھیک ہونے کا ٹریکر" : "Wound Healing Tracker",
      description: lang === 'ur' ? "زخم کے ٹھیک ہونے کی روزانہ کی کارکردگی کو ٹریک کریں۔ اے آئی سرخی، سوجن اور انفیکشن کے خطرات کا اندازہ لگاتا ہے۔" : "Track daily wound healing progress. AI evaluates redness, swelling, and infection risks over time.",
      icon: "🩹",
      path: "/wound-tracker",
      color: "green",
      stats: lang === 'ur' ? ["ٹائم لائن", "انفیکشن چیک"] : ["Timeline", "Infection Check"]
    },
    {
      title: lang === 'ur' ? "کھانسی کی آواز کا اے آئی" : "Cough Sound AI",
      description: lang === 'ur' ? "وہسپر اے آئی کے ساتھ کھانسی کی آڈیو ریکارڈنگز کا تجزیہ کریں۔ خشک، تر، یا کالی کھانسی کے پیٹرن کا فوری پتہ لگائیں۔" : "Analyze cough audio recordings with Whisper AI. Detect dry, wet, or pertussis patterns instantly.",
      icon: "🎤",
      path: "/cough-detector",
      color: "blue",
      stats: lang === 'ur' ? ["وہسپر اے آئی", "آڈیو تجزیہ"] : ["Whisper AI", "Audio Analysis"]
    },
    {
      title: lang === 'ur' ? "نیند کے معیار کا اے آئی" : "Sleep Quality AI",
      description: lang === 'ur' ? "آڈیو خرراٹے کے تجزیے اور طبی سوالناموں کے ذریعے نیند کی کمی اور سلیپ اپنیا کے خطرات کا اندازہ کریں۔" : "Evaluate sleep apnea risks and sleep architecture through audio snoring analysis and clinical questionnaires.",
      icon: "😴",
      path: "/sleep-analyzer",
      color: "purple",
      stats: lang === 'ur' ? ["اپنیا چیک", "سلیپ اسکور"] : ["Apnea Check", "Sleep Score"]
    },
    {
      title: lang === 'ur' ? "ادویات کی تصدیق" : "Medicine Verifier",
      description: lang === 'ur' ? "ادویات کی اصلیت کی تصدیق، جعلی علامات کی جانچ، اور خوراک کی ہدایات حاصل کرنے کے لیے پیکجنگ کی تصویر لیں۔" : "Snap a photo of medicine packaging to verify authenticity, check counterfeit signs, and get dosage instructions.",
      icon: "💊",
      path: "/medicine-analyzer",
      color: "teal",
      stats: lang === 'ur' ? ["جعلی دوا چیک", "تصویری اے آئی"] : ["Counterfeit Check", "OCR AI"]
    },
    {
      title: lang === 'ur' ? "لیب رپورٹ کا تجزیہ کار" : "Lab Report Analyzer",
      description: lang === 'ur' ? "فوری اور آسان اے آئی بریک ڈاؤن کے لیے خون کے ٹیسٹ، لپڈ پینل، یا طبی لیب رپورٹس اپ لوڈ کریں۔" : "Upload blood tests, lipid panels, or clinical lab reports for an instant, easy-to-understand AI breakdown.",
      icon: "📄",
      path: "/lab-analyzer",
      color: "amber",
      stats: lang === 'ur' ? ["پی ڈی ایف/تصویر", "بایو مارکرز"] : ["PDF/Image", "Biomarkers"]
    },
    {
      title: lang === 'ur' ? "بالوں اور کھوپڑی کا اے آئی" : "Hair Disease AI",
      description: lang === 'ur' ? "سفید بالوں، بالوں کے گرنے، کھردری کھوپڑی اور خشکی کا جدید ٹرائیکولوجی اے آئی سے معائنہ کریں۔" : "Analyze white hair, premature graying, hair thinning, and scalp conditions with trichology-trained vision AI.",
      icon: "💇",
      path: "/hair-analyzer",
      color: "emerald",
      stats: lang === 'ur' ? ["ٹرائیکولوجی", "رنگ کی تبدیلی"] : ["Trichology AI", "Color Shifts"]
    },
    {
      title: lang === 'ur' ? "روزمرہ کی عادات کا جائزہ" : "Daily Routine Analyzer",
      description: lang === 'ur' ? "طرزِ زندگی کو بہتر بنانے کے لیے نیند، اسکرین ٹائم، پانی، سرگرمی، اور تناؤ کا روزانہ جائزہ لیں۔" : "Input daily sleep, screen time, water, activity, and stress metrics to calculate and optimize your lifestyle schedule.",
      icon: "📅",
      path: "/routine-analyzer",
      color: "purple",
      stats: lang === 'ur' ? ["عادات اسکور", "روزانہ شیڈول"] : ["Habits Score", "Hourly Schedule"]
    },
    {
      title: lang === 'ur' ? "وائس ڈاکٹر علاج و ٹریاج" : "VoiceDoc Triage AI",
      description: lang === 'ur' ? "دیہی علاقوں کے لیے مخصوص آواز کا معاون جو اردو آواز اور واٹس ایپ بوٹ کے ذریعے طبی رہنمائی فراہم کرتا ہے۔" : "Rural-focused voice assistant with Llama 3.3 Versatile reasoning, native language speech synthesis, and WhatsApp bot.",
      icon: "🩺",
      path: "/voicedoc",
      color: "orange",
      stats: lang === 'ur' ? ["آواز کی ترکیب", "واٹس ایپ بوٹ"] : ["Speech Synthesis", "WhatsApp Bot"]
    },
    {
      title: lang === 'ur' ? "اشاروں کی زبان کا مترجم" : "PSL Gesture Translator",
      description: lang === 'ur' ? "پاکستانی اشاروں کی زبان (PSL) اور اردو حروف تہجی کا لائیو ترجمہ کریں۔ اے آئی سے مکمل جملے تشکیل دیں۔" : "Translate Pakistani Sign Language (PSL) and Urdu alphabets in real-time. Compile signs into full sentences with AI.",
      icon: "🖐️",
      path: "/sign-translator",
      color: "cyan",
      stats: lang === 'ur' ? ["سکیلیٹل پوز اے آئی", "اردو سیکھیں"] : ["Skeletal Pose AI", "Urdu Learning"]
    },
    {
      title: lang === 'ur' ? "ادویات کی تجویز کا اے آئی" : "Suggest Medicine AI",
      description: lang === 'ur' ? "طبی رہنما خطوط، عام استعمال کی ادویات کے فارمولے، خوراکیں، اور سخت احتیاطی تدابیر حاصل کریں۔" : "Get structured therapeutic guidelines, over-the-counter active formulations, strict contraindications, and dosages.",
      icon: "💊",
      path: "/suggest-medicine",
      color: "teal",
      stats: lang === 'ur' ? ["طبی نسخہ پیڈ", "خوراکیں اور تنبیہات"] : ["Circadian Rx Pad", "Dosages & Warnings"]
    }
  ]

  const getScanIcon = (type) => {
    switch(type) {
      case 'wound': return '🩹';
      case 'cough': return '🎤';
      case 'sleep': return '😴';
      case 'medicine': return '💊';
      case 'eye': return '👁️';
      case 'skin': return '🔴';
      case 'lab': return '📄';
      case 'hair': return '💇';
      case 'routine': return '📅';
      case 'voicedoc': return '🩺';
      case 'sign': return '🖐️';
      case 'prescription': return '💊';
      default: return '📋';
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 slide-in">
      {/* Pakistan ka Digital Doctor Hero Section */}
      <div className="relative glass-card p-8 sm:p-12 rounded-3xl overflow-hidden border border-white/10 text-center space-y-6 shadow-2xl bg-gradient-to-b from-navy-900 to-[#020810]/95">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-medical-green/15 to-medical-blue/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-medical-blue/15 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-medical-green/10 border border-medical-green/20 text-medical-green text-xs font-black uppercase tracking-widest shadow-glow">
            <span className="w-2 h-2 rounded-full bg-medical-green animate-pulse" />
            {lang === 'ur' ? 'پاکستان کا ڈیجیٹل ڈاکٹر • PAKISTAN KA DIGITAL DOCTOR' : 'PAKISTAN KA DIGITAL DOCTOR • پاکستان کا ڈیجیٹل ڈاکٹر'}
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white font-outfit tracking-tight leading-tight">
            {t.heroTitle.split(' ')[0]} <span className="gradient-text">{t.heroTitle.split(' ').slice(1).join(' ')}</span>
          </h1>
          
          <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
            {t.heroSubtitle}
            <span className="block mt-2 font-semibold text-medical-green">
              {t.scansCompleted.replace('{count}', recentScans.length > 0 ? recentScans.length : getHistory().length)}
            </span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a href="#diagnostics" className="btn-primary py-3.5 px-8 text-base shadow-lg shadow-medical-green/20">
              <span>🚀</span> {t.launchBtn}
            </a>
            <button
              onClick={handleActivateDemo}
              className="px-8 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-600 text-navy-950 font-extrabold text-base transition-all flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
            >
              <span>🔬</span> {t.demoBtn}
            </button>
            <Link to="/history" className="btn-secondary py-3.5 px-8 text-base">
              <span>📋</span> {t.historyBtn}
            </Link>
            <Link to="/chw/login" className="px-8 py-3.5 rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 font-extrabold text-base transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:-translate-y-1">
              <span className="text-xl">🧳</span> {t.chwBtn}
            </Link>
          </div>
        </div>

        {/* 3 Stat Pills & Stats Banner */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-white/10 mt-8 max-w-3xl mx-auto">
          <div className="p-4 rounded-2xl bg-medical-green/5 border border-medical-green/10 backdrop-blur-md flex flex-col items-center">
            <span className="text-xl">🧬</span>
            <div className="text-base font-extrabold text-white font-outfit mt-1">{t.aiModules}</div>
            <div className="text-[10px] text-white/40 uppercase font-semibold tracking-wider">{t.aiModulesSub}</div>
          </div>
          <div className="p-4 rounded-2xl bg-medical-blue/5 border border-medical-blue/10 backdrop-blur-md flex flex-col items-center">
            <span className="text-xl">🔒</span>
            <div className="text-base font-extrabold text-medical-green font-outfit mt-1">{t.private}</div>
            <div className="text-[10px] text-white/40 uppercase font-semibold tracking-wider">{t.privateSub}</div>
          </div>
          <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 backdrop-blur-md flex flex-col items-center">
            <span className="text-xl">📴</span>
            <div className="text-base font-extrabold text-purple-400 font-outfit mt-1">{t.offline}</div>
            <div className="text-[10px] text-white/40 uppercase font-semibold tracking-wider">{t.offlineSub}</div>
          </div>
        </div>
      </div>

      {/* Grid for Gauge & WhatsApp Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        <div className="lg:col-span-1 flex">
          <RiskScore />
        </div>
        <div className="lg:col-span-2 flex">
          {/* WhatsApp Triage Banner */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-medical-green/30 bg-gradient-to-r from-medical-green/10 via-[#020810] to-medical-blue/10 flex flex-col justify-between gap-6 shadow-xl w-full">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-medical-green font-bold text-sm uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-medical-green animate-pulse" /> {t.waTitle}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-outfit">
                {t.waSubtitle}
              </h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                {t.waDesc}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 bg-[#020810]/80 p-4 rounded-2xl border border-white/10 backdrop-blur-xl shadow-inner justify-between w-full">
              <div>
                <div className="text-[9px] text-white/40 uppercase font-semibold tracking-wider mb-1">{t.waSend}</div>
                <div className="font-mono text-xs sm:text-sm font-bold text-medical-green bg-medical-green/10 px-3 py-1.5 rounded-xl border border-medical-green/20 select-all">
                  {whatsapp.joinCode}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-white/40 uppercase font-semibold tracking-wider mb-1">{t.waTo}</div>
                <div className="font-mono text-xs sm:text-sm font-bold text-white bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 select-all">
                  +{whatsapp.phone}
                </div>
              </div>
              <a
                href={`https://wa.me/${whatsapp.phone}?text=${encodeURIComponent(whatsapp.joinCode)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary py-2.5 px-5 text-xs font-bold shadow-lg shadow-medical-green/20"
              >
                <span>💬</span> {t.waBotBtn}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div id="diagnostics" className="space-y-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-outfit flex items-center gap-2">
              <span>🩺</span> {t.diagTitle}
            </h2>
            <p className="text-sm text-white/60 mt-1">{t.diagSub}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => (
            <FeatureCard key={idx} {...feat} />
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-outfit flex items-center gap-2">
              <span>📋</span> {t.recentTitle}
            </h2>
            <p className="text-sm text-white/60 mt-1">{t.recentSub}</p>
          </div>
          <Link to="/history" className="btn-secondary text-xs py-2 px-4">
            {t.viewAllHistory} ({getHistory().length})
          </Link>
        </div>

        {recentScans.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl border border-white/5 text-center space-y-3">
            <div className="text-4xl mb-2">📭</div>
            <h3 className="text-lg font-bold text-white font-outfit">{t.noScans}</h3>
            <p className="text-sm text-white/50 max-w-md mx-auto">
              {t.noScansDesc}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentScans.map((scan) => (
              <Link
                key={scan.id}
                to="/history"
                className="glass-card p-5 rounded-2xl border border-white/5 hover:border-medical-green/30 transition-all group flex flex-col justify-between h-44 hover:scale-[1.02]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-md">
                      {getScanIcon(scan.type)}
                    </span>
                    <span className="text-[10px] text-white/40 bg-white/5 px-2.5 py-1 rounded-full font-semibold">
                      {formatTime(scan.timestamp)}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white font-outfit group-hover:text-medical-green transition-colors line-clamp-1 capitalize">
                    {scan.type} {t.analysis}
                  </h4>
                  <p className="text-xs text-white/60 mt-1 line-clamp-2 leading-relaxed">
                    {scan.summary || scan.rawResponse || t.recentActivityPlaceholder}
                  </p>
                </div>
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40 group-hover:text-white transition-colors">
                  <span className="font-semibold text-medical-green">{t.viewFullReport}</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
