import React from 'react';

export default function VoiceDocStandardForm({
  language,
  setLanguage,
  recording,
  timeLeft,
  startRecording,
  stopRecordingEarly,
  textInput,
  setTextInput,
  handleTextSubmit
}) {
  return (
    <div className="glass-card p-8 sm:p-12 rounded-3xl border border-white/10 text-center space-y-8 shadow-2xl fade-in">
      {/* Language Selector */}
      <div className="max-w-xs mx-auto space-y-2">
        <label className="block text-xs font-bold text-white/70 uppercase tracking-wider">
          Select Spoken / Written Language
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="input-field cursor-pointer bg-navy-900 text-center font-bold text-base shadow-inner"
        >
          <option value="Urdu / اردو">Urdu / اردو</option>
          <option value="Roman Urdu / رومن اردو">Roman Urdu / رومن اردو</option>
          <option value="English">English</option>
          <option value="Punjabi / پنجابی">Punjabi / پنجابی</option>
          <option value="Pashto / پښتو">Pashto / پښتو</option>
          <option value="Sindhi / سنڌي">Sindhi / سنڌي</option>
          <option value="Hindi / हिन्दी">Hindi / हिन्दी</option>
        </select>
      </div>

      {/* Recording UI / Big Mic Button */}
      <div className="flex flex-col items-center justify-center py-6">
        <button
          type="button"
          onClick={recording ? stopRecordingEarly : startRecording}
          className={`w-36 h-36 rounded-full flex items-center justify-center text-6xl shadow-2xl transition-all duration-300 ${
            recording
              ? 'bg-red-500 text-white recording-pulse scale-110 cursor-pointer shadow-[0_0_50px_rgba(239,68,68,0.6)]'
              : 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-navy-950 hover:scale-105 hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] cursor-pointer'
          }`}
          title={recording ? 'Click to stop recording early' : 'Click to start 10s recording'}
        >
          {recording ? '⏹️' : '🎙️'}
        </button>

        <div className="mt-8 space-y-2">
          <h3 className="text-2xl font-bold text-white font-outfit">
            {recording ? `Listening to Symptoms... ${timeLeft}s left` : 'Click Microphone to Speak'}
          </h3>
          <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
            {recording
              ? 'Speak clearly into your device microphone. Click the stop button when finished.'
              : 'Record up to 10 seconds of your symptoms for instant Whisper AI voice triage.'}
          </p>
        </div>

        {/* Waveform Visualization during recording */}
        {recording && (
          <div className="flex items-center justify-center gap-1.5 h-16 mt-8 fade-in">
            <span className="wave-bar bg-emerald-500" />
            <span className="wave-bar bg-emerald-500" />
            <span className="wave-bar bg-emerald-500" />
            <span className="wave-bar bg-emerald-500" />
            <span className="wave-bar bg-emerald-500" />
            <span className="wave-bar bg-emerald-500" />
            <span className="wave-bar bg-emerald-500" />
            <span className="wave-bar bg-emerald-500" />
            <span className="wave-bar bg-emerald-500" />
            <span className="wave-bar bg-emerald-500" />
            <span className="wave-bar bg-emerald-500" />
            <span className="wave-bar bg-emerald-500" />
          </div>
        )}
      </div>

      {/* Text Chat Option */}
      <div className="w-full max-w-lg mx-auto mt-12 pt-8 border-t border-white/10 space-y-4 fade-in">
        <h4 className="text-sm font-bold text-white/80 font-outfit flex items-center justify-center gap-2">
          <span>💬</span> Or Type Your Message / Symptoms
        </h4>
        <form onSubmit={handleTextSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder={`Type symptoms in ${language.split(' ')[0]} or English...`}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="input-field flex-1 py-3.5 text-base shadow-inner"
          />
          <button
            type="submit"
            disabled={!textInput.trim()}
            className="btn-primary px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>

      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300/90 leading-relaxed max-w-lg mx-auto shadow-inner">
        💡 <b>Rural Healthcare Note:</b> VoiceDoc is optimized for patients with limited literacy or digital access. Triage summaries can be instantly forwarded to local clinic WhatsApp numbers for urgent follow-up.
      </div>
    </div>
  );
}
