import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_get_train_timetable():
    response = client.get("/api/trains?day=1")
    assert response.status_code == 200
    data = response.json()
    assert "day" in data
    assert "summary" in data
    assert "trains" in data
    assert data["summary"]["total_trains"] > 0
    assert len(data["trains"]) > 0
    first_train = data["trains"][0]
    assert "train_number" in first_train
    assert "entry_hhmm" in first_train
    assert "status" in first_train


def test_simulation_train_delay_updates_timetable_and_reset():
    # 1. Check initial state
    init_res = client.get("/api/trains?day=1")
    assert init_res.status_code == 200

    # 2. Inject train delay
    delay_res = client.post("/api/simulation/train-delay", json={"delay_minutes": 45})
    assert delay_res.status_code == 200
    delay_data = delay_res.json()
    assert delay_data["scenario_type"] == "TRAIN_DELAY_DISRUPTION"

    # 3. Verify timetable reflects disruption
    updated_res = client.get("/api/trains?day=1")
    assert updated_res.status_code == 200
    updated_data = updated_res.json()
    assert updated_data["summary"]["delayed_count"] >= 1
    assert updated_data["summary"]["is_corridor_disrupted"] is True
    assert updated_data["summary"]["total_network_delay_minutes"] >= 45

    # 4. Reset simulation
    reset_res = client.post("/api/simulation/reset")
    assert reset_res.status_code == 200
    reset_data = reset_res.json()
    assert reset_data["status"] == "RESET_SUCCESSFUL"

    # 5. Verify timetable is restored to nominal
    restored_res = client.get("/api/trains?day=1")
    assert restored_res.status_code == 200
    restored_data = restored_res.json()
    assert restored_data["summary"]["delayed_count"] == 0
    assert restored_data["summary"]["is_corridor_disrupted"] is False
