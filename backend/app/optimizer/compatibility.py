from typing import Dict, Tuple
from backend.app.models.railway import MaintenanceJob, SafetyClassEnum


def is_safety_compatible(job_a: MaintenanceJob, job_b: MaintenanceJob) -> bool:
    """Evaluates domain safety rules between two maintenance jobs on the same corridor section.
    
    Returns True if jobs can co-occur in the same possession window (Convoy).
    Returns False if operational safety requires separation.
    """
    # Identical jobs cannot be paired with themselves
    if job_a.id == job_b.id:
        return False

    # Jobs must target the same section to be candidates for convoying
    if job_a.section_id != job_b.section_id:
        return False

    # Heavy equipment restrictions: e.g. Tamping Machine requires track exclusivity
    if (job_a.safety_class == SafetyClassEnum.HEAVY_EQUIPMENT.value and 
        job_b.safety_class == SafetyClassEnum.HEAVY_EQUIPMENT.value):
        return False

    # Power Block Isolation rules:
    # If TRD job requires electrical isolation, Engineering or S&T jobs can safely 
    # work under dead OHE wire, which is a prime convoy synergy!
    if job_a.department == "TRD" and job_a.safety_class == SafetyClassEnum.ISOLATION_REQUIRED.value:
        if job_b.department in ("ENGINEERING", "S_AND_T"):
            return True

    if job_b.department == "TRD" and job_b.safety_class == SafetyClassEnum.ISOLATION_REQUIRED.value:
        if job_a.department in ("ENGINEERING", "S_AND_T"):
            return True

    # S&T Interlocked work (e.g. Point Machine, Track Circuit):
    # Highly synergetic with Engineering turnout and track maintenance
    if job_a.department == "S_AND_T" and job_b.department == "ENGINEERING":
        return True
    if job_b.department == "S_AND_T" and job_a.department == "ENGINEERING":
        return True

    # Same department jobs: Safe if they don't both require exclusive heavy equipment
    if job_a.department == job_b.department:
        if (job_a.safety_class == SafetyClassEnum.HEAVY_EQUIPMENT.value or 
            job_b.safety_class == SafetyClassEnum.HEAVY_EQUIPMENT.value):
            return False
        return True

    # Default permissive for standard non-conflicting maintenance
    return True
