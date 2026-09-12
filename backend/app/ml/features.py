import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
from datetime import datetime
from backend.app.models.railway import Asset, MaintenanceJob, Section


class FeatureExtractor:
    """Extracts tabular feature matrices from canonical railway models."""

    DEPT_MAP = {"ENGINEERING": 0, "TRD": 1, "S_AND_T": 2}
    SAFETY_MAP = {"STANDARD": 0, "ISOLATION_REQUIRED": 1, "INTERLOCKED": 2, "HEAVY_EQUIPMENT": 3}

    @classmethod
    def extract_features_from_entities(
        cls,
        assets: List[Asset],
        jobs: List[MaintenanceJob],
        sections: List[Section],
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Extracts X_priority (for risk/priority scoring) and X_duration (for duration estimation)."""
        assets_by_id = {a.id: a for a in assets}
        sections_by_id = {s.id: s for s in sections}

        records = []
        now = datetime.utcnow()

        for j in jobs:
            asset = assets_by_id.get(j.asset_id)
            section = sections_by_id.get(j.section_id)

            if not asset or not section:
                continue

            age_days = (now - asset.install_date).days if asset.install_date else 365
            days_since_maint = (now - asset.last_maintenance_date).days if asset.last_maintenance_date else 90

            records.append({
                "job_id": j.id,
                "asset_id": asset.id,
                "criticality": asset.criticality,
                "condition_score": asset.condition_score,
                "age_days": max(1, age_days),
                "days_since_last_maint": max(1, days_since_maint),
                "dept_code": cls.DEPT_MAP.get(j.department, 0),
                "safety_code": cls.SAFETY_MAP.get(j.safety_class, 0),
                "section_speed": section.max_speed_kmh,
                "section_length": section.length_km,
                "is_statutory": 1 if j.statutory_deadline_minute is not None else 0,
                # Ground-truth targets (with latent noise for training)
                "true_priority": j.priority_score,
                "true_duration_p50": j.duration_p50_min,
                "true_duration_p90": j.duration_p90_min,
            })

        df = pd.DataFrame(records)
        return df
