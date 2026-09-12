import time
from typing import List, Dict, Any, Tuple, Optional
from pydantic import BaseModel
from ortools.sat.python import cp_model

from backend.app.models.railway import (
    MaintenanceJob,
    CorridorWindow,
    TrainMovement,
    DepartmentResource,
    TrainPriorityEnum,
)
from backend.app.optimizer.compatibility import is_safety_compatible


class OptimizedBlock(BaseModel):
    block_id: str
    window_id: str
    section_id: str
    start_minute: int
    end_minute: int
    duration_min: int
    job_ids: List[str]
    departments: List[str]
    is_convoy: bool
    used_duration_p90_min: int
    buffer_min: int
    explanation: str
    is_pinned: bool = False
    status: str = "PROPOSED"  # PROPOSED, PINNED, APPROVED, REJECTED


class OptimizationResult(BaseModel):
    status: str  # OPTIMAL, FEASIBLE, INFEASIBLE
    solve_time_seconds: float
    total_jobs: int
    scheduled_jobs_count: int
    deferred_jobs_count: int
    possessions_opened_count: int
    total_possession_minutes: int
    convoys_formed_count: int
    possessions_avoided_by_convoy: int
    critical_jobs_deferred_count: int
    train_conflicts_count: int = 0
    blocks: List[OptimizedBlock]
    deferred_job_ids: List[str]
    kpis: Dict[str, Any]


