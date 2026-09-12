from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from ortools.sat.python import cp_model

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.schemas.health import HealthResponse

router = APIRouter(prefix="", tags=["Health"])


@router.get("/health", response_model=HealthResponse, status_code=status.HTTP_200_OK)
def get_health(db: Session = Depends(get_db)):
    """Comprehensive health check endpoint verifying DB, Solver, and Core Services."""
    db_connected = False
    db_error = None
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception as e:
        db_error = str(e)

    solver_ready = False
    solver_error = None
    try:
        model = cp_model.CpModel()
        _ = model.NewBoolVar("probe_var")
        solver_ready = True
    except Exception as e:
        solver_error = str(e)

    overall_status = "healthy" if db_connected else "degraded"

    return HealthResponse(
        status=overall_status,
        app_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database_connected=db_connected,
        solver_ready=solver_ready,
        details={
            "database_error": db_error,
            "solver_error": solver_error,
            "solver_engine": "OR-Tools CP-SAT"
        }
    )
