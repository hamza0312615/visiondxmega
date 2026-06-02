import React from "react";

export default function Tabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-4">
      <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
        <span>📄</span> Report Inputs
      </h2>
      {/* Tabs */}
      <div className="flex bg-navy-900/80 p-1 rounded-xl border border-white/10 gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "upload"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md"
              : "text-white/60 hover:text-white"
          }`}
        >
          📁 Upload Photo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("webcam")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "webcam"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md"
              : "text-white/60 hover:text-white"
          }`}
        >
          ⏺️ Camera Scan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "manual"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md"
              : "text-white/60 hover:text-white"
          }`}
        >
          ✍️ Manual Log
        </button>
      </div>
    </div>
  );
}
