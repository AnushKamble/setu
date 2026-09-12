from typing import Dict, Any
from sqlalchemy.orm import Session

from backend.app.models.railway import Asset, MaintenanceJob, Section
from backend.app.ml.features import FeatureExtractor
from backend.app.ml.priority import PriorityModel
from backend.app.ml.duration import DurationQuantileModel
from backend.app.ml.hazard import CostOfWaitingModel


class MLPipeline:
    """Orchestrates ML feature extraction, model training, and database job score updates."""

    def __init__(self):
        self.priority_model = PriorityModel()
        self.duration_model = DurationQuantileModel()

    def train_and_update(self, db: Session) -> Dict[str, Any]:
        """Extracts features, trains models, and updates all database jobs with ML predictions."""
        assets = db.query(Asset).all()
        jobs = db.query(MaintenanceJob).all()
        sections = db.query(Section).all()

        if not assets or not jobs:
            return {"status": "SKIPPED", "message": "No assets or jobs in database"}

        df = FeatureExtractor.extract_features_from_entities(assets, jobs, sections)

        # 1. Load or generate comprehensive 1,000-sample training corpus
        import os
        import pandas as pd
        from backend.app.datagen.generator import RailwayDataGenerator

        corpus_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "railway_training_corpus.csv"))
        if os.path.exists(corpus_path):
            corpus_df = pd.read_csv(corpus_path)
        else:
            gen = RailwayDataGenerator(seed=42)
            corpus_df = gen.generate_training_corpus(n_samples=1000, save_path=corpus_path)

        # Combine corpus with active database jobs for training
        train_df = pd.concat([corpus_df, df], ignore_index=True)

        # 2. Train models on 1000+ sample dataset
        priority_metrics = self.priority_model.train(train_df)
        self.duration_model.train(train_df)

        # 3. Score predictions for active database jobs
        predicted_priority = self.priority_model.predict(df)
        p50, p90 = self.duration_model.predict_quantiles(df)

        df["priority_score"] = predicted_priority
        cost_waiting = CostOfWaitingModel.batch_compute(df, deferral_days=7)

        # 4. Update database records
        job_map = {j.id: j for j in jobs}
        for idx, row in df.iterrows():
            j = job_map.get(row["job_id"])
            if j:
                j.priority_score = float(predicted_priority[idx])
                j.duration_p50_min = int(p50[idx])
                j.duration_p90_min = int(p90[idx])
                j.cost_of_waiting = float(cost_waiting[idx])

        db.commit()

        return {
            "status": "SUCCESS",
            "models_trained": ["LightGBM_Priority", "LightGBM_Duration_Quantile", "Hazard_CostOfWaiting"],
            "training_corpus_samples": len(train_df),
            "records_updated": len(df),
            "priority_metrics": priority_metrics,
            "mean_predicted_priority": round(float(predicted_priority.mean()), 3),
            "mean_p90_duration_min": round(float(p90.mean()), 1),
        }
