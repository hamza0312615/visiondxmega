import { useState } from 'react';
import { X, UserPlus, ClipboardList } from 'lucide-react';
import { useCHW } from '../../context/CHWContext';

export default function AddPatientModal({ isOpen, onClose }) {
  const { addPatient } = useCHW();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    chiefComplaint: 'fever'
  });

  if (!isOpen) return null;

  const complaints = ['fever', 'cough', 'skin', 'wound', 'eye', 'other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age) return;
    
    addPatient({
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender,
      chiefComplaint: formData.chiefComplaint
    });
    
    setFormData({ name: '', age: '', gender: 'Male', chiefComplaint: 'fever' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
      <div className="bg-navy-900 border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-navy-950/50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-medical-green" />
            <h2 className="font-semibold text-white">Add New Patient</h2>
          </div>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg min-h-[48px] min-w-[48px] flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/50 uppercase ml-1">Patient Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Ali Raza"
              className="w-full bg-navy-950/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-medical-green transition-all"
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="space-y-2 flex-1">
              <label className="text-xs font-semibold text-white/50 uppercase ml-1">Age</label>
              <input 
                type="number" 
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                placeholder="Years"
                min="0"
                max="120"
                className="w-full bg-navy-950/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-medical-green transition-all"
                required
              />
            </div>
            
            <div className="space-y-2 flex-1">
              <label className="text-xs font-semibold text-white/50 uppercase ml-1">Gender</label>
              <select 
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                className="w-full bg-navy-950/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-medical-green transition-all appearance-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/50 uppercase ml-1">Chief Complaint</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <ClipboardList className="w-5 h-5 text-white/40" />
              </div>
              <select 
                value={formData.chiefComplaint}
                onChange={(e) => setFormData({...formData, chiefComplaint: e.target.value})}
                className="w-full bg-navy-950/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-medical-green transition-all appearance-none capitalize"
              >
                {complaints.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full bg-medical-green hover:bg-emerald-400 text-navy-950 font-bold py-3.5 px-6 rounded-xl min-h-[48px] transition-colors"
            >
              Save Patient Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
