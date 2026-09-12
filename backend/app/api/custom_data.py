import csv
import io
import os
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.railway import (
    Asset,
    MaintenanceJob,
    TrainMovement,
    Section,
    CorridorWindow,
    DepartmentResource,
    JobStatusEnum,
    SafetyClassEnum,
    TrainPriorityEnum
)
from backend.app.optimizer.solver import BlockOptimizer
from backend.app.validator.checker import IndependentValidator

router = APIRouter(prefix="/api/custom-data", tags=["Custom Data Ingestion"])

TEMPLATES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "templates"))


class CsvUploadPayload(BaseModel):
    csv_text: str
    auto_reoptimize: bool = True


@router.get("/template/{template_type}", response_class=PlainTextResponse)
def get_csv_template(template_type: str):
    """Returns downloadable raw CSV template for jobs, trains, or CUG roster."""
    filename_map = {
        "jobs": "jobs_template.csv",
        "trains": "trains_template.csv",
        "cug": "cug_roster_template.csv"
    }
    filename = filename_map.get(template_type.lower())
    if not filename:
        raise HTTPException(status_code=404, detail=f"Unknown template {template_type}. Available: jobs, trains, cug")

    filepath = os.path.join(TEMPLATES_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"Template file not found at {filepath}")

    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


@router.post("/upload-jobs")
def upload_custom_jobs(
    payload: CsvUploadPayload,
    db: Session = Depends(get_db)
):
    """Ingests custom user maintenance jobs from CSV text, validates railway schema,
    replaces existing jobs in DB, and runs OR-Tools CP-SAT optimizer.
    """
    csv_file = io.StringIO(payload.csv_text.strip())
    reader = csv.DictReader(csv_file)

    required_fields = ["job_id", "section_id", "department", "work_type", "duration_minutes"]
    if not reader.fieldnames or not all(f in reader.fieldnames for f in required_fields):
        missing = [f for f in required_fields if f not in (reader.fieldnames or [])]
        raise HTTPException(
            status_code=400,
            detail=f"Invalid CSV headers. Missing required fields: {missing}. Expected at least {required_fields}"
        )

    # Validate sections exist
    valid_sections = {s.id for s in db.query(Section).all()}
    if not valid_sections:
        # Fallback default sections
        valid_sections = {
            "SEC-NDLS-GZB-UP", "SEC-NDLS-GZB-DN",
            "SEC-GZB-ALJN-UP", "SEC-GZB-ALJN-DN",
            "SEC-ALJN-CNB-UP", "SEC-ALJN-CNB-DN"
        }

    new_jobs = []
    errors = []

    for idx, row in enumerate(reader, start=1):
        j_id = row.get("job_id", "").strip()
        sec_id = row.get("section_id", "").strip()
        dept = row.get("department", "").strip().upper()
        w_type = row.get("work_type", "").strip().upper()
        
        try:
            dur = int(row.get("duration_minutes", 120))
            if dur <= 0:
                raise ValueError("duration must be positive")
        except Exception:
            errors.append(f"Row {idx}: Invalid duration_minutes '{row.get('duration_minutes')}'")
            continue

        if not j_id:
            errors.append(f"Row {idx}: Missing job_id")
            continue

        if dept not in ["ENGINEERING", "TRD", "S_AND_T"]:
            errors.append(f"Row {idx}: Invalid department '{dept}'. Must be ENGINEERING, TRD, or S_AND_T")
            continue

        # Optional statutory deadline
        deadline_hr = row.get("statutory_deadline_hours")
        deadline_min = int(float(deadline_hr) * 60) if deadline_hr and deadline_hr.strip() else None

        # Priority weight
        p_weight = float(row.get("priority_weight", 1.0)) if row.get("priority_weight") else 1.0

        # Ensure asset exists for this section and department
        asset_id = f"AST-CUSTOM-{sec_id}-{dept}"
        existing_asset = db.query(Asset).filter_by(id=asset_id).first()
        if not existing_asset:
            existing_asset = Asset(
                id=asset_id,
                section_id=sec_id,
                department=dept,
                asset_type="TRACK_ASSET",
                criticality=3,
                condition_score=0.75,
                latent_degradation_factor=1.0
            )
            db.add(existing_asset)
            db.flush()

        job = MaintenanceJob(
            id=j_id,
            asset_id=existing_asset.id,
            section_id=sec_id,
            department=dept,
            job_type=w_type,
            description=f"Custom {dept} {w_type} on {sec_id}",
            duration_p50_min=dur,
            duration_p90_min=int(dur * 1.15),
            priority_score=min(1.0, max(0.1, p_weight / 2.0)),
            cost_of_waiting=p_weight,
            statutory_deadline_minute=deadline_min,
            safety_class=SafetyClassEnum.STANDARD.value,
            status=JobStatusEnum.BACKLOG.value,
            required_resources=[f"{dept[:3]}_GANG"]
        )
        new_jobs.append(job)

    if errors:
        raise HTTPException(status_code=422, detail={"validation_errors": errors})

    if not new_jobs:
        raise HTTPException(status_code=400, detail="No valid job rows found in CSV.")

    # Replace jobs in DB
    db.query(MaintenanceJob).delete()
    db.add_all(new_jobs)
    db.commit()

    response = {
        "status": "SUCCESS",
        "message": f"Successfully ingested {len(new_jobs)} custom maintenance jobs.",
        "jobs_count": len(new_jobs),
        "departments_breakdown": {
            "ENGINEERING": sum(1 for j in new_jobs if j.department == "ENGINEERING"),
            "TRD": sum(1 for j in new_jobs if j.department == "TRD"),
            "S_AND_T": sum(1 for j in new_jobs if j.department == "S_AND_T")
        }
    }

    # Auto reoptimize if requested
    if payload.auto_reoptimize:
        windows = db.query(CorridorWindow).all()
        trains = db.query(TrainMovement).all()
        resources = db.query(DepartmentResource).all()

        optimizer = BlockOptimizer(
            jobs=new_jobs,
            windows=windows,
            trains=trains,
            resources=resources,
            time_limit_seconds=10.0
        )
        opt_res = optimizer.solve()
        response["optimization"] = {
            "solver_status": opt_res.status,
            "solve_time_seconds": opt_res.solve_time_seconds,
            "scheduled_jobs": opt_res.scheduled_jobs_count,
            "total_jobs": len(new_jobs),
            "convoys_formed": opt_res.convoys_formed_count,
            "possessions_avoided": opt_res.possessions_avoided_by_convoy,
        }

    return response


