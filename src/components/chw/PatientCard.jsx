import { useState } from 'react';
import { User, Activity } from 'lucide-react';

export default function PatientCard({ patient, isActive, onClick }) {
  
  const getBadgeColor = (risk) => {
    switch(risk) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-medical-green/20 text-medical-green border-medical-green/30';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all min-h-[48px] ${isActive ? 'bg-white/10 border-white/20' : 'bg-navy-900/50 border-white/5 hover:bg-white/5'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-navy-950 border border-white/10 flex items-center justify-center">
            <User className="w-5 h-5 text-white/50" />
          </div>
          <div>
            <h3 className="font-semibold text-white truncate">{patient.name}</h3>
            <p className="text-xs text-white/50">{patient.age}y • {patient.gender}</p>
          </div>
        </div>
        
        <div className={`text-xs px-2 py-1 rounded-md border capitalize font-semibold ${getBadgeColor(patient.overallRisk)}`}>
          {patient.overallRisk}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-white/50 border-t border-white/5 pt-3">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          <span>{patient.results.length} tests run</span>
        </div>
        <span className="truncate max-w-[120px]">{patient.chiefComplaint}</span>
      </div>
    </button>
  );
}
