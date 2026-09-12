from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.railway import TrainMovement, Section

router = APIRouter(prefix="/trains", tags=["Train Timetable & Dynamic Movements"])


@router.get("")
def get_corridor_train_timetable(
    day: int = Query(default=1, ge=1, le=7),
    section_id: Optional[str] = Query(default=None),
    priority_class: Optional[str] = Query(default=None),
    delayed_only: bool = Query(default=False),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Returns complete corridor train timetable for a given horizon day with real-time delay states."""
    day_start_m = (day - 1) * 1440
    day_end_m = day * 1440

    query = db.query(TrainMovement).filter(
        TrainMovement.entry_minute < day_end_m,
        TrainMovement.exit_minute > day_start_m,
    )

    if section_id and section_id != "ALL":
        query = query.filter(TrainMovement.section_id == section_id)

    if priority_class and priority_class != "ALL":
        query = query.filter(TrainMovement.priority_class == priority_class)

    all_trains = query.order_by(TrainMovement.entry_minute.asc()).all()

    sections = {s.id: s.name for s in db.query(Section).all()}

    train_list = []
    total_delay = 0
    max_delay = 0
    delayed_count = 0
    knocked_on_count = 0

    for t in all_trains:
        d_min = t.delay_minutes or 0
        stat = t.status or ("DELAYED" if d_min > 0 else "ON_TIME")
        if d_min > 0:
            total_delay += d_min
            max_delay = max(max_delay, d_min)
            if stat == "KNOCKED_ON":
                knocked_on_count += 1
            else:
                delayed_count += 1

        if delayed_only and d_min <= 0:
            continue

        entry_rel = max(0, min(1440, t.entry_minute - day_start_m))
        exit_rel = max(0, min(1440, t.exit_minute - day_start_m))

        orig_entry_rel = max(0, min(1440, (t.original_entry_minute or t.entry_minute) - day_start_m))
        orig_exit_rel = max(0, min(1440, (t.original_exit_minute or t.exit_minute) - day_start_m))

        train_list.append({
            "id": t.id,
            "train_number": t.train_number,
            "train_name": t.train_name,
            "priority_class": t.priority_class,
            "section_id": t.section_id,
            "section_name": sections.get(t.section_id, t.section_id),
            "day": day,
            "entry_minute": t.entry_minute,
            "exit_minute": t.exit_minute,
            "entry_hhmm": f"{entry_rel // 60:02d}:{entry_rel % 60:02d}",
            "exit_hhmm": f"{exit_rel // 60:02d}:{exit_rel % 60:02d}",
            "original_entry_hhmm": f"{orig_entry_rel // 60:02d}:{orig_entry_rel % 60:02d}",
            "original_exit_hhmm": f"{orig_exit_rel // 60:02d}:{orig_exit_rel % 60:02d}",
            "delay_minutes": d_min,
            "status": stat,
            "is_goods_forecast": t.is_goods_forecast,
        })

    return {
        "day": day,
        "summary": {
            "total_trains": len(all_trains),
            "filtered_count": len(train_list),
            "on_time_count": len(all_trains) - delayed_count - knocked_on_count,
            "delayed_count": delayed_count,
            "knocked_on_count": knocked_on_count,
            "total_network_delay_minutes": total_delay,
            "max_single_delay_minutes": max_delay,
            "is_corridor_disrupted": (delayed_count + knocked_on_count) > 0,
        },
        "trains": train_list
    }
