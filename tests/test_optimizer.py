import pytest
from backend.app.datagen.scenarios import ScenarioManager
from backend.app.baseline.planner import BaselinePlanner
from backend.app.optimizer.solver import BlockOptimizer
from backend.app.optimizer.compatibility import is_safety_compatible


def test_safety_compatibility_rules():
    data = ScenarioManager.generate_scenario(scenario_name="NORMAL", seed=42)
    jobs = data["jobs"]

    engg_jobs = [j for j in jobs if j.department == "ENGINEERING"]
    trd_jobs = [j for j in jobs if j.department == "TRD"]
    snt_jobs = [j for j in jobs if j.department == "S_AND_T"]

    # Align sections
    if engg_jobs and trd_jobs:
        engg_jobs[0].section_id = "SEC-TEST-01"
        trd_jobs[0].section_id = "SEC-TEST-01"
        # TRD isolation required + Engineering work on same section is compatible
        trd_jobs[0].safety_class = "ISOLATION_REQUIRED"
        assert is_safety_compatible(engg_jobs[0], trd_jobs[0]) is True

        # Different sections should not be compatible for a single block
        trd_jobs[0].section_id = "SEC-TEST-02"
        assert is_safety_compatible(engg_jobs[0], trd_jobs[0]) is False


def test_optimizer_beats_baseline_on_normal_scenario():
    """Core mathematical proof: CP-SAT must beat baseline by forming convoys and reducing possessions."""
    data = ScenarioManager.generate_scenario(scenario_name="NORMAL", seed=42)

    # 1. Run Baseline Planner
    baseline = BaselinePlanner(
        jobs=data["jobs"],
        windows=data["windows"],
        trains=data["trains"],
        resources=data["resources"],
    ).solve()

    # 2. Run CP-SAT Convoy Optimizer
    optimizer = BlockOptimizer(
        jobs=data["jobs"],
        windows=data["windows"],
        trains=data["trains"],
        resources=data["resources"],
        time_limit_seconds=10.0,
    ).solve()

    assert optimizer.status in ("OPTIMAL", "FEASIBLE")
    assert optimizer.scheduled_jobs_count > 0

    # CP-SAT must form convoys
    assert optimizer.convoys_formed_count > 0
    assert optimizer.possessions_avoided_by_convoy > 0

    # Key SIH proof: Possessions opened by CP-SAT must be strictly fewer than the Baseline!
    assert optimizer.possessions_opened_count < baseline.possessions_opened_count

    # Total possession downtime minutes must be reduced compared to baseline
    assert optimizer.total_possession_minutes < baseline.total_possession_minutes

    # Statutory and critical jobs must be protected
    assert optimizer.critical_jobs_deferred_count == 0

    # Check solver performance
    assert optimizer.solve_time_seconds < 5.0


def test_plans_compare_api(client):
    # Seed scenario first
    client.post("/api/scenarios/seed", json={"scenario_name": "NORMAL", "seed": 42})

    # Call comparison endpoint
    res = client.get("/api/plans/compare")
    assert res.status_code == 200
    comp = res.json()

    assert "baseline" in comp
    assert "optimized" in comp
    assert "deltas" in comp

    assert comp["deltas"]["possessions_saved"] > 0
    assert comp["deltas"]["percentage_possessions_reduced"] > 0
    assert comp["deltas"]["downtime_minutes_saved"] > 0
    assert comp["deltas"]["convoys_created"] > 0


def test_operator_override_and_bdms_export(client):
    # Seed scenario
    client.post("/api/scenarios/seed", json={"scenario_name": "NORMAL", "seed": 42})
    # Run optimize
    opt_res = client.post("/api/plans/optimize")
    assert opt_res.status_code == 200
    plan = opt_res.json()
    assert len(plan["blocks"]) > 0
    target_block = plan["blocks"][0]

    # Test candidate windows endpoint
    win_res = client.get(f"/api/plans/candidate-windows?section_id={target_block['section_id']}")
    assert win_res.status_code == 200
    candidate_windows = win_res.json()
    assert len(candidate_windows) > 0

    # Test Pin block action
    override_res = client.post(
        "/api/plans/block/override",
        json={"block_id": target_block["block_id"], "action": "PIN"}
    )
    assert override_res.status_code == 200
    updated = override_res.json()
    assert updated["block"]["is_pinned"] is True
    assert updated["block"]["status"] == "PINNED"

    # Test Approve block action
    appr_res = client.post(
        "/api/plans/block/override",
        json={"block_id": target_block["block_id"], "action": "APPROVE"}
    )
    assert appr_res.status_code == 200
    assert appr_res.json()["block"]["status"] == "APPROVED"

    # Test Reassign window action
    if len(candidate_windows) > 1:
        alt_win = candidate_windows[1]
        reassign_res = client.post(
            "/api/plans/block/override",
            json={
                "block_id": target_block["block_id"],
                "action": "REASSIGN_WINDOW",
                "new_window_id": alt_win["id"],
                "operator_notes": "Operator rescheduled to Day 2 night window"
            }
        )
        assert reassign_res.status_code == 200
        assert reassign_res.json()["block"]["window_id"] == alt_win["id"]

    # Test Cross-Department Compatibility Matrix endpoint
    matrix_res = client.get("/api/plans/compatibility-matrix")
    assert matrix_res.status_code == 200
    matrix = matrix_res.json()
    assert "rules" in matrix
    assert len(matrix["rules"]) >= 5

    # Test BDMS Export endpoint
    bdms_res = client.post("/api/plans/export-bdms")
    assert bdms_res.status_code == 200
    bundle = bdms_res.json()
    assert "bdms_bundle_header" in bundle
    assert "possession_requests" in bundle
    assert bundle["bdms_bundle_header"]["total_possessions_requested"] > 0
