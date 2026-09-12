from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.app.database import get_db
from backend.app.datagen.scenarios import ScenarioManager
from backend.app.datagen.loader import seed_database
from backend.app.models.railway import (
    Section,
    Asset,
    MaintenanceJob,
    CorridorWindow,
    TrainMovement,
    DepartmentResource,
)

router = APIRouter(prefix="", tags=["Scenarios & Network"])


class SeedRequest(BaseModel):
    scenario_name: str = "NORMAL"
    seed: int = 42


@router.get("/scenarios", response_model=List[str])
def list_scenarios():
    """List all pre-configured deterministic railway operating scenarios."""
    return ScenarioManager.SCENARIO_NAMES


@router.post("/scenarios/seed", status_code=status.HTTP_200_OK)
def run_seed_scenario(req: SeedRequest, db: Session = Depends(get_db)):
    """Seed the database with chosen scenario and return summary metrics."""
    try:
        summary = seed_database(scenario_name=req.scenario_name, seed=req.seed, db=db)
        return summary
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to seed database: {str(e)}")


@router.get("/network/summary")
def get_network_summary(db: Session = Depends(get_db)):
    """Returns real-time backlog and asset health across all departments."""
    sections_count = db.query(Section).count()
    assets_count = db.query(Asset).count()
    jobs = db.query(MaintenanceJob).all()
    windows_count = db.query(CorridorWindow).count()
    trains_count = db.query(TrainMovement).count()

    return {
        "sections_count": sections_count,
        "assets_count": assets_count,
        "windows_count": windows_count,
        "trains_count": trains_count,
        "jobs_summary": {
            "total": len(jobs),
            "by_department": {
                "ENGINEERING": sum(1 for j in jobs if j.department == "ENGINEERING"),
                "TRD": sum(1 for j in jobs if j.department == "TRD"),
                "S_AND_T": sum(1 for j in jobs if j.department == "S_AND_T"),
            },
            "statutory_count": sum(1 for j in jobs if j.statutory_deadline_minute is not None),
            "avg_priority": round(sum(j.priority_score for j in jobs) / max(1, len(jobs)), 3),
            "total_cost_of_waiting": round(sum(j.cost_of_waiting for j in jobs), 2),
        }
    }


@router.get("/jobs")
def get_jobs(
    department: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    """Retrieve maintenance work orders with optional filtering."""
    query = db.query(MaintenanceJob)
    if department:
        query = query.filter(MaintenanceJob.department == department.upper())
    if status_filter:
        query = query.filter(MaintenanceJob.status == status_filter.upper())
    jobs = query.all()

    return [
        {
            "id": j.id,
            "asset_id": j.asset_id,
            "section_id": j.section_id,
            "department": j.department,
            "job_type": j.job_type,
            "description": j.description,
            "duration_p50_min": j.duration_p50_min,
            "duration_p90_min": j.duration_p90_min,
            "priority_score": j.priority_score,
            "cost_of_waiting": j.cost_of_waiting,
            "safety_class": j.safety_class,
            "statutory_deadline_minute": j.statutory_deadline_minute,
            "status": j.status,
            "required_resources": j.required_resources,
        }
        for j in jobs
    ]


@router.get("/windows")
def get_corridor_windows(
    section_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    """Retrieve available corridor possession windows."""
    query = db.query(CorridorWindow)
    if section_id:
        query = query.filter(CorridorWindow.section_id == section_id)
    windows = query.limit(limit).all()
    return [
        {
            "id": w.id,
            "section_id": w.section_id,
            "start_minute": w.start_minute,
            "end_minute": w.end_minute,
            "duration_min": w.duration_min,
            "allowed_departments": w.allowed_departments,
            "traffic_impact_tier": w.traffic_impact_tier,
        }
        for w in windows
    ]
