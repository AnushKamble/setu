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


def test_roi_metrics_default(client):
    response = client.get("/api/roi/metrics")
    assert response.status_code == 200
    data = response.json()

    assert "executive_summary" in data
    assert "traction_power" in data
    assert "diesel_and_fuel" in data
    assert "financial_breakdown_items" in data
    assert "esg_green_railways" in data

    # Verify positive financial savings
    summary = data["executive_summary"]
    assert summary["annual_savings_crores"] > 10.0
    assert summary["punctuality_gain_pct"] > 0
    assert summary["annual_co2_avoided_tonnes"] > 500

    # Verify breakdown items
    items = data["financial_breakdown_items"]
    assert len(items) >= 4
    for it in items:
        assert "head" in it
        assert "amount_crores" in it
        assert it["amount_crores"] > 0


def test_roi_metrics_sensitivity_parameters(client):
    # Test with higher tariff and diesel cost
    response = client.get("/api/roi/metrics?electricity_tariff=9.50&diesel_cost_per_liter=105.0&daily_train_volume=180")
    assert response.status_code == 200
    data = response.json()

    params = data["parameters_used"]
    assert params["electricity_tariff_per_kwh"] == 9.50
    assert params["diesel_cost_per_liter"] == 105.0
    assert params["daily_train_volume"] == 180

    # With higher tariffs, annual savings should increase
    default_res = client.get("/api/roi/metrics").json()
    assert data["executive_summary"]["annual_savings_crores"] > default_res["executive_summary"]["annual_savings_crores"]
