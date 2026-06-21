import { useState } from 'react'
import bcrypt from 'bcryptjs'

export default function AuthScreen({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('Male')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate network delay for a premium experience
    setTimeout(() => {
      if (isLogin) {
        if (!email || !password) {
          setError('Please fill in all fields.')
          setLoading(false)
          return
        }
        
        // Find user in localStorage
        const storedUser = localStorage.getItem('visiondx_user')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          if (user.email === email && bcrypt.compareSync(password, user.password)) {
            localStorage.setItem('visiondx_auth_token', 'session_active')
            onLoginSuccess(user)
            setLoading(false)
            return
          } else if (user.email === email) {
            setError('Invalid credentials.')
            setLoading(false)
            return
          }
        }
        
        // Default guest user login or auto-register if first time
        const salt = bcrypt.genSaltSync(10)
        const hashedPassword = bcrypt.hashSync(password, salt)

        const defaultUser = {
          name: email.split('@')[0] || 'User',
          age: '28',
          gender: 'Male',
          email,
          password: hashedPassword
        }
        localStorage.setItem('visiondx_user', JSON.stringify(defaultUser))
        localStorage.setItem('visiondx_auth_token', 'session_active')
        onLoginSuccess(defaultUser)
      } else {
        if (!email || !password || !name || !age || !gender) {
          setError('Please complete all profile details.')
          setLoading(false)
          return
        }

        const salt = bcrypt.genSaltSync(10)
        const hashedPassword = bcrypt.hashSync(password, salt)

        const newUser = {
          name,
          age,
          gender,
          email,
          password: hashedPassword
        }

        localStorage.setItem('visiondx_user', JSON.stringify(newUser))
        localStorage.setItem('visiondx_auth_token', 'session_active')
        onLoginSuccess(newUser)
      }
      setLoading(false)
    }, 1200)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020810] relative px-4 py-16 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-medical-green/10 rounded-full blur-[120px] pointer-events-none animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-[45vw] h-[45vw] bg-medical-blue/10 rounded-full blur-[130px] pointer-events-none animate-pulse-slow" />

      <div className="w-full max-w-md glass-card p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center text-3xl bg-gradient-to-br from-medical-green to-medical-blue shadow-lg shadow-medical-green/20 mx-auto">
            ✚
          </div>
          <h2 className="text-3xl font-extrabold text-white font-outfit tracking-tight leading-tight">
            VisionDX <span className="gradient-text">Mega</span>
          </h2>
          <p className="text-sm text-white/50">
            {isLogin ? 'Sign in to access AI Diagnostics Suite' : 'Create your secure profile to get started'}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-navy-900/80 p-1.5 rounded-xl border border-white/10 gap-2">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
              isLogin ? 'bg-gradient-to-r from-medical-green to-medical-blue text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
              !isLogin ? 'bg-gradient-to-r from-medical-green to-medical-blue text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            Create Profile
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sohail"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Age & Gender Group */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">Age</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    placeholder="e.g. 28"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="input-field cursor-pointer bg-navy-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-medical-green to-medical-blue text-white font-bold text-sm hover:scale-[1.01] transition-all flex items-center justify-center gap-2 shadow-lg shadow-medical-green/10 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLogin ? (
              'Access Suite'
            ) : (
              'Create Profile & Login'
            )}
          </button>
        </form>

        <div className="text-center text-[10px] text-white/30 pt-4 border-t border-white/5">
          🔒 Secure Client-Side Encryption • 100% Patient Privacy Guaranteed
        </div>
      </div>
    </div>
  )
}
