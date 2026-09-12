import pytest
from backend.app.datagen.scenarios import ScenarioManager
from backend.app.ml.features import FeatureExtractor
from backend.app.ml.priority import PriorityModel
from backend.app.ml.duration import DurationQuantileModel
from backend.app.ml.hazard import CostOfWaitingModel
from backend.app.ml.pipeline import MLPipeline


def test_feature_extraction():
    data = ScenarioManager.generate_scenario(scenario_name="HIGH_MAINTENANCE", seed=42)
    df = FeatureExtractor.extract_features_from_entities(
        data["assets"], data["jobs"], data["sections"]
    )

    assert len(df) == len(data["jobs"])
    for col in PriorityModel.FEATURE_COLS:
        assert col in df.columns
    assert "true_priority" in df.columns
    assert "true_duration_p50" in df.columns


def test_priority_model_training_and_inference():
    data = ScenarioManager.generate_scenario(scenario_name="HIGH_MAINTENANCE", seed=42)
    df = FeatureExtractor.extract_features_from_entities(
        data["assets"], data["jobs"], data["sections"]
    )

    # 1. Test XGBoost Engine
    xgb_model = PriorityModel(algorithm="xgboost")
    xgb_metrics = xgb_model.train(df)
    assert xgb_metrics["algorithm"] == "XGBOOST"
    assert "val_mae" in xgb_metrics
    assert xgb_metrics["val_mae"] < 0.25
    xgb_preds = xgb_model.predict(df)
    assert len(xgb_preds) == len(df)
    assert all(0.0 <= p <= 1.0 for p in xgb_preds)

    # 2. Test LightGBM Engine
    lgb_model = PriorityModel(algorithm="lightgbm")
    lgb_metrics = lgb_model.train(df)
    assert lgb_metrics["algorithm"] == "LIGHTGBM"
    assert "val_mae" in lgb_metrics
    assert lgb_metrics["val_mae"] < 0.25
    lgb_preds = lgb_model.predict(df)
    assert len(lgb_preds) == len(df)
    assert all(0.0 <= p <= 1.0 for p in lgb_preds)


def test_duration_quantile_model():
    data = ScenarioManager.generate_scenario(scenario_name="HIGH_MAINTENANCE", seed=42)
    df = FeatureExtractor.extract_features_from_entities(
        data["assets"], data["jobs"], data["sections"]
    )

    model = DurationQuantileModel()
    model.train(df)
    p50, p90 = model.predict_quantiles(df)

    assert len(p50) == len(df)
    assert len(p90) == len(df)
    for med, high in zip(p50, p90):
        assert high >= med + 10  # P90 buffer must exceed P50


def test_cost_of_waiting_hazard_monotonicity():
    # Test that higher criticality and higher priority yield higher cost of waiting
    low_cow = CostOfWaitingModel.compute_cost_of_waiting(priority_score=0.4, criticality=2, deferral_days=7)
    high_cow = CostOfWaitingModel.compute_cost_of_waiting(priority_score=0.9, criticality=5, deferral_days=7)

    assert high_cow > low_cow

    # Test that postponing by 14 days costs more than 7 days
    cow_7d = CostOfWaitingModel.compute_cost_of_waiting(priority_score=0.7, criticality=4, deferral_days=7)
    cow_14d = CostOfWaitingModel.compute_cost_of_waiting(priority_score=0.7, criticality=4, deferral_days=14)

    assert cow_14d > cow_7d


def test_ml_pipeline_and_api(client):
    client.post("/api/scenarios/seed", json={"scenario_name": "NORMAL", "seed": 42})

    # Call ML train endpoint
    train_res = client.post("/api/ml/train")
    assert train_res.status_code == 200
    train_data = train_res.json()
    assert train_data["status"] == "SUCCESS"
    assert "priority_metrics" in train_data

    # Check status endpoint
    status_res = client.get("/api/ml/status")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["priority_model"]["is_trained"] is True
    assert status_data["duration_model"]["is_trained"] is True
