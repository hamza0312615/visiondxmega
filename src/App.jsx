import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import CursorEffect from './components/CursorEffect'
import AuthScreen from './components/AuthScreen'
import AutopilotConsole from './components/AutopilotConsole'

// Pages
import Dashboard from './pages/Dashboard'
import EyePredictor from './pages/EyePredictor'
import SkinAnalyzer from './pages/SkinAnalyzer'
import WoundTracker from './pages/WoundTracker'
import CoughDetector from './pages/CoughDetector'
import SleepAnalyzer from './pages/SleepAnalyzer'
import MedicineAnalyzer from './pages/MedicineAnalyzer'
import LabReportAnalyzer from './pages/LabReportAnalyzer'
import HairAnalyzer from './pages/HairAnalyzer'
import DailyRoutineAnalyzer from './pages/DailyRoutineAnalyzer'
import VoiceDoc from './pages/VoiceDoc'
import OfflineAgent from './pages/OfflineAgent'
import History from './pages/History'
import Settings from './pages/Settings'
import SuggestMedicine from './pages/SuggestMedicine'
import Timeline from './pages/Timeline'
import Heatmap from './pages/Heatmap'

export default function App() {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('visiondx_auth_token')
    const storedUser = localStorage.getItem('visiondx_user')
    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    }
  }, [])

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('visiondx_auth_token')
    setUser(null)
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-navy-950 text-white font-inter selection:bg-medical-green selection:text-navy-950 relative overflow-x-hidden">
        <CursorEffect />
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-navy-950 text-white font-inter selection:bg-medical-green selection:text-navy-950 relative overflow-x-hidden flex flex-col">
        {/* Global Cursor Animation & Glow Effect */}
        <CursorEffect />

        {/* Global Navigation */}
        <Navbar user={user} onLogout={handleLogout} />

        {/* Global Autopilot Assistant Console */}
        <AutopilotConsole />

        {/* Main Content Routes */}
        <main className="pb-16 pt-24 flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/eye-predictor" element={<EyePredictor />} />
            <Route path="/skin-analyzer" element={<SkinAnalyzer />} />
            <Route path="/wound-tracker" element={<WoundTracker />} />
            <Route path="/cough-detector" element={<CoughDetector />} />
            <Route path="/sleep-analyzer" element={<SleepAnalyzer />} />
            <Route path="/medicine-analyzer" element={<MedicineAnalyzer />} />
            <Route path="/lab-analyzer" element={<LabReportAnalyzer />} />
            <Route path="/hair-analyzer" element={<HairAnalyzer />} />
            <Route path="/routine-analyzer" element={<DailyRoutineAnalyzer />} />
            <Route path="/voicedoc" element={<VoiceDoc />} />
            <Route path="/offline-agent" element={<OfflineAgent />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/suggest-medicine" element={<SuggestMedicine />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/heatmap" element={<Heatmap />} />
          </Routes>
        </main>

        {/* Premium Footer */}
        <footer className="border-t border-white/10 bg-navy-900/50 backdrop-blur-md py-8 text-center text-xs text-white/40 mt-auto relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-medical-green animate-pulse" />
              <span>VisionDX Mega Platform • AI-Powered Health Diagnostics</span>
            </div>
            <div>
              <span>Built with React 18, Tailwind CSS & Groq Llama 3.2 / Whisper AI</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  )
}
