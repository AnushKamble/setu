def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "system" in data
    assert "SETU" in data["system"]
    assert data["health"] == "/health"


def test_health_check_success(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database_connected"] is True
    assert data["solver_ready"] is True
    assert data["details"]["solver_engine"] == "OR-Tools CP-SAT"


def test_root_health_alias(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_database_session(db_session):
    from sqlalchemy import text
    result = db_session.execute(text("SELECT 42 AS val")).fetchone()
    assert result[0] == 42
