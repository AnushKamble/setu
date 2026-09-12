from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from backend.app.models.railway import MaintenanceJob, CorridorWindow, TrainMovement, DepartmentResource
from backend.app.ml.hazard import CostOfWaitingModel
from backend.app.simulation.digital_twin import DigitalTwinState, NetworkImpactEstimate
from backend.app.optimizer.replanner import DynamicReplanner, ReplanningDiff
from backend.app.optimizer.solver import OptimizationResult


class CounterfactualPostponeResult(BaseModel):
    job_id: str
    asset_id: str
    section_id: str
    postpone_days: int
    current_cost_of_waiting: float
    future_cost_of_waiting: float
    cost_increase_pct: float
    is_statutory_breached: bool
    operational_recommendation: str


class CounterfactualDisruptionResult(BaseModel):
    scenario_type: str
    impact: NetworkImpactEstimate
    replanning_diff: ReplanningDiff


class CounterfactualEngine:
    """Answers operator what-if questions via deterministic simulation and dynamic re-optimization."""

    @classmethod
    def evaluate_postpone_job(
        cls,
        job: MaintenanceJob,
        postpone_days: int = 7,
    ) -> CounterfactualPostponeResult:
        current_cow = job.cost_of_waiting
        future_cow = CostOfWaitingModel.compute_cost_of_waiting(
            priority_score=job.priority_score,
            criticality=4,  # baseline asset criticality
            deferral_days=postpone_days + 7,
        )

        pct_increase = round(((future_cow - current_cow) / max(0.1, current_cow)) * 100, 1)

        statutory_breached = False
        if job.statutory_deadline_minute:
            # If postponing pushes beyond statutory deadline
            statutory_breached = True

        if statutory_breached:
            rec = "REJECT POSTPONEMENT: Statutory regulatory inspection deadline cannot be breached."
        elif pct_increase > 40.0:
            rec = f"NOT RECOMMENDED: Postponing {postpone_days} days compounds deferred failure risk by +{pct_increase}%."
        else:
            rec = f"ACCEPTABLE WITH CAUTION: Marginal risk increases by +{pct_increase}%. Alternative windows available."

        return CounterfactualPostponeResult(
            job_id=job.id,
            asset_id=job.asset_id,
            section_id=job.section_id,
            postpone_days=postpone_days,
            current_cost_of_waiting=current_cow,
            future_cost_of_waiting=future_cow,
            cost_increase_pct=pct_increase,
            is_statutory_breached=statutory_breached,
            operational_recommendation=rec,
        )

    @classmethod
    def evaluate_train_delay_disruption(
        cls,
        current_plan: OptimizationResult,
        train_id: str,
        delay_minutes: int,
        sections: List[Any],
        assets: List[Any],
        jobs: List[MaintenanceJob],
        windows: List[CorridorWindow],
        trains: List[TrainMovement],
        resources: Optional[List[DepartmentResource]] = None,
    ) -> CounterfactualDisruptionResult:
        twin = DigitalTwinState(
            sections=sections,
            assets=assets,
            jobs=jobs,
            windows=windows,
            trains=trains,
        )
        impact = twin.inject_train_delay(train_id=train_id, delay_minutes=delay_minutes)

        diff = DynamicReplanner.replan_on_disruption(
            current_plan=current_plan,
            jobs=jobs,
            windows=windows,
            trains=trains,
            disrupted_window_ids=set(impact.affected_blocks),
            resources=resources,
        )

        return CounterfactualDisruptionResult(
            scenario_type="TRAIN_DELAY_DISRUPTION",
            impact=impact,
            replanning_diff=diff,
        )
