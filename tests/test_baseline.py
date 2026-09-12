import pytest
from backend.app.datagen.scenarios import ScenarioManager
from backend.app.baseline.planner import BaselinePlanner


def test_baseline_planner_execution():
    # Generate NORMAL scenario
    data = ScenarioManager.generate_scenario(scenario_name="NORMAL", seed=42)
    planner = BaselinePlanner(
        jobs=data["jobs"],
        windows=data["windows"],
        trains=data["trains"],
        resources=data["resources"],
    )
    result = planner.solve()

    assert result.planner_type == "DECENTRALIZED_GREEDY_BASELINE"
    assert result.total_jobs == len(data["jobs"])
    assert result.scheduled_jobs_count > 0
    # In decentralized baseline, each scheduled job claims an individual possession (no convoying)
    assert result.possessions_opened_count == result.scheduled_jobs_count
    assert result.convoys_formed_count == 0
    assert result.total_possession_minutes > 0
    assert result.execution_time_seconds < 1.0

    # Verify assignments have valid window IDs
    window_ids = {w.id for w in data["windows"]}
    for a in result.assignments:
        assert a.window_id in window_ids
        assert a.duration_min > 0


def test_baseline_api_endpoint(client):
    # Seed database first
    client.post("/api/scenarios/seed", json={"scenario_name": "NORMAL", "seed": 42})

    # Run baseline plan
    res = client.post("/api/plans/baseline")
    assert res.status_code == 200
    plan_data = res.json()
    assert plan_data["planner_type"] == "DECENTRALIZED_GREEDY_BASELINE"
    assert plan_data["scheduled_jobs_count"] > 0
    assert plan_data["convoys_formed_count"] == 0
    assert "kpis" in plan_data
    assert plan_data["kpis"]["possessions_count"] == plan_data["scheduled_jobs_count"]

    # Get cached baseline plan
    get_res = client.get("/api/plans/baseline")
    assert get_res.status_code == 200
    assert get_res.json()["scheduled_jobs_count"] == plan_data["scheduled_jobs_count"]
