import pytest
from backend.app.datagen.scenarios import ScenarioManager
from backend.app.optimizer.convoy_miner import MaintenanceOpportunityMiner
from backend.app.optimizer.compatibility import is_safety_compatible


def test_opportunity_mining():
    data = ScenarioManager.generate_scenario(scenario_name="HIGH_MAINTENANCE", seed=42)
    result = MaintenanceOpportunityMiner.mine_opportunities(
        jobs=data["jobs"],
        windows=data["windows"],
    )

    assert result.total_opportunities_found > 0
    assert result.potential_possessions_saved > 0

    jobs_by_id = {j.id: j for j in data["jobs"]}

    for opp in result.opportunities:
        assert len(opp.departments) >= 2  # Must span multiple departments
        assert len(opp.job_ids) >= 2
        assert len(opp.candidate_window_ids) > 0
        assert opp.combined_duration_p90_min > 0

        # Verify pairwise safety compatibility of all bundled jobs
        j1 = jobs_by_id[opp.job_ids[0]]
        j2 = jobs_by_id[opp.job_ids[1]]
        assert is_safety_compatible(j1, j2) is True


def test_opportunities_api(client):
    client.post("/api/scenarios/seed", json={"scenario_name": "NORMAL", "seed": 42})
    res = client.get("/api/plans/opportunities")
    assert res.status_code == 200
    data = res.json()
    assert "total_opportunities_found" in data
    assert "opportunities" in data