class BlockOptimizer:
    """Google OR-Tools CP-SAT Multi-Department Convoy Optimizer."""

    def __init__(
        self,
        jobs: List[MaintenanceJob],
        windows: List[CorridorWindow],
        trains: List[TrainMovement],
        resources: Optional[List[DepartmentResource]] = None,
        pinned_window_assignments: Optional[Dict[str, str]] = None,
        section_monthly_quotas: Optional[Dict[str, int]] = None,
        time_limit_seconds: float = 10.0,
    ):
        self.jobs = jobs
        self.windows = sorted(windows, key=lambda w: w.start_minute)
        self.trains = trains
        self.resources = {r.department: r.total_units for r in (resources or [])}
        self.pinned_window_assignments = pinned_window_assignments or {}
        self.section_monthly_quotas = section_monthly_quotas or {}
        raw_limit = time_limit_seconds.default if hasattr(time_limit_seconds, "default") else time_limit_seconds
        self.time_limit_seconds = float(raw_limit)

    def solve(self) -> OptimizationResult:
        start_time = time.perf_counter()

        model = cp_model.CpModel()

        # Decision Variables
        # x[j_id, w_id] = 1 if job j assigned to window w
        x: Dict[Tuple[str, str], cp_model.IntVar] = {}
        # y[w_id] = 1 if window w opened for possession
        y: Dict[str, cp_model.IntVar] = {}
        # z[j_a, j_b, w_id] = 1 if jobs j_a and j_b convoy together in window w
        z: Dict[Tuple[str, str, str], cp_model.IntVar] = {}

        for w in self.windows:
            y[w.id] = model.NewBoolVar(f"y_{w.id}")

        for j in self.jobs:
            for w in self.windows:
                # Spatial check: job must match window section
                if j.section_id != w.section_id:
                    continue
                # Department check
                if w.allowed_departments and j.department not in w.allowed_departments:
                    continue
                # Duration check: window must be at least as long as p90 duration
                if w.duration_min < j.duration_p90_min:
                    continue
                # Statutory deadline check
                if j.statutory_deadline_minute and w.start_minute > j.statutory_deadline_minute:
                    continue

                x[(j.id, w.id)] = model.NewBoolVar(f"x_{j.id}_{w.id}")
                # Window activation implication
                model.AddImplication(x[(j.id, w.id)], y[w.id])

        # Candidate convoys: pairs of compatible jobs on same section
        compatible_pairs: List[Tuple[MaintenanceJob, MaintenanceJob]] = []
        for idx1, j1 in enumerate(self.jobs):
            for j2 in self.jobs[idx1 + 1 :]:
                if j1.section_id == j2.section_id and is_safety_compatible(j1, j2):
                    compatible_pairs.append((j1, j2))

        for j1, j2 in compatible_pairs:
            for w in self.windows:
                if (j1.id, w.id) in x and (j2.id, w.id) in x:
                    z_var = model.NewBoolVar(f"z_{j1.id}_{j2.id}_{w.id}")
                    z[(j1.id, j2.id, w.id)] = z_var
                    # Linearization constraints for z = x1 AND x2
                    model.Add(z_var <= x[(j1.id, w.id)])
                    model.Add(z_var <= x[(j2.id, w.id)])
                    model.Add(z_var >= x[(j1.id, w.id)] + x[(j2.id, w.id)] - 1)

        # -------------------------------------------------------------
        # HARD CONSTRAINTS
        # -------------------------------------------------------------

        # 1. Job scheduled at most once
        for j in self.jobs:
            job_vars = [x[(j.id, w.id)] for w in self.windows if (j.id, w.id) in x]
            if job_vars:
                model.Add(sum(job_vars) <= 1)

        # 2. Window Duration Capacity with P90 duration buffer
        for w in self.windows:
            window_job_terms = [
                x[(j.id, w.id)] * j.duration_p90_min
                for j in self.jobs
                if (j.id, w.id) in x
            ]
            if window_job_terms:
                model.Add(sum(window_job_terms) <= w.duration_min * y[w.id])

        # 3. Department Safety Incompatibility
        # Incompatible jobs on the same section cannot share the same window
        for idx1, j1 in enumerate(self.jobs):
            for j2 in self.jobs[idx1 + 1 :]:
                if j1.section_id == j2.section_id and not is_safety_compatible(j1, j2):
                    for w in self.windows:
                        if (j1.id, w.id) in x and (j2.id, w.id) in x:
                            model.Add(x[(j1.id, w.id)] + x[(j2.id, w.id)] <= 1)

        # 4. Section Exclusivity (Overlapping windows on same section cannot both open)
        for idx1, w1 in enumerate(self.windows):
            for w2 in self.windows[idx1 + 1 :]:
                if w1.section_id == w2.section_id:
                    # Overlap check
                    if max(w1.start_minute, w2.start_minute) < min(w1.end_minute, w2.end_minute):
                        model.Add(y[w1.id] + y[w2.id] <= 1)

        # 5. Protected Express Train Movement Conflict Avoidance
        for t in self.trains:
            if t.priority_class == TrainPriorityEnum.EXPRESS.value:
                for w in self.windows:
                    if w.section_id == t.section_id:
                        if max(w.start_minute, t.entry_minute) < min(w.end_minute, t.exit_minute):
                            # Express train strictly forbids block opening
                            model.Add(y[w.id] == 0)

        # 6. Department Resource Pool Constraints
        for w in self.windows:
            for dept, limit in self.resources.items():
                dept_jobs_in_w = [
                    x[(j.id, w.id)]
                    for j in self.jobs
                    if j.department == dept and (j.id, w.id) in x
                ]
                if dept_jobs_in_w:
                    model.Add(sum(dept_jobs_in_w) <= limit)

        # 7. Operator Human-in-the-Loop Pinning Constraints
        for pin_job_id, pin_win_id in self.pinned_window_assignments.items():
            if (pin_job_id, pin_win_id) in x:
                model.Add(x[(pin_job_id, pin_win_id)] == 1)
                model.Add(y[pin_win_id] == 1)

        # 8. Multi-Horizon Monthly Strategic Envelope Ceiling
        for sec_id, max_possession_mins in self.section_monthly_quotas.items():
            sec_window_terms = [
                y[w.id] * w.duration_min
                for w in self.windows
                if w.section_id == sec_id
            ]
            if sec_window_terms:
                model.Add(sum(sec_window_terms) <= max_possession_mins)

        # -------------------------------------------------------------
        # OBJECTIVE FUNCTION (Hierarchical Lexicographic Staged Weighting)
        # -------------------------------------------------------------
        # Stage 1: Heavily penalize leaving statutory jobs unscheduled (weight: 100,000)
        # Stage 2: Penalize deferred cost of waiting (weight: 500 * cost_of_waiting)
        # Stage 3: Penalize opened possession minutes (weight: 1 * w.duration_min)
        # Stage 4: Strongly reward convoy combinations (weight: -2,000 * z)
        objective_terms = []

        for j in self.jobs:
            scheduled_vars = [x[(j.id, w.id)] for w in self.windows if (j.id, w.id) in x]
            if not scheduled_vars:
                continue

            scheduled_sum = sum(scheduled_vars)
            not_scheduled = 1 - scheduled_sum

            # Statutory penalty
            if j.statutory_deadline_minute is not None:
                objective_terms.append(not_scheduled * 100000)
            else:
                # Cost of waiting penalty (scaled to integer)
                int_cow = int(j.cost_of_waiting * 500)
                objective_terms.append(not_scheduled * int_cow)

        # Possession downtime penalty (minimizing block hours opened)
        for w in self.windows:
            objective_terms.append(y[w.id] * w.duration_min)

        # Convoy synergy reward (combining multi-department activities)
        for z_var in z.values():
            objective_terms.append(z_var * -2000)

        model.Minimize(sum(objective_terms))

        # Solve
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = self.time_limit_seconds
        solver.parameters.num_search_workers = 4

        solver_status = solver.Solve(model)
        solve_duration = time.perf_counter() - start_time

        status_str = solver.StatusName(solver_status)

        if solver_status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            return OptimizationResult(
                status=status_str,
                solve_time_seconds=round(solve_duration, 4),
                total_jobs=len(self.jobs),
                scheduled_jobs_count=0,
                deferred_jobs_count=len(self.jobs),
                possessions_opened_count=0,
                total_possession_minutes=0,
                convoys_formed_count=0,
                possessions_avoided_by_convoy=0,
                critical_jobs_deferred_count=sum(
                    1 for j in self.jobs if j.statutory_deadline_minute or j.priority_score >= 0.8
                ),
                blocks=[],
                deferred_job_ids=[j.id for j in self.jobs],
                kpis={"status": status_str, "error": "No feasible schedule found"},
            )

        # Extract solution
        scheduled_job_ids = set()
        blocks: List[OptimizedBlock] = []
        convoys_count = 0
        possessions_avoided = 0
        total_opened_minutes = 0

        for w in self.windows:
            if solver.Value(y[w.id]) == 1:
                assigned_jobs = [
                    j for j in self.jobs if (j.id, w.id) in x and solver.Value(x[(j.id, w.id)]) == 1
                ]
                if not assigned_jobs:
                    continue

                total_opened_minutes += w.duration_min
                job_ids = [j.id for j in assigned_jobs]
                for j_id in job_ids:
                    scheduled_job_ids.add(j_id)

                departments = list({j.department for j in assigned_jobs})
                is_convoy = len(departments) > 1 or len(assigned_jobs) > 1
                if is_convoy:
                    convoys_count += 1
                    possessions_avoided += (len(assigned_jobs) - 1)

                used_dur = sum(j.duration_p90_min for j in assigned_jobs)
                buffer_min = w.duration_min - used_dur

                dept_summary = ", ".join(departments)
                if is_convoy:
                    expl = (
                        f"Joint Convoy: Bundled {len(assigned_jobs)} maintenance tasks across {dept_summary} "
                        f"saving {len(assigned_jobs)-1} separate track possessions. Buffer: {buffer_min} mins."
                    )
                else:
                    expl = (
                        f"Single-Department Block: Scheduled {len(assigned_jobs)} task(s) for {dept_summary}. "
                        f"Buffer: {buffer_min} mins."
                    )

                blocks.append(
                    OptimizedBlock(
                        block_id=f"BLK-{w.id}",
                        window_id=w.id,
                        section_id=w.section_id,
                        start_minute=w.start_minute,
                        end_minute=w.end_minute,
                        duration_min=w.duration_min,
                        job_ids=job_ids,
                        departments=departments,
                        is_convoy=is_convoy,
                        used_duration_p90_min=used_dur,
                        buffer_min=buffer_min,
                        explanation=expl,
                    )
                )

        deferred_job_ids = [j.id for j in self.jobs if j.id not in scheduled_job_ids]
        critical_deferred = sum(
            1 for j in self.jobs
            if j.id in deferred_job_ids and (j.statutory_deadline_minute or j.priority_score >= 0.8)
        )

        kpis = {
            "possessions_count": len(blocks),
            "total_possession_minutes": total_opened_minutes,
            "jobs_scheduled_ratio": round(len(scheduled_job_ids) / max(1, len(self.jobs)), 3),
            "convoys_formed": convoys_count,
            "possessions_avoided_by_convoy": possessions_avoided,
            "critical_jobs_deferred": critical_deferred,
            "statutory_missed": 0 if critical_deferred == 0 else critical_deferred,
            "solve_time_seconds": round(solve_duration, 4),
            "num_decision_variables": len(x) + len(y) + len(z),
            "num_assignment_vars": len(x),
            "num_window_vars": len(y),
            "num_convoy_product_vars": len(z),
            "solver_algorithm": "Google OR-Tools CP-SAT (Exact Integer Programming & SAT Hybrid)",
            "optimality_proof": "Proven Globally Optimal" if solver_status == cp_model.OPTIMAL else "Feasible Upper Bound",
            "search_workers": 4,
        }

        return OptimizationResult(
            status=status_str,
            solve_time_seconds=round(solve_duration, 4),
            total_jobs=len(self.jobs),
            scheduled_jobs_count=len(scheduled_job_ids),
            deferred_jobs_count=len(deferred_job_ids),
            possessions_opened_count=len(blocks),
            total_possession_minutes=total_opened_minutes,
            convoys_formed_count=convoys_count,
            possessions_avoided_by_convoy=possessions_avoided,
            critical_jobs_deferred_count=critical_deferred,
            blocks=blocks,
            deferred_job_ids=deferred_job_ids,
            kpis=kpis,
        )
