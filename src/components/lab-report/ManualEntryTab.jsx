import React from "react";

export default function ManualEntryTab({
  manualParams,
  newParam,
  setNewParam,
  handleParamChange,
  handleRemoveParam,
  handleAddParam,
}) {
  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">
          Log Biomarker Values
        </h3>
        <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md font-semibold">
          Template Pre-filled
        </span>
      </div>

      {/* Param Input List */}
      <div className="space-y-3">
        {manualParams.map((p, idx) => (
          <div
            key={idx}
            className="grid grid-cols-12 gap-3 items-center bg-white/5 p-3 rounded-xl border border-white/5"
          >
            <div className="col-span-4">
              <input
                type="text"
                value={p.name}
                onChange={(e) => handleParamChange(idx, "name", e.target.value)}
                placeholder="Parameter (e.g. Hemoglobin)"
                className="w-full bg-transparent border-b border-white/10 text-white placeholder:text-white/20 text-xs focus:outline-none focus:border-cyan-400 py-1 font-bold"
              />
            </div>
            <div className="col-span-2">
              <input
                type="text"
                value={p.value}
                onChange={(e) =>
                  handleParamChange(idx, "value", e.target.value)
                }
                placeholder="Value (e.g. 13.5)"
                className="w-full bg-transparent border-b border-white/10 text-white placeholder:text-white/20 text-xs text-center font-mono focus:outline-none focus:border-cyan-400 py-1"
              />
            </div>
            <div className="col-span-2">
              <input
                type="text"
                value={p.unit}
                onChange={(e) => handleParamChange(idx, "unit", e.target.value)}
                placeholder="Unit (e.g. g/dL)"
                className="w-full bg-transparent border-b border-white/10 text-white placeholder:text-white/20 text-xs text-center focus:outline-none focus:border-cyan-400 py-1"
              />
            </div>
            <div className="col-span-3">
              <input
                type="text"
                value={p.refRange}
                onChange={(e) =>
                  handleParamChange(idx, "refRange", e.target.value)
                }
                placeholder="Ref (e.g. 12.0 - 16.0)"
                className="w-full bg-transparent border-b border-white/10 text-white placeholder:text-white/20 text-xs text-center focus:outline-none focus:border-cyan-400 py-1"
              />
            </div>
            <div className="col-span-1 text-right">
              <button
                type="button"
                onClick={() => handleRemoveParam(idx)}
                className="text-red-400 hover:text-red-300 text-sm font-bold p-1"
                title="Remove row"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Row Box */}
      <div className="grid grid-cols-12 gap-3 items-center bg-cyan-500/5 p-4 rounded-xl border border-dashed border-cyan-500/20">
        <div className="col-span-4">
          <input
            type="text"
            value={newParam.name}
            onChange={(e) => setNewParam({ ...newParam, name: e.target.value })}
            placeholder="New Parameter"
            className="w-full bg-transparent border-b border-cyan-500/20 text-white placeholder:text-white/20 text-xs focus:outline-none focus:border-cyan-400 py-1"
          />
        </div>
        <div className="col-span-2">
          <input
            type="text"
            value={newParam.value}
            onChange={(e) =>
              setNewParam({ ...newParam, value: e.target.value })
            }
            placeholder="Value"
            className="w-full bg-transparent border-b border-cyan-500/20 text-white placeholder:text-white/20 text-xs text-center focus:outline-none focus:border-cyan-400 py-1"
          />
        </div>
        <div className="col-span-2">
          <input
            type="text"
            value={newParam.unit}
            onChange={(e) => setNewParam({ ...newParam, unit: e.target.value })}
            placeholder="Unit"
            className="w-full bg-transparent border-b border-cyan-500/20 text-white placeholder:text-white/20 text-xs text-center focus:outline-none focus:border-cyan-400 py-1"
          />
        </div>
        <div className="col-span-3">
          <input
            type="text"
            value={newParam.refRange}
            onChange={(e) =>
              setNewParam({ ...newParam, refRange: e.target.value })
            }
            placeholder="Ref Range"
            className="w-full bg-transparent border-b border-cyan-500/20 text-white placeholder:text-white/20 text-xs text-center focus:outline-none focus:border-cyan-400 py-1"
          />
        </div>
        <div className="col-span-1 text-right">
          <button
            type="button"
            onClick={handleAddParam}
            className="text-cyan-400 hover:text-cyan-300 font-extrabold text-lg p-1"
            title="Add Parameter"
          >
            ＋
          </button>
        </div>
      </div>
    </div>
  );
}
