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


def test_dispatch_overview_endpoint(client):
    response = client.get("/api/dispatch/overview")
    assert response.status_code == 200
    data = response.json()

    assert "total_blocks" in data
    assert "total_crews_mobilized" in data
    assert "dispatch_blocks" in data
    assert len(data["dispatch_blocks"]) > 0

    first_blk = data["dispatch_blocks"][0]
    assert "crews" in first_blk
    assert len(first_blk["crews"]) >= 1

    # Verify crew schema
    crew = first_blk["crews"][0]
    assert "gang_id" in crew
    assert "supervisor_name" in crew
    assert "safety_token" in crew
    assert "notice_text" in crew


def test_dispatch_broadcast_and_ack(client):
    # 1. Get a block ID
    overview = client.get("/api/dispatch/overview").json()
    target_block = overview["dispatch_blocks"][0]
    block_id = target_block["block_id"]

    # 2. Broadcast mobilization
    broadcast_res = client.post("/api/dispatch/broadcast", json={
        "block_id": block_id,
        "channels": ["SMS", "WHATSAPP", "TMS_PUSH"],
        "urgent": True,
    })
    assert broadcast_res.status_code == 200
    b_data = broadcast_res.json()
    assert b_data["success"] is True
    assert b_data["notices_sent"] >= 1

    # 3. Simulate Crew Ack
    crew_id = target_block["crews"][0]["gang_id"]
    ack_res = client.post("/api/dispatch/ack", json={
        "block_id": block_id,
        "gang_id": crew_id,
        "status": "ON_SITE_BRIEFED",
        "location_note": "KM 26.2 Trackbed, Detonators Placed",
    })
    assert ack_res.status_code == 200
    ack_data = ack_res.json()
    assert ack_data["success"] is True
    assert ack_data["new_status"] == "ON_SITE_BRIEFED"
