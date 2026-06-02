import React from "react";

export default function ReportTypeSelector({ reportType, setReportType }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
          Report Type
        </label>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="input-field cursor-pointer bg-navy-900"
        >
          <option value="General / Complete Blood Count (CBC)">
            Complete Blood Count (CBC)
          </option>
          <option value="Lipid Panel / Cholesterol">
            Lipid Panel (Cholesterol, Triglycerides)
          </option>
          <option value="Blood Sugar / HbA1c / Diabetes Panel">
            Blood Sugar / HbA1c / Diabetes Panel
          </option>
          <option value="Liver Function Test (LFT)">
            Liver Function Test (LFT)
          </option>
          <option value="Kidney Function Test (KFT / Electrolytes)">
            Kidney Function Test (KFT / Electrolytes)
          </option>
          <option value="Other Medical Lab Report">
            Other Medical Lab Report
          </option>
        </select>
      </div>
    </div>
  );
}
