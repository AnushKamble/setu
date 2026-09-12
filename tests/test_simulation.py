import pytest
from backend.app.datagen.scenarios import ScenarioManager
from backend.app.optimizer.solver import BlockOptimizer
from backend.app.simulation.digital_twin import DigitalTwinState
from backend.app.optimizer.replanner import DynamicReplanner
from backend.app.optimizer.relaxation import InfeasibilityRelaxationEngine
from backend.app.explanation.explainer import DecisionExplainer
from backend.app.simulation.counterfactual import CounterfactualEngine
from backend.app.optimizer.horizon import MultiHorizonCoordinator


def test_digital_twin_and_network_impact():
    data = ScenarioManager.generate_scenario(scenario_name="NORMAL", seed=42)
    twin = DigitalTwinState(
        sections=data["sections"],
        assets=data["assets"],
        jobs=data["jobs"],
        windows=data["windows"],
        trains=data["trains"],
    )

    # Inject a 45-min train delay on an express train
    express_train = next(t for t in data["trains"] if t.priority_class == "EXPRESS")
    impact = twin.inject_train_delay(train_id=express_train.id, delay_minutes=45)

    assert impact.direct_delay_minutes == 45
    assert impact.secondary_delay_minutes > 0  # Multi-hop propagation must occur
    assert impact.total_network_delay_minutes > 45
    assert impact.replan_recommended is True
    assert impact.max_hops >= 1
    assert len(impact.adjacent_sections_affected) >= 1


def test_digital_twin_multi_hop_cascade_corridor():
    data = ScenarioManager.generate_scenario(scenario_name="NORMAL", seed=42)
    twin = DigitalTwinState(
        sections=data["sections"],
        assets=data["assets"],
        jobs=data["jobs"],
        windows=data["windows"],
        trains=data["trains"],
    )

    # Pick a train on the first section (SEC-NDLS-GZB-UP) with substantial delay (60 mins)
    ndls_train = next((t for t in data["trains"] if "NDLS" in t.section_id), data["trains"][0])
    impact = twin.inject_train_delay(train_id=ndls_train.id, delay_minutes=60)

    assert impact.max_hops >= 1
    assert len(impact.cascade_chain) >= 1
    # Check damping: first hop delay must be smaller than primary delay
    first_hop = impact.cascade_chain[0]
    assert first_hop["propagated_delay_minutes"] < 60
    assert first_hop["buffer_absorption_minutes"] > 0



def test_dynamic_replanner_frozen_state():
    data = ScenarioManager.generate_scenario(scenario_name="NORMAL", seed=42)
    plan = BlockOptimizer(
        jobs=data["jobs"],
        windows=data["windows"],
        trains=data["trains"],
        resources=data["resources"],
    ).solve()

    assert len(plan.blocks) > 0

    # Freeze the first block's jobs
    frozen_jobs = set(plan.blocks[0].job_ids)

    # Displace the second block's window
    disrupted_win_id = plan.blocks[1].window_id

    diff = DynamicReplanner.replan_on_disruption(
        current_plan=plan,
        jobs=data["jobs"],
        windows=data["windows"],
        trains=data["trains"],
        frozen_job_ids=frozen_jobs,
        disrupted_window_ids={disrupted_win_id},
        resources=data["resources"],
    )

    assert diff.replan_time_seconds < 3.0
    # Frozen block must be retained
    assert plan.blocks[0].block_id in diff.unaffected_blocks
    assert diff.updated_plan.scheduled_jobs_count > 0


def test_infeasibility_relaxation_engine():
    data = ScenarioManager.generate_scenario(scenario_name="HARD_OPTIMIZATION", seed=42)
    alt = InfeasibilityRelaxationEngine.analyze_and_relax(
        jobs=data["jobs"],
        windows=data["windows"],
        trains=data["trains"],
        resources=data["resources"],
    )

    assert alt.slack_amount_minutes > 0
    assert alt.controller_intervention_required is True
    assert alt.recommended_plan.status in ("OPTIMAL", "FEASIBLE")


def test_decision_explainer():
    data = ScenarioManager.generate_scenario(scenario_name="NORMAL", seed=42)
    plan = BlockOptimizer(
        jobs=data["jobs"],
        windows=data["windows"],
        trains=data["trains"],
        resources=data["resources"],
    ).solve()

    report = DecisionExplainer.explain_plan(
        plan=plan,
        jobs=data["jobs"],
        windows=data["windows"],
    )

    assert report.total_blocks_explained == len(plan.blocks)
    assert report.convoys_explained == plan.convoys_formed_count
    for b_expl in report.block_explanations:
        assert len(b_expl.reasons) >= 2
        assert len(b_expl.summary_sentence) > 10


def test_counterfactual_and_simulation_api(client):
    client.post("/api/scenarios/seed", json={"scenario_name": "NORMAL", "seed": 42})
    client.post("/api/plans/optimize")

    # 1. Test explain endpoint
    expl_res = client.get("/api/plans/explain")
    assert expl_res.status_code == 200
    assert expl_res.json()["total_blocks_explained"] > 0

    # 2. Test multi-horizon endpoint
    mh_res = client.get("/api/plans/multi-horizon")
    assert mh_res.status_code == 200
    assert "monthly_envelopes" in mh_res.json()
    assert "weekly_tactical_plan" in mh_res.json()

    # 3. Test train-delay disruption simulation
    dly_res = client.post("/api/simulation/train-delay", json={"delay_minutes": 35})
    assert dly_res.status_code == 200
    dly_data = dly_res.json()
    assert "impact" in dly_data
    assert "replanning_diff" in dly_data
    assert dly_data["impact"]["direct_delay_minutes"] == 35

    # 4. Test postpone job counterfactual
    jobs = client.get("/api/jobs").json()
    first_job_id = jobs[0]["id"]
    postpone_res = client.post(
        "/api/simulation/postpone-job",
        json={"job_id": first_job_id, "postpone_days": 7},
    )
    assert postpone_res.status_code == 200
    assert postpone_res.json()["postpone_days"] == 7
    assert "operational_recommendation" in postpone_res.json()
