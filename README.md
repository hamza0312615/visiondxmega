<div align="center">

<img src="https://img.shields.io/badge/VisionDX-Mega%20Platform-00d4aa?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyIDJhMTAgMTAgMCAxIDAgMCAyMEExMCAxMCAwIDAgMCAxMiAyem0wIDE4YTggOCAwIDEgMSAwLTE2IDggOCAwIDAgMSAwIDE2em0wLTEyYTQgNCAwIDEgMCAwIDggNCA0IDAgMCAwIDAtOHoiLz48L3N2Zz4=" alt="VisionDX Mega"/>

# 🏥 VisionDX Mega Platform

### *Pakistan Ka Digital Doctor • پاکستان کا ڈیجیٹل ڈاکٹر*

**12 AI-powered diagnostic tools unified into a single client-side medical intelligence platform**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.3-orange?style=flat-square)](https://groq.com/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands%20AI-blue?style=flat-square)](https://mediapipe.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

> 🌟 **100% Private** — All diagnostics run client-side. Zero backend data storage.  
> 📴 **Offline-Ready** — Service Worker pre-loaded for rural low-connectivity environments.  
> 🇵🇰 **Multilingual** — Full Urdu, Punjabi, Pashto, Sindhi, Hindi & English support.

---

</div>

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [🏗️ System Architecture](#️-system-architecture)
- [✨ Feature Modules](#-feature-modules)
  - [👁️ Eye Disease Predictor](#️-eye-disease-predictor)
  - [🔴 Skin Rash Analyzer](#-skin-rash-analyzer)
  - [🩹 Wound Healing Tracker](#-wound-healing-tracker)
  - [🎤 Cough Sound AI](#-cough-sound-ai)
  - [😴 Sleep Quality AI](#-sleep-quality-ai)
  - [💊 Medicine Verifier](#-medicine-verifier)
  - [📄 Lab Report Analyzer](#-lab-report-analyzer)
  - [💇 Hair Disease AI](#-hair-disease-ai)
  - [📅 Daily Routine Analyzer](#-daily-routine-analyzer)
  - [🩺 VoiceDoc Triage AI](#-voicedoc-triage-ai)
  - [🖐️ PSL Sign Language Translator](#️-psl-sign-language-translator)
  - [💊 Suggest Medicine AI](#-suggest-medicine-ai)
- [🧳 CHW Mode — Community Health Worker Platform](#-chw-mode--community-health-worker-platform)
- [💬 WhatsApp Triage Bot](#-whatsapp-triage-bot)
- [🤖 Autopilot Demo Console](#-autopilot-demo-console)
- [🔧 Tech Stack](#-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Configuration & API Keys](#️-configuration--api-keys)
- [📁 Project Structure](#-project-structure)
- [🌐 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)

---

## 🎯 Overview

**VisionDX Mega** is a comprehensive, AI-powered medical diagnostics web platform built to democratize healthcare access — especially for rural and underserved communities in Pakistan. It integrates **12 specialized AI diagnostic modules** into a single cohesive, blazing-fast SPA (Single Page Application) that runs entirely in the browser.

The platform leverages:
- **Groq's ultra-fast Llama 3.3 70B Versatile** for text-based medical reasoning
- **Groq Whisper V3** for multilingual voice transcription and triage
- **Google Gemini Vision** for multimodal image analysis
- **MediaPipe Hands** for real-time skeletal pose detection
- **OpenCV Python backend** for clinical wound segmentation
- **ElevenLabs / Web Speech API** for native multilingual TTS

> All patient data is stored **exclusively in browser `localStorage`** — nothing ever leaves the patient's device.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VisionDX Mega Platform                               │
│                     (React 18 + Vite SPA Frontend)                          │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Navbar     │  │  AuthScreen  │  │  Autopilot   │  │ CursorEffect │  │
│  │  (Global     │  │  (JWT Auth   │  │  Console     │  │ (Micro-UX)   │  │
│  │  Navigation) │  │  localStorage│  │  (Demo Mode) │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                             │
│  ┌──────────────────────────── DIAGNOSTIC MODULES ─────────────────────┐  │
│  │                                                                       │  │
│  │  👁️ EyePredictor  🔴 SkinAnalyzer  🩹 WoundTracker  🎤 CoughDetector │  │
│  │  😴 SleepAnalyzer  💊 MedicineAnalyzer  📄 LabReportAnalyzer         │  │
│  │  💇 HairAnalyzer   📅 DailyRoutineAnalyzer  🩺 VoiceDoc              │  │
│  │  🖐️ SignTranslator  💊 SuggestMedicine                                │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────── SUPPORT PAGES ───────────────────────────────────────┐  │
│  │  📋 History   ⚙️ Settings   📊 Heatmap   📅 Timeline   🧳 CHW Mode  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────── UTILITY LAYER ───────────────────────────────────────┐  │
│  │  groqApi.js     localStorage.js    pslClassifier.js   ttsService.js  │  │
│  │  translationService.js   demoPresets.js   chwReportService.js        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                 │
   ┌────────▼────────┐              ┌─────────▼──────────┐
   │  AI APIs Layer  │              │  Python CV Backend  │
   │                 │              │  (FastAPI + OpenCV) │
   │ ┌─────────────┐ │              │                     │
   │ │ Groq Cloud  │ │              │ POST /api/analyze-  │
   │ │ Llama 3.3   │ │              │      wound          │
   │ │ Whisper V3  │ │              │                     │
   │ └─────────────┘ │              │ GET  /api/wounds    │
   │ ┌─────────────┐ │              │ POST /api/wounds    │
   │ │ Google      │ │              │                     │
   │ │ Gemini 1.5  │ │              │ OpenCV Pipeline:    │
   │ │ Vision      │ │              │ HSV → Contour →     │
   │ └─────────────┘ │              │ Ellipse Fit →       │
   │ ┌─────────────┐ │              │ Measurements (mm²)  │
   │ │ ElevenLabs  │ │              │                     │
   │ │ TTS / Web   │ │              │ localhost:8000       │
   │ │ Speech API  │ │              └─────────────────────┘
   │ └─────────────┘ │
   │ ┌─────────────┐ │       ┌─────────────────────────────┐
   │ │  MediaPipe  │ │       │   WhatsApp Backend          │
   │ │  Hands CDN  │ │       │   (Node.js / Express)       │
   │ └─────────────┘ │       │                             │
   └─────────────────┘       │ POST /api/send-triage       │
                             │ Twilio / Meta Business API  │
                             │ localhost:3001               │
                             └─────────────────────────────┘
```

### Data Flow Architecture

```
Patient → Browser Frontend (React SPA)
    │
    ├─ Image/Audio Input
    │       │
    │       ├─► Groq Vision API (Llama 3.2 Vision / Whisper)
    │       │        └─► AI Medical Report
    │       │
    │       └─► FastAPI Backend (OpenCV) ─► CV Metrics (mm², Stage)
    │                    └─► Combined with LLM Response
    │
    ├─ Results → localStorage (Private, No Server)
    │
    └─ WhatsApp Forward → Node.js Backend → Meta API → Doctor
```

---

## ✨ Feature Modules

### 👁️ Eye Disease Predictor
**Route:** `/eye-predictor`

Upload or capture retinal/eye photos for AI-powered ophthalmic analysis. The module cross-references expert clinical knowledge bases to identify:
- 🔵 **Conjunctivitis** (Pink Eye) — bacterial vs viral differentiation
- ⚪ **Cataracts** — lens opacity grading
- 🟤 **Glaucoma** — optic disc assessment
- 🔴 **Diabetic Retinopathy** — vascular leakage patterns
- 🟡 **Stye / Blepharitis** — eyelid inflammation markers

**AI Engine:** Google Gemini 1.5 Flash Vision + Groq LLaMA 3.2 Vision

---

### 🔴 Skin Rash Analyzer
**Route:** `/skin-analyzer`

Instant dermatological AI assessment from a single photo. Covers:
- **Melanoma / BCC** — malignancy risk scoring (ABCDE criteria)
- **Dermatitis & Eczema** — inflammation pattern recognition
- **Psoriasis** — plaque morphology analysis
- **Urticaria / Hives** — allergic reaction identification
- **Tinea / Fungal infections** — ringworm, athlete's foot

Provides **verified medical precautions** and urgency triage flags (`HOME_CARE` / `SEE_DOCTOR` / `EMERGENCY`).

---

### 🩹 Wound Healing Tracker
**Route:** `/wound-tracker`

The platform's most technically advanced module — a **dual-engine system**:

#### 🔬 Computer Vision (CV) Engine (FastAPI + OpenCV)
```python
# HSV color space wound segmentation
mask1 = cv2.inRange(hsv, (0, 40, 40), (25, 255, 255))   # Red tissue
mask2 = cv2.inRange(hsv, (155, 40, 40), (180, 255, 255)) # Deep red
mask3 = cv2.inRange(hsv, (5, 30, 30), (30, 200, 180))    # Necrotic

# Contour fitting → Precise measurements
ellipse = cv2.fitEllipse(largest_contour)
area_mm2 = wound_area_px / (px_per_mm ** 2)
```

**Outputs:**
| Metric | Description |
|--------|-------------|
| **Length × Width** | Major/Minor axis in millimeters |
| **Wound Area (mm²)** | Calibrated isolated tissue field |
| **Estimated Depth** | Infiltration index in mm |
| **Healing Stage** | Inflammatory / Proliferative / Remodeling |
| **Segmentation Overlay** | Base64 OpenCV annotation image |
| **CV Confidence** | Detection confidence score (0–1) |

#### 🤖 LLM Clinical Reasoning (Groq Llama 3.3)
Combines CV metrics with clinical context (pain level, wound location, healing day) for:
- Infection risk assessment
- Evidence-based dressing recommendations
- NPWT candidacy evaluation
- 7-day re-evaluation scheduling

#### 📈 Progress Analytics Dashboard
- SVG-rendered wound area trend charts
- Healing velocity (mm²/day)
- % area reduction since baseline
- Days tracked counter

---

### 🎤 Cough Sound AI
**Route:** `/cough-detector`

Records 10-second audio clips and runs **Groq Whisper V3** transcription + acoustic pattern classification:
- **Dry cough** — irritant/allergic/viral signatures
- **Wet/Productive cough** — bacterial pneumonia indicators
- **Whooping cough (Pertussis)** — characteristic inspiratory whoop
- **Barking cough (Croup)** — laryngeal involvement
- **Chronic cough** — GERD, asthma, TB screening prompts

---

### 😴 Sleep Quality AI
**Route:** `/sleep-analyzer`

Dual-mode sleep assessment:
1. **Audio Snoring Analysis** — records sleep audio, detects snoring patterns, estimates sleep apnea risk
2. **Clinical Questionnaire (STOP-BANG + Epworth)** — validated sleep disorder screening tools

Generates a **Sleep Quality Score** and OSA risk stratification (Low / Medium / High).

---

### 💊 Medicine Verifier
**Route:** `/medicine-analyzer`

Snap a photo of any medicine packaging for:
- **Authenticity verification** — hologram and packaging checks
- **Counterfeit detection flags** — font inconsistencies, seal integrity
- **OCR extraction** — active ingredients, dosage, expiry date
- **Drug interaction warnings** — known contraindications
- **Dosage instructions** — age-adjusted recommendations

---

### 📄 Lab Report Analyzer
**Route:** `/lab-analyzer`

A complete **Clinical Pathology Suite** with 3 input modes:

| Mode | Description |
|------|-------------|
| 📁 **Photo Upload** | Drag-and-drop lab report image for OCR + AI interpretation |
| 📸 **Camera Scan** | Live webcam capture of printed lab reports |
| ✍️ **Manual Entry** | Type biomarker values directly with pre-filled templates |

**Supported Report Categories:**
- Complete Blood Count (CBC) — Hemoglobin, WBC, RBC, Platelets
- Lipid Panel — Total Cholesterol, HDL, LDL, Triglycerides
- Blood Sugar / HbA1c / Diabetes Panel
- Liver Function Test (LFT) — Bilirubin, AST, ALT, ALP
- Kidney Function Test (KFT / Electrolytes) — Creatinine, BUN, Na⁺, K⁺

**Outputs a print-ready clinical report sheet** with:
- Patient credentials & Requisition ID
- Biomarker table with HIGH ▲ / LOW ▼ / NORMAL ✓ flags
- AI diagnostic interpretation
- Dietary and lifestyle modification suggestions
- `window.print()` → PDF download

---

### 💇 Hair Disease AI
**Route:** `/hair-analyzer`

**Trichology-trained vision AI** analyzing:
- **Androgenetic Alopecia** — male/female pattern baldness scoring
- **Alopecia Areata** — patchy hair loss pattern detection
- **Telogen Effluvium** — diffuse shedding assessment
- **Premature Graying** — pigmentation loss analysis
- **Scalp conditions** — dandruff, seborrheic dermatitis, psoriasis
- **Hair shaft abnormalities** — brittleness, split ends

---

### 📅 Daily Routine Analyzer
**Route:** `/routine-analyzer`

Comprehensive lifestyle health calculator using daily inputs:

| Parameter | Input Type |
|-----------|-----------|
| Sleep Duration | Hours slider |
| Sleep Quality | 1–10 rating |
| Screen Time | Hours |
| Water Intake | Glasses/day |
| Physical Activity | Minutes |
| Stress Level | 1–10 scale |
| Caffeine Intake | Cups/day |

Generates a **Lifestyle Health Score**, identifies circadian rhythm disruption, and produces an **optimized hourly daily schedule** recommendation.

---

### 🩺 VoiceDoc Triage AI
**Route:** `/voicedoc`

The platform's flagship rural healthcare module — a full **multilingual AI doctor chatbot**:

#### 🌍 Supported Languages
| Language | Script | TTS |
|----------|--------|-----|
| Urdu | اردو | ✅ Native |
| Roman Urdu | Latin | ✅ Fallback |
| Punjabi | پنجابی | ✅ |
| Pashto | پښتو | ✅ |
| Sindhi | سنڌي | ✅ |
| Hindi | हिन्दी | ✅ |
| English | Latin | ✅ |

#### 3 Consultation Modes:
1. **🎙️ Voice Recording** — 10-second mic capture → Whisper V3 transcription → Llama reasoning → TTS playback
2. **💬 Text Chat** — Type symptoms in any language → AI triage → voice response
3. **🤖 WhatsApp Bot Mode** — Fills structured patient profile → dispatches formatted triage referral directly to doctor's WhatsApp

#### Clinical TTS Integration:
- **ElevenLabs** (if API key set) — premium neural speech
- **Google TTS proxy** — high-quality multilingual fallback
- **Web Speech API** — offline browser-native fallback

---

### 🖐️ PSL Sign Language Translator
**Route:** `/sign-translator`

The most technically complex module — a full **Pakistan Sign Language (PSL) real-time translator**:

#### 🧠 Core AI Engine
- **MediaPipe Hands** (CDN-loaded) — skeletal 21-landmark hand tracking at 30FPS
- **Custom PSL Gesture Classifier** (`pslClassifier.js`) — heuristic geometry engine
- **Dual-hand compound gesture** support (combined two-hand signs)

#### 📖 PSL Dictionary Coverage
Categories: `Greetings`, `Pronouns`, `Household`, `Bathroom`, `Beach`, `Animals`, `Birds`, `Airport`, `Sentences`

#### 🔤 Translation Modes
| Mode | Description |
|------|-------------|
| **Word Signs** | Translates complete PSL vocabulary signs |
| **Urdu Alphabets** | Maps hand poses to Urdu alphabet letters (alef → ی) |

#### 🤖 AI Sentence Compiler
Assembles detected sign sequences into grammatically correct sentences using:
- **Gemini 1.5 Flash** or **Groq Llama 3.3** (configurable)
- **Local NLP fallback** with rule-based phrase matching
- **MyMemory API** for additional translation fallback

#### 📚 Learning Center
Interactive Urdu alphabet teaching module:
- Displays target letter and hand diagram
- Live camera validates if user is forming the correct sign
- Gamified scoring (+10 pts per correct sign)
- Audio beep feedback on success/failure

#### 🗃️ Sign Dataset Collector
Built-in data collection tool for expanding the sign language dataset:
- Label a custom sign gesture
- Capture landmark JSON samples at 1fps
- Export as `.json` dataset for model training

---

### 💊 Suggest Medicine AI
**Route:** `/suggest-medicine`

A responsible AI pharmaceutical reference module providing:
- **Structured therapeutic guidelines** based on symptoms
- **Over-the-counter formulations** with active ingredients
- **Evidence-based dosage schedules** (adult / pediatric)
- **Strict contraindications and black box warnings**
- **Circadian Rx Pad** — optimal medication timing based on body clock
- **Drug-drug interaction alerts**

> ⚠️ Always includes clear disclaimer: consult a licensed physician before administering any medication.

---

## 🧳 CHW Mode — Community Health Worker Platform

**Routes:** `/chw/login` → `/chw/dashboard` → `/chw/report-preview`

A dedicated sub-platform for Community Health Workers (CHWs / Lady Health Workers) to:

- **Access aggregated diagnostic results** saved from all 12 AI modules
- **Triage multiple patients** in a field clinic setting
- **Generate printable patient summary reports** for hospital handoffs
- **Risk-stratified queue** — Critical 🔴 / Warning 🟡 / Normal 🟢
- **Secure CHW login** separate from patient auth flow

Results from each module automatically flow into CHW records via `useSaveToCHW()` hook with risk classification.

---

## 💬 WhatsApp Triage Bot

**Backend:** `whatsapp-backend/server.js` (Node.js + Express)

A dedicated WhatsApp automation backend integrating with **Twilio / Meta Business API**:

```
Patient types symptoms → VoiceDoc processes → Formatted triage alert sent to:
    ┌──────────────────────────────┐
    │  *VISIONDX CLINICAL TRIAGE* │
    │  Patient: Abdullah (18/M)   │
    │  Location: Rahim Yar Khan   │
    │  Priority: SEE_DOCTOR       │
    │  Symptoms: "..."            │
    │  AI Advice: "..."           │
    └──────────────────────────────┘
           ↓ Sent to Doctor's WhatsApp
```

**Endpoints:**
| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/send-triage` | Send triage report to doctor WhatsApp |
| `POST` | `/api/webhook` | Receive inbound WhatsApp messages |
| `GET` | `/health` | Service health check |

**Sandbox Setup:** Configure Twilio sandbox, set join code in Settings page, patients text the join code to activate.

---

## 🤖 Autopilot Demo Console

**Component:** `AutopilotConsole.jsx`

A global floating demo orchestrator that:
1. Automatically navigates through all 12 diagnostic modules
2. Loads realistic pre-built demo presets (real medical images)
3. Simulates full AI analysis pipeline for each module
4. Displays live result cards without requiring API keys

Activated by clicking **"Try Active Demo Mode"** on the Dashboard or triggering `window.dispatchEvent(new Event('autopilot-start'))`.

---

## 🔧 Tech Stack

### Frontend
| Technology | Version | Usage |
|-----------|---------|-------|
| **React** | 18.3.1 | Core UI framework |
| **Vite** | 5.2.11 | Build tool + HMR dev server |
| **React Router DOM** | 6.23.1 | SPA client-side routing |
| **TailwindCSS** | 3.4.3 | Utility-first styling |
| **Lucide React** | 0.378.0 | Icon library |
| **React Webcam** | 7.2.0 | Camera capture component |
| **@google/generative-ai** | 0.24.1 | Gemini API SDK |
| **MediaPipe Hands** | CDN | Hand landmark detection |

### AI & APIs
| Service | Model | Usage |
|---------|-------|-------|
| **Groq** | `llama-3.3-70b-versatile` | Medical text reasoning |
| **Groq** | `llama-3.2-11b-vision-preview` | Image analysis |
| **Groq** | `whisper-large-v3` | Voice transcription |
| **Google Gemini** | `gemini-1.5-flash` | Vision analysis fallback |
| **ElevenLabs** | Neural TTS | Premium speech synthesis |
| **MyMemory API** | Translation | Urdu/multilingual translation |

### Backend
| Technology | Version | Usage |
|-----------|---------|-------|
| **FastAPI** | ≥0.110.0 | REST API for wound CV |
| **OpenCV** | ≥4.9.0 | Computer vision segmentation |
| **NumPy** | ≥1.26.4 | Matrix math for CV |
| **Uvicorn** | ≥0.29.0 | ASGI server |
| **Node.js** | LTS | WhatsApp bot backend |
| **Express** | — | WhatsApp webhook server |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18.x
- **Python** ≥ 3.10 (for wound CV backend)
- **pip** or **uv** package manager

### 1. Clone the Repository
```bash
git clone https://github.com/hamza0312615/visiondxmega.git
cd visiondxmega
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
# Edit .env with your API keys (see Configuration section below)
```

### 4. Start the Frontend Dev Server
```bash
npm run dev
# → Opens at http://localhost:5173
```

### 5. (Optional) Start the Wound CV Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → API at http://localhost:8000
```

### 6. (Optional) Start the WhatsApp Backend
```bash
cd whatsapp-backend
npm install
npm start
# → Bot server at http://localhost:3001
```

---

## ⚙️ Configuration & API Keys

Create a `.env` file in the project root:

```env
# ─── Groq AI (Required for most features) ──────────────────────────────────
VITE_GROQ_API_KEY=gsk_your_groq_api_key_here
# Get free at: https://console.groq.com

# ─── Google Gemini (Optional vision fallback) ───────────────────────────────
VITE_GEMINI_API_KEY=your_gemini_api_key_here
# Get free at: https://aistudio.google.com

# ─── ElevenLabs TTS (Optional premium voice) ────────────────────────────────
VITE_ELEVENLABS_API_KEY=sk_your_elevenlabs_key_here
# Get at: https://elevenlabs.io

# ─── WhatsApp Backend URL ────────────────────────────────────────────────────
VITE_WA_BACKEND_URL=http://localhost:3001

# ─── Wound CV Backend URL ────────────────────────────────────────────────────
VITE_API_URL=http://localhost:8000
```

> **💡 No API Key?** The platform works in full **Demo Mode** — pre-built simulated medical scenarios run without any API keys. Perfect for showcasing and testing!

### In-App Settings
API keys can also be configured directly in the app via **Settings** (`/settings`) page — stored securely in browser localStorage.

---

## 📁 Project Structure

```
VisionDX-Mega/
├── 📄 index.html                    # Vite entry point
├── 📄 vite.config.js                # Vite configuration
├── 📄 tailwind.config.js            # Tailwind custom theme
├── 📄 package.json                  # Frontend dependencies
├── 📄 .env                          # Environment variables
│
├── 📁 src/
│   ├── 📄 main.jsx                  # React app root
│   ├── 📄 App.jsx                   # Router + global layout
│   ├── 📄 index.css                 # Global styles + Tailwind directives
│   │
│   ├── 📁 pages/                    # Route-level page components
│   │   ├── Dashboard.jsx            # Home dashboard + feature grid
│   │   ├── EyePredictor.jsx         # Eye disease AI
│   │   ├── SkinAnalyzer.jsx         # Dermatology AI
│   │   ├── WoundTracker.jsx         # CV + LLM wound analysis
│   │   ├── CoughDetector.jsx        # Whisper cough AI
│   │   ├── SleepAnalyzer.jsx        # Sleep apnea screener
│   │   ├── MedicineAnalyzer.jsx     # Drug verifier
│   │   ├── LabReportAnalyzer.jsx    # Pathology report AI
│   │   ├── HairAnalyzer.jsx         # Trichology AI
│   │   ├── DailyRoutineAnalyzer.jsx # Lifestyle optimizer
│   │   ├── VoiceDoc.jsx             # Multilingual triage chatbot
│   │   ├── SignTranslator.jsx       # PSL gesture recognition
│   │   ├── SuggestMedicine.jsx      # Pharma reference AI
│   │   ├── History.jsx              # Scan history browser
│   │   ├── Settings.jsx             # API key config + profile
│   │   ├── Timeline.jsx             # Patient timeline view
│   │   ├── Heatmap.jsx              # Diagnostic heatmap viz
│   │   ├── OfflineAgent.jsx         # Offline mode manager
│   │   ├── CHWLogin.jsx             # Community health worker auth
│   │   ├── CHWDashboard.jsx         # CHW patient queue
│   │   └── CHWReportPreview.jsx     # Printable CHW report
│   │
│   ├── 📁 components/               # Reusable UI components
│   │   ├── Navbar.jsx               # Global navigation bar
│   │   ├── AuthScreen.jsx           # Login/register screen
│   │   ├── AutopilotConsole.jsx     # Demo mode orchestrator
│   │   ├── CursorEffect.jsx         # Custom cursor glow animation
│   │   ├── FeatureCard.jsx          # Dashboard module card
│   │   ├── ResultCard.jsx           # AI result display card
│   │   ├── RiskScore.jsx            # Health risk gauge widget
│   │   ├── WebcamCapture.jsx        # Camera capture UI
│   │   ├── LoadingSpinner.jsx       # Loading animation
│   │   └── Skeleton.jsx             # Content skeleton loader
│   │
│   ├── 📁 utils/                    # Core utility functions
│   │   ├── groqApi.js               # Groq API (text/vision/audio)
│   │   ├── localStorage.js          # History, auth, config management
│   │   ├── pslClassifier.js         # PSL gesture classification engine
│   │   ├── ttsService.js            # Text-to-speech abstraction layer
│   │   └── translationService.js    # MyMemory translation API
│   │
│   ├── 📁 data/
│   │   └── demoPresets.js           # Demo mode medical scenarios
│   │
│   ├── 📁 hooks/
│   │   └── useSaveToCHW.js          # CHW record auto-save hook
│   │
│   └── 📁 context/                  # React context providers
│
├── 📁 backend/                      # Python FastAPI wound CV backend
│   ├── main.py                      # FastAPI app + OpenCV pipeline
│   ├── requirements.txt             # Python dependencies
│   ├── data.json                    # Wound records ledger
│   └── uploads/                     # Wound image storage
│
└── 📁 whatsapp-backend/             # Node.js WhatsApp bot server
    ├── server.js                    # Express + Twilio webhook handler
    ├── package.json                 # Bot dependencies
    └── .env.example                 # Bot environment template
```

---

## 🌐 Deployment

### Frontend (Vite Build)
```bash
npm run build
# → Outputs to /dist — deploy to Vercel, Netlify, GitHub Pages, or any CDN
```

### Backend (Python FastAPI)
```bash
# Using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000

# Or with Docker
docker build -t visiondx-backend .
docker run -p 8000:8000 visiondx-backend
```

### Recommended Cloud Deployment
| Service | Use Case |
|---------|----------|
| **Vercel** | Frontend SPA (recommended) |
| **Railway / Render** | FastAPI Python backend |
| **Railway** | Node.js WhatsApp backend |
| **Cloud Run** | Containerized full-stack |

> **Note:** The CV backend (`/backend`) requires OpenCV which needs a Linux/Mac environment. Use `opencv-python-headless` for server deployments.

---

## 🔒 Privacy & Security

- ✅ **Zero server-side patient data storage** — all records in browser localStorage
- ✅ **API keys stored client-side** in encrypted localStorage
- ✅ **No telemetry or analytics** tracking
- ✅ **CORS-protected** FastAPI backend (localhost only by default)
- ✅ **Service Worker ready** for offline-first deployment
- ⚠️ **Medical Disclaimer:** VisionDX is an AI assistance tool and does NOT replace professional medical diagnosis. Always consult a licensed physician for clinical decisions.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

### Areas for Contribution
- 🌐 Additional PSL signs for the gesture dictionary
- 🌍 New language support in VoiceDoc
- 🧠 Improved wound segmentation algorithms
- 📱 PWA / Mobile app version
- 🏥 New diagnostic modules (ECG analysis, X-ray AI, etc.)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for Pakistan's healthcare future**

*VisionDX Mega Platform • AI-Powered Health Diagnostics*

*Built with React 18, Tailwind CSS & Groq Llama 3.3 / Whisper AI*

[![GitHub](https://img.shields.io/badge/GitHub-hamza0312615%2Fvisiondxmega-black?style=flat-square&logo=github)](https://github.com/hamza0312615/visiondxmega)

</div>
