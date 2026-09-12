import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_get_csv_template():
    response = client.get("/api/custom-data/template/jobs")
    assert response.status_code == 200
    assert "job_id,section_id,department" in response.text

    response_trains = client.get("/api/custom-data/template/trains")
    assert response_trains.status_code == 200
    assert "train_number,train_name" in response_trains.text


def test_upload_custom_jobs_and_reoptimize():
    custom_csv = """job_id,section_id,department,work_type,duration_minutes,statutory_deadline_hours,machine_required,min_crew_size,priority_weight
JOB-TEST-01,SEC-NDLS-GZB-UP,ENGINEERING,TRACK_TAMPING,120,48,TAMPING_MACHINE,8,1.5
JOB-TEST-02,SEC-NDLS-GZB-UP,TRD,OHE_INSPECTION,90,48,TOWER_WAGON,6,1.2
JOB-TEST-03,SEC-NDLS-GZB-UP,S_AND_T,POINT_MACHINE_OVERHAUL,60,24,NONE,4,1.8
"""
    response = client.post(
        "/api/custom-data/upload-jobs",
        json={"csv_text": custom_csv, "auto_reoptimize": True}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["jobs_count"] == 3
    assert "optimization" in data
    assert data["optimization"]["scheduled_jobs"] >= 1


def test_upload_custom_jobs_validation_error():
    invalid_csv = """job_id,section_id,department,work_type,duration_minutes
JOB-BAD-01,SEC-NDLS-GZB-UP,INVALID_DEPT,TRACK_TAMPING,120
"""
    response = client.post(
        "/api/custom-data/upload-jobs",
        json={"csv_text": invalid_csv, "auto_reoptimize": False}
    )
    assert response.status_code == 422
    data = response.json()
    assert "validation_errors" in data["detail"]


def test_upload_custom_trains():
    custom_trains_csv = """train_number,train_name,priority_class,section_id,entry_minute,exit_minute,is_goods_forecast
12952,Mumbai Tejas Rajdhani,EXPRESS,SEC-NDLS-GZB-UP,300,340,False
BOXN-99,NTPC Coal Special,FREIGHT_DEMAND,SEC-NDLS-GZB-UP,400,480,True
"""
    response = client.post(
        "/api/custom-data/upload-trains",
        json={"csv_text": custom_trains_csv}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["trains_count"] == 2
    assert data["express_count"] == 1
