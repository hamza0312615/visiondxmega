import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCHW } from '../context/CHWContext';
import PatientCard from '../components/chw/PatientCard';
import AddPatientModal from '../components/chw/AddPatientModal';
import PatientDiagnosticPanel from '../components/chw/PatientDiagnosticPanel';
import { LogOut, Plus, Send } from 'lucide-react';

export default function CHWDashboard() {
  const { session, endSession, activePatientId, setActivePatientId } = useCHW();
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/chw/login');
    }
  }, [session, navigate]);

  if (!session) return null;

  const handleEndSession = () => {
    if (window.confirm('Are you sure you want to end this session? Unsent data will be cleared.')) {
      endSession();
      navigate('/chw/login');
    }
  };

  const handleSendReports = () => {
    navigate('/chw/report-preview');
  };

  return (
    <div className="flex h-screen bg-navy-950 pt-20"> {/* pt-20 to account for global Navbar */}
      {/* Left Sidebar - Roster */}
      <div className="w-full md:w-80 lg:w-96 border-r border-white/10 bg-navy-900/30 flex flex-col h-full">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-navy-900/80">
          <div>
            <h2 className="font-bold text-white text-lg">Patient Roster</h2>
            <p className="text-xs text-white/50">{session.worker.village}</p>
          </div>
          <button 
            onClick={handleEndSession}
            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
            title="End Session"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 border-dashed rounded-xl py-3 flex items-center justify-center gap-2 transition-colors min-h-[48px]"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Add Patient</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {session.patients.length === 0 ? (
            <div className="text-center py-8 text-white/40 text-sm">
              No patients added yet.
            </div>
          ) : (
            session.patients.map(patient => (
              <PatientCard 
                key={patient.id} 
                patient={patient} 
                isActive={activePatientId === patient.id}
                onClick={() => setActivePatientId(patient.id)}
              />
            ))
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-navy-900/80">
          <button 
            onClick={handleSendReports}
            disabled={session.patients.length === 0}
            className={`w-full font-bold py-3.5 px-4 rounded-xl min-h-[48px] transition-colors flex items-center justify-center gap-2 ${
              session.patients.length === 0 
                ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                : 'bg-medical-green hover:bg-emerald-400 text-navy-950'
            }`}
          >
            <Send className="w-5 h-5" />
            Send All Reports
          </button>
        </div>
      </div>

      {/* Right Panel - Diagnostics */}
      <div className="hidden md:block flex-1 h-full bg-navy-950/50">
        <PatientDiagnosticPanel />
      </div>

      {/* Mobile Right Panel Overlay */}
      {activePatientId && (
        <div className="md:hidden fixed inset-0 z-40 bg-navy-950 pt-20 flex flex-col">
          <div className="p-4 bg-navy-900 flex justify-between items-center border-b border-white/10">
            <h2 className="font-bold text-white">Diagnostics</h2>
            <button 
              onClick={() => setActivePatientId(null)}
              className="text-white/60 hover:text-white px-4 py-2 min-h-[48px]"
            >
              Back to Roster
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PatientDiagnosticPanel />
          </div>
        </div>
      )}

      <AddPatientModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
