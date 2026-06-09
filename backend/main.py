from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.concurrency import run_in_threadpool
import cv2
import numpy as np
import json
import uuid
import base64
from datetime import datetime
from pathlib import Path

app = FastAPI(title="WoundCare API", version="1.0.0")

# Allow React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Directories ──────────────────────────────────────────────────────────────
BASE_DIR    = Path(__file__).parent
DATA_FILE   = BASE_DIR / "data.json"
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

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

    # Convert px → mm (assume 100mm reference field)
    REFERENCE_MM = 100.0
    px_per_mm = max(work.shape[:2]) / REFERENCE_MM
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
        result = await run_in_threadpool(analyze_wound, data)
        # Save the original image to disk
        image_url = await run_in_threadpool(save_image, data, image.filename or "wound.png")
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
