import copy
import pytest
from backend.app.datagen.scenarios import ScenarioManager
from backend.app.optimizer.solver import BlockOptimizer, OptimizedBlock
from backend.app.validator.checker import IndependentValidator


def test_validator_passes_on_cpsat_plan():
    """Valid CP-SAT generated schedule must pass 100% of independent validator checks."""
    data = ScenarioManager.generate_scenario(scenario_name="NORMAL", seed=42)
    optimizer = BlockOptimizer(
        jobs=data["jobs"],
        windows=data["windows"],
        trains=data["trains"],
        resources=data["resources"],
        time_limit_seconds=10.0,
    ).solve()

    assert optimizer.status in ("OPTIMAL", "FEASIBLE")

    report = IndependentValidator.validate(
        plan=optimizer,
        jobs=data["jobs"],
        windows=data["windows"],
        trains=data["trains"],
        resources=data["resources"],
    )

    assert report.is_valid is True
    assert report.violations_count == 0
    assert len(report.checks_passed) == 7


def test_validator_catches_duplicate_job_assignment():
    """Corrupted plan with duplicate job assignment must be rejected."""
    data = ScenarioManager.generate_scenario(scenario_name="NORMAL", seed=42)
    optimizer = BlockOptimizer(
        jobs=data["jobs"],
        windows=data["windows"],
        trains=data["trains"],
        resources=data["resources"],
    ).solve()

    corrupted_plan = copy.deepcopy(optimizer)
    # Inject duplicate: add the first job of block 0 into block 1 as well
    dup_job_id = corrupted_plan.blocks[0].job_ids[0]
    corrupted_plan.blocks[1].job_ids.append(dup_job_id)

    report = IndependentValidator.validate(
        plan=corrupted_plan,
        jobs=data["jobs"],
        windows=data["windows"],
        trains=data["trains"],
        resources=data["resources"],
    )

    assert report.is_valid is False
    v_types = [v.violation_type for v in report.violations]
    assert "DUPLICATE_JOB_ASSIGNMENT" in v_types


def test_validator_catches_train_conflict():
    """Corrupted plan overlapping an express train must be flagged as critical safety collision."""
    data = ScenarioManager.generate_scenario(scenario_name="NORMAL", seed=42)
    optimizer = BlockOptimizer(
        jobs=data["jobs"],
        windows=data["windows"],
        trains=data["trains"],
        resources=data["resources"],
    ).solve()

    corrupted_plan = copy.deepcopy(optimizer)
    # Find an express train on block 0's section and shift block to collide
    target_block = corrupted_plan.blocks[0]
    express_train = next(
        t for t in data["trains"]
        if t.priority_class == "EXPRESS" and t.section_id == target_block.section_id
    )

    # Shift block window to collide with express train
    target_block.start_minute = express_train.entry_minute - 10
    target_block.end_minute = express_train.exit_minute + 10

    report = IndependentValidator.validate(
        plan=corrupted_plan,
        jobs=data["jobs"],
        windows=data["windows"],
        trains=data["trains"],
        resources=data["resources"],
    )

    assert report.is_valid is False
    v_types = [v.violation_type for v in report.violations]
    assert "PROTECTED_TRAIN_CONFLICT" in v_types


def test_validator_catches_safety_incompatibility():
    """Corrupted plan with two incompatible jobs in the same convoy must be flagged."""
    data = ScenarioManager.generate_scenario(scenario_name="NORMAL", seed=42)
    optimizer = BlockOptimizer(
        jobs=data["jobs"],
        windows=data["windows"],
        trains=data["trains"],
        resources=data["resources"],
    ).solve()

    corrupted_plan = copy.deepcopy(optimizer)
    # Create two artificial heavy equipment jobs
    j1 = copy.deepcopy(data["jobs"][0])
    j2 = copy.deepcopy(data["jobs"][1])
    j1.id = "JOB-HEAVY-1"
    j2.id = "JOB-HEAVY-2"
    j1.section_id = corrupted_plan.blocks[0].section_id
    j2.section_id = corrupted_plan.blocks[0].section_id
    j1.safety_class = "HEAVY_EQUIPMENT"
    j2.safety_class = "HEAVY_EQUIPMENT"

    jobs_with_heavy = list(data["jobs"]) + [j1, j2]
    corrupted_plan.blocks[0].job_ids = [j1.id, j2.id]

    report = IndependentValidator.validate(
        plan=corrupted_plan,
        jobs=jobs_with_heavy,
        windows=data["windows"],
        trains=data["trains"],
        resources=data["resources"],
    )

    assert report.is_valid is False
    v_types = [v.violation_type for v in report.violations]
    assert "DEPARTMENT_SAFETY_INCOMPATIBILITY" in v_types


def test_validator_api_endpoint(client):
    client.post("/api/scenarios/seed", json={"scenario_name": "NORMAL", "seed": 42})
    client.post("/api/plans/optimize")

    res = client.get("/api/plans/validate")
    assert res.status_code == 200
    report = res.json()
    assert report["is_valid"] is True
    assert report["violations_count"] == 0
    assert len(report["checks_passed"]) == 7
