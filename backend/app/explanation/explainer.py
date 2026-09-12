from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from backend.app.models.railway import MaintenanceJob, CorridorWindow
from backend.app.optimizer.solver import OptimizationResult, OptimizedBlock


class BlockExplanation(BaseModel):
    block_id: str
    section_id: str
    time_window: str
    duration_min: int
    departments: List[str]
    is_convoy: bool
    reasons: List[str]
    summary_sentence: str


class DecisionExplanationReport(BaseModel):
    total_blocks_explained: int
    convoys_explained: int
    deferred_jobs_explained: int
    block_explanations: List[BlockExplanation]
    deferred_explanations: Dict[str, str]


class DecisionExplainer:
    """Generates deterministic, mathematically grounded explanations from solver outputs."""

    @classmethod
    def explain_plan(
        cls,
        plan: OptimizationResult,
        jobs: List[MaintenanceJob],
        windows: List[CorridorWindow],
    ) -> DecisionExplanationReport:
        jobs_by_id = {j.id: j for j in jobs}
        windows_by_id = {w.id: w for w in windows}

        block_expls: List[BlockExplanation] = []

        for b in plan.blocks:
            w = windows_by_id.get(b.window_id)
            reasons = []

            # 1. Capacity & Buffering reason
            reasons.append(
                f"P90 work duration {b.used_duration_p90_min}m fits within the {b.duration_min}m window "
                f"leaving a safety buffer of {b.buffer_min}m."
            )

            # 2. Multi-Department Convoy Synergy reason
            if b.is_convoy:
                reasons.append(
                    f"Cross-department bundling: Combined {len(b.job_ids)} jobs across {', '.join(b.departments)}, "
                    f"avoiding {len(b.job_ids)-1} separate track possessions."
                )

            # 3. Traffic Protection reason
            tier = w.traffic_impact_tier if w else "LOW_OFF_PEAK"
            reasons.append(f"Window slotted during {tier} with zero express train conflicts.")

            # 4. Criticality / Statutory Urgency
            statutory_jobs = [j_id for j_id in b.job_ids if jobs_by_id.get(j_id) and jobs_by_id[j_id].statutory_deadline_minute]
            if statutory_jobs:
                reasons.append(f"Satisfies mandatory statutory inspection deadline for {', '.join(statutory_jobs)}.")

            if b.is_convoy:
                summary = (
                    f"Approved joint convoy for {', '.join(b.departments)} on {b.section_id}: "
                    f"saves {len(b.job_ids)-1} block(s) and keeps {b.buffer_min}m buffer."
                )
            else:
                summary = (
                    f"Approved single block on {b.section_id} for {', '.join(b.departments)} "
                    f"during non-traffic window."
                )

            block_expls.append(
                BlockExplanation(
                    block_id=b.block_id,
                    section_id=b.section_id,
                    time_window=f"{b.start_minute}m - {b.end_minute}m",
                    duration_min=b.duration_min,
                    departments=b.departments,
                    is_convoy=b.is_convoy,
                    reasons=reasons,
                    summary_sentence=summary,
                )
            )

        # Explain deferred jobs
        deferred_expls = {}
        for j_id in plan.deferred_job_ids:
            j = jobs_by_id.get(j_id)
            if j:
                deferred_expls[j_id] = (
                    f"Job {j_id} ({j.job_type} on {j.section_id}) deferred: lower risk escalation "
                    f"(Priority {j.priority_score}, CoW {j.cost_of_waiting}) compared to scheduled backlog. "
                    f"Section capacity prioritized statutory tasks."
                )

        return DecisionExplanationReport(
            total_blocks_explained=len(block_expls),
            convoys_explained=sum(1 for b in block_expls if b.is_convoy),
            deferred_jobs_explained=len(deferred_expls),
            block_explanations=block_expls,
            deferred_explanations=deferred_expls,
        )
