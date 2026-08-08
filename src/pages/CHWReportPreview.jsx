import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCHW } from '../context/CHWContext';
import { generateCHWReportText, sendWhatsAppReport } from '../services/chwReportService';
import { ArrowLeft, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CHWReportPreview() {
  const navigate = useNavigate();
  const { patients, worker } = useCHW();
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (!patients || patients.length === 0) {
      navigate('/chw-dashboard');
      return;
    }

    const generateAllReports = async () => {
      setLoading(true);
      const reportPromises = patients.map(async (p) => {
        if (p.records && p.records.length > 0) {
          try {
            const text = await generateCHWReportText(p, p.records, worker?.name || 'CHW');
            return { patient: p, text, status: 'pending' };
          } catch (error) {
            return { patient: p, text: "Failed to generate report.", status: 'error' };
          }
        }
        return null;
      });

      const results = await Promise.all(reportPromises);
      setReports(results.filter(r => r !== null));
      setLoading(false);
    };

    generateAllReports();
  }, [patients, navigate, worker]);

  const handleSendAll = async () => {
    setSending(true);
    setStatusMsg('');
    
    const sendPromises = reports.map(async (rep, i) => {
      if (rep.status === 'sent' || !rep.patient.phone) return null;
      
      try {
        await sendWhatsAppReport(rep.patient, rep.text);
        
        // Update local state to show it's sent
        setReports(prev => {
          const newR = [...prev];
          newR[i] = { ...newR[i], status: 'sent' };
          return newR;
        });
        return true;
      } catch (error) {
        setReports(prev => {
          const newR = [...prev];
          newR[i] = { ...newR[i], status: 'error', errorMsg: error.message };
          return newR;
        });
        return false;
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r === true).length;
    
    setSending(false);
    setStatusMsg(`Successfully sent ${successCount} out of ${reports.length} reports.`);
  };

  const handleTextChange = (index, newText) => {
    setReports(prev => {
      const newR = [...prev];
      newR[index].text = newText;
      return newR;
    });
  };

  if (!patients || patients.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 slide-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/chw/dashboard')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white font-outfit">Bulk Report Dispatch</h1>
            <p className="text-xs text-white/50 mt-1">Review the AI-generated clinical summaries for all patients before sending.</p>
          </div>
        </div>
        <button 
          onClick={handleSendAll}
          disabled={sending || reports.length === 0}
          className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
            sending || reports.length === 0
              ? 'bg-white/5 text-white/30 cursor-not-allowed' 
              : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:scale-[1.02] shadow-lg shadow-emerald-500/20'
          }`}
        >
          {sending ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
          {sending ? 'Dispatching...' : 'Send All to WhatsApp'}
        </button>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-navy-800/80 border border-white/10 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-semibold text-white/90">{statusMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <LoadingSpinner />
          <p className="text-sm text-cyan-400 animate-pulse font-semibold">Generating Groq AI Field Reports for {patients.length} patients...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report, idx) => (
            <div key={idx} className="glass-card p-5 rounded-2xl border border-white/10 bg-navy-900/50 flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-bold text-white text-sm">{report.patient.name}</h3>
                  <p className="text-xs text-white/50">{report.patient.phone || 'No Phone Number'}</p>
                </div>
                {report.status === 'sent' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Sent
                  </span>
                )}
                {report.status === 'error' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20" title={report.errorMsg}>
                    <ShieldAlert className="w-3 h-3" /> Error
                  </span>
                )}
              </div>
              <textarea
                value={report.text}
                onChange={(e) => handleTextChange(idx, e.target.value)}
                disabled={report.status === 'sent'}
                className="w-full flex-1 min-h-[250px] p-3 bg-black/40 border border-white/5 rounded-xl text-xs text-white/80 focus:border-cyan-500/50 focus:outline-none transition-colors font-mono resize-none"
              />
            </div>
          ))}
          {reports.length === 0 && (
            <div className="col-span-full text-center py-12 text-white/40">
              No patients have diagnostic records to send.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
