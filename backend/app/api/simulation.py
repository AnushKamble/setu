from typing import Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.railway import (
    Section,
    Asset,
    MaintenanceJob,
    CorridorWindow,
    TrainMovement,
    DepartmentResource,
)
from backend.app.api.plans import (
    run_optimized_plan,
    _LATEST_OPTIMIZED_PLAN,
    set_latest_optimized_plan,
    get_latest_optimized_plan,
)
from backend.app.simulation.counterfactual import (
    CounterfactualEngine,
    CounterfactualPostponeResult,
    CounterfactualDisruptionResult,
)
from backend.app.explanation.explainer import DecisionExplainer
from backend.app.optimizer.horizon import MultiHorizonCoordinator

router = APIRouter(prefix="", tags=["Simulation & Explanations"])


class TrainDelayRequest(BaseModel):
    train_id: Optional[str] = None
    delay_minutes: int = 40


class PostponeJobRequest(BaseModel):
    job_id: str
    postpone_days: int = 7


class BlockCancellationRequest(BaseModel):
    block_id: str
    reason: Optional[str] = "Section Controller Traffic Surge / Adverse Weather"


class MaintenanceOverrunRequest(BaseModel):
    block_id: str
    overrun_minutes: int = 45
    root_cause: Optional[str] = "Tamping machine mechanical breakdown / OHE alignment delay"


@router.post("/simulation/train-delay", response_model=CounterfactualDisruptionResult)
def simulate_train_delay(req: TrainDelayRequest, db: Session = Depends(get_db)):
    """Injects a train delay, estimates 1-hop network impact, replans with frozen state, and commits live timetable updates."""
    active_plan = get_latest_optimized_plan(db=db)

    sections = db.query(Section).all()
    assets = db.query(Asset).all()
    jobs = db.query(MaintenanceJob).all()
    windows = db.query(CorridorWindow).all()
    trains = db.query(TrainMovement).all()
    resources = db.query(DepartmentResource).all()

    # If train_id not provided, pick first express train on active section
    target_train = None
    if req.train_id:
        target_train = db.query(TrainMovement).filter(TrainMovement.id == req.train_id).first()
    if not target_train:
        target_train = next((t for t in trains if t.priority_class == "EXPRESS"), trains[0])

    result = CounterfactualEngine.evaluate_train_delay_disruption(
        current_plan=active_plan,
        train_id=target_train.id,
        delay_minutes=req.delay_minutes,
        sections=sections,
        assets=assets,
        jobs=jobs,
        windows=windows,
        trains=trains,
        resources=resources,
    )

    # 1. Update target train in DB with real-time delay
    target_train.entry_minute += req.delay_minutes
    target_train.exit_minute += req.delay_minutes
    target_train.delay_minutes = (target_train.delay_minutes or 0) + req.delay_minutes
    target_train.status = "DELAYED"

    # 2. Update knocked-on trains identified in cascade
    knocked_on_nums = set(result.impact.trains_knocked_on or [])
    for t in trains:
        if t.train_number in knocked_on_nums and t.id != target_train.id:
            prop_delay = max(5, int(req.delay_minutes * 0.65))
            t.entry_minute += prop_delay
            t.exit_minute += prop_delay
            t.delay_minutes = (t.delay_minutes or 0) + prop_delay
            t.status = "KNOCKED_ON"

    db.commit()

    # 3. Commit updated replanned plan to global plan cache
    if result.replanning_diff and result.replanning_diff.updated_plan and result.replanning_diff.updated_plan.blocks:
        set_latest_optimized_plan(result.replanning_diff.updated_plan)

    return result


@router.post("/simulation/block-cancellation", response_model=CounterfactualDisruptionResult)
def simulate_block_cancellation(req: BlockCancellationRequest, db: Session = Depends(get_db)):
    """Simulates unexpected track possession abort and re-allocates jobs via warm-start CP-SAT."""
    active_plan = get_latest_optimized_plan(db=db)

    sections = db.query(Section).all()
    assets = db.query(Asset).all()
    jobs = db.query(MaintenanceJob).all()
    windows = db.query(CorridorWindow).all()
    trains = db.query(TrainMovement).all()
    resources = db.query(DepartmentResource).all()

    result = CounterfactualEngine.evaluate_block_cancellation(
        current_plan=active_plan,
        block_id=req.block_id,
        reason=req.reason or "Adverse Weather / Emergency Traffic Surge",
        sections=sections,
        assets=assets,
        jobs=jobs,
        windows=windows,
        trains=trains,
        resources=resources,
    )

    if result.replanning_diff and result.replanning_diff.updated_plan and result.replanning_diff.updated_plan.blocks:
        set_latest_optimized_plan(result.replanning_diff.updated_plan)

    return result


