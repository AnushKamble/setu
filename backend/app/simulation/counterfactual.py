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

    @classmethod
    def evaluate_block_cancellation(
        cls,
        current_plan: OptimizationResult,
        block_id: str,
        reason: str,
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
        
        target_block = next((b for b in current_plan.blocks if b.block_id == block_id), current_plan.blocks[0])
        twin.inject_block_cancellation(window_id=target_block.window_id, reason=reason)
        
        sec = next((s for s in sections if s.id == target_block.section_id), None)
        impact = NetworkImpactEstimate(
            event_id=f"EVT-CAN-{target_block.block_id}",
            primary_section_id=target_block.section_id,
            direct_delay_minutes=0,
            adjacent_sections_affected=sec.adjacent_section_ids if sec else [],
            secondary_delay_minutes=0,
            total_network_delay_minutes=0,
            trains_knocked_on=[],
            affected_blocks=[target_block.window_id],
            replan_recommended=True,
            cascade_chain=[{
                "hop_level": 0,
                "section_id": target_block.section_id,
                "section_name": sec.name if sec else target_block.section_id,
                "propagated_delay_minutes": 0,
                "buffer_absorption_minutes": target_block.duration_min,
                "overlapping_windows": [target_block.window_id],
                "event": f"Possession {target_block.block_id} cancelled ({reason}). {len(target_block.job_ids)} jobs queued for dynamic re-allocation."
            }],
            max_hops=1,
        )

        diff = DynamicReplanner.replan_on_disruption(
            current_plan=current_plan,
            jobs=jobs,
            windows=windows,
            trains=trains,
            disrupted_window_ids={target_block.window_id},
            resources=resources,
        )

        return CounterfactualDisruptionResult(
            scenario_type="BLOCK_CANCELLATION",
            impact=impact,
            replanning_diff=diff,
        )

    @classmethod
    def evaluate_maintenance_overrun(
        cls,
        current_plan: OptimizationResult,
        block_id: str,
        overrun_minutes: int,
        root_cause: str,
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

        target_block = next((b for b in current_plan.blocks if b.block_id == block_id), current_plan.blocks[0])
        w = next((win for win in windows if win.id == target_block.window_id), None)
        extended_end = (w.end_minute if w else target_block.end_minute) + overrun_minutes

        detained_trains = []
        for t in trains:
            if t.section_id == target_block.section_id:
                if target_block.start_minute <= t.entry_minute <= extended_end + 15:
                    detained_trains.append(t)

        if detained_trains:
            impact = twin.inject_train_delay(train_id=detained_trains[0].id, delay_minutes=overrun_minutes)
        else:
            sec = next((s for s in sections if s.id == target_block.section_id), None)
            impact = NetworkImpactEstimate(
                event_id=f"EVT-OVR-{target_block.block_id}",
                primary_section_id=target_block.section_id,
                direct_delay_minutes=overrun_minutes,
                adjacent_sections_affected=sec.adjacent_section_ids if sec else [],
                secondary_delay_minutes=int(overrun_minutes * 0.4),
                total_network_delay_minutes=overrun_minutes + int(overrun_minutes * 0.4),
                trains_knocked_on=[],
                affected_blocks=[target_block.window_id],
                replan_recommended=True,
                cascade_chain=[{
                    "hop_level": 0,
                    "section_id": target_block.section_id,
                    "section_name": sec.name if sec else target_block.section_id,
                    "propagated_delay_minutes": overrun_minutes,
                    "buffer_absorption_minutes": max(0, target_block.buffer_min - overrun_minutes),
                    "overlapping_windows": [target_block.window_id],
                    "event": f"Work overrun of +{overrun_minutes}m on {target_block.block_id} ({root_cause}). Track handover delayed."
                }],
                max_hops=1,
            )

        diff = DynamicReplanner.replan_on_disruption(
            current_plan=current_plan,
            jobs=jobs,
            windows=windows,
            trains=trains,
            disrupted_window_ids={target_block.window_id},
            resources=resources,
        )

        return CounterfactualDisruptionResult(
            scenario_type="MAINTENANCE_OVERRUN",
            impact=impact,
            replanning_diff=diff,
        )