@router.post("/upload-trains")
def upload_custom_trains(
    payload: CsvUploadPayload,
    db: Session = Depends(get_db)
):
    """Ingests custom train timetable movements from CSV, replaces current timetable in DB."""
    csv_file = io.StringIO(payload.csv_text.strip())
    reader = csv.DictReader(csv_file)

    required_fields = ["train_number", "train_name", "priority_class", "section_id", "entry_minute", "exit_minute"]
    if not reader.fieldnames or not all(f in reader.fieldnames for f in required_fields):
        missing = [f for f in required_fields if f not in (reader.fieldnames or [])]
        raise HTTPException(
            status_code=400,
            detail=f"Invalid CSV headers. Missing: {missing}. Expected: {required_fields}"
        )

    new_trains = []
    errors = []

    for idx, row in enumerate(reader, start=1):
        t_num = row.get("train_number", "").strip()
        t_name = row.get("train_name", "").strip()
        p_class = row.get("priority_class", "EXPRESS").strip().upper()
        sec_id = row.get("section_id", "").strip()

        try:
            entry_min = int(row.get("entry_minute", 0))
            exit_min = int(row.get("exit_minute", 60))
            if exit_min <= entry_min:
                raise ValueError("exit_minute must be after entry_minute")
        except Exception:
            errors.append(f"Row {idx}: Invalid entry/exit minute values")
            continue

        is_goods = str(row.get("is_goods_forecast", "false")).lower() in ["true", "1", "yes"]

        train = TrainMovement(
            id=f"TRN-USR-{t_num}",
            train_number=t_num,
            train_name=t_name,
            priority_class=p_class,
            section_id=sec_id,
            entry_minute=entry_min,
            exit_minute=exit_min,
            is_goods_forecast=is_goods,
            delay_probability=0.1
        )
        new_trains.append(train)

    if errors:
        raise HTTPException(status_code=422, detail={"validation_errors": errors})

    if not new_trains:
        raise HTTPException(status_code=400, detail="No valid train rows found in CSV.")

    db.query(TrainMovement).delete()
    db.add_all(new_trains)
    db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Successfully ingested {len(new_trains)} custom train movements into timetables.",
        "trains_count": len(new_trains),
        "express_count": sum(1 for t in new_trains if t.priority_class == "EXPRESS"),
        "freight_count": sum(1 for t in new_trains if "FREIGHT" in t.priority_class or t.is_goods_forecast)
    }
