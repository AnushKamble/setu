from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.ml.pipeline import MLPipeline

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

_PIPELINE = MLPipeline()


@router.post("/train", status_code=status.HTTP_200_OK)
def train_and_update_models(db: Session = Depends(get_db)):
    """Triggers ML training on current database assets/jobs and updates job scores."""
    result = _PIPELINE.train_and_update(db=db)
    return result


@router.get("/status")
def get_ml_status():
    """Returns training metrics and feature schema for LightGBM models."""
    return {
        "priority_model": {
            "type": "LightGBM Regressor",
            "features": _PIPELINE.priority_model.FEATURE_COLS,
            "metrics": _PIPELINE.priority_model.metrics,
            "is_trained": _PIPELINE.priority_model.model is not None,
        },
        "duration_model": {
            "type": "LightGBM Quantile Regressors (P50, P90)",
            "features": _PIPELINE.duration_model.FEATURE_COLS,
            "is_trained": _PIPELINE.duration_model.model_p50 is not None,
        },
        "hazard_model": {
            "type": "Cost-of-Waiting Parametric Hazard Model",
            "formula": "priority^1.6 * (1 + 0.25*criticality) * (days/7)^1.35 * 8.0",
        }
    }
