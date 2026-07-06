import { useEffect, useState } from 'react';
import StatusCards from './StatusCards';
import LiveChart from './LiveChart';
import PoseViewer from './PoseViewer';
import { saveResult } from '../../utils/localStorage';
import { useSaveToCHW } from '../../hooks/useSaveToCHW';

export default function LiveSleepDashboard({ onSave }) {
  const { saveToCHW } = useSaveToCHW();
  const [data, setData] = useState({
    rssi: 0,
    variance: 0,
    state: "Waiting for backend...",
    score: 100,
    alarm: false
  });
  
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Connect to FastAPI WebSocket
    const ws = new WebSocket('ws://localhost:8000/ws/live');
    
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      setData(payload);
      
      setHistory(prev => {
        const newHistory = [...prev, { time: new Date().toLocaleTimeString(), variance: payload.variance, rssi: payload.rssi }];
        // Keep last 100 points for the chart
        if (newHistory.length > 100) return newHistory.slice(-100);
        return newHistory;
      });
    };

    return () => ws.close();
  }, []);

  const saveSession = () => {
    const resultData = {
      summary: `Hardware Scan. Avg BPM: ${data.bpm || 0}. State: ${data.state}`,
      rawResponse: "Hardware IoT Session Log",
      sleepScore: data.score,
      details: {
        sleepScoreCalculated: `${data.score} / 100`,
        qualityRating: data.score > 80 ? 'Excellent Quality' : data.score > 50 ? 'Fair Quality' : 'Poor Quality',
        assessedUrgency: 'NORMAL',
        regionalScreening: `Avg Breathing Rate: ${data.bpm || 'N/A'} BPM`
      }
    };
    
    const saved = saveResult('sleep', resultData);
    saveToCHW('SleepAnalyzer', resultData.summary, 'normal', resultData);
    
    alert('Hardware Sleep Session Saved to Main AI Database!');
    if (onSave) onSave();
  };

  return (
    <>
      <div className="aurora-bg"></div>
      
      {/* Massive Full-Screen Alarm Overlay */}
      {data.alarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-red-950/80 animate-pulse backdrop-blur-sm"></div>
          <div className="relative bg-red-950/90 border border-red-500 rounded-3xl p-16 shadow-[0_0_150px_rgba(239,68,68,0.6)] text-center transform hover:scale-105 transition-transform duration-300">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center animate-bounce shadow-[0_0_50px_rgba(239,68,68,0.8)]">
              <span className="text-5xl">⏰</span>
            </div>
            <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-red-600 mb-4 tracking-widest uppercase">
              Wake Up!
            </h1>
            <p className="text-2xl text-red-200 font-medium">Smart Alarm / Event Detected</p>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-transparent text-slate-50 p-8 relative z-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex justify-between items-center bg-slate-900/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-md shadow-2xl">
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 mb-2">
                VisionDX SleepSense
              </h1>
              <p className="text-slate-300 font-medium tracking-wide">Contactless Sleep & Presence Analysis System</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={saveSession}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-lg shadow-indigo-500/20"
              >
                💾 Save Session to DB
              </button>
              
              <div className="flex gap-4 items-center bg-slate-800/80 p-3 rounded-xl border border-slate-600 shadow-inner ml-2">
                <label className="text-slate-300 text-sm font-semibold flex items-center gap-2">
                  <span className="text-indigo-400">⏰</span> Smart Wake:
                </label>
                <input 
                  type="time" 
                  className="bg-slate-900 border border-indigo-500/30 rounded-lg px-3 py-2 text-md font-medium text-slate-100 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all cursor-pointer"
                  onChange={(e) => {
                    fetch('http://localhost:8000/api/wake_time', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ time: e.target.value })
                    });
                  }}
                />
              </div>
            </div>
          </header>

        {/* Disclaimer Banner */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-200">
          <strong>Note:</strong> This is a wellness/monitoring aid, not a diagnostic device.
        </div>

        {/* Top Cards */}
        <StatusCards data={data} />

        {/* Charts and 3D View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 3D Viewer */}
          <PoseViewer state={data.state} />

          {/* Line Chart */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <span className="w-3 h-3 rounded-full bg-emerald-400 mr-3 animate-pulse"></span>
              Live Movement (Variance)
            </h2>
            <div className="h-[300px]">
              <LiveChart data={history} />
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
