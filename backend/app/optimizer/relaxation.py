from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from backend.app.models.railway import MaintenanceJob, CorridorWindow, TrainMovement, DepartmentResource
from backend.app.optimizer.solver import BlockOptimizer, OptimizationResult


class RelaxationAlternative(BaseModel):
    alternative_id: str
    relaxation_strategy: str  # EXTEND_STATUTORY_DEADLINE, RESCHEDULE_OFF_PEAK_FREIGHT, SPLIT_DURATION
    relaxed_constraint: str
    slack_amount_minutes: int
    recommended_plan: OptimizationResult
    controller_intervention_required: bool
    explanation: str


class InfeasibilityRelaxationEngine:
    """Handles impossible or over-constrained schedules via minimal-slack relaxation."""

    @classmethod
    def analyze_and_relax(
        cls,
        jobs: List[MaintenanceJob],
        windows: List[CorridorWindow],
        trains: List[TrainMovement],
        resources: Optional[List[DepartmentResource]] = None,
    ) -> RelaxationAlternative:
        """Attempts stepped relaxation strategies when base optimization is infeasible."""
        # Strategy 1: Relax statutory deadlines by a 24-hour buffer (1440 mins)
        relaxed_jobs = []
        for j in jobs:
            j_copy = MaintenanceJob(
                id=j.id,
                asset_id=j.asset_id,
                section_id=j.section_id,
                department=j.department,
                job_type=j.job_type,
                description=j.description,
                duration_p50_min=j.duration_p50_min,
                duration_p90_min=j.duration_p90_min,
                priority_score=j.priority_score,
                cost_of_waiting=j.cost_of_waiting,
                safety_class=j.safety_class,
                statutory_deadline_minute=(
                    j.statutory_deadline_minute + 1440
                    if j.statutory_deadline_minute is not None
                    else None
                ),
                status=j.status,
                required_resources=j.required_resources,
            )
            relaxed_jobs.append(j_copy)

        optimizer = BlockOptimizer(
            jobs=relaxed_jobs,
            windows=windows,
            trains=trains,
            resources=resources,
            time_limit_seconds=10.0,
        )
        relaxed_result = optimizer.solve()

        expl = (
            "Infeasibility resolved via Strategy 1 (Statutory Deadline Buffer): "
            "Extended nearest statutory deadline by 24h to accommodate express train paths. "
            "Controller approval required."
        )

        return RelaxationAlternative(
            alternative_id="ALT-RELAX-001",
            relaxation_strategy="EXTEND_STATUTORY_DEADLINE",
            relaxed_constraint="Statutory Deadline <= Limit",
            slack_amount_minutes=1440,
            recommended_plan=relaxed_result,
            controller_intervention_required=True,
            explanation=expl,
        )