@router.post("/simulation/maintenance-overrun", response_model=CounterfactualDisruptionResult)
def simulate_maintenance_overrun(req: MaintenanceOverrunRequest, db: Session = Depends(get_db)):
    """Simulates block handover delay and models multi-hop downstream knock-on train delays."""
    active_plan = get_latest_optimized_plan(db=db)

    sections = db.query(Section).all()
    assets = db.query(Asset).all()
    jobs = db.query(MaintenanceJob).all()
    windows = db.query(CorridorWindow).all()
    trains = db.query(TrainMovement).all()
    resources = db.query(DepartmentResource).all()

    result = CounterfactualEngine.evaluate_maintenance_overrun(
        current_plan=active_plan,
        block_id=req.block_id,
        overrun_minutes=req.overrun_minutes,
        root_cause=req.root_cause or "Machine failure / Pantograph alignment delay",
        sections=sections,
        assets=assets,
        jobs=jobs,
        windows=windows,
        trains=trains,
        resources=resources,
    )

    knocked_on_nums = set(result.impact.trains_knocked_on or [])
    for t in trains:
        if t.train_number in knocked_on_nums:
            t.entry_minute += req.overrun_minutes
            t.exit_minute += req.overrun_minutes
            t.delay_minutes = (t.delay_minutes or 0) + req.overrun_minutes
            t.status = "KNOCKED_ON"
    db.commit()

    if result.replanning_diff and result.replanning_diff.updated_plan and result.replanning_diff.updated_plan.blocks:
        set_latest_optimized_plan(result.replanning_diff.updated_plan)

    return result


@router.post("/simulation/reset")
def reset_corridor_simulation(db: Session = Depends(get_db)):
    """Resets any injected delays back to nominal timetable and restores the baseline CP-SAT optimal plan."""
    trains = db.query(TrainMovement).all()
    reset_count = 0
    for t in trains:
        if t.original_entry_minute is not None:
            t.entry_minute = t.original_entry_minute
        elif t.delay_minutes and t.delay_minutes > 0:
            t.entry_minute -= t.delay_minutes

        if t.original_exit_minute is not None:
            t.exit_minute = t.original_exit_minute
        elif t.delay_minutes and t.delay_minutes > 0:
            t.exit_minute -= t.delay_minutes

        if (t.delay_minutes and t.delay_minutes > 0) or t.status != "ON_TIME":
            reset_count += 1
            t.delay_minutes = 0
            t.status = "ON_TIME"

    db.commit()

    # Re-solve nominal optimal plan
    nominal_plan = run_optimized_plan(db=db)
    set_latest_optimized_plan(nominal_plan)

    return {
        "status": "RESET_SUCCESSFUL",
        "trains_reverted": reset_count,
        "message": "Corridor timetable and possession plan restored to nominal baseline.",
        "active_plan_status": nominal_plan.status,
    }



@router.post("/simulation/postpone-job", response_model=CounterfactualPostponeResult)
def simulate_postpone_job(req: PostponeJobRequest, db: Session = Depends(get_db)):
    """Computes counterfactual risk growth and recommendation for delaying a job by N days."""
    job = db.query(MaintenanceJob).filter(MaintenanceJob.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {req.job_id} not found.")

    res = CounterfactualEngine.evaluate_postpone_job(job=job, postpone_days=req.postpone_days)
    return res


@router.get("/plans/explain")
def get_plan_explanation(db: Session = Depends(get_db)):
    """Returns deterministic reason codes for why each possession and convoy was selected."""
    global _LATEST_OPTIMIZED_PLAN
    if _LATEST_OPTIMIZED_PLAN is None:
        _LATEST_OPTIMIZED_PLAN = run_optimized_plan(db=db)

    jobs = db.query(MaintenanceJob).all()
    windows = db.query(CorridorWindow).all()

    report = DecisionExplainer.explain_plan(
        plan=_LATEST_OPTIMIZED_PLAN,
        jobs=jobs,
        windows=windows,
    )
    return report


@router.get("/plans/multi-horizon")
def get_multi_horizon_plan(db: Session = Depends(get_db)):
    """Computes monthly strategic section envelopes and validates weekly plan consistency."""
    sections = db.query(Section).all()
    jobs = db.query(MaintenanceJob).all()
    windows = db.query(CorridorWindow).all()
    trains = db.query(TrainMovement).all()
    resources = db.query(DepartmentResource).all()

    res = MultiHorizonCoordinator.solve_multi_horizon(
        sections=sections,
        jobs=jobs,
        windows=windows,
        trains=trains,
        resources=resources,
    )
    return res
