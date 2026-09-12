import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.datagen.loader import seed_database
from backend.app.database import SessionLocal


@pytest.fixture(scope="module")
def client():
    db = SessionLocal()
    seed_database(scenario_name="NORMAL", seed=42, db=db)
    db.close()
    with TestClient(app) as c:
        yield c


def test_kavach_tsr_feed(client):
    response = client.get("/api/kavach/tsr-feed")
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "ONLINE"
    assert "tsr_profiles" in data
    assert len(data["tsr_profiles"]) >= 1

    first_tsr = data["tsr_profiles"][0]
    assert "tsr_id" in first_tsr
    assert first_tsr["caution_speed_kmh"] == 30
    assert first_tsr["normal_line_speed_kmh"] == 130
    assert "rfid_tag_boundary_inrear" in first_tsr
    assert "tcas_packet_hex" in first_tsr


def test_kavach_simulate_intervention_overspeed(client):
    # Driver fails to brake approaching the TSR
    response = client.post("/api/kavach/simulate-intervention", json={
        "train_no": "12004",
        "train_name": "Lucknow Shatabdi Express",
        "initial_speed_kmh": 120.0,
        "driver_braking_applied": False
    })
    assert response.status_code == 200
    data = response.json()

    assert data["outcome_status"] == "KAVACH_AEB_INTERVENTION_SUCCESS"
    assert data["kavach_emergency_brake_engaged"] is True
    assert data["safety_margin_meters_before_block"] > 0
    assert "trajectory_samples" in data
    assert len(data["trajectory_samples"]) > 0


def test_kavach_simulate_intervention_compliant_driver(client):
    # Driver complies with cab signalling and brakes smoothly
    response = client.post("/api/kavach/simulate-intervention", json={
        "train_no": "12424",
        "train_name": "Dibrugarh Rajdhani Express",
        "initial_speed_kmh": 130.0,
        "driver_braking_applied": True
    })
    assert response.status_code == 200
    data = response.json()

    assert data["outcome_status"] == "DRIVER_COMPLIANT_SMOOTH_ENTRY"
    assert data["kavach_emergency_brake_engaged"] is False
    assert data["final_speed_kmh"] == 30.0
