import { Activity, Wifi, Moon, AlertTriangle, Wind } from 'lucide-react';

export default function StatusCards({ data }) {
  const isAlarm = data.state === "Sleepwalking!";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      {/* State Card */}
      <div className={`rounded-2xl p-6 border transition-colors duration-500 ${
        isAlarm 
          ? 'bg-red-500/10 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' 
          : 'bg-slate-800 border-slate-700 shadow-lg'
      }`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 font-medium mb-1">Current State</p>
            <h3 className={`text-2xl font-bold ${isAlarm ? 'text-red-400' : 'text-white'}`}>
              {data.state}
            </h3>
          </div>
          <div className={`p-3 rounded-xl ${isAlarm ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
            {isAlarm ? <AlertTriangle size={24} /> : <Moon size={24} />}
          </div>
        </div>
      </div>

      {/* RSSI Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 font-medium mb-1">Signal Strength</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-white">{data.rssi.toFixed(1)}</h3>
              <span className="text-slate-400">dBm</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Wifi size={24} />
          </div>
        </div>
      </div>
      
      {/* Breathing Rate Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 font-medium mb-1">Respiration (BPM)</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-white">{data.bpm || 0}</h3>
              <span className="text-slate-400">BPM</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Wind size={24} />
          </div>
        </div>
      </div>

      {/* Sleep Score Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="text-slate-400 font-medium mb-1">Sleep Score</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-white">{data.score}</h3>
              <span className="text-slate-400">/ 100</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
            <Activity size={24} />
          </div>
        </div>
        
        {/* Background decorative progress bar thing */}
        <div 
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000"
          style={{ width: `${data.score}%` }}
        ></div>
      </div>

    </div>
  );
}
