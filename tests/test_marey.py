import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.datagen.scenarios import ScenarioManager
from backend.app.datagen.loader import seed_database
from backend.app.database import SessionLocal


@pytest.fixture(scope="module")
def client():
    # Seed database with NORMAL scenario for deterministic testing
    db = SessionLocal()
    seed_database(scenario_name="NORMAL", seed=42, db=db)
    db.close()
    with TestClient(app) as c:
        yield c


def test_marey_endpoint_structure_and_stations(client):
    response = client.get("/api/marey/data?day=1&track_type=ALL")
    assert response.status_code == 200
    data = response.json()

    assert "stations" in data
    assert "trajectories" in data
    assert "blocks" in data
    assert "metrics" in data

    # Verify stations chainage
    stations = data["stations"]
    assert len(stations) == 4
    kms = [s["km"] for s in stations]
    assert kms == sorted(kms)  # Monotonically increasing from 0.0 to 433.5
    assert stations[0]["code"] == "NDLS"
    assert stations[-1]["code"] == "CNB"


def test_marey_trajectories_and_blocks_filtering(client):
    response = client.get("/api/marey/data?day=1&track_type=ALL")
    data = response.json()

    assert len(data["trajectories"]) > 0
    # Every trajectory must have points spanning between 0 and 1440 minutes
    for traj in data["trajectories"]:
        assert len(traj["points"]) >= 2
        for pt in traj["points"]:
            assert 0 <= pt["minute"] <= 1440
            assert 0.0 <= pt["km"] <= 433.5

    # Check track filter
    up_response = client.get("/api/marey/data?day=1&track_type=UP_MAIN")
    up_data = up_response.json()
    for traj in up_data["trajectories"]:
        assert traj["track_type"] == "UP_MAIN"
    for blk in up_data["blocks"]:
        assert blk["track_type"] == "UP_MAIN"


def test_marey_zero_conflict_invariance(client):
    response = client.get("/api/marey/data?day=1&track_type=ALL")
    data = response.json()

    assert data["metrics"]["zero_conflict_verified"] is True
    # Verify that express train points do not penetrate active blocks on the same track
    for blk in data["blocks"]:
        for traj in data["trajectories"]:
            if traj["track_type"] == blk["track_type"] and traj["priority_class"] == "EXPRESS":
                # Check spatial overlap
                for pt in traj["points"]:
                    if blk["min_km"] <= pt["km"] <= blk["max_km"]:
                        # If spatially in block section, time must be outside [start, end]
                        assert not (blk["start_minute"] < pt["minute"] < blk["end_minute"])
