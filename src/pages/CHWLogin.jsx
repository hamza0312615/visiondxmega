import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCHW } from '../context/CHWContext';
import { LogIn, MapPin, Phone, Shield } from 'lucide-react';

export default function CHWLogin() {
  const { startSession } = useCHW();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    workerName: '',
    village: '',
    doctorNumber: '+92' // Default country code
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.workerName || !formData.village || !formData.doctorNumber) return;

    startSession({
      workerId: crypto.randomUUID(),
      ...formData
    });
    
    navigate('/chw/dashboard');
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-navy-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-medical-green/20 flex items-center justify-center border border-medical-green/30 shadow-[0_0_15px_rgba(46,204,113,0.3)]">
            <Shield className="w-8 h-8 text-medical-green" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">CHW Portal</h1>
          <p className="text-white/50 text-sm">Community Health Worker Offline Mode</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider ml-1">Worker Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <LogIn className="w-5 h-5 text-white/40" />
              </div>
              <input 
                type="text" 
                value={formData.workerName}
                onChange={(e) => setFormData({...formData, workerName: e.target.value})}
                placeholder="e.g. Ayesha Khan"
                className="w-full bg-navy-950/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-medical-green focus:ring-1 focus:ring-medical-green transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider ml-1">Village / Area</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPin className="w-5 h-5 text-white/40" />
              </div>
              <input 
                type="text" 
                value={formData.village}
                onChange={(e) => setFormData({...formData, village: e.target.value})}
                placeholder="e.g. Goth Ibrahim"
                className="w-full bg-navy-950/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-medical-green focus:ring-1 focus:ring-medical-green transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider ml-1">Doctor's WhatsApp Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="w-5 h-5 text-white/40" />
              </div>
              <input 
                type="text" 
                value={formData.doctorNumber}
                onChange={(e) => setFormData({...formData, doctorNumber: e.target.value})}
                placeholder="+92 3XX XXXXXXX"
                className="w-full bg-navy-950/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-medical-green focus:ring-1 focus:ring-medical-green transition-all"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-medical-green hover:bg-emerald-400 text-navy-950 font-bold py-4 px-6 rounded-xl min-h-[48px] transition-colors flex items-center justify-center gap-2"
          >
            Start Offline Session
          </button>
        </form>
      </div>
    </div>
  );
}
