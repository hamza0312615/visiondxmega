import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import json
import shutil
import sys
import os

# Add backend dir to path
sys.path.insert(0, os.path.dirname(__file__))

from main import app, generate_recommendations, analyze_wound

client = TestClient(app)


# ── Health Check ─────────────────────────────────────────────────────────────

def test_health_endpoint():
    """API should respond with status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "WoundCare" in data["message"]


# ── Wound CRUD ───────────────────────────────────────────────────────────────

def test_create_and_get_wound():
    """Create a wound via POST, then retrieve it via GET."""
    wound_payload = {
        "patientId": "test-patient",
        "woundType": "Test Wound",
        "location": "Left arm",
        "initialDate": "2024-01-01",
        "currentStatus": "stable",
        "recommendations": ["Keep dry"],
    }
    # Create
    res = client.post("/api/wounds", json=wound_payload)
    assert res.status_code == 200
    created = res.json()
    assert "id" in created
    assert created["woundType"] == "Test Wound"

    # Get by ID
    res2 = client.get(f"/api/wounds/{created['id']}")
    assert res2.status_code == 200
    assert res2.json()["location"] == "Left arm"


def test_get_wounds_list():
    """GET /api/wounds should return a list."""
    res = client.get("/api/wounds")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_get_wounds_comprehensive():
    """Create a wound and verify it appears in the list with correct structure."""
    payload = {
        "patientId": "test-patient-comp",
        "woundType": "Pressure Ulcer",
        "location": "Heel",
        "initialDate": "2024-03-10",
        "currentStatus": "stable",
        "recommendations": ["Offload pressure"]
    }
    # Create
    create_res = client.post("/api/wounds", json=payload)
    assert create_res.status_code == 200
    created_id = create_res.json()["id"]

    # List
    list_res = client.get("/api/wounds")
    assert list_res.status_code == 200
    wounds = list_res.json()
    assert isinstance(wounds, list)

    # Find the created wound
    found = next((w for w in wounds if w["id"] == created_id), None)
    assert found is not None
    assert found["patientId"] == "test-patient-comp"
    assert found["woundType"] == "Pressure Ulcer"
    assert found["location"] == "Heel"
    assert "createdAt" in found
    assert "measurements" in found
    assert isinstance(found["measurements"], list)


def test_wound_not_found():
    """GET a non-existent wound should return 404."""
    res = client.get("/api/wounds/nonexistent-id-12345")
    assert res.status_code == 404


# ── Recommendation Engine ────────────────────────────────────────────────────

def test_inflammatory_recommendations():
    """Inflammatory stage should produce infection-monitoring recommendations."""
    recs = generate_recommendations("inflammatory", area=600, depth=3, length=30, width=20)
    combined = " ".join(recs).lower()
    assert "antimicrobial" in combined
    assert "infection" in combined
    assert "systemic" in combined  # area > 500


def test_proliferative_recommendations():
    """Proliferative stage should recommend moist environment."""
    recs = generate_recommendations("proliferative", area=200, depth=1, length=15, width=13)
    combined = " ".join(recs).lower()
    assert "moist" in combined
    assert "granulation" in combined


def test_large_wound_referral():
    """Area > 1000 should recommend specialist referral."""
    recs = generate_recommendations("proliferative", area=1500, depth=5, length=50, width=30)
    combined = " ".join(recs).lower()
    assert "specialist" in combined
    assert "negative pressure" in combined


def test_deep_wound_dressing():
    """Depth > 4mm should recommend alginate dressing."""
    recs = generate_recommendations("remodeling", area=300, depth=5, length=20, width=15)
    combined = " ".join(recs).lower()
    assert "alginate" in combined


def test_nutrition_always_included():
    """Every recommendation set should include nutrition advice."""
    recs = generate_recommendations("remodeling", area=50, depth=1, length=8, width=6)
    combined = " ".join(recs).lower()
    assert "nutrition" in combined
    assert "protein" in combined


# ── Image Analysis ───────────────────────────────────────────────────────────

def test_analyze_wound_returns_expected_keys():
    """analyze_wound should return measurements, healingStage, confidence, etc."""
    # Create a simple red test image (simulates wound)
    import numpy as np
    import cv2

    img = np.zeros((200, 200, 3), dtype=np.uint8)
    # Draw a red circle to simulate wound
    cv2.circle(img, (100, 100), 40, (0, 0, 200), -1)
    _, buf = cv2.imencode(".png", img)
    image_bytes = buf.tobytes()

    result = analyze_wound(image_bytes)
    assert "measurements" in result
    assert "healingStage" in result
    assert "confidence" in result
    assert "segmentationUrl" in result
    assert "recommendations" in result
    assert result["measurements"]["length"] > 0
    assert result["measurements"]["width"] > 0
    assert result["measurements"]["area"] > 0
    assert result["healingStage"] in ["inflammatory", "proliferative", "remodeling"]
    assert 0 < result["confidence"] <= 1.0


def test_analyze_wound_invalid_image():
    """analyze_wound should raise ValueError for invalid bytes."""
    with pytest.raises(ValueError, match="Could not decode image"):
        analyze_wound(b"not-an-image")
