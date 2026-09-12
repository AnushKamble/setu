from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from backend.app.models.railway import MaintenanceJob, CorridorWindow
from backend.app.optimizer.compatibility import is_safety_compatible


class CandidateOpportunity(BaseModel):
    opportunity_id: str
    section_id: str
    departments: List[str]
    job_ids: List[str]
    job_types: List[str]
    candidate_window_ids: List[str]
    combined_duration_p90_min: int
    possessions_saved: int
    compatibility_reasons: List[str]
    synergy_score: float  # Normalized score based on combined priority and possession reduction


class OpportunityMinerResult(BaseModel):
    total_opportunities_found: int
    sections_analyzed: int
    potential_possessions_saved: int
    opportunities: List[CandidateOpportunity]


class MaintenanceOpportunityMiner:
    """Discovers spatial, temporal, and safety-compatible multi-department maintenance bundles."""

    @classmethod
    def mine_opportunities(
        cls,
        jobs: List[MaintenanceJob],
        windows: List[CorridorWindow],
    ) -> OpportunityMinerResult:
        jobs_by_section: Dict[str, List[MaintenanceJob]] = {}
        for j in jobs:
            jobs_by_section.setdefault(j.section_id, []).append(j)

        windows_by_section: Dict[str, List[CorridorWindow]] = {}
        for w in windows:
            windows_by_section.setdefault(w.section_id, []).append(w)

        opportunities: List[CandidateOpportunity] = []
        opp_counter = 1
        total_saved = 0

        for sec_id, sec_jobs in jobs_by_section.items():
            sec_windows = windows_by_section.get(sec_id, [])
            if len(sec_jobs) < 2 or not sec_windows:
                continue

            # Separate jobs by department
            depts = {j.department for j in sec_jobs}
            if len(depts) < 2:
                # Need at least 2 distinct departments to form a multi-department convoy
                continue

            # Find cross-department pairs or triplets that are mutually compatible
            for i, j1 in enumerate(sec_jobs):
                for j2 in sec_jobs[i + 1 :]:
                    if j1.department == j2.department:
                        continue

                    if not is_safety_compatible(j1, j2):
                        continue

                    combined_dur = j1.duration_p90_min + j2.duration_p90_min

                    # Check for compatible corridor windows with sufficient capacity
                    matching_windows = [
                        w.id for w in sec_windows
                        if w.duration_min >= combined_dur and
                        (not w.allowed_departments or (j1.department in w.allowed_departments and j2.department in w.allowed_departments))
                    ]

                    if not matching_windows:
                        continue

                    reasons = []
                    if "TRD" in (j1.department, j2.department):
                        reasons.append("TRD OHE isolation block synergizes with ground-level track/signal inspection.")
                    if "S_AND_T" in (j1.department, j2.department):
                        reasons.append("Signal/point maintenance aligned with track possession.")

                    synergy = round((j1.priority_score + j2.priority_score) * 0.5 + 0.3, 3)

                    opp = CandidateOpportunity(
                        opportunity_id=f"OPP-{sec_id[:10]}-{opp_counter:03d}",
                        section_id=sec_id,
                        departments=list({j1.department, j2.department}),
                        job_ids=[j1.id, j2.id],
                        job_types=[j1.job_type, j2.job_type],
                        candidate_window_ids=matching_windows[:3],  # top 3 candidate slots
                        combined_duration_p90_min=combined_dur,
                        possessions_saved=1,
                        compatibility_reasons=reasons,
                        synergy_score=synergy,
                    )
                    opportunities.append(opp)
                    opp_counter += 1
                    total_saved += 1

        # Sort opportunities by synergy score descending
        opportunities.sort(key=lambda o: o.synergy_score, reverse=True)

        return OpportunityMinerResult(
            total_opportunities_found=len(opportunities),
            sections_analyzed=len(jobs_by_section),
            potential_possessions_saved=total_saved,
            opportunities=opportunities,
        )
