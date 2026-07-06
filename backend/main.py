from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Form, WebSocket, WebSocketDisconnect
import asyncio
from rssi_scanner import RSSIScanner
from sleep_analyzer import SleepAnalyzer
from alarm_manager import AlarmManager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
import cv2
import numpy as np
import json
import uuid
import base64
import os
import httpx
import sqlite3
from datetime import datetime
from pathlib import Path

app = FastAPI(title="WoundCare API", version="1.0.0")

# Allow React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── SleepSense Global State ───────────────────────────────────────────────────
current_sleep_state = {
    "rssi": 0,
    "variance": 0.0,
    "state": "Calibrating...",
    "score": 100,
    "alarm": False
}
connected_ws_clients = set()
target_wake_time = None

async def sleep_analysis_task():
    scanner = RSSIScanner()
    if not scanner.connected_ssid:
        print("SleepSense: Cannot run without a connected WiFi network.")
        return

    analyzer = SleepAnalyzer(window_size=20, sleepwalking_threshold=2.0)
    alarm = AlarmManager()
    alarm_cooldown = 0
    
    while True:
        rssi = scanner.get_current_rssi()
        if rssi is not None:
            state, variance, bpm = analyzer.analyze_window(rssi)
            score = analyzer.get_sleep_score()
            
            is_alarming = False
            if alarm_cooldown > 0:
                alarm_cooldown -= 1
                
            import datetime
            global target_wake_time
            if target_wake_time and state in ["Light Sleep", "Restless"]:
                now = datetime.datetime.now()
                try:
                    target_hr, target_min = map(int, target_wake_time.split(':'))
                    target_dt = now.replace(hour=target_hr, minute=target_min, second=0, microsecond=0)
                    if target_dt < now:
                        target_dt += datetime.timedelta(days=1)
                        
                    time_diff_minutes = (target_dt - now).total_seconds() / 60.0
                    
                    if 0 <= time_diff_minutes <= 30 and alarm_cooldown == 0:
                        is_alarming = True
                        alarm_cooldown = 10
                        target_wake_time = None # Disable it after it fires
                except Exception as e:
                    print("Error parsing wake time:", e)
                    
            if state == "Sleepwalking!" and alarm_cooldown == 0:
                is_alarming = True
                alarm_cooldown = 10
            
            current_sleep_state["rssi"] = rssi
            current_sleep_state["variance"] = variance
            current_sleep_state["state"] = state
            current_sleep_state["score"] = score
            current_sleep_state["alarm"] = is_alarming
            current_sleep_state["bpm"] = bpm
            
            message = json.dumps(current_sleep_state)
            disconnected = set()
            for client in connected_ws_clients:
                try:
                    await client.send_text(message)
                except Exception:
                    disconnected.add(client)
            
            for client in disconnected:
                connected_ws_clients.remove(client)

            if is_alarming:
                alarm.trigger_alarm(duration_ms=1500)
                
        await asyncio.sleep(0.5)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(sleep_analysis_task())

