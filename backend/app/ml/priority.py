import os
import pickle
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from sklearn.metrics import mean_absolute_error, mean_squared_error

try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

try:
    import lightgbm as lgb
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False


class PriorityModel:
    """Gradient-boosted decision tree ML model (XGBoost / LightGBM) for maintenance urgency and asset risk scoring."""

    FEATURE_COLS = [
        "criticality",
        "condition_score",
        "age_days",
        "days_since_last_maint",
        "dept_code",
        "safety_code",
        "section_speed",
        "section_length",
        "is_statutory",
    ]

    def __init__(self, model_path: Optional[str] = None, algorithm: str = "xgboost"):
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), "priority_model.pkl")
        self.algorithm = algorithm.lower()
        # Fallback if selected algorithm is not installed
        if self.algorithm == "xgboost" and not HAS_XGBOOST and HAS_LIGHTGBM:
            self.algorithm = "lightgbm"
        elif self.algorithm == "lightgbm" and not HAS_LIGHTGBM and HAS_XGBOOST:
            self.algorithm = "xgboost"

        self.model: Any = None
        self.metrics: Dict[str, Any] = {}
        self._load()

    def train(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Trains XGBoost or LightGBM model on extracted feature dataframe with 80/20 train/validation split."""
        if len(df) < 10:
            raise ValueError(f"Insufficient training samples ({len(df)}). Require >= 10.")

        X = df[self.FEATURE_COLS]
        y = df["true_priority"]

        # 80/20 train/validation split
        split_idx = int(len(df) * 0.8)
        X_train, X_val = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_val = y.iloc[:split_idx], y.iloc[split_idx:]

        if self.algorithm == "xgboost" and HAS_XGBOOST:
            self.model = xgb.XGBRegressor(
                n_estimators=60,
                learning_rate=0.08,
                max_depth=4,
                random_state=42,
                verbosity=0,
            )
        elif HAS_LIGHTGBM:
            self.model = lgb.LGBMRegressor(
                n_estimators=60,
                learning_rate=0.08,
                max_depth=4,
                num_leaves=15,
                random_state=42,
                verbosity=-1,
            )
        else:
            raise RuntimeError("Neither XGBoost nor LightGBM is available in the Python runtime.")

        self.model.fit(X_train, y_train)

        preds = self.model.predict(X_val)
        mae = float(mean_absolute_error(y_val, preds))
        rmse = float(np.sqrt(mean_squared_error(y_val, preds)))

        self.metrics = {
            "algorithm": self.algorithm.upper(),
            "val_mae": round(mae, 4),
            "val_rmse": round(rmse, 4),
            "samples_trained": len(X_train),
            "samples_validated": len(X_val),
        }

        self._save()
        return self.metrics

    def predict(self, df: pd.DataFrame) -> np.ndarray:
        """Predicts risk/priority score in [0.05, 0.99]. Falls back to heuristic if not trained."""
        if self.model is None:
            # Fallback heuristic: weighted combination of condition decay and criticality
            raw = (1.0 - df["condition_score"]) * 0.6 + (df["criticality"] / 5.0) * 0.4
            return np.clip(raw.values, 0.05, 0.99)

        X = df[self.FEATURE_COLS]
        preds = self.model.predict(X)
        return np.clip(np.round(preds, 3), 0.05, 0.99)

    def _save(self):
        try:
            with open(self.model_path, "wb") as f:
                pickle.dump({"model": self.model, "metrics": self.metrics}, f)
        except Exception:
            pass

    def _load(self):
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    data = pickle.load(f)
                    self.model = data.get("model")
                    self.metrics = data.get("metrics", {})
            except Exception:
                self.model = None
