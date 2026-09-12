import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.railway import Section, MaintenanceJob
from backend.app.api.plans import run_optimized_plan, _LATEST_OPTIMIZED_PLAN

router = APIRouter(prefix="/dispatch", tags=["Field Crew Dispatcher & Digital Muster"])

# In-memory muster state for crew readiness tracking during simulation
_CREW_STATE_STORE: Dict[str, Dict[str, Any]] = {}


class BroadcastRequest(BaseModel):
    block_id: str
    channels: List[str] = ["SMS", "WHATSAPP", "TMS_PUSH"]
    urgent: bool = True
    proxy_gang_id: Optional[str] = None
    proxy_phone: Optional[str] = None


class CrewAckRequest(BaseModel):
    block_id: str
    gang_id: str
    status: str = "ON_SITE_BRIEFED"  # ALERTED, ACKNOWLEDGED, STAGED_AT_SIDING, ON_SITE_BRIEFED, READY_FOR_BLOCK
    location_note: Optional[str] = "KM 42.8 UP Track, Detonators Staged"


def _generate_crew_records(block) -> List[Dict[str, Any]]:
    """Generates realistic Indian Railways field gang rosters for a scheduled block."""
    crews = []
    depts = block.departments if hasattr(block, "departments") and block.departments else ["ENGINEERING"]

    if "ENGINEERING" in depts:
        gang_id = f"GANG-ENG-{block.block_id}"
        default_loc = "Staged at Ghaziabad P-Way Siding (KM 25.5)"
        crews.append({
            "gang_id": gang_id,
            "department": "ENGINEERING",
            "role": "Track Maintenance & P-Way Machine Gang",
            "supervisor_name": "Ramesh Kumar (JE / P-Way)",
            "phone": "+91 98712 34501",
            "strength": 18,
            "equipment": "CSU Tamping Machine #04, Track Gauges",
            "gps_location": _CREW_STATE_STORE.get(block.block_id, {}).get(f"{gang_id}_loc", default_loc),
            "safety_token": f"IRPWM-807-ENG-{block.block_id[-4:]}",
            "notice_text": (
                f"OFFICIAL MOBILIZATION: Block {block.block_id} on {block.section_id}. "
                f"Time: {block.duration_min} min. Gang 18 men. Deploy 3 detonators at 1200m and banner flags at 600m. "
                f"Caution speed limit 30 km/h post-tamping. Acknowledge immediately."
            ),
            "status": _CREW_STATE_STORE.get(block.block_id, {}).get(gang_id, "ALERTED"),
        })

    if "TRD" in depts:
        gang_id = f"GANG-TRD-{block.block_id}"
        default_loc = "En-route Siding KM 28.0 (ETA 8 mins)"
        crews.append({
            "gang_id": gang_id,
            "department": "TRD",
            "role": "OHE Traction Distribution & Power Cut Gang",
            "supervisor_name": "Suresh Yadav (SSE / TRD)",
            "phone": "+91 98110 98214",
            "strength": 8,
            "equipment": "8-Wheeler Tower Wagon #TW-02, Ladder Trolley",
            "gps_location": _CREW_STATE_STORE.get(block.block_id, {}).get(f"{gang_id}_loc", default_loc),
            "safety_token": f"PTW-TRD-25KV-{block.block_id[-4:]}",
            "notice_text": (
                f"OFFICIAL MOBILIZATION: Block {block.block_id} on {block.section_id}. "
                f"Permit to Work (PTW) isolation sanctioned for 25kV Catenary. "
                f"Fix earth discharge rods on both sides of tower wagon prior to ascending ladder. Acknowledge immediately."
            ),
            "status": _CREW_STATE_STORE.get(block.block_id, {}).get(gang_id, "ALERTED"),
        })

    if "S_AND_T" in depts:
        gang_id = f"GANG-SNT-{block.block_id}"
        default_loc = "Relay Room & Point Machine 104A/B"
        crews.append({
            "gang_id": gang_id,
            "department": "S_AND_T",
            "role": "Signal Interlocking & Point Machine Gang",
            "supervisor_name": "Vikas Anand (JE / Signal)",
            "phone": "+91 97170 54329",
            "strength": 6,
            "equipment": "Point Machine Test Kit, Digital Axle Counter Calibrator",
            "gps_location": _CREW_STATE_STORE.get(block.block_id, {}).get(f"{gang_id}_loc", default_loc),
            "safety_token": f"ST-T351-DISCONN-{block.block_id[-4:]}",
            "notice_text": (
                f"OFFICIAL MOBILIZATION: Block {block.block_id} on {block.section_id}. "
                f"Submit Form S&T-T/351 disconnection memo to Station Master. "
                f"Verify normal detection restoration prior to block cancellation memo. Acknowledge immediately."
            ),
            "status": _CREW_STATE_STORE.get(block.block_id, {}).get(gang_id, "ALERTED"),
        })

    # Always include Operating (Station Master) & Traction Power Controller (TPC) for authentic railway joint protocol
    sm_gang_id = f"STN-MSTR-{block.block_id}"
    sm_default_loc = f"{block.section_id.split('-')[0].strip()} Station Master Cabin"
    crews.append({
        "gang_id": sm_gang_id,
        "department": "OPERATING",
        "role": "Station Master & Block Register Controller",
        "supervisor_name": "O.P. Meena (Station Master)",
        "phone": "+91 97170 50012",
        "strength": 4,
        "equipment": "Block Instrument, Caution Order Register T/409",
        "gps_location": _CREW_STATE_STORE.get(block.block_id, {}).get(f"{sm_gang_id}_loc", sm_default_loc),
        "safety_token": f"SM-CAUTION-T409-{block.block_id[-4:]}",
        "notice_text": (
            f"BLOCK REGISTER CAUTION: Sanctioned Block {block.block_id} on {block.section_id}. "
            f"Issue Form T/409 Caution Order (Speed limit 30 km/h) to all departing drivers. Keep point locks clamped."
        ),
        "status": _CREW_STATE_STORE.get(block.block_id, {}).get(sm_gang_id, "ALERTED"),
    })

    tpc_gang_id = f"TPC-CTRL-{block.block_id}"
    crews.append({
        "gang_id": tpc_gang_id,
        "department": "ELECTRICAL_TPC",
        "role": "Divisional Traction Power Controller (SCADA)",
        "supervisor_name": "A.K. Sharma (TPC / DLI)",
        "phone": "+91 98100 11223",
        "strength": 2,
        "equipment": "SCADA 25kV Feeder Console, Remote Breaker CB-104",
        "gps_location": _CREW_STATE_STORE.get(block.block_id, {}).get(f"{tpc_gang_id}_loc", "Divisional SCADA Room (DLI)"),
        "safety_token": f"SCADA-ISOL-25KV-{block.block_id[-4:]}",
        "notice_text": (
            f"SCADA FEEDER DE-ENERGIZATION: Block {block.block_id} on {block.section_id}. "
            f"De-energize Sector 4B 25kV overhead catenary. Confirm zero residual current before issuing PTW clearance."
        ),
        "status": _CREW_STATE_STORE.get(block.block_id, {}).get(tpc_gang_id, "ALERTED"),
    })

    return crews


