from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from backend.app.models.railway import (
    Section,
    Asset,
    MaintenanceJob,
    CorridorWindow,
    TrainMovement,
    JobStatusEnum,
)


class SimulationEvent(BaseModel):
    event_id: str
    event_type: str  # TRAIN_DELAY, BLOCK_CANCELLATION, DURATION_OVERRUN, EMERGENCY_DEFECT
    target_id: str
    section_id: str
    delay_or_magnitude_minutes: int
    timestamp_minute: int
    description: str


class PropagationHop(BaseModel):
    hop_level: int
    section_id: str
    section_name: str
    propagated_delay_minutes: int
    buffer_absorption_minutes: int
    overlapping_windows: List[str] = Field(default_factory=list)


class NetworkImpactEstimate(BaseModel):
    event_id: str
    primary_section_id: str
    direct_delay_minutes: int
    adjacent_sections_affected: List[str]
    secondary_delay_minutes: int
    total_network_delay_minutes: int
    trains_knocked_on: List[str]
    affected_blocks: List[str]
    replan_recommended: bool
    cascade_chain: List[Dict[str, Any]] = Field(default_factory=list)
    max_hops: int = 1


class DigitalTwinState:
    """State graph simulation layer maintaining dynamic railway entities and event transitions."""

    def __init__(
        self,
        sections: List[Section],
        assets: List[Asset],
        jobs: List[MaintenanceJob],
        windows: List[CorridorWindow],
        trains: List[TrainMovement],
        current_minute: int = 0,
    ):
        self.sections = {s.id: s for s in sections}
        self.assets = {a.id: a for a in assets}
        self.jobs = {j.id: j for j in jobs}
        self.windows = {w.id: w for w in windows}
        self.trains = {t.id: t for t in trains}
        self.current_minute = current_minute
        self.event_log: List[SimulationEvent] = []

    def inject_train_delay(self, train_id: str, delay_minutes: int) -> NetworkImpactEstimate:
        """Injects train delay and models multi-hop downstream network delay propagation across corridor sections."""
        train = self.trains.get(train_id)
        if not train:
            raise ValueError(f"Train {train_id} not found in Digital Twin state.")

        event = SimulationEvent(
            event_id=f"EVT-DLY-{len(self.event_log)+1:03d}",
            event_type="TRAIN_DELAY",
            target_id=train.id,
            section_id=train.section_id,
            delay_or_magnitude_minutes=delay_minutes,
            timestamp_minute=self.current_minute,
            description=f"Train {train.train_number} delayed by {delay_minutes} mins entering {train.section_id}",
        )
        self.event_log.append(event)

        # Update train entry/exit times
        train.entry_minute += delay_minutes
        train.exit_minute += delay_minutes

        # Multi-Hop downstream network impact analysis across corridor graph
        affected_sections_list: List[str] = []
        cascade_chain: List[Dict[str, Any]] = []
        visited = {train.section_id}
        current_frontier = [(train.section_id, delay_minutes, 0)]
        cumulative_secondary = 0
        max_hop_reached = 0

        # Primary section maintenance blocks affected
        affected_blocks: List[str] = []
        for w in self.windows.values():
            if w.section_id == train.section_id:
                if max(w.start_minute, train.entry_minute) < min(w.end_minute, train.exit_minute):
                    affected_blocks.append(w.id)

        # Knocked-on trains on primary section
        knocked_on_trains: List[str] = []
        for other_t in self.trains.values():
            if other_t.id != train.id:
                if other_t.section_id == train.section_id:
                    if train.entry_minute <= other_t.entry_minute <= train.exit_minute + 15:
                        knocked_on_trains.append(other_t.train_number)

        # Multi-hop propagation loop (traverses adjacent sections with damping factor 0.65 and slack absorption)
        hop = 1
        while current_frontier:
            next_frontier = []
            for curr_sec_id, curr_delay, current_hop in current_frontier:
                curr_sec = self.sections.get(curr_sec_id)
                if not curr_sec or not curr_sec.adjacent_section_ids:
                    continue

                for adj_id in curr_sec.adjacent_section_ids:
                    if adj_id in visited:
                        continue
                    visited.add(adj_id)
                    adj_sec = self.sections.get(adj_id)

                    # Dynamic damping: 65% delay carried forward, 35% absorbed by engineering recovery margins
                    damping_factor = 0.65
                    propagated_delay = int(curr_delay * damping_factor)
                    absorbed_slack = curr_delay - propagated_delay

                    if propagated_delay >= 5:  # Minimum perceptible operational delay threshold
                        max_hop_reached = max(max_hop_reached, hop)
                        cumulative_secondary += propagated_delay
                        affected_sections_list.append(adj_id)

                        # Check window conflicts on this downstream section
                        downstream_windows = []
                        for w in self.windows.values():
                            if w.section_id == adj_id:
                                # Estimate downstream arrival window
                                est_arrival = train.entry_minute + (hop * 45)
                                est_departure = train.exit_minute + (hop * 45) + propagated_delay
                                if max(w.start_minute, est_arrival) < min(w.end_minute, est_departure):
                                    downstream_windows.append(w.id)
                                    if w.id not in affected_blocks:
                                        affected_blocks.append(w.id)

                        # Check downstream trains affected by signal headway compression
                        for other_t in self.trains.values():
                            if other_t.id != train.id and other_t.section_id == adj_id:
                                est_arrival = train.entry_minute + (hop * 45)
                                if est_arrival <= other_t.entry_minute <= est_arrival + propagated_delay + 10:
                                    if other_t.train_number not in knocked_on_trains:
                                        knocked_on_trains.append(other_t.train_number)

                        cascade_chain.append({
                            "hop_level": hop,
                            "section_id": adj_id,
                            "section_name": adj_sec.name if adj_sec else adj_id,
                            "propagated_delay_minutes": propagated_delay,
                            "buffer_absorption_minutes": absorbed_slack,
                            "overlapping_windows": downstream_windows,
                        })

                        next_frontier.append((adj_id, propagated_delay, hop))

            current_frontier = next_frontier
            hop += 1

        # Fallback for primary adjacent if no multi-hop reached minimum threshold
        if not affected_sections_list:
            sec = self.sections.get(train.section_id)
            if sec and sec.adjacent_section_ids:
                affected_sections_list = sec.adjacent_section_ids
                cumulative_secondary = int(delay_minutes * 0.65)

        replan_needed = len(affected_blocks) > 0 or delay_minutes >= 30

        return NetworkImpactEstimate(
            event_id=event.event_id,
            primary_section_id=train.section_id,
            direct_delay_minutes=delay_minutes,
            adjacent_sections_affected=affected_sections_list,
            secondary_delay_minutes=cumulative_secondary,
            total_network_delay_minutes=delay_minutes + cumulative_secondary,
            trains_knocked_on=knocked_on_trains,
            affected_blocks=affected_blocks,
            replan_recommended=replan_needed,
            cascade_chain=cascade_chain,
            max_hops=max_hop_reached or 1,
        )

    def inject_block_cancellation(self, window_id: str, reason: str = "Unfavorable weather / operational surge") -> SimulationEvent:
        """Simulates cancellation of an approved possession window by section controller."""
        w = self.windows.get(window_id)
        event = SimulationEvent(
            event_id=f"EVT-CAN-{len(self.event_log)+1:03d}",
            event_type="BLOCK_CANCELLATION",
            target_id=window_id,
            section_id=w.section_id if w else "UNKNOWN",
            delay_or_magnitude_minutes=w.duration_min if w else 0,
            timestamp_minute=self.current_minute,
            description=f"Possession window {window_id} cancelled: {reason}",
        )
        self.event_log.append(event)
        return event

    def get_active_state_summary(self) -> Dict[str, Any]:
        """Returns digital twin state snapshot."""
        return {
            "current_minute": self.current_minute,
            "total_sections": len(self.sections),
            "total_assets": len(self.assets),
            "total_jobs": len(self.jobs),
            "jobs_by_status": {
                st.value: sum(1 for j in self.jobs.values() if j.status == st.value)
                for st in JobStatusEnum
            },
            "events_logged_count": len(self.event_log),
        }
