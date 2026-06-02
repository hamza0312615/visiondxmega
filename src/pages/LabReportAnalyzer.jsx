import { useState, useEffect } from "react";
import { analyzeImage, analyzeText } from "../utils/groqApi";
import {
  saveResult,
  isDemoMode,
  setDemoMode,
  getApiKey,
} from "../utils/localStorage";
import { demoPresets } from "../data/demoPresets";
import ResultCard from "../components/ResultCard";
import LoadingSpinner from "../components/LoadingSpinner";
import WebcamCapture from "../components/WebcamCapture";
import Skeleton from "../components/Skeleton";

// Extracted Components
import ManualEntryTab from "../components/lab-report/ManualEntryTab";
import UploadTab from "../components/lab-report/UploadTab";
import PrintSheet from "../components/lab-report/PrintSheet";
import Tabs from "../components/lab-report/Tabs";
import ReportTypeSelector from "../components/lab-report/ReportTypeSelector";

export default function LabReportAnalyzer() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [activeTab, setActiveTab] = useState("upload"); // 'upload', 'webcam', or 'manual'
  const [reportType, setReportType] = useState(
    "General / Complete Blood Count (CBC)",
  );
  const [presetData, setPresetData] = useState(null);

  // Manual Entry States
  const [manualParams, setManualParams] = useState([]);
  const [newParam, setNewParam] = useState({
    name: "",
    value: "",
    unit: "",
    refRange: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentResult, setCurrentResult] = useState(null);

  useEffect(() => {
    const runDemo = async () => {
      const isAutopilot =
        localStorage.getItem("visiondx_autopilot") === "active" &&
        localStorage.getItem("visiondx_autopilot_step") === "lab";
      const storedTrigger = localStorage.getItem("visiondx_nav_preset_trigger");

      let preset = null;
      if (storedTrigger) {
        const parsed = JSON.parse(storedTrigger);
        if (parsed.page === "/lab-analyzer") {
          preset = demoPresets.lab.find((p) => p.id === parsed.presetId);
          localStorage.removeItem("visiondx_nav_preset_trigger");
        }
      }

      if (!preset && (isDemoMode() || isAutopilot)) {
        if (isDemoMode()) setDemoMode(false);
        preset = demoPresets.lab[0];
      }

      if (preset) {
        const blob = await fetch(preset.image).then((res) => res.blob());
        const file = new File([blob], preset.fileName, {
          type: preset.fileName.endsWith(".jpg") ? "image/jpeg" : "image/png",
        });
        setImageFile(file);
        setImagePreview(preset.image);
        setActiveTab("upload");
        setReportType("General / Complete Blood Count (CBC)");
        setPresetData(preset);

        if (isAutopilot) {
          setLoading(true);
          setTimeout(() => {
            handleAnalyze(null, null, file, preset);
          }, 1200);
        }
      }
    };
    runDemo();

    const handleNavTrigger = () => {
      runDemo();
    };
    window.addEventListener("visiondx-preset-triggered", handleNavTrigger);
    return () =>
      window.removeEventListener("visiondx-preset-triggered", handleNavTrigger);
  }, []);

  // Default templates for manual entry parameters
  const templates = {
    "General / Complete Blood Count (CBC)": [
      {
        name: "Hemoglobin",
        value: "13.5",
        unit: "g/dL",
        refRange: "12.0 - 16.0",
      },
      {
        name: "White Blood Cell (WBC)",
        value: "7.5",
        unit: "x10^3/uL",
        refRange: "4.0 - 11.0",
      },
      {
        name: "Red Blood Cell (RBC)",
        value: "4.8",
        unit: "x10^6/uL",
        refRange: "4.2 - 5.4",
      },
      {
        name: "Platelet Count",
        value: "250",
        unit: "x10^3/uL",
        refRange: "150 - 450",
      },
    ],
    "Lipid Panel / Cholesterol": [
      {
        name: "Total Cholesterol",
        value: "210",
        unit: "mg/dL",
        refRange: "< 200",
      },
      {
        name: "HDL (Good) Cholesterol",
        value: "45",
        unit: "mg/dL",
        refRange: "> 40",
      },
      {
        name: "LDL (Bad) Cholesterol",
        value: "135",
        unit: "mg/dL",
        refRange: "< 100",
      },
      { name: "Triglycerides", value: "160", unit: "mg/dL", refRange: "< 150" },
    ],
    "Blood Sugar / HbA1c / Diabetes Panel": [
      {
        name: "Fasting Blood Sugar",
        value: "98",
        unit: "mg/dL",
        refRange: "70 - 99",
      },
      {
        name: "Post-Prandial Glucose",
        value: "145",
        unit: "mg/dL",
        refRange: "< 140",
      },
      {
        name: "HbA1c (Glycated Hb)",
        value: "6.1",
        unit: "%",
        refRange: "< 5.7",
      },
    ],
    "Liver Function Test (LFT)": [
      {
        name: "Bilirubin Total",
        value: "0.9",
        unit: "mg/dL",
        refRange: "0.2 - 1.2",
      },
      { name: "SGOT / AST", value: "38", unit: "U/L", refRange: "8 - 48" },
      { name: "SGPT / ALT", value: "42", unit: "U/L", refRange: "7 - 56" },
      {
        name: "Alkaline Phosphatase",
        value: "90",
        unit: "U/L",
        refRange: "44 - 147",
      },
    ],
    "Kidney Function Test (KFT / Electrolytes)": [
      {
        name: "Serum Creatinine",
        value: "1.1",
        unit: "mg/dL",
        refRange: "0.6 - 1.2",
      },
      {
        name: "Blood Urea Nitrogen (BUN)",
        value: "16",
        unit: "mg/dL",
        refRange: "7 - 20",
      },
      {
        name: "Serum Sodium",
        value: "140",
        unit: "mEq/L",
        refRange: "135 - 145",
      },
      {
        name: "Serum Potassium",
        value: "4.2",
        unit: "mEq/L",
        refRange: "3.5 - 5.0",
      },
    ],
  };

  // Pre-fill parameters when category changes
  useEffect(() => {
    if (templates[reportType]) {
      setManualParams(templates[reportType]);
    } else {
      setManualParams([]);
    }
  }, [reportType]);

  const handleImageChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleImageChange(file);
  };

  const handleWebcamCapture = (file) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  const handleAddParam = () => {
    if (!newParam.name || !newParam.value) {
      setError("Parameter name and value are required.");
      return;
    }
    setManualParams([...manualParams, newParam]);
    setNewParam({ name: "", value: "", unit: "", refRange: "" });
    setError("");
  };

  const handleRemoveParam = (index) => {
    setManualParams(manualParams.filter((_, i) => i !== index));
  };

  const handleParamChange = (index, field, val) => {
    const updated = [...manualParams];
    updated[index][field] = val;
    setManualParams(updated);
  };

  const handleAnalyze = async (e, customParams, customFile, forcePreset) => {
    if (e) e.preventDefault();

    const activeFile = customFile || imageFile;
    const activeParams = customParams || manualParams;

    if (activeTab !== "manual" && !activeFile) {
      setError("Please capture or upload a lab report photo to analyze.");
      return;
    }

    if (activeTab === "manual" && activeParams.length === 0) {
      setError("Please enter at least one lab parameter to analyze.");
      return;
    }

    setLoading(true);
    setError("");
    setCurrentResult(null);

    // Preset simulated fallback mode if API keys are missing
    const activePreset = forcePreset || presetData;
    const hasKey = getApiKey() || localStorage.getItem("visiondx_gemini_key");
    if (
      activePreset &&
      activeFile &&
      activeFile.name === activePreset.fileName &&
      !hasKey
    ) {
      setTimeout(() => {
        const saved = saveResult("lab", activePreset.fallbackResult);
        setCurrentResult(saved);
        setLoading(false);
      }, 1500);
      return;
    }

    // Load active patient profile
    const profile = JSON.parse(
      localStorage.getItem("visiondx_user") ||
        '{"name":"John Doe","age":"30","gender":"Male"}',
    );

    let aiResponse = "";
    try {
      if (activeTab === "manual") {
        const textPrompt = `You are an expert clinical pathologist AI assistant. A patient has manually logged their lab report results.
Patient Details:
- Name: ${profile.name}
- Age: ${profile.age} years
- Gender: ${profile.gender}
Report Type: ${reportType}

Entered Parameters:
${activeParams.map((p) => `- ${p.name}: ${p.value} ${p.unit} (Ref Range: ${p.refRange || "Not specified"})`).join("\n")}

Analyze these medical parameters:
1) Identify all abnormal/out-of-range values. Match them against the specified reference ranges.
2) In a section titled "**Diagnostics Interpretation**", explain what these abnormal values indicate in simple, patient-friendly terms, potential underlying causes, and suggested dietary/lifestyle modifications.
3) In a section titled "**Suggested Precautions & Early Care**", suggest generic early care precautions or nutritional advice to follow in the absence of a doctor.
4) End your response with exactly one of these urgency flags: NORMAL, SEE_DOCTOR, or EMERGENCY.`;

        aiResponse = await analyzeText(textPrompt);
      } else {
        const visionPrompt = `You are an expert clinical pathologist AI assistant. Analyze this medical lab report image. Report Type specified by patient: "${reportType}".
Patient Profile context: Name: ${profile.name}, Age: ${profile.age}, Gender: ${profile.gender}.
1) Perform optical character recognition to extract key test parameters, patient results, and reference ranges.
2) Clearly identify and list all abnormal values (e.g., High/Low flags).
3) In a section titled "**Diagnostics Interpretation**", explain what these abnormal values indicate in simple, patient-friendly terms, potential underlying causes, and suggested dietary/lifestyle modifications.
4) In a section titled "**Suggested Precautions & Early Care**", suggest generic early care precautions or nutritional advice to follow in the absence of a doctor.
5) Provide clear clinical advice and determine medical urgency. End your response with exactly one of these urgency flags: NORMAL, SEE_DOCTOR, or EMERGENCY.`;

        aiResponse = await analyzeImage(activeFile, visionPrompt);
      }

      let abnormalSummary = "Analyzing parameters...";
      const lowerRes = aiResponse.toLowerCase();
      if (
        lowerRes.includes("normal") &&
        !lowerRes.includes("abnormal") &&
        !lowerRes.includes("high") &&
        !lowerRes.includes("low")
      ) {
        abnormalSummary =
          "All Key Parameters Appear Within Normal Reference Ranges";
      } else {
        abnormalSummary = "Abnormal Values / Out-of-Range Parameters Detected";
      }

      let urgency = "SEE_DOCTOR";
      if (aiResponse.includes("EMERGENCY")) urgency = "EMERGENCY";
      else if (aiResponse.includes("NORMAL")) urgency = "NORMAL";

      const resultDetails = {
        patientName: profile.name,
        patientAge: `${profile.age} Years`,
        patientGender: profile.gender,
        reportCategory: reportType,
        parameterAssessment: abnormalSummary,
        assessedUrgency: urgency.replace("_", " "),
      };

      // Add manual params data to history if entered manually, so we can re-render the table
      const resultData = {
        summary: `Lab Report Analysis (${reportType}): ${abnormalSummary}. Urgency: ${urgency.replace("_", " ")}.`,
        rawResponse: aiResponse,
        details: resultDetails,
        loggedParameters: activeTab === "manual" ? activeParams : null,
      };

      const saved = saveResult("lab", resultData);
      setCurrentResult(saved);
    } catch (err) {
      setError(
        err.message ||
          "Failed to analyze lab report. Please check your API key or try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetAnalyzer = () => {
    setImageFile(null);
    setImagePreview("");
    setPresetData(null);
    setCurrentResult(null);
    setError("");
    if (templates[reportType]) {
      setManualParams(templates[reportType]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 slide-in printable-area">
      {/* CSS print utility overlay */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          nav, footer, button, .no-print, .upload-zone, .input-field, select, input {
            display: none !important;
          }
          .printable-area {
            margin: 0 !important;
            padding: 0 !important;
          }
          .glass-card {
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .glass-panel {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            color: black !important;
          }
          .text-white {
            color: black !important;
          }
          .text-white\\/60, .text-white\\/50, .text-white\\/40 {
            color: #475569 !important;
          }
          .gradient-text {
            background: none !important;
            -webkit-text-fill-color: black !important;
            color: black !important;
          }
          .bg-navy-950, .bg-[#020810], .bg-navy-900\\/50 {
            background: white !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            color: black !important;
            padding: 8px !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6 no-print">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2 shadow-glow">
            <span>📊</span> Clinical Pathology Vision & Manual Analyzer
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
            Lab Report AI Analyzer
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Upload images/PDFs of reports, or manually log your test values.
            Compile parameters into a certified clinical report sheet ready to
            download or print.
          </p>
        </div>
        {currentResult && (
          <button
            onClick={resetAnalyzer}
            className="btn-secondary text-xs py-2.5 px-4"
          >
            + New Lab Analysis
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 fade-in shadow-lg no-print">
          <span>⚠️</span> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold animate-pulse shadow-glow flex items-center gap-2">
            <span>🔬</span> Evaluating biomarkers, cross-referencing
            physiological levels, and generating certified lab report sheet...
          </div>
          <Skeleton />
        </div>
      ) : currentResult ? (
        <div className="space-y-8 fade-in">
          {/* Custom Pathology Print Sheet */}
          <PrintSheet
            currentResult={currentResult}
            resetAnalyzer={resetAnalyzer}
          />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto glass-card p-8 sm:p-12 rounded-3xl border border-white/10 shadow-2xl space-y-8 no-print">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

          <ReportTypeSelector
            reportType={reportType}
            setReportType={setReportType}
          />

          {activeTab === "manual" ? (
            <ManualEntryTab
              manualParams={manualParams}
              newParam={newParam}
              setNewParam={setNewParam}
              handleParamChange={handleParamChange}
              handleRemoveParam={handleRemoveParam}
              handleAddParam={handleAddParam}
            />
          ) : activeTab === "webcam" ? (
            <WebcamCapture
              onCapture={handleWebcamCapture}
              label="Open Live Lab Report Camera"
            />
          ) : (
            <UploadTab
              imagePreview={imagePreview}
              imageFile={imageFile}
              handleDrop={handleDrop}
              handleImageChange={handleImageChange}
              setImageFile={setImageFile}
              setImagePreview={setImagePreview}
              setReportType={setReportType}
              setPresetData={setPresetData}
            />
          )}

          {presetData && !currentResult && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-dashed border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-3 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.15)] mt-4">
              <span className="text-xl">💡</span>
              <div>
                <div className="font-bold text-white text-sm">
                  Demo Case Loaded!
                </div>
                <div className="mt-0.5 text-white/70">
                  Click the pulsing <b>"Run High-Fidelity Demo Analysis"</b>{" "}
                  button below to execute the AI clinical simulation.
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={
              activeTab === "manual" ? manualParams.length === 0 : !imageFile
            }
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-xl ${
              (activeTab === "manual" ? manualParams.length > 0 : imageFile)
                ? presetData && !currentResult
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-navy-950 hover:scale-[1.01] animate-bounce shadow-emerald-500/40 ring-4 ring-emerald-400/30"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:scale-[1.01] shadow-cyan-500/20"
                : "bg-white/5 text-white/40 cursor-not-allowed border border-white/5"
            }`}
          >
            <span>🔬</span>{" "}
            {presetData && !currentResult
              ? "Run High-Fidelity Demo Analysis"
              : activeTab === "manual"
                ? "Analyze & Generate Clinical Report Sheet"
                : "Extract & Analyze Lab Report"}
          </button>
        </div>
      )}
    </div>
  );
}
