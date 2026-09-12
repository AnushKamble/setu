import pytest
from backend.app.datagen.generator import RailwayDataGenerator
from backend.app.datagen.scenarios import ScenarioManager
from backend.app.datagen.loader import seed_database


def test_network_generation():
    gen = RailwayDataGenerator(seed=123)
    sections = gen.generate_network()
    assert len(sections) == 6
    section_ids = [s.id for s in sections]
    assert "SEC-NDLS-GZB-UP" in section_ids
    assert "SEC-NDLS-GZB-DN" in section_ids
    assert "SEC-GZB-ALJN-UP" in section_ids
    for s in sections:
        assert s.length_km > 0
        assert s.max_speed_kmh >= 130


def test_asset_and_job_generation():
    gen = RailwayDataGenerator(seed=456)
    sections = gen.generate_network()
    assets, jobs = gen.generate_assets_and_jobs(sections, job_count_target=20)

    assert len(assets) > 0
    assert len(jobs) == 20

    departments = {j.department for j in jobs}
    assert "ENGINEERING" in departments
    assert "TRD" in departments
    assert "S_AND_T" in departments

    # Verify duration p90 > p50
    for j in jobs:
        assert j.duration_p90_min > j.duration_p50_min
        assert j.priority_score >= 0.0 and j.priority_score <= 1.0
        assert j.cost_of_waiting > 0.0


def test_anti_circularity_latent_noise():
    """Verify that assets exhibit variation in latent degradation factors (Anti-Circularity)."""
    gen = RailwayDataGenerator(seed=789)
    sections = gen.generate_network()
    assets, _ = gen.generate_assets_and_jobs(sections, job_count_target=10, latent_noise_scale=0.3)

    latent_factors = [a.latent_degradation_factor for a in assets]
    # Check variance exists in the latent unobserved factor
    assert len(set(latent_factors)) > 5
    assert min(latent_factors) < 1.0 or max(latent_factors) > 1.0


def test_scenario_manager_all_scenarios():
    for sc in ScenarioManager.SCENARIO_NAMES:
        data = ScenarioManager.generate_scenario(scenario_name=sc, seed=42)
        assert data["scenario"] == sc
        assert len(data["sections"]) == 6
        assert len(data["jobs"]) > 0
        assert len(data["windows"]) > 0
        assert len(data["trains"]) > 0


def test_scenario_api_endpoints(client):
    # Test listing scenarios
    res = client.get("/api/scenarios")
    assert res.status_code == 200
    scenarios = res.json()
    assert "NORMAL" in scenarios
    assert "HIGH_MAINTENANCE" in scenarios

    # Test seeding NORMAL scenario
    seed_res = client.post("/api/scenarios/seed", json={"scenario_name": "NORMAL", "seed": 42})
    assert seed_res.status_code == 200
    seed_data = seed_res.json()
    assert seed_data["status"] == "SUCCESS"
    assert seed_data["counts"]["maintenance_jobs_total"] == 18

    # Test network summary
    summary_res = client.get("/api/network/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["sections_count"] == 6
    assert summary["jobs_summary"]["total"] == 18
    assert summary["jobs_summary"]["by_department"]["ENGINEERING"] > 0
    assert summary["jobs_summary"]["by_department"]["TRD"] > 0
    assert summary["jobs_summary"]["by_department"]["S_AND_T"] > 0

    # Test jobs query with filter
    jobs_res = client.get("/api/jobs?department=TRD")
    assert jobs_res.status_code == 200
    jobs_list = jobs_res.json()
    assert all(j["department"] == "TRD" for j in jobs_list)
