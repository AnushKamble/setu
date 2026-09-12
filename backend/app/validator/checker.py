from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from backend.app.models.railway import (
    MaintenanceJob,
    CorridorWindow,
    TrainMovement,
    DepartmentResource,
    TrainPriorityEnum,
)
from backend.app.optimizer.solver import OptimizationResult, OptimizedBlock
from backend.app.optimizer.compatibility import is_safety_compatible


class ValidationViolation(BaseModel):
    violation_type: str
    severity: str  # CRITICAL_SAFETY, STATUTORY_BREACH, CAPACITY_OVERRUN, RESOURCE_LIMIT
    block_id: Optional[str] = None
    job_id: Optional[str] = None
    section_id: Optional[str] = None
    message: str


class ValidationReport(BaseModel):
    is_valid: bool
    total_checks_run: int
    violations_count: int
    violations: List[ValidationViolation] = Field(default_factory=list)
    checks_passed: List[str] = Field(default_factory=list)
    audit_timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class IndependentValidator:
    """Zero-trust external schedule validator.
    
    Verifies operational and safety validity independently of solver internal state.
    """

    @classmethod
    def validate(
        cls,
        plan: OptimizationResult,
        jobs: List[MaintenanceJob],
        windows: List[CorridorWindow],
        trains: List[TrainMovement],
        resources: Optional[List[DepartmentResource]] = None,
    ) -> ValidationReport:
        violations: List[ValidationViolation] = []
        checks_passed: List[str] = []

        jobs_by_id = {j.id: j for j in jobs}
        windows_by_id = {w.id: w for w in windows}
        res_limits = {r.department: r.total_units for r in (resources or [])}

        # -------------------------------------------------------------
        # CHECK 1: Duplicate Job Assignments
        # -------------------------------------------------------------
        seen_job_ids: Dict[str, str] = {}
        dup_found = False
        for b in plan.blocks:
            for j_id in b.job_ids:
                if j_id in seen_job_ids:
                    dup_found = True
                    violations.append(
                        ValidationViolation(
                            violation_type="DUPLICATE_JOB_ASSIGNMENT",
                            severity="CRITICAL_SAFETY",
                            block_id=b.block_id,
                            job_id=j_id,
                            message=f"Job {j_id} assigned to multiple blocks: {seen_job_ids[j_id]} and {b.block_id}",
                        )
                    )
                else:
                    seen_job_ids[j_id] = b.block_id
        if not dup_found:
            checks_passed.append("No duplicate job assignments")

        # -------------------------------------------------------------
        # CHECK 2: Window Duration Capacity with P90 Buffers
        # -------------------------------------------------------------
        capacity_violated = False
        for b in plan.blocks:
            total_duration_p90 = sum(
                jobs_by_id[j_id].duration_p90_min
                for j_id in b.job_ids
                if j_id in jobs_by_id
            )
            if total_duration_p90 > b.duration_min:
                capacity_violated = True
                violations.append(
                    ValidationViolation(
                        violation_type="WINDOW_CAPACITY_OVERRUN",
                        severity="CAPACITY_OVERRUN",
                        block_id=b.block_id,
                        section_id=b.section_id,
                        message=(
                            f"Block {b.block_id} duration overrun: jobs require {total_duration_p90} mins "
                            f"(P90) exceeding window limit of {b.duration_min} mins."
                        ),
                    )
                )
        if not capacity_violated:
            checks_passed.append("All blocks respect P90 window duration capacity")

        # -------------------------------------------------------------
        # CHECK 3: Section Exclusivity (No overlapping possessions on same section)
        # -------------------------------------------------------------
        section_overlap_found = False
        for i, b1 in enumerate(plan.blocks):
            for b2 in plan.blocks[i + 1 :]:
                if b1.section_id == b2.section_id:
                    # Overlap check
                    if max(b1.start_minute, b2.start_minute) < min(b1.end_minute, b2.end_minute):
                        section_overlap_found = True
                        violations.append(
                            ValidationViolation(
                                violation_type="SECTION_CONCURRENT_POSSESSION",
                                severity="CRITICAL_SAFETY",
                                block_id=b1.block_id,
                                section_id=b1.section_id,
                                message=(
                                    f"Concurrent possessions on {b1.section_id}: {b1.block_id} "
                                    f"[{b1.start_minute}-{b1.end_minute}] overlaps with {b2.block_id} "
                                    f"[{b2.start_minute}-{b2.end_minute}]."
                                ),
                            )
                        )
        if not section_overlap_found:
            checks_passed.append("Section exclusivity strictly maintained (no concurrent blocks)")

        # -------------------------------------------------------------
        # CHECK 4: Protected Express Train Conflict Avoidance
        # -------------------------------------------------------------
        train_conflict_found = False
        for b in plan.blocks:
            for t in trains:
                if t.priority_class == TrainPriorityEnum.EXPRESS.value and t.section_id == b.section_id:
                    if max(b.start_minute, t.entry_minute) < min(b.end_minute, t.exit_minute):
                        train_conflict_found = True
                        violations.append(
                            ValidationViolation(
                                violation_type="PROTECTED_TRAIN_CONFLICT",
                                severity="CRITICAL_SAFETY",
                                block_id=b.block_id,
                                section_id=b.section_id,
                                message=(
                                    f"Safety Collision: Block {b.block_id} [{b.start_minute}-{b.end_minute}] "
                                    f"conflicts with Express Train {t.train_number} ({t.train_name}) "
                                    f"[{t.entry_minute}-{t.exit_minute}]."
                                ),
                            )
                        )
        if not train_conflict_found:
            checks_passed.append("Zero protected express train timetable conflicts")

        # -------------------------------------------------------------
        # CHECK 5: Multi-Department Safety Compatibility safe(j,j')
        # -------------------------------------------------------------
        safety_incompat_found = False
        for b in plan.blocks:
            block_jobs = [jobs_by_id[j_id] for j_id in b.job_ids if j_id in jobs_by_id]
            for i, j1 in enumerate(block_jobs):
                for j2 in block_jobs[i + 1 :]:
                    if not is_safety_compatible(j1, j2):
                        safety_incompat_found = True
                        violations.append(
                            ValidationViolation(
                                violation_type="DEPARTMENT_SAFETY_INCOMPATIBILITY",
                                severity="CRITICAL_SAFETY",
                                block_id=b.block_id,
                                job_id=f"{j1.id}+{j2.id}",
                                section_id=b.section_id,
                                message=(
                                    f"Incompatible Convoy: Job {j1.id} ({j1.department}) and Job {j2.id} "
                                    f"({j2.department}) violate safety separation rules in {b.block_id}."
                                ),
                            )
                        )
        if not safety_incompat_found:
            checks_passed.append("All convoy pairings pass multi-department safety compatibility")

        # -------------------------------------------------------------
        # CHECK 6: Statutory Deadlines
        # -------------------------------------------------------------
        statutory_missed = False
        for j in jobs:
            if j.statutory_deadline_minute is not None:
                if j.id not in seen_job_ids:
                    statutory_missed = True
                    violations.append(
                        ValidationViolation(
                            violation_type="STATUTORY_JOB_UNSCHEDULED",
                            severity="STATUTORY_BREACH",
                            job_id=j.id,
                            section_id=j.section_id,
                            message=f"Mandatory statutory inspection {j.id} left unscheduled!",
                        )
                    )
                else:
                    # Check if scheduled start minute is before statutory deadline
                    b = next(b for b in plan.blocks if j.id in b.job_ids)
                    if b.start_minute > j.statutory_deadline_minute:
                        statutory_missed = True
                        violations.append(
                            ValidationViolation(
                                violation_type="STATUTORY_DEADLINE_EXCEEDED",
                                severity="STATUTORY_BREACH",
                                block_id=b.block_id,
                                job_id=j.id,
                                section_id=j.section_id,
                                message=(
                                    f"Statutory job {j.id} scheduled at minute {b.start_minute} "
                                    f"after regulatory deadline {j.statutory_deadline_minute}."
                                ),
                            )
                        )
        if not statutory_missed:
            checks_passed.append("All statutory inspection deadlines 100% satisfied")

        # -------------------------------------------------------------
        # CHECK 7: Department Resource Limits
        # -------------------------------------------------------------
        resource_exceeded = False
        for b in plan.blocks:
            dept_counts = {}
            for j_id in b.job_ids:
                j = jobs_by_id.get(j_id)
                if j:
                    dept_counts[j.department] = dept_counts.get(j.department, 0) + 1

            for dept, count in dept_counts.items():
                limit = res_limits.get(dept, 99)
                if count > limit:
                    resource_exceeded = True
                    violations.append(
                        ValidationViolation(
                            violation_type="RESOURCE_POOL_OVERCOMMITTED",
                            severity="RESOURCE_LIMIT",
                            block_id=b.block_id,
                            message=(
                                f"Block {b.block_id} demands {count} {dept} gangs, exceeding "
                                f"available pool of {limit}."
                            ),
                        )
                    )
        if not resource_exceeded:
            checks_passed.append("All department workforce & equipment pool constraints satisfied")

        total_checks = 7
        is_valid = len(violations) == 0

        return ValidationReport(
            is_valid=is_valid,
            total_checks_run=total_checks,
            violations_count=len(violations),
            violations=violations,
            checks_passed=checks_passed,
        )
