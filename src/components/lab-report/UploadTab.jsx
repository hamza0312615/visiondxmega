import React from "react";
import { demoPresets } from "../../data/demoPresets";

export default function UploadTab({
  imagePreview,
  imageFile,
  handleDrop,
  handleImageChange,
  setImageFile,
  setImagePreview,
  setReportType,
  setPresetData,
}) {
  return (
    <div>
      {/* Interactive Demo Presets */}
      {!imagePreview && (
        <div className="bg-[#020810]/40 p-5 rounded-2xl border border-white/5 space-y-3 mb-4">
          <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
            <span>✨</span> Clinical Demo Presets (No Photo Required):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {demoPresets.lab.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={async () => {
                  const blob = await fetch(preset.image).then((res) =>
                    res.blob(),
                  );
                  const file = new File([blob], preset.fileName, {
                    type: "image/png",
                  });
                  setImageFile(file);
                  setImagePreview(preset.image);
                  setReportType(
                    preset.id === "lab-1"
                      ? "General / Complete Blood Count (CBC)"
                      : "Lipid Panel / Cholesterol",
                  );
                  setPresetData(preset);
                }}
                className="p-3.5 text-left rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between gap-1.5 group cursor-pointer"
              >
                <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                  {preset.title}
                </div>
                <div className="text-[10px] text-white/50 line-clamp-2 leading-relaxed">
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!imagePreview ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="upload-zone flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/20 rounded-3xl bg-white/5 hover:bg-white/10 hover:border-cyan-500/50 transition-all cursor-pointer group shadow-inner"
        >
          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
            📊
          </div>
          <p className="text-base font-bold text-white mb-1">
            Drag & Drop lab report photo here
          </p>
          <p className="text-xs text-white/40 mb-6">Supports JPEG, PNG, WEBP</p>
          <label className="btn-secondary cursor-pointer text-xs py-3 px-6 shadow-md">
            Browse Device Files
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="relative rounded-3xl overflow-hidden border border-white/20 bg-navy-900 flex flex-col items-center p-6 shadow-inner">
          <img
            src={imagePreview}
            alt="Lab Report Preview"
            className="max-h-80 object-contain rounded-2xl mb-6 shadow-2xl"
          />
          <div className="flex gap-4 w-full justify-center">
            <label className="btn-secondary cursor-pointer text-xs py-2.5 px-6 shadow-md">
              Change Photo
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files[0])}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setImageFile(null);
                setImagePreview("");
              }}
              className="px-6 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-bold transition-all shadow-md"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
