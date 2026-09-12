import time
from typing import List, Dict, Any, Optional, Set
from pydantic import BaseModel

from backend.app.models.railway import (
    MaintenanceJob,
    CorridorWindow,
    TrainMovement,
    DepartmentResource,
    TrainPriorityEnum,
)


class BaselineAssignment(BaseModel):
    job_id: str
    job_type: str
    department: str
    section_id: str
    window_id: str
    start_minute: int
    end_minute: int
    duration_min: int
    priority_score: float
    is_statutory: bool


class BaselinePlanResult(BaseModel):
    planner_type: str = "DECENTRALIZED_GREEDY_BASELINE"
    total_jobs: int
    scheduled_jobs_count: int
    deferred_jobs_count: int
    possessions_opened_count: int
    total_possession_minutes: int
    convoys_formed_count: int = 0
    critical_jobs_deferred_count: int
    train_conflicts_count: int
    resource_conflicts_count: int
    execution_time_seconds: float
    assignments: List[BaselineAssignment]
    deferred_job_ids: List[str]
    kpis: Dict[str, Any]


class BaselinePlanner:
    """Simulates Indian Railways legacy decentralized, department-siloed planning (BDMS/manual).
    
    Characteristics:
    - Each department schedules independently based on internal urgency.
    - No multi-department convoying (each job claims a separate window).
    - First-come, first-served window reservation.
    - Naive train conflict handling and resource pool tracking.
    """

    def __init__(
        self,
        jobs: List[MaintenanceJob],
        windows: List[CorridorWindow],
        trains: List[TrainMovement],
        resources: Optional[List[DepartmentResource]] = None,
    ):
        self.jobs = jobs
        self.windows = sorted(windows, key=lambda w: w.start_minute)
        self.trains = trains
        self.resources = {r.department: r.total_units for r in (resources or [])}

    def solve(self) -> BaselinePlanResult:
        start_time = time.perf_counter()

        # Sort jobs: Statutory first, then by priority_score descending
        sorted_jobs = sorted(
            self.jobs,
            key=lambda j: (
                1 if j.statutory_deadline_minute is not None else 0,
                j.priority_score,
            ),
            reverse=True,
        )

        occupied_windows: Set[str] = set()
        assignments: List[BaselineAssignment] = []
        deferred_job_ids: List[str] = []

        train_conflicts_count = 0
        resource_conflicts_count = 0

        # Build fast lookup for protected express train intervals per section
        protected_trains_by_section: Dict[str, List[TrainMovement]] = {}
        for t in self.trains:
            if t.priority_class == TrainPriorityEnum.EXPRESS.value:
                protected_trains_by_section.setdefault(t.section_id, []).append(t)

        for job in sorted_jobs:
            assigned = False
            # Search for first available window matching section and department
            for w in self.windows:
                # Must be same section and department must be allowed
                if w.section_id != job.section_id:
                    continue
                if w.allowed_departments and job.department not in w.allowed_departments:
                    continue
                # In baseline decentralized planning, windows are NOT shared across jobs
                if w.id in occupied_windows:
                    continue
                # Check window duration capacity against p90 duration
                if w.duration_min < job.duration_p90_min:
                    continue

                # Check if job statutory deadline is violated
                if job.statutory_deadline_minute and w.start_minute > job.statutory_deadline_minute:
                    continue

                # Check for protected train collisions in this window
                has_train_conflict = False
                for tr in protected_trains_by_section.get(w.section_id, []):
                    # Overlap condition: max(start1, start2) < min(end1, end2)
                    if max(w.start_minute, tr.entry_minute) < min(w.end_minute, tr.exit_minute):
                        has_train_conflict = True
                        break

                # In real life, manual planners sometimes book windows that conflict with traffic
                if has_train_conflict:
                    train_conflicts_count += 1

                # Reserve window
                occupied_windows.add(w.id)
                assignments.append(
                    BaselineAssignment(
                        job_id=job.id,
                        job_type=job.job_type,
                        department=job.department,
                        section_id=job.section_id,
                        window_id=w.id,
                        start_minute=w.start_minute,
                        end_minute=w.start_minute + job.duration_p90_min,
                        duration_min=job.duration_p90_min,
                        priority_score=job.priority_score,
                        is_statutory=job.statutory_deadline_minute is not None,
                    )
                )
                assigned = True
                break

            if not assigned:
                deferred_job_ids.append(job.id)

        # Count critical jobs deferred (statutory or priority >= 0.8)
        critical_jobs_deferred = 0
        deferred_set = set(deferred_job_ids)
        for job in self.jobs:
            if job.id in deferred_set:
                if job.statutory_deadline_minute is not None or job.priority_score >= 0.8:
                    critical_jobs_deferred += 1

        # Calculate total possession minutes opened
        total_possession_minutes = sum(
            w.duration_min for w in self.windows if w.id in occupied_windows
        )

        solve_duration = time.perf_counter() - start_time

        kpis = {
            "possessions_count": len(occupied_windows),
            "total_possession_minutes": total_possession_minutes,
            "jobs_scheduled_ratio": round(len(assignments) / max(1, len(self.jobs)), 3),
            "critical_jobs_deferred": critical_jobs_deferred,
            "convoys_formed": 0,
            "train_conflicts": train_conflicts_count,
            "average_window_utilization": round(
                sum(a.duration_min for a in assignments) / max(1, total_possession_minutes), 3
            ) if total_possession_minutes > 0 else 0.0,
        }

        return BaselinePlanResult(
            total_jobs=len(self.jobs),
            scheduled_jobs_count=len(assignments),
            deferred_jobs_count=len(deferred_job_ids),
            possessions_opened_count=len(occupied_windows),
            total_possession_minutes=total_possession_minutes,
            convoys_formed_count=0,
            critical_jobs_deferred_count=critical_jobs_deferred,
            train_conflicts_count=train_conflicts_count,
            resource_conflicts_count=resource_conflicts_count,
            execution_time_seconds=round(solve_duration, 4),
            assignments=assignments,
            deferred_job_ids=deferred_job_ids,
            kpis=kpis,
        )
