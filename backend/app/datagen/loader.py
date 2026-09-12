from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.app.database import reset_db, SessionLocal
from backend.app.datagen.scenarios import ScenarioManager
from backend.app.models.railway import (
    Section,
    Asset,
    MaintenanceJob,
    CorridorWindow,
    TrainMovement,
    DepartmentResource,
)


def seed_database(scenario_name: str = "NORMAL", seed: int = 42, db: Session = None) -> Dict[str, Any]:
    """Populates database with reproducible scenario entities.
    
    If db session is not provided, manages its own session lifecycle.
    """
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        # Clean existing records in reverse dependency order
        from backend.app.models.railway import PlanBlock, Plan
        db.query(PlanBlock).delete()
        db.query(Plan).delete()
        db.query(TrainMovement).delete()
        db.query(CorridorWindow).delete()
        db.query(MaintenanceJob).delete()
        db.query(Asset).delete()
        db.query(DepartmentResource).delete()
        db.query(Section).delete()
        db.flush()

        data = ScenarioManager.generate_scenario(scenario_name=scenario_name, seed=seed)

        # Batch insert entities in dependency order
        db.add_all(data["sections"])
        db.flush()

        db.add_all(data["resources"])
        db.add_all(data["assets"])
        db.flush()

        db.add_all(data["jobs"])
        db.add_all(data["windows"])
        db.add_all(data["trains"])
        db.commit()

        # Compute summary metrics for caller
        jobs = data["jobs"]
        summary = {
            "status": "SUCCESS",
            "scenario": scenario_name,
            "seed": seed,
            "counts": {
                "sections": len(data["sections"]),
                "assets": len(data["assets"]),
                "resources": len(data["resources"]),
                "maintenance_jobs_total": len(jobs),
                "maintenance_jobs_by_dept": {
                    "ENGINEERING": sum(1 for j in jobs if j.department == "ENGINEERING"),
                    "TRD": sum(1 for j in jobs if j.department == "TRD"),
                    "S_AND_T": sum(1 for j in jobs if j.department == "S_AND_T"),
                },
                "statutory_jobs_count": sum(1 for j in jobs if j.statutory_deadline_minute is not None),
                "corridor_windows": len(data["windows"]),
                "train_movements_total": len(data["trains"]),
                "freight_forecast_trains": sum(1 for t in data["trains"] if t.is_goods_forecast),
            }
        }
        return summary
    finally:
        if close_session:
            db.close()


if __name__ == "__main__":
    res = seed_database("NORMAL", 42)
    print("Database seeded successfully:")
    print(res)
