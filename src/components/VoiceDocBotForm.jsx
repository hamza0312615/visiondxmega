import React from 'react';

export default function VoiceDocBotForm({
  botPatientName,
  setBotPatientName,
  botPatientAge,
  setBotPatientAge,
  botPatientGender,
  setBotPatientGender,
  botPatientCity,
  setBotPatientCity,
  botDoctorPhone,
  setBotDoctorPhone,
  botSymptoms,
  setBotSymptoms,
  handleBotSubmit
}) {
  return (
    <form onSubmit={handleBotSubmit} className="glass-card p-8 sm:p-10 rounded-3xl border border-white/10 text-left space-y-6 shadow-2xl fade-in">
      <h3 className="text-xl font-bold text-white font-outfit border-b border-white/10 pb-4 flex items-center gap-2">
        <span>🤖</span> WhatsApp Triage Referral Bot
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Patient Name</label>
          <input
            type="text"
            value={botPatientName}
            onChange={(e) => setBotPatientName(e.target.value)}
            className="input-field bg-navy-900 border-white/10 hover:border-emerald-500/50"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Age</label>
            <input
              type="number"
              value={botPatientAge}
              onChange={(e) => setBotPatientAge(e.target.value)}
              className="input-field bg-navy-900 border-white/10 hover:border-emerald-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Gender</label>
            <select
              value={botPatientGender}
              onChange={(e) => setBotPatientGender(e.target.value)}
              className="input-field bg-navy-900 border-white/10 hover:border-emerald-500/50 cursor-pointer"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Location / City</label>
          <input
            type="text"
            value={botPatientCity}
            onChange={(e) => setBotPatientCity(e.target.value)}
            className="input-field bg-navy-900 border-white/10 hover:border-emerald-500/50"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Doctor WhatsApp Phone</label>
          <input
            type="text"
            value={botDoctorPhone}
            onChange={(e) => setBotDoctorPhone(e.target.value)}
            className="input-field bg-navy-900 font-mono border-white/10 hover:border-emerald-500/50"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Patient Symptoms & Clinical Notes</label>
          <textarea
            rows={4}
            value={botSymptoms}
            onChange={(e) => setBotSymptoms(e.target.value)}
            placeholder="Describe patient symptoms here (e.g. high fever, productive cough, high WBC counts detected)..."
            className="input-field bg-navy-900 border-white/10 hover:border-emerald-500/50 text-sm"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-navy-950 font-extrabold text-base hover:scale-[1.01] transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20"
      >
        <span>🤖</span> Compile & Send Triage via WhatsApp
      </button>
    </form>
  );
}