# ── Directories ──────────────────────────────────────────────────────────────
BASE_DIR    = Path(__file__).parent
DATA_FILE   = BASE_DIR / "data.json"
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# Load environment variables manually
def load_env():
    env_paths = [BASE_DIR / ".env", BASE_DIR.parent / ".env"]
    for path in env_paths:
        if path.exists():
            with open(path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ[k.strip()] = v.strip().strip('"').strip("'")
            break

load_env()

# Initialize SQLite database
DB_FILE = BASE_DIR / "visiondx.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            name TEXT,
            age TEXT,
            gender TEXT,
            city TEXT,
            createdAt TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS diagnostic_records (
            id TEXT PRIMARY KEY,
            patientId TEXT,
            moduleName TEXT,
            summary TEXT,
            riskLevel TEXT,
            timestamp TEXT,
            rawData TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

# Serve uploaded images as static files  →  http://localhost:8000/uploads/xyz.png
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# ── File Ledger ──────────────────────────────────────────────────────────────

def load_data() -> dict:
    if not DATA_FILE.exists():
        default = {"wounds": [], "measurements": []}
        save_data(default)
        return default
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_data(data: dict):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

# ── Wound Analysis ───────────────────────────────────────────────────────────

def analyze_wound(image_bytes: bytes) -> dict:
    """
    Real OpenCV-based wound segmentation and measurement.
    1. Decode image
    2. Convert to HSV → mask isolating wound-colored regions
    3. Find contours → pick the largest one as the wound
    4. Compute area, length, width from contour
    5. Classify healing stage from color features
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")

    orig_h, orig_w = img.shape[:2]

    # Resize for speed
    scale = 512 / max(orig_h, orig_w)
    work = cv2.resize(img, None, fx=scale, fy=scale)
    hsv = cv2.cvtColor(work, cv2.COLOR_BGR2HSV)

    # Wound tissue masks (red/pink/necrotic)
    mask1 = cv2.inRange(hsv, (0, 40, 40), (25, 255, 255))
    mask2 = cv2.inRange(hsv, (155, 40, 40), (180, 255, 255))
    mask3 = cv2.inRange(hsv, (5, 30, 30), (30, 200, 180))
    mask = cv2.bitwise_or(mask1, cv2.bitwise_or(mask2, mask3))

    # Morphological cleanup
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=3)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN,  kernel, iterations=2)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        fallback_area_px = int(0.09 * work.shape[0] * work.shape[1])
        r = int((fallback_area_px / np.pi) ** 0.5)
        wound_area_px = fallback_area_px
        length_px = r * 2
        width_px  = r * 2
    else:
        largest = max(contours, key=cv2.contourArea)
        wound_area_px = cv2.contourArea(largest)
        if len(largest) >= 5:
            ellipse = cv2.fitEllipse(largest)
            _, (minor_ax, major_ax), _ = ellipse
            length_px = major_ax
            width_px  = minor_ax
        else:
            x, y, w, h = cv2.boundingRect(largest)
            length_px = float(max(w, h))
            width_px  = float(min(w, h))

    # Detect Green Calibration Marker (Green HSV Range)
    lower_green = np.array([35, 40, 40])
    upper_green = np.array([85, 255, 255])
    green_mask = cv2.inRange(hsv, lower_green, upper_green)
    
    green_contours, _ = cv2.findContours(green_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    marker_diameter_px = None
    best_marker_contour = None
    
    for c in green_contours:
        area = cv2.contourArea(c)
        if area < 50:
            continue
        perimeter = cv2.arcLength(c, True)
        if perimeter == 0:
            continue
        circularity = 4 * np.pi * area / (perimeter ** 2)
        if circularity > 0.7:  # reasonable circular marker check
            if best_marker_contour is None or area > cv2.contourArea(best_marker_contour):
                best_marker_contour = c
                
    if best_marker_contour is not None:
        _, m_radius = cv2.minEnclosingCircle(best_marker_contour)
        marker_diameter_px = m_radius * 2

    # Calibrate px -> mm (assume circular sticker of diameter 20.0 mm)
    MARKER_PHYSICAL_DIAMETER_MM = 20.0
    if marker_diameter_px and marker_diameter_px > 5:
        px_per_mm = marker_diameter_px / MARKER_PHYSICAL_DIAMETER_MM
        calibrated_by_marker = True
    else:
        # Fallback to default 100mm field-of-view calibration scale
        REFERENCE_MM = 100.0
        px_per_mm = max(work.shape[:2]) / REFERENCE_MM
        calibrated_by_marker = False

    area_mm2  = wound_area_px / (px_per_mm ** 2)
    length_mm = length_px / px_per_mm
    width_mm  = width_px  / px_per_mm
    depth_mm  = round(0.15 * min(length_mm, width_mm), 1)

    # Healing stage from color
    masked_pixels = work[mask > 0]
    if len(masked_pixels) > 0:
        b, g, r = masked_pixels.mean(axis=0)
        if r > 130 and r > g * 1.3:
            healing_stage = "inflammatory"
        elif g > 80 and abs(r - g) < 50:
            healing_stage = "proliferative"
        else:
            healing_stage = "remodeling"
    else:
        healing_stage = "proliferative"

    # Segmentation overlay (base64 PNG)
    overlay = work.copy()
    overlay[mask > 0] = (overlay[mask > 0] * 0.5 + np.array([0, 0, 200]) * 0.5).astype(np.uint8)
    if best_marker_contour is not None:
        # Draw bright green circle outlining calibration marker
        cv2.drawContours(overlay, [best_marker_contour], -1, (0, 255, 0), 2)
        
    _, buf = cv2.imencode(".png", overlay)
    seg_b64 = "data:image/png;base64," + base64.b64encode(buf.tobytes()).decode()

    confidence = min(0.99, 0.75 + (wound_area_px / (work.shape[0] * work.shape[1])) * 0.5)

    return {
        "measurements": {
            "length": round(length_mm, 1),
            "width":  round(width_mm,  1),
            "area":   round(area_mm2,  1),
            "depth":  depth_mm,
        },
        "healingStage": healing_stage,
        "confidence":   round(confidence, 2),
        "segmentationUrl": seg_b64,
        "calibratedByMarker": calibrated_by_marker,
        "recommendations": generate_recommendations(
            healing_stage, round(area_mm2, 1), depth_mm, round(length_mm, 1), round(width_mm, 1)
        ),
    }


def generate_recommendations(
    healing_stage: str, area: float, depth: float, length: float, width: float
) -> list[str]:
    """
    Rule-based clinical decision support engine.
    Generates wound care recommendations using evidence-based guidelines
    from healing stage, wound area (mm²), depth (mm), and dimensions (mm).
    """
    recs: list[str] = []

    # ── Stage-specific recommendations ────────────────────────────────────────
    if healing_stage == "inflammatory":
        recs.append("Active inflammation detected — keep wound clean and apply antimicrobial dressing (e.g. silver-based)")
        recs.append("Monitor for signs of infection: increased redness, warmth, swelling, or purulent discharge")
        if area > 500:
            recs.append("Large inflamed area — consider systemic assessment and potential wound culture")
    elif healing_stage == "proliferative":
        recs.append("Wound is in proliferative phase — maintain moist wound environment to support granulation")
        recs.append("Use hydrogel or foam dressing to promote tissue formation")
        recs.append("Avoid disrupting new granulation tissue during dressing changes")
    elif healing_stage == "remodeling":
        recs.append("Wound is in remodeling phase — continue current care protocol")
        recs.append("Apply silicone-based dressing to minimize scar formation")
        recs.append("Protect area from UV exposure to prevent hyperpigmentation")

    # ── Size-based recommendations ────────────────────────────────────────────
    if area > 1000:
        recs.append("⚠️ Large wound area (>10 cm²) — refer to wound care specialist for advanced treatment")
        recs.append("Consider negative pressure wound therapy (NPWT) for accelerated healing")
    elif area > 500:
        recs.append("Moderate wound area — document progress weekly with photographs")
    else:
        recs.append("Small wound area — healing on track with standard care protocol")

    # ── Depth-based recommendations ───────────────────────────────────────────
    if depth > 4:
        recs.append("Deep wound (>4mm) — use alginate or hydrofiber dressing to manage exudate and fill cavity")
        recs.append("Assess for undermining or tunneling at wound edges")
    elif depth > 2:
        recs.append("Moderate depth wound — consider foam dressing with appropriate absorptive capacity")
    else:
        recs.append("Shallow wound — thin hydrocolloid or film dressing should suffice")

    # ── General recommendations ───────────────────────────────────────────────
    recs.append("Ensure adequate nutrition: protein intake ≥1.2 g/kg/day supports wound healing")
    recs.append("Re-evaluate wound in 7 days and compare measurements to track healing velocity")

    if area > 200 and healing_stage == "inflammatory":
        recs.append("If no improvement in 2 weeks, consider biopsy to rule out malignancy")

    return recs



def save_image(image_bytes: bytes, filename: str) -> str:
    """Save image to uploads/ and return the public URL path."""
    ext = Path(filename).suffix or ".png"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOADS_DIR / unique_name
    filepath.write_bytes(image_bytes)
    return f"http://localhost:8000/uploads/{unique_name}"


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "message": "WoundCare API is running"}


@app.post("/api/analyze-wound")
async def analyze_wound_endpoint(image: UploadFile = File(...)):
    allowed = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
    if image.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    data = await image.read()
    if len(data) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 15 MB)")

    try:
        result = analyze_wound(data)
        # Save the original image to disk
        image_url = save_image(data, image.filename or "wound.png")
        result["imageUrl"] = image_url
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

    return JSONResponse(result)


@app.get("/api/wounds")
def get_wounds():
    data = load_data()
    return data["wounds"]


@app.post("/api/wounds")
def create_wound(wound: dict):
    data = load_data()
    wound["id"] = str(uuid.uuid4())
    wound["createdAt"] = datetime.utcnow().isoformat()
    wound.setdefault("measurements", [])
    data["wounds"].append(wound)
    save_data(data)
    return wound


@app.post("/api/wounds/{wound_id}/measurements")
def add_measurement(wound_id: str, measurement: dict):
    data = load_data()
    wound = next((w for w in data["wounds"] if w["id"] == wound_id), None)
    if not wound:
        raise HTTPException(status_code=404, detail="Wound not found")

    measurement["id"] = str(uuid.uuid4())
    measurement["woundId"] = wound_id
    measurement["date"] = datetime.utcnow().isoformat().split("T")[0]
    wound.setdefault("measurements", []).append(measurement)
    save_data(data)
    return measurement


@app.get("/api/wounds/{wound_id}")
def get_wound(wound_id: str):
    data = load_data()
    wound = next((w for w in data["wounds"] if w["id"] == wound_id), None)
    if not wound:
        raise HTTPException(status_code=404, detail="Wound not found")
    return wound


@app.post("/api/ai/analyze-image")
async def proxy_analyze_image(request: Request):
    body = await request.json()
    base64_image = body.get("image")
    mime_type = body.get("mimeType", "image/jpeg")
    prompt = body.get("prompt")
    
    groq_key = body.get("groqKey") or os.environ.get("VITE_GROQ_API_KEY") or os.environ.get("GROQ_API_KEY")
    gemini_key = body.get("geminiKey") or os.environ.get("VITE_GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY")
    
    if not groq_key and not gemini_key:
        raise HTTPException(status_code=400, detail="No API keys configured on backend")
        
    # Attempt Groq Vision Models first
    if groq_key:
        VISION_MODELS = [
            'meta-llama/llama-4-scout-17b-16e-instruct',
            'llama-3.2-90b-vision-preview',
            'llama-3.2-11b-vision-preview',
        ]
        async with httpx.AsyncClient(timeout=45.0) as client:
            for model in VISION_MODELS:
                try:
                    response = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {groq_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": model,
                            "messages": [
                                {
                                    "role": "system",
                                    "content": "You are an expert medical image analysis AI. Analyze the uploaded image thoroughly, read ALL visible text including medicine names, dosages, ingredients, warnings. Be specific and accurate."
                                },
                                {
                                    "role": "user",
                                    "content": [
                                        {
                                            "type": "image_url",
                                            "image_url": {
                                                "url": f"data:{mime_type};base64,{base64_image}",
                                                "detail": "high"
                                            }
                                        },
                                        {
                                            "type": "text",
                                            "text": prompt
                                        }
                                    ]
                                }
                            ],
                            "max_tokens": 2048,
                            "temperature": 0.2
                        }
                    )
                    if response.status_code == 200:
                        data = response.json()
                        content = data["choices"][0]["message"]["content"]
                        if content and len(content) > 100:
                            return {"content": content, "provider": f"groq-{model}"}
                except Exception as e:
                    print(f"Groq Vision {model} error: {e}")
                    
    # Fallback to Gemini 2.0 Flash
    if gemini_key:
        try:
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(
                    gemini_url,
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [{
                            "parts": [
                                { "text": prompt },
                                {
                                    "inline_data": {
                                        "mime_type": mime_type,
                                        "data": base64_image
                                    }
                                }
                            ]
                        }]
                    }
                )
                if response.status_code == 200:
                    data = response.json()
                    content = data["candidates"][0]["content"]["parts"][0]["text"]
                    if content:
                        return {"content": content, "provider": "gemini-2.0-flash"}
        except Exception as e:
            print(f"Gemini error: {e}")
            
    # Text-only fallback as last resort (using Llama 3.3 70B)
    if groq_key:
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {groq_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {
                                "role": "user",
                                "content": f"A clinical image was uploaded but visual analysis failed. Evaluation prompt: {prompt}"
                            }
                        ],
                        "max_tokens": 2048,
                        "temperature": 0.3
                    }
                )
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    return {"content": content, "provider": "groq-llama-3.3-text-fallback"}
        except Exception as e:
            print(f"Llama fallback error: {e}")
            
    raise HTTPException(status_code=500, detail="All image analysis models failed or key not configured")


@app.post("/api/ai/analyze-text")
async def proxy_analyze_text(request: Request):
    body = await request.json()
    prompt = body.get("prompt")
    
    groq_key = body.get("groqKey") or os.environ.get("VITE_GROQ_API_KEY") or os.environ.get("GROQ_API_KEY")
    gemini_key = body.get("geminiKey") or os.environ.get("VITE_GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY")
    
    if not groq_key:
        if gemini_key:
            try:
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
                async with httpx.AsyncClient(timeout=45.0) as client:
                    response = await client.post(
                        gemini_url,
                        headers={"Content-Type": "application/json"},
                        json={
                            "contents": [{ "parts": [{ "text": prompt }] }]
                        }
                    )
                    if response.status_code == 200:
                        data = response.json()
                        content = data["candidates"][0]["content"]["parts"][0]["text"]
                        return {"content": content, "provider": "gemini-1.5-flash"}
            except Exception as e:
                print(f"Gemini text error: {e}")
        raise HTTPException(status_code=400, detail="No Groq/Gemini API key configured on backend")
        
    try:
        response_format = {"type": "json_object"} if "json format" in prompt.lower() else None
        
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{ "role": "user", "content": prompt }],
                    "response_format": response_format,
                    "max_tokens": 1536,
                    "temperature": 0.3
                }
            )
            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return {"content": content, "provider": "groq-llama-3.3-70b"}
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/transcribe-audio")
async def proxy_transcribe_audio(file: UploadFile = File(...), groqKey: Optional[str] = Form(None)):
    groq_key = groqKey or os.environ.get("VITE_GROQ_API_KEY") or os.environ.get("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(status_code=400, detail="No Groq API key configured on backend")
        
    data = await file.read()
    
    async with httpx.AsyncClient(timeout=45.0) as client:
        files = {
            "file": (file.filename or "audio.webm", data, file.content_type or "audio/webm")
        }
        data_fields = {
            "model": "whisper-large-v3",
            "response_format": "json"
        }
        try:
            response = await client.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {groq_key}"},
                files=files,
                data=data_fields
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

# ── SQLite Patient & Sync Endpoints ──────────────────────────────────────────

class PatientModel(BaseModel):
    id: Optional[str] = None
    name: str
    age: str
    gender: str
    city: str

class SyncRecordModel(BaseModel):
    patientId: str
    records: List[dict]

@app.get("/api/patients")
def get_patients():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients ORDER BY createdAt DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/patients")
def create_patient(patient: PatientModel):
    pid = patient.id or str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO patients (id, name, age, gender, city, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
        (pid, patient.name, patient.age, patient.gender, patient.city, created_at)
    )
    conn.commit()
    conn.close()
    return {"id": pid, "name": patient.name, "age": patient.age, "gender": patient.gender, "city": patient.city, "createdAt": created_at}

@app.post("/api/history/sync")
def sync_history(payload: SyncRecordModel):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    for r in payload.records:
        rid = r.get("id") or str(uuid.uuid4())
        module = r.get("moduleName") or r.get("type") or "Unknown"
        summary = r.get("summary") or ""
        risk = r.get("riskLevel") or r.get("details", {}).get("assessedUrgency", "normal").lower()
        ts = r.get("timestamp") or datetime.utcnow().isoformat()
        raw = json.dumps(r)
        cursor.execute(
            "INSERT OR REPLACE INTO diagnostic_records (id, patientId, moduleName, summary, riskLevel, timestamp, rawData) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (rid, payload.patientId, module, summary, risk, ts, raw)
        )
    conn.commit()
    conn.close()
    return {"success": True, "synced": len(payload.records)}

@app.get("/api/patients/{patient_id}/records")
def get_patient_records(patient_id: str):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM diagnostic_records WHERE patientId = ? ORDER BY timestamp DESC", (patient_id,))
    rows = cursor.fetchall()
    conn.close()
    records = []
    for r in rows:
        d_r = dict(r)
        try:
            d_r["rawData"] = json.loads(d_r["rawData"])
        except:
            pass
        records.append(d_r)
    return records

class FeedbackModel(BaseModel):
    recordId: str
    isAccurate: bool
    correctedDiagnosis: Optional[str] = None

@app.post("/api/history/feedback")
def submit_feedback(payload: FeedbackModel):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    is_acc = 1 if payload.isAccurate else 0
    corr = payload.correctedDiagnosis or ""
    
    cursor.execute("SELECT rawData FROM diagnostic_records WHERE id = ?", (payload.recordId,))
    row = cursor.fetchone()
    if row:
        try:
            raw = json.loads(row[0])
            raw["isAccurate"] = payload.isAccurate
            raw["correctedDiagnosis"] = corr
            new_raw = json.dumps(raw)
            cursor.execute(
                "UPDATE diagnostic_records SET isAccurate = ?, correctedDiagnosis = ?, rawData = ? WHERE id = ?",
                (is_acc, corr, new_raw, payload.recordId)
            )
        except Exception as e:
            print("Feedback parse error:", e)
            cursor.execute(
                "UPDATE diagnostic_records SET isAccurate = ?, correctedDiagnosis = ? WHERE id = ?",
                (is_acc, corr, payload.recordId)
            )
    else:
        # If record not found, create a placeholder diagnostic record
        rid = payload.recordId
        cursor.execute(
            "INSERT OR REPLACE INTO diagnostic_records (id, patientId, moduleName, summary, riskLevel, timestamp, rawData, isAccurate, correctedDiagnosis) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (rid, "default_patient", "Feedback Override", corr, "normal", datetime.utcnow().isoformat(), "{}", is_acc, corr)
        )
        
    conn.commit()
    conn.close()
    return {"success": True, "recordId": payload.recordId, "isAccurate": payload.isAccurate, "correctedDiagnosis": corr}

@app.get("/api/patients/{patient_id}/records")
def get_patient_records(patient_id: str):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM diagnostic_records WHERE patientId = ? ORDER BY timestamp DESC", (patient_id,))
    rows = cursor.fetchall()
    conn.close()
    records = []
    for r in rows:
        d_r = dict(r)
        try:
            d_r["rawData"] = json.loads(d_r["rawData"])
        except:
            pass
        records.append(d_r)
    return records


# ── SleepSense Endpoints ─────────────────────────────────────────────────────

@app.get("/api/sleep/status")
@app.get("/api/status") # Legacy support
async def get_status():
    return current_sleep_state

class WakeTimeRequest(BaseModel):
    time: str # "HH:MM" format

@app.post("/api/sleep/wake_time")
@app.post("/api/wake_time") # Legacy support
async def set_wake_time(req: WakeTimeRequest):
    global target_wake_time
    target_wake_time = req.time
    return {"status": "ok", "target": target_wake_time}

@app.websocket("/ws/sleep-live")
@app.websocket("/ws/live") # Legacy support for LiveSleepDashboard.jsx
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_ws_clients.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_ws_clients.remove(websocket)
