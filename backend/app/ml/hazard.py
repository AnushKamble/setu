import numpy as np
import pandas as pd


class CostOfWaitingModel:
    """Ordinal parametric hazard model estimating risk escalation per week of deferral."""

    @classmethod
    def compute_cost_of_waiting(
        cls,
        priority_score: float,
        criticality: int,
        deferral_days: int = 7,
    ) -> float:
        """Computes expected risk penalty for postponing maintenance by deferral_days."""
        # Non-linear hazard growth curve:
        # High-criticality assets compound risk faster when deferred
        base_rate = float(priority_score) ** 1.6
        crit_multiplier = 1.0 + (float(criticality) * 0.25)
        time_factor = (float(deferral_days) / 7.0) ** 1.35

        cost = base_rate * crit_multiplier * time_factor * 8.0
        return round(float(cost), 2)

    @classmethod
    def batch_compute(
        cls,
        df: pd.DataFrame,
        deferral_days: int = 7,
    ) -> np.ndarray:
        """Computes cost of waiting vector for a dataframe of jobs."""
        prio = df["priority_score"].values if "priority_score" in df else df["true_priority"].values
        crit = df["criticality"].values

        base = prio ** 1.6
        mult = 1.0 + (crit * 0.25)
        time_factor = (deferral_days / 7.0) ** 1.35
        costs = base * mult * time_factor * 8.0
        return np.round(costs, 2)
