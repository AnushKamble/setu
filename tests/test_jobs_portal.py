import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


from backend.app.database import SessionLocal
from backend.app.models.railway import MaintenanceJob

def test_submit_field_job_emergency():
    payload = {
        "department": "ENGINEERING",
        "section_id": "SEC-GZB-ALJN-UP",
        "job_type": "RAIL_FRACTURE_REPAIR",
        "description": "Urgent USFD detected rail fracture on Up line. Immediate 30 kmph caution order.",
        "duration_minutes": 90,
        "statutory_deadline_hours": 24,
        "machine_required": "NONE",
        "min_crew_size": 10,
        "auto_reoptimize": True
    }
    response = client.post("/api/jobs/submit", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "job" in data
    assert data["job"]["department"] == "ENGINEERING"
    assert data["job"]["safety_class"] == "CRITICAL"
    assert data["job"]["priority_score"] >= 0.90
    assert data["job"]["duration_p90_min"] >= 90
    assert "pipeline_trace" in data
    assert "optimization" in data["pipeline_trace"]
    assert "safety_validation" in data["pipeline_trace"]
    assert data["pipeline_trace"]["safety_validation"]["is_valid"] is True

    # Cleanup created job
    db = SessionLocal()
    db.query(MaintenanceJob).filter_by(id=data["job"]["id"]).delete()
    db.commit()
    db.close()


def test_submit_field_job_trd():
    payload = {
        "department": "TRD",
        "section_id": "SEC-NDLS-GZB-UP",
        "job_type": "OHE_INSPECTION",
        "description": "OHE bracket alignment and contact wire dropper tensioning.",
        "duration_minutes": 90,
        "statutory_deadline_hours": 48,
        "machine_required": "TOWER_WAGON",
        "min_crew_size": 6,
        "auto_reoptimize": True
    }
    response = client.post("/api/jobs/submit", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["job"]["department"] == "TRD"
    assert data["job"]["duration_p50_min"] == 90
    assert data["pipeline_trace"]["optimization"]["scheduled"] is True

    # Cleanup created job
    db = SessionLocal()
    db.query(MaintenanceJob).filter_by(id=data["job"]["id"]).delete()
    db.commit()
    db.close()


def test_submit_field_job_invalid_dept():
    payload = {
        "department": "INVALID_DEPT",
        "section_id": "SEC-NDLS-GZB-UP",
        "job_type": "ROUTINE_CHECK",
        "description": "Invalid test",
        "duration_minutes": 60
    }
    response = client.post("/api/jobs/submit", json=payload)
    assert response.status_code == 400

