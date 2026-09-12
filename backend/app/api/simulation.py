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
from backend.app.api.plans import run_optimized_plan, _LATEST_OPTIMIZED_PLAN
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


@router.post("/simulation/train-delay", response_model=CounterfactualDisruptionResult)
def simulate_train_delay(req: TrainDelayRequest, db: Session = Depends(get_db)):
    """Injects a train delay, estimates 1-hop network impact, and replans with frozen state."""
    global _LATEST_OPTIMIZED_PLAN
    if _LATEST_OPTIMIZED_PLAN is None:
        _LATEST_OPTIMIZED_PLAN = run_optimized_plan(db=db)

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
        current_plan=_LATEST_OPTIMIZED_PLAN,
        train_id=target_train.id,
        delay_minutes=req.delay_minutes,
        sections=sections,
        assets=assets,
        jobs=jobs,
        windows=windows,
        trains=trains,
        resources=resources,
    )
    return result


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
