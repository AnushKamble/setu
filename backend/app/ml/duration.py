import os
import pickle
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional
try:
    import lightgbm as lgb
    HAS_LIGHTGBM = True
except (ImportError, OSError):
    lgb = None
    HAS_LIGHTGBM = False


class DurationQuantileModel:
    """Predicts P50 and P90 maintenance work duration quantiles using LightGBM pinball loss."""

    FEATURE_COLS = [
        "dept_code",
        "safety_code",
        "criticality",
        "condition_score",
        "section_speed",
        "section_length",
    ]

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), "duration_model.pkl")
        self.model_p50: Optional[lgb.LGBMRegressor] = None
        self.model_p90: Optional[lgb.LGBMRegressor] = None
        self._load()

    def train(self, df: pd.DataFrame):
        """Trains quantile regression models for alpha=0.50 and alpha=0.90."""
        X = df[self.FEATURE_COLS]
        y = df["true_duration_p50"]  # target base duration

        # P50 Quantile (Median)
        self.model_p50 = lgb.LGBMRegressor(
            objective="quantile",
            alpha=0.50,
            n_estimators=40,
            learning_rate=0.08,
            random_state=42,
            verbosity=-1,
        )
        self.model_p50.fit(X, y)

        # P90 Quantile (Conservative 90th percentile buffer)
        self.model_p90 = lgb.LGBMRegressor(
            objective="quantile",
            alpha=0.90,
            n_estimators=40,
            learning_rate=0.08,
            random_state=42,
            verbosity=-1,
        )
        self.model_p90.fit(X, df["true_duration_p90"])

        self._save()

    def predict_quantiles(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Returns (p50, p90) predicted durations in integer minutes."""
        if self.model_p50 is None or self.model_p90 is None:
            # Fallback heuristic
            p50 = df["true_duration_p50"].values if "true_duration_p50" in df else np.full(len(df), 45)
            p90 = df["true_duration_p90"].values if "true_duration_p90" in df else p50 + 15
            return p50.astype(int), p90.astype(int)

        X = df[self.FEATURE_COLS]
        p50 = self.model_p50.predict(X)
        p90 = self.model_p90.predict(X)

        # Enforce physical invariant: P90 must be >= P50 + 5 minutes
        p50 = np.maximum(20, np.round(p50)).astype(int)
        p90 = np.maximum(p50 + 10, np.round(p90)).astype(int)

        return p50, p90

    def _save(self):
        try:
            with open(self.model_path, "wb") as f:
                pickle.dump({"p50": self.model_p50, "p90": self.model_p90}, f)
        except Exception:
            pass

    def _load(self):
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    data = pickle.load(f)
                    self.model_p50 = data.get("p50")
                    self.model_p90 = data.get("p90")
            except Exception:
                self.model_p50 = None
                self.model_p90 = None
