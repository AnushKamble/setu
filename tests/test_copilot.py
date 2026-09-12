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


def test_copilot_chat_why_question(client):
    response = client.post("/api/copilot/chat", json={
        "message": "Why can't we do track tamping on Thursday morning at Aligarh?",
        "conversation_history": []
    })
    assert response.status_code == 200
    data = response.json()

    assert "response" in data
    assert "12004" in data["response"] or "Shatabdi" in data["response"]
    assert "Aligarh" in data["response"]


def test_copilot_chat_statutory_breach(client):
    response = client.post("/api/copilot/chat", json={
        "message": "Which statutory deadlines will breach if we cancel Sunday's block?",
        "conversation_history": []
    })
    assert response.status_code == 200
    data = response.json()

    assert "response" in data
    assert "IRPWM" in data["response"] or "USFD" in data["response"] or "Statutory" in data["response"]


def test_copilot_chat_roi_savings(client):
    response = client.post("/api/copilot/chat", json={
        "message": "What is our annual financial and diesel savings?",
        "conversation_history": []
    })
    assert response.status_code == 200
    data = response.json()

    assert "response" in data
    assert "Crores" in data["response"] or "18" in data["response"]
