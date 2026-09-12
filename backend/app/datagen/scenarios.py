from typing import Dict, Any, List
from backend.app.datagen.generator import RailwayDataGenerator
from backend.app.models.railway import (
    Section,
    Asset,
    MaintenanceJob,
    CorridorWindow,
    TrainMovement,
    DepartmentResource,
)


class ScenarioManager:
    """Pre-configured deterministic railway operating scenarios."""

    SCENARIO_NAMES = [
        "NORMAL",
        "HIGH_MAINTENANCE",
        "CONGESTED",
        "RESOURCE_CONSTRAINED",
        "DISRUPTION_HEAVY",
        "HARD_OPTIMIZATION",
        "ENTERPRISE_DIVISION",
    ]

    @classmethod
    def generate_scenario(
        cls,
        scenario_name: str = "NORMAL",
        seed: int = 42,
        horizon_days: int = 7,
    ) -> Dict[str, Any]:
        """Generates all entities for a specific scenario name."""
        scenario_name = scenario_name.upper()
        if scenario_name not in cls.SCENARIO_NAMES:
            raise ValueError(f"Unknown scenario {scenario_name}. Available: {cls.SCENARIO_NAMES}")

        gen = RailwayDataGenerator(seed=seed)
        sections = gen.generate_network()
        resources = gen.generate_resources()

        if scenario_name == "NORMAL":
            assets, jobs = gen.generate_assets_and_jobs(sections, job_count_target=18, statutory_ratio=0.20)
            windows, trains = gen.generate_windows_and_trains(sections, horizon_days=horizon_days)

        elif scenario_name == "HIGH_MAINTENANCE":
            # Dense maintenance backlog testing convoy capacity
            assets, jobs = gen.generate_assets_and_jobs(sections, job_count_target=36, statutory_ratio=0.35)
            windows, trains = gen.generate_windows_and_trains(sections, horizon_days=horizon_days)

        elif scenario_name == "CONGESTED":
            # Normal backlog but heavier freight traffic and fewer windows
            assets, jobs = gen.generate_assets_and_jobs(sections, job_count_target=20, statutory_ratio=0.20)
            windows, trains = gen.generate_windows_and_trains(sections, horizon_days=horizon_days)
            # Add extra freight movements
            extra_trains = []
            for t in trains:
                if t.is_goods_forecast:
                    # duplicate freight movement on opposite track
                    pass
            # Filter windows to simulate tighter possession availability
            windows = [w for w in windows if w.traffic_impact_tier == "NIGHT_BLOCK"]

        elif scenario_name == "RESOURCE_CONSTRAINED":
            # Very tight resource caps: 1 gang per department
            assets, jobs = gen.generate_assets_and_jobs(sections, job_count_target=22, statutory_ratio=0.25)
            windows, trains = gen.generate_windows_and_trains(sections, horizon_days=horizon_days)
            for res in resources:
                res.total_units = 1

        elif scenario_name == "DISRUPTION_HEAVY":
            assets, jobs = gen.generate_assets_and_jobs(sections, job_count_target=18, statutory_ratio=0.20)
            windows, trains = gen.generate_windows_and_trains(sections, horizon_days=horizon_days)
            for t in trains:
                t.delay_probability = 0.65  # Heavy delay propensity

        elif scenario_name == "HARD_OPTIMIZATION":
            # Multiple statutory deadlines set early with constrained windows (provokes relaxation engine)
            assets, jobs = gen.generate_assets_and_jobs(sections, job_count_target=28, statutory_ratio=0.60)
            windows, trains = gen.generate_windows_and_trains(sections, horizon_days=horizon_days)
            # Force urgent statutory deadlines in the first 2 days
            for j in jobs:
                if j.statutory_deadline_minute:
                    j.statutory_deadline_minute = min(j.statutory_deadline_minute, 2880)

        elif scenario_name == "ENTERPRISE_DIVISION":
            # Division-wide scale testing 60+ maintenance tasks across all 6 corridor sections
            assets, jobs = gen.generate_assets_and_jobs(sections, job_count_target=60, statutory_ratio=0.30)
            windows, trains = gen.generate_windows_and_trains(sections, horizon_days=horizon_days)

        return {
            "scenario": scenario_name,
            "seed": seed,
            "horizon_days": horizon_days,
            "sections": sections,
            "resources": resources,
            "assets": assets,
            "jobs": jobs,
            "windows": windows,
            "trains": trains,
        }