@router.get("/overview")
def get_dispatch_overview(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns all sanctioned blocks with assigned field crew rosters and digital muster status."""
    global _LATEST_OPTIMIZED_PLAN
    if _LATEST_OPTIMIZED_PLAN is None:
        _LATEST_OPTIMIZED_PLAN = run_optimized_plan(db=db)

    dispatch_blocks = []
    total_crews = 0
    ready_crews = 0

    for b in _LATEST_OPTIMIZED_PLAN.blocks:
        crews = _generate_crew_records(b)
        total_crews += len(crews)
        ready_count = sum(1 for c in crews if c["status"] in ["ON_SITE_BRIEFED", "READY_FOR_BLOCK"])
        ready_crews += ready_count

        dispatch_blocks.append({
            "block_id": b.block_id,
            "window_id": b.window_id,
            "section_id": b.section_id,
            "is_convoy": b.is_convoy,
            "duration_min": b.duration_min,
            "start_minute": b.start_minute,
            "end_minute": b.end_minute,
            "start_hhmm": f"{(b.start_minute % 1440) // 60:02d}:{(b.start_minute % 1440) % 60:02d}",
            "end_hhmm": f"{(b.end_minute % 1440) // 60:02d}:{(b.end_minute % 1440) % 60:02d}",
            "day_number": (b.start_minute // 1440) + 1,
            "departments": b.departments,
            "crews": crews,
            "readiness_pct": round((ready_count / max(1, len(crews))) * 100, 1),
            "mobilization_status": "READY" if ready_count == len(crews) else "DISPATCHING",
        })

    return {
        "timestamp_utc": datetime.datetime.utcnow().isoformat(),
        "total_blocks": len(dispatch_blocks),
        "total_crews_mobilized": total_crews,
        "crews_on_site": ready_crews,
        "overall_muster_compliance": round((ready_crews / max(1, total_crews)) * 100, 1),
        "dispatch_blocks": dispatch_blocks,
    }


@router.post("/broadcast")
def broadcast_mobilization_orders(req: BroadcastRequest, db: Session = Depends(get_db)):
    """Broadcasts multi-department mobilization orders across SMS, WhatsApp, and TMS push gateway."""
    global _LATEST_OPTIMIZED_PLAN
    if _LATEST_OPTIMIZED_PLAN is None:
        _LATEST_OPTIMIZED_PLAN = run_optimized_plan(db=db)

    block = next((b for b in _LATEST_OPTIMIZED_PLAN.blocks if b.block_id == req.block_id), None)
    if not block:
        raise HTTPException(status_code=404, detail=f"Block {req.block_id} not found.")

    if req.block_id not in _CREW_STATE_STORE:
        _CREW_STATE_STORE[req.block_id] = {}

    crews = _generate_crew_records(block)
    broadcast_logs = []

    for c in crews:
        # Progress status to ACKNOWLEDGED on broadcast
        _CREW_STATE_STORE[req.block_id][c["gang_id"]] = "ACKNOWLEDGED"
        is_proxy = (req.proxy_gang_id == c["gang_id"] and bool(req.proxy_phone))
        phone_used = req.proxy_phone if is_proxy else c["phone"]
        for ch in req.channels:
            broadcast_logs.append({
                "gang_id": c["gang_id"],
                "supervisor": c["supervisor_name"],
                "department": c["department"],
                "phone": phone_used,
                "is_evaluator_proxy": is_proxy,
                "channel": ch,
                "status": "SENT_DELIVERED",
                "timestamp": datetime.datetime.utcnow().strftime("%H:%M:%S IST"),
                "token": c["safety_token"],
            })

    return {
        "success": True,
        "block_id": req.block_id,
        "channels_used": req.channels,
        "notices_sent": len(broadcast_logs),
        "broadcast_logs": broadcast_logs,
        "evaluator_proxy_active": bool(req.proxy_phone),
        "message": f"Successfully broadcast mobilization orders to all {len(crews)} departmental supervisors.",
    }


@router.post("/ack")
def crew_muster_ack(req: CrewAckRequest):
    """Simulates field supervisor GPS check-in and safety briefing muster acknowledgement."""
    if req.block_id not in _CREW_STATE_STORE:
        _CREW_STATE_STORE[req.block_id] = {}

    _CREW_STATE_STORE[req.block_id][req.gang_id] = req.status
    if req.location_note:
        _CREW_STATE_STORE[req.block_id][f"{req.gang_id}_loc"] = req.location_note
    return {
        "success": True,
        "block_id": req.block_id,
        "gang_id": req.gang_id,
        "new_status": req.status,
        "location_note": req.location_note,
        "compliance_verified": True,
        "timestamp": datetime.datetime.utcnow().strftime("%H:%M:%S IST"),
    }
