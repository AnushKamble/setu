import time
from typing import List, Dict, Any, Set, Optional
from pydantic import BaseModel
from ortools.sat.python import cp_model

from backend.app.models.railway import (
    MaintenanceJob,
    CorridorWindow,
    TrainMovement,
    DepartmentResource,
    JobStatusEnum,
)
from backend.app.optimizer.solver import (
    BlockOptimizer,
    OptimizationResult,
    OptimizedBlock,
)


class ReplanningDiff(BaseModel):
    replan_status: str  # REPLANNED_SUCCESS, NO_CHANGE_NEEDED, RELAXED_FALLBACK
    replan_time_seconds: float
    frozen_jobs_count: int
    reassigned_jobs_count: int
    unaffected_blocks: List[str]
    modified_or_new_blocks: List[OptimizedBlock]
    diff_summary: str
    updated_plan: OptimizationResult


class DynamicReplanner:
    """Dynamic disruption replanner using warm-start rolling horizon with frozen in-progress state."""

    @classmethod
    def replan_on_disruption(
        cls,
        current_plan: OptimizationResult,
        jobs: List[MaintenanceJob],
        windows: List[CorridorWindow],
        trains: List[TrainMovement],
        frozen_job_ids: Optional[Set[str]] = None,
        disrupted_window_ids: Optional[Set[str]] = None,
        resources: Optional[List[DepartmentResource]] = None,
        time_limit_seconds: float = 5.0,
    ) -> ReplanningDiff:
        start_time = time.perf_counter()

        frozen_ids = set(frozen_job_ids or [])
        disrupted_win_ids = set(disrupted_window_ids or [])

        # Auto-freeze jobs marked COMMITTED or IN_PROGRESS
        for j in jobs:
            if j.status in (JobStatusEnum.COMMITTED.value, JobStatusEnum.IN_PROGRESS.value, JobStatusEnum.COMPLETED.value):
                frozen_ids.add(j.id)

        # Identify which existing blocks are unaffected vs disrupted
        unaffected_blocks: List[OptimizedBlock] = []
        jobs_in_unaffected: Set[str] = set()

        for b in current_plan.blocks:
            # If block uses a disrupted window, it cannot be retained as-is
            if b.window_id in disrupted_win_ids:
                continue

            # If all jobs in block are frozen, lock this block in place
            if all(j_id in frozen_ids for j_id in b.job_ids):
                unaffected_blocks.append(b)
                for j_id in b.job_ids:
                    jobs_in_unaffected.add(j_id)

        # Remaining jobs to schedule (flexible jobs + frozen jobs displaced from disrupted windows)
        remaining_jobs = [j for j in jobs if j.id not in jobs_in_unaffected]

        # Available windows excluding those claimed by unaffected blocks or cancelled
        claimed_windows = {b.window_id for b in unaffected_blocks}
        available_windows = [
            w for w in windows
            if w.id not in claimed_windows and w.id not in disrupted_win_ids
        ]

        # Re-solve the sub-problem using CP-SAT Convoy Optimizer
        optimizer = BlockOptimizer(
            jobs=remaining_jobs,
            windows=available_windows,
            trains=trains,
            resources=resources,
            time_limit_seconds=time_limit_seconds,
        )
        sub_result = optimizer.solve()
        replan_duration = time.perf_counter() - start_time

        # Merge unaffected blocks with newly optimized blocks
        all_blocks = list(unaffected_blocks) + list(sub_result.blocks)
        total_scheduled = len(jobs_in_unaffected) + sub_result.scheduled_jobs_count
        deferred_ids = [j.id for j in jobs if j.id not in jobs_in_unaffected and j.id in sub_result.deferred_job_ids]

        merged_plan = OptimizationResult(
            status=sub_result.status,
            solve_time_seconds=round(replan_duration, 4),
            total_jobs=len(jobs),
            scheduled_jobs_count=total_scheduled,
            deferred_jobs_count=len(deferred_ids),
            possessions_opened_count=len(all_blocks),
            total_possession_minutes=sum(b.duration_min for b in all_blocks),
            convoys_formed_count=sum(1 for b in all_blocks if b.is_convoy),
            possessions_avoided_by_convoy=sum(len(b.job_ids) - 1 for b in all_blocks if b.is_convoy),
            critical_jobs_deferred_count=sub_result.critical_jobs_deferred_count,
            blocks=all_blocks,
            deferred_job_ids=deferred_ids,
            kpis={
                "replan_duration_seconds": round(replan_duration, 4),
                "frozen_blocks_retained": len(unaffected_blocks),
                "new_blocks_formed": len(sub_result.blocks),
            },
        )

        diff_text = (
            f"Dynamic Replan completed in {round(replan_duration, 3)}s: Retained {len(unaffected_blocks)} frozen blocks "
            f"and re-allocated {sub_result.scheduled_jobs_count} flexible jobs across {len(sub_result.blocks)} new possession windows."
        )

        return ReplanningDiff(
            replan_status="REPLANNED_SUCCESS" if sub_result.status in ("OPTIMAL", "FEASIBLE") else "RELAXED_FALLBACK",
            replan_time_seconds=round(replan_duration, 4),
            frozen_jobs_count=len(frozen_ids),
            reassigned_jobs_count=sub_result.scheduled_jobs_count,
            unaffected_blocks=[b.block_id for b in unaffected_blocks],
            modified_or_new_blocks=sub_result.blocks,
            diff_summary=diff_text,
            updated_plan=merged_plan,
        )
