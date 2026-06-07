import { useNavigate } from 'react-router-dom';
import { useCHW } from '../../context/CHWContext';
import { 
  ScanFace, Eye, Activity, HeartPulse, FileText, Pill, 
  Moon, Scissors, AlertCircle, CheckCircle2 
} from 'lucide-react';

export default function PatientDiagnosticPanel() {
  const { session, activePatientId } = useCHW();
  const navigate = useNavigate();

  const patient = session?.patients.find(p => p.id === activePatientId);

  if (!patient) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Activity className="w-10 h-10 text-white/20" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Patient Selected</h2>
        <p className="text-white/50 max-w-sm">
          Select a patient from the roster on the left, or add a new patient to begin diagnostics.
        </p>
      </div>
    );
  }

  const modules = [
    { name: 'SkinAnalyzer', path: '/skin-analyzer', icon: ScanFace, label: 'Skin & Rash Check', color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { name: 'EyePredictor', path: '/eye-predictor', icon: Eye, label: 'Eye Examination', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { name: 'WoundTracker', path: '/wound-tracker', icon: Activity, label: 'Wound Tracker', color: 'text-red-400', bg: 'bg-red-400/10' },
    { name: 'CoughDetector', path: '/cough-detector', icon: HeartPulse, label: 'Cough Analysis', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { name: 'LabReportAnalyzer', path: '/lab-analyzer', icon: FileText, label: 'Scan Lab Report', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { name: 'MedicineAnalyzer', path: '/medicine-analyzer', icon: Pill, label: 'Check Medicine', color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { name: 'SleepAnalyzer', path: '/sleep-analyzer', icon: Moon, label: 'Sleep Tracker', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { name: 'HairAnalyzer', path: '/hair-analyzer', icon: Scissors, label: 'Scalp & Hair', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  const handleLaunchModule = (path) => {
    navigate(`${path}?patientId=${patient.id}`);
  };

  const getResultForModule = (moduleName) => {
    // Return the latest result for this module
    return patient.results.filter(r => r.moduleName === moduleName).pop();
  };

  return (
    <div className="h-full flex flex-col bg-navy-950/50">
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-navy-900/50">
        <h2 className="text-2xl font-bold text-white">{patient.name}</h2>
        <div className="flex items-center gap-4 mt-2 text-white/60">
          <span>{patient.age} years old</span>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span>{patient.gender}</span>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="capitalize text-medical-green">{patient.chiefComplaint}</span>
        </div>
      </div>

      {/* Grid of Diagnostics */}
      <div className="p-6 flex-1 overflow-y-auto">
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Available Diagnostics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const result = getResultForModule(mod.name);
            
            return (
              <div 
                key={mod.name} 
                className="bg-navy-900 border border-white/5 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${mod.bg}`}>
                    <Icon className={`w-6 h-6 ${mod.color}`} />
                  </div>
                  {result && (
                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border ${
                      result.riskLevel === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      result.riskLevel === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-medical-green/20 text-medical-green border-medical-green/30'
                    }`}>
                      {result.riskLevel === 'critical' ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      <span className="capitalize font-semibold">{result.riskLevel}</span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-1">{mod.label}</h4>
                  
                  {result ? (
                    <p className="text-xs text-white/60 line-clamp-2 mb-4 h-8" title={result.summary}>
                      {result.summary}
                    </p>
                  ) : (
                    <p className="text-xs text-white/40 mb-4 h-8">Not performed yet.</p>
                  )}

                  <button 
                    onClick={() => handleLaunchModule(mod.path)}
                    className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors min-h-[48px] ${
                      result 
                        ? 'bg-white/5 hover:bg-white/10 text-white' 
                        : 'bg-medical-green/10 hover:bg-medical-green/20 text-medical-green'
                    }`}
                  >
                    {result ? 'Run Again' : 'Start Scan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
