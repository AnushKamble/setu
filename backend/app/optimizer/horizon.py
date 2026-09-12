from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from backend.app.models.railway import MaintenanceJob, CorridorWindow, Section
from backend.app.optimizer.solver import BlockOptimizer, OptimizationResult


class MonthlySectionEnvelope(BaseModel):
    section_id: str
    max_possession_hours: float
    max_possession_minutes: int
    statutory_jobs_quota: int
    target_departments: List[str]


class MultiHorizonPlanResult(BaseModel):
    horizon_type: str = "TWO_TIER_ROLLING_HORIZON"
    monthly_envelopes: Dict[str, MonthlySectionEnvelope]
    weekly_tactical_plan: OptimizationResult
    envelope_consistency_verified: bool
    section_utilization_pct: Dict[str, float]


class MultiHorizonCoordinator:
    """Implements two-tier rolling horizon coordination per corrected Architecture Decision 002.
    
    1. Monthly Strategic Envelope: Establishes coarse possession-hour budget per section.
    2. Weekly Tactical Solve: Refines discrete 5-minute possession slots constrained within the monthly envelope.
    """

    @classmethod
    def compute_monthly_envelope(
        cls,
        sections: List[Section],
        jobs: List[MaintenanceJob],
        total_monthly_demand_hours: float = 40.0,
    ) -> Dict[str, MonthlySectionEnvelope]:
        """Calculates macro-level section possession budgets across a 30-day horizon."""
        envelopes = {}
        jobs_by_sec = {}
        for j in jobs:
            jobs_by_sec.setdefault(j.section_id, []).append(j)

        total_jobs = max(1, len(jobs))

        for sec in sections:
            sec_jobs = jobs_by_sec.get(sec.id, [])
            sec_share = len(sec_jobs) / total_jobs
            # Allocated weekly envelope derived from monthly target
            weekly_hours = max(2.5, round((total_monthly_demand_hours / 4.0) * (0.4 + sec_share), 1))
            statutory_count = sum(1 for j in sec_jobs if j.statutory_deadline_minute is not None)
            depts = list({j.department for j in sec_jobs})

            envelopes[sec.id] = MonthlySectionEnvelope(
                section_id=sec.id,
                max_possession_hours=weekly_hours,
                max_possession_minutes=int(weekly_hours * 60),
                statutory_jobs_quota=statutory_count,
                target_departments=depts,
            )

        return envelopes

    @classmethod
    def solve_multi_horizon(
        cls,
        sections: List[Section],
        jobs: List[MaintenanceJob],
        windows: List[CorridorWindow],
        trains: List[Any],
        resources: Optional[List[Any]] = None,
        time_limit_seconds: float = 10.0,
    ) -> MultiHorizonPlanResult:
        # 1. Compute Monthly Strategic Envelope
        envelopes = cls.compute_monthly_envelope(sections=sections, jobs=jobs)

        # 2. Tactical Weekly Solve with CP-SAT Convoy Optimizer
        optimizer = BlockOptimizer(
            jobs=jobs,
            windows=windows,
            trains=trains,
            resources=resources,
            time_limit_seconds=time_limit_seconds,
        )
        weekly_result = optimizer.solve()

        # 3. Verify that weekly allocations respect monthly section envelopes
        weekly_usage_by_sec: Dict[str, int] = {}
        for b in weekly_result.blocks:
            weekly_usage_by_sec[b.section_id] = weekly_usage_by_sec.get(b.section_id, 0) + b.duration_min

        utilization_pct = {}
        all_consistent = True

        for sec_id, env in envelopes.items():
            used_min = weekly_usage_by_sec.get(sec_id, 0)
            pct = round((used_min / max(1, env.max_possession_minutes)) * 100, 1)
            utilization_pct[sec_id] = pct
            if used_min > env.max_possession_minutes:
                all_consistent = False

        return MultiHorizonPlanResult(
            monthly_envelopes=envelopes,
            weekly_tactical_plan=weekly_result,
            envelope_consistency_verified=all_consistent,
            section_utilization_pct=utilization_pct,
        )
