import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from backend.app.models.railway import (
    DepartmentEnum,
    JobStatusEnum,
    SafetyClassEnum,
    TrainPriorityEnum,
    Section,
    Asset,
    MaintenanceJob,
    CorridorWindow,
    TrainMovement,
    DepartmentResource,
)


class RailwayDataGenerator:
    """Domain-grounded synthetic generator for Indian Railways fixed infrastructure.
    
    Implements latent unobserved noise factors to ensure machine learning models
    cannot circularly memorize deterministic generation rules (anti-circularity fix).
    """

    def __init__(self, seed: int = 42):
        self.seed = seed
        self.rng = random.Random(seed)

    def generate_network(self) -> List[Section]:
        """Generates representative double-track corridor (Delhi - Ghaziabad - Aligarh division)."""
        sections_data = [
            ("SEC-NDLS-GZB-UP", "New Delhi - Ghaziabad Up Main", "DELHI", "UP_MAIN", 25.5, 130, ["SEC-GZB-ALJN-UP"]),
            ("SEC-NDLS-GZB-DN", "New Delhi - Ghaziabad Down Main", "DELHI", "DN_MAIN", 25.5, 130, ["SEC-GZB-ALJN-DN"]),
            ("SEC-GZB-ALJN-UP", "Ghaziabad - Aligarh Up Main", "DELHI", "UP_MAIN", 106.0, 140, ["SEC-NDLS-GZB-UP", "SEC-ALJN-CNB-UP"]),
            ("SEC-GZB-ALJN-DN", "Ghaziabad - Aligarh Down Main", "DELHI", "DN_MAIN", 106.0, 140, ["SEC-NDLS-GZB-DN", "SEC-ALJN-CNB-DN"]),
            ("SEC-ALJN-CNB-UP", "Aligarh - Kanpur Up Main", "PRAYAGRAJ", "UP_MAIN", 302.0, 130, ["SEC-GZB-ALJN-UP"]),
            ("SEC-ALJN-CNB-DN", "Aligarh - Kanpur Down Main", "PRAYAGRAJ", "DN_MAIN", 302.0, 130, ["SEC-GZB-ALJN-DN"]),
        ]
        sections = []
        for sid, name, div, ttype, length, speed, adj in sections_data:
            sections.append(
                Section(
                    id=sid,
                    name=name,
                    division=div,
                    track_type=ttype,
                    length_km=length,
                    max_speed_kmh=speed,
                    adjacent_section_ids=adj,
                )
            )
        return sections

    def generate_resources(self) -> List[DepartmentResource]:
        """Generates available workforce gangs and specialized equipment pools."""
        return [
            DepartmentResource(id="RES-ENG-GANG-01", department=DepartmentEnum.ENGINEERING.value, resource_type="TRACK_MAINTENANCE_GANG", total_units=3),
            DepartmentResource(id="RES-ENG-MCH-01", department=DepartmentEnum.ENGINEERING.value, resource_type="TAMPING_MACHINE", total_units=1),
            DepartmentResource(id="RES-TRD-GANG-01", department=DepartmentEnum.TRD.value, resource_type="OHE_MAINTENANCE_GANG", total_units=2),
            DepartmentResource(id="RES-TRD-TW-01", department=DepartmentEnum.TRD.value, resource_type="TOWER_WAGON", total_units=2),
            DepartmentResource(id="RES-SNT-GANG-01", department=DepartmentEnum.S_AND_T.value, resource_type="SIGNAL_MAINTENANCE_GANG", total_units=2),
        ]

    def generate_assets_and_jobs(
        self,
        sections: List[Section],
        job_count_target: int = 24,
        latent_noise_scale: float = 0.25,
        statutory_ratio: float = 0.25,
    ) -> (List[Asset], List[MaintenanceJob]):
        """Generates realistic asset inventory and maintenance job backlogs.
        
        Args:
            sections: Target railway sections.
            job_count_target: Number of maintenance jobs to raise.
            latent_noise_scale: Standard deviation of latent environmental factor (Anti-circularity).
            statutory_ratio: Proportion of jobs with strict regulatory deadlines.
        """
        asset_types = {
            DepartmentEnum.ENGINEERING.value: [
                # Short/Precision Tasks (35 - 65 min)
                ("FASTENING_SYSTEM", 3, 35, 50, SafetyClassEnum.STANDARD.value, ["TRACK_MAINTENANCE_GANG"]),
                ("SEJ_EXPANSION_JOINT", 4, 55, 75, SafetyClassEnum.STANDARD.value, ["TRACK_MAINTENANCE_GANG"]),
                ("USFD_FLAW_CLAMPING", 5, 65, 85, SafetyClassEnum.STANDARD.value, ["TRACK_MAINTENANCE_GANG"]),
                # Tactical Corridor Tasks (85 - 145 min)
                ("RAIL_WELD_THERMIT", 4, 110, 140, SafetyClassEnum.STANDARD.value, ["TRACK_MAINTENANCE_GANG"]),
                ("GLUED_INSULATED_JOINT", 4, 85, 115, SafetyClassEnum.INTERLOCKED.value, ["TRACK_MAINTENANCE_GANG"]),
                ("TURNOUT_SWITCH_RENEWAL", 5, 130, 165, SafetyClassEnum.INTERLOCKED.value, ["TRACK_MAINTENANCE_GANG", "TAMPING_MACHINE"]),
                # Heavy Mechanised Overhauls (140 - 195 min)
                ("BALLAST_BED_TAMPING_09_3X", 3, 140, 180, SafetyClassEnum.HEAVY_EQUIPMENT.value, ["TAMPING_MACHINE"]),
                ("DEEP_BALLAST_SCREENING_BCM", 2, 160, 195, SafetyClassEnum.HEAVY_EQUIPMENT.value, ["TAMPING_MACHINE"]),
            ],
            DepartmentEnum.TRD.value: [
                # Short/Precision Tasks (40 - 65 min)
                ("OHE_INSULATOR_WASHING", 3, 45, 60, SafetyClassEnum.ISOLATION_REQUIRED.value, ["OHE_MAINTENANCE_GANG"]),
                ("ISOLATOR_SWITCH_OVERHAUL", 4, 55, 75, SafetyClassEnum.ISOLATION_REQUIRED.value, ["OHE_MAINTENANCE_GANG"]),
                # Tactical Corridor Tasks (75 - 135 min)
                ("DROPPER_CURRENT_JUMPER", 4, 75, 95, SafetyClassEnum.ISOLATION_REQUIRED.value, ["OHE_MAINTENANCE_GANG", "TOWER_WAGON"]),
                ("CANTILEVER_ASSEMBLY_ALIGN", 3, 85, 115, SafetyClassEnum.ISOLATION_REQUIRED.value, ["OHE_MAINTENANCE_GANG"]),
                ("NEUTRAL_SECTION_ASSEMBLY", 5, 105, 135, SafetyClassEnum.ISOLATION_REQUIRED.value, ["OHE_MAINTENANCE_GANG", "TOWER_WAGON"]),
                # Heavy Traction Overhauls (140 - 185 min)
                ("CONTACT_WIRE_RESTRINGING", 5, 140, 175, SafetyClassEnum.ISOLATION_REQUIRED.value, ["TOWER_WAGON"]),
                ("TRACTION_SUBSTATION_FEEDER", 4, 150, 185, SafetyClassEnum.ISOLATION_REQUIRED.value, ["OHE_MAINTENANCE_GANG"]),
            ],
            DepartmentEnum.S_AND_T.value: [
                # Short/Precision Tasks (30 - 55 min)
                ("SIGNAL_ASPECT_LED_ARRAY", 3, 30, 45, SafetyClassEnum.STANDARD.value, ["SIGNAL_MAINTENANCE_GANG"]),
                ("AXLE_COUNTER_RESET_TEST", 4, 40, 55, SafetyClassEnum.INTERLOCKED.value, ["SIGNAL_MAINTENANCE_GANG"]),
                ("TRACK_CIRCUIT_DROP_SHUNT", 5, 45, 60, SafetyClassEnum.INTERLOCKED.value, ["SIGNAL_MAINTENANCE_GANG"]),
                # Tactical Signalling Tasks (70 - 135 min)
                ("POINT_MACHINE_THROW_LOCK", 5, 70, 95, SafetyClassEnum.INTERLOCKED.value, ["SIGNAL_MAINTENANCE_GANG"]),
                ("INTERLOCKING_RELAY_RACK", 4, 90, 120, SafetyClassEnum.INTERLOCKED.value, ["SIGNAL_MAINTENANCE_GANG"]),
                ("BLOCK_INSTRUMENT_TOKENLESS", 5, 105, 135, SafetyClassEnum.INTERLOCKED.value, ["SIGNAL_MAINTENANCE_GANG"]),
            ],
        }

        assets = []
        jobs = []
        asset_counter = 1
        job_counter = 1

        departments = [DepartmentEnum.ENGINEERING.value, DepartmentEnum.TRD.value, DepartmentEnum.S_AND_T.value]

        # Generate base asset inventory
        for section in sections:
            for dept in departments:
                types = asset_types[dept]
                for atype, crit, p50, p90, sclass, req_res in types:
                    # Injected latent noise factor (unobserved soil dampness, metallurgy micro-flaws, etc.)
                    latent_factor = max(0.5, min(1.5, self.rng.gauss(1.0, latent_noise_scale)))
                    
                    # Age in days (between 90 and 1800 days)
                    age_days = self.rng.randint(90, 1800)
                    install_date = datetime.utcnow() - timedelta(days=age_days)
                    last_maint_days = self.rng.randint(15, min(age_days, 360))
                    last_maint = datetime.utcnow() - timedelta(days=last_maint_days)

                    # Condition score driven by observed age + hidden latent factor
                    base_decay = (last_maint_days / 360.0) * (crit / 3.0) * 0.4
                    effective_decay = base_decay * latent_factor
                    condition = max(0.15, min(0.98, 1.0 - effective_decay + self.rng.gauss(0, 0.05)))

                    asset_id = f"AST-{dept[:3]}-{asset_counter:03d}"
                    asset_counter += 1

                    asset = Asset(
                        id=asset_id,
                        section_id=section.id,
                        department=dept,
                        asset_type=atype,
                        criticality=crit,
                        install_date=install_date,
                        last_maintenance_date=last_maint,
                        condition_score=round(condition, 3),
                        latent_degradation_factor=round(latent_factor, 3),
                    )
                    assets.append(asset)

        # Generate jobs for degraded assets or statutory requirements
        assets_by_urgency = sorted(assets, key=lambda a: a.condition_score)
        selected_assets = assets_by_urgency[:job_count_target]

        for asset in selected_assets:
            # Find prototype properties
            matching_specs = [
                s for s in asset_types[asset.department] if s[0] == asset.asset_type
            ]
            atype, crit, base_p50, base_p90, sclass, req_res = matching_specs[0]

            # Durations with slight noise
            duration_p50 = max(20, int(base_p50 + self.rng.randint(-5, 10)))
            duration_p90 = max(duration_p50 + 10, int(base_p90 + self.rng.randint(0, 15)))

            # Priority score: proxy for urgency & asset risk
            # Note: Model in Phase 6 will predict this from features; here we seed initial realistic scores
            raw_priority = (1.0 - asset.condition_score) * 0.6 + (asset.criticality / 5.0) * 0.4
            priority = max(0.1, min(0.99, round(raw_priority, 3)))

            # Cost of waiting: non-linear hazard growth per 7-day deferral
            cost_waiting = round((priority ** 1.8) * 10.0, 2)

            # Statutory inspection flag: deadline set within horizon
            is_statutory = (self.rng.random() < statutory_ratio) or (asset.criticality == 5 and asset.condition_score < 0.45)
            # 7-day weekly horizon has 10080 minutes
            statutory_deadline = self.rng.randint(2880, 10000) if is_statutory else None

            job_id = f"JOB-{asset.department[:3]}-{job_counter:03d}"
            job_counter += 1

            job = MaintenanceJob(
                id=job_id,
                asset_id=asset.id,
                section_id=asset.section_id,
                department=asset.department,
                job_type=f"{asset.asset_type}_MAINTENANCE",
                description=f"Scheduled corrective maintenance for {asset.asset_type} on {asset.section_id}",
                duration_p50_min=duration_p50,
                duration_p90_min=duration_p90,
                priority_score=priority,
                cost_of_waiting=cost_waiting,
                safety_class=sclass,
                statutory_deadline_minute=statutory_deadline,
                status=JobStatusEnum.PROPOSED.value,
                required_resources=req_res,
            )
            jobs.append(job)

        return assets, jobs

    def generate_windows_and_trains(
        self,
        sections: List[Section],
        horizon_days: int = 7,
    ) -> (List[CorridorWindow], List[TrainMovement]):
        """Generates corridor possession windows and train timetables across the horizon."""
        windows = []
        trains = []
        win_counter = 1
        train_counter = 1

        total_minutes = horizon_days * 24 * 60

        # Protected Express Trains schedule pattern (Daily services)
        express_patterns = [
            ("12001", "Bhopal Shatabdi Express", 360, 420),      # 06:00 - 07:00
            ("22436", "Vande Bharat Express", 480, 540),        # 08:00 - 09:00
            ("12302", "Howrah Rajdhani Express", 1020, 1080),   # 17:00 - 18:00
            ("12424", "Dibrugarh Rajdhani", 960, 1020),         # 16:00 - 17:00
            ("12560", "Shiv Ganga Express", 1200, 1260),        # 20:00 - 21:00
        ]

        for day in range(horizon_days):
            day_offset = day * 1440
            is_weekend = (day % 7) in [5, 6]

            # Realistic Indian Railways Timetabled Corridor Possession Patterns:
            # - Weekdays: Deep Night Integrated Block (240m), Midday Shadow Block (120m), Afternoon Gap (90m)
            # - Weekends: Mega Engineering Possessions (285m) & Extended Integrated Shadow (180m)
            if is_weekend:
                window_patterns = [
                    (30, 315, 285, "NIGHT_BLOCK", ["ENGINEERING", "TRD", "S_AND_T"]),       # 00:30 - 05:15 (285 min)
                    (750, 930, 180, "DAY_OFF_PEAK", ["ENGINEERING", "TRD", "S_AND_T"]),     # 12:30 - 15:30 (180 min)
                ]
            else:
                window_patterns = [
                    (30, 270, 240, "NIGHT_BLOCK", ["ENGINEERING", "TRD", "S_AND_T"]),       # 00:30 - 04:30 (240 min)
                    (690, 810, 120, "DAY_OFF_PEAK", ["ENGINEERING", "TRD", "S_AND_T"]),     # 11:30 - 13:30 (120 min)
                    (840, 930, 90, "DAY_OFF_PEAK", ["ENGINEERING", "TRD", "S_AND_T"]),      # 14:00 - 15:30 (90 min)
                ]

            # Generate corridor windows for each section
            for section in sections:
                for w_start, w_end, duration, tier, allowed_depts in window_patterns:
                    start_min = day_offset + w_start
                    end_min = day_offset + w_end
                    win_id = f"WIN-{section.id}-D{day+1}-{w_start:04d}"
                    windows.append(
                        CorridorWindow(
                            id=win_id,
                            section_id=section.id,
                            start_minute=start_min,
                            end_minute=end_min,
                            duration_min=duration,
                            allowed_departments=allowed_depts,
                            traffic_impact_tier=tier,
                        )
                    )

            # Generate timetable train movements
            for section in sections:
                # Express trains
                for t_num, t_name, t_start, t_end in express_patterns:
                    t_entry = day_offset + t_start + self.rng.randint(-5, 5)
                    t_exit = day_offset + t_end + self.rng.randint(-5, 5)
                    trains.append(
                        TrainMovement(
                            id=f"TRN-{t_num}-D{day+1}-{section.id}",
                            train_number=t_num,
                            train_name=t_name,
                            priority_class=TrainPriorityEnum.EXPRESS.value,
                            section_id=section.id,
                            entry_minute=t_entry,
                            exit_minute=t_exit,
                            original_entry_minute=t_entry,
                            original_exit_minute=t_exit,
                            delay_minutes=0,
                            status="ON_TIME",
                            is_goods_forecast=False,
                            delay_probability=0.08,
                        )
                    )

                # Freight scheduled movements (COA forecast)
                # Freight trains typically run during off-peak hours
                freight_slots = [270, 570, 840, 1320]
                for f_slot in freight_slots:
                    f_entry = day_offset + f_slot + self.rng.randint(-15, 20)
                    f_exit = f_entry + self.rng.randint(40, 60)
                    trains.append(
                        TrainMovement(
                            id=f"FRT-COA-{train_counter:04d}",
                            train_number=f"BOXN-{self.rng.randint(1000, 9999)}",
                            train_name="Goods Rake (COA Freight Forecast)",
                            priority_class=TrainPriorityEnum.FREIGHT_SCHEDULED.value,
                            section_id=section.id,
                            entry_minute=f_entry,
                            exit_minute=f_exit,
                            original_entry_minute=f_entry,
                            original_exit_minute=f_exit,
                            delay_minutes=0,
                            status="ON_TIME",
                            is_goods_forecast=True,
                            delay_probability=0.35,
                        )
                    )
                    train_counter += 1

        return windows, trains

    def generate_training_corpus(self, n_samples: int = 1000, save_path: Optional[str] = None) -> Any:
        """Generates a comprehensive, diverse dataset of N historical maintenance jobs for AI/ML training.
        
        Saves to backend/data/railway_training_corpus.csv and returns pandas DataFrame.
        Directly satisfies enterprise scalability and eliminates small-sample placeholder limitations.
        """
        import os
        import pandas as pd

        sections = self.generate_network()
        sec_speeds = {s.id: s.max_speed_kmh for s in sections}
        sec_lengths = {s.id: s.length_km for s in sections}
        sec_ids = [s.id for s in sections]

        dept_map = {"ENGINEERING": 0, "TRD": 1, "S_AND_T": 2}
        safety_map = {"STANDARD": 0, "ISOLATION_REQUIRED": 1, "INTERLOCKED": 2, "HEAVY_EQUIPMENT": 3}

        job_types_pool = [
            ("ENGINEERING", "RAIL_WELD_ULTRASONIC_TESTING", 4, 45, 65, "STANDARD", ["TRACK_MAINTENANCE_GANG"]),
            ("ENGINEERING", "TURNOUT_SWITCH_RENEWAL", 5, 60, 95, "INTERLOCKED", ["TRACK_MAINTENANCE_GANG", "TAMPING_MACHINE"]),
            ("ENGINEERING", "TRACK_TAMPING_AND_ALIGNMENT", 4, 90, 130, "HEAVY_EQUIPMENT", ["TAMPING_MACHINE"]),
            ("ENGINEERING", "BALLAST_CLEANING_BCM", 3, 110, 150, "HEAVY_EQUIPMENT", ["TAMPING_MACHINE"]),
            ("ENGINEERING", "RAIL_FASTENING_REPLACEMENT", 3, 30, 45, "STANDARD", ["TRACK_MAINTENANCE_GANG"]),
            ("ENGINEERING", "DE-STRESSING_CWR_TRACK", 5, 80, 115, "STANDARD", ["TRACK_MAINTENANCE_GANG"]),
            ("TRD", "OHE_CONTACT_WIRE_INSPECTION", 5, 60, 90, "ISOLATION_REQUIRED", ["TOWER_WAGON"]),
            ("TRD", "INSULATOR_WASHING_AND_REPLACEMENT", 4, 40, 60, "ISOLATION_REQUIRED", ["OHE_MAINTENANCE_GANG", "TOWER_WAGON"]),
            ("TRD", "CANTILEVER_ADJUSTMENT", 3, 45, 70, "ISOLATION_REQUIRED", ["OHE_MAINTENANCE_GANG"]),
            ("TRD", "TRACTION_TRANSFORMER_OIL_TEST", 4, 50, 75, "ISOLATION_REQUIRED", ["OHE_MAINTENANCE_GANG"]),
            ("TRD", "CROSSOVER_OHE_DROPPERS_MAINTENANCE", 4, 55, 80, "ISOLATION_REQUIRED", ["TOWER_WAGON"]),
            ("S_AND_T", "POINT_MACHINE_MOTOR_OVERHAUL", 5, 50, 75, "INTERLOCKED", ["SIGNAL_MAINTENANCE_GANG"]),
            ("S_AND_T", "TRACK_CIRCUIT_TUNING_AND_CALIBRATION", 5, 35, 50, "INTERLOCKED", ["SIGNAL_MAINTENANCE_GANG"]),
            ("S_AND_T", "AXLE_COUNTER_OUTDOOR_HEAD_TESTING", 4, 30, 45, "INTERLOCKED", ["SIGNAL_MAINTENANCE_GANG"]),
            ("S_AND_T", "SIGNAL_LED_ASPECT_REPLACEMENT", 3, 25, 40, "STANDARD", ["SIGNAL_MAINTENANCE_GANG"]),
            ("S_AND_T", "INTERLOCKING_CABLE_MEGGERING", 4, 40, 60, "STANDARD", ["SIGNAL_MAINTENANCE_GANG"]),
        ]

        rows = []
        for i in range(1, n_samples + 1):
            proto = self.rng.choice(job_types_pool)
            dept, jtype, crit, base_p50, base_p90, sclass, req_res = proto
            sec_id = self.rng.choice(sec_ids)

            # Injected latent degradation factor (unobserved environmental stress)
            latent = max(0.5, min(1.6, self.rng.gauss(1.0, 0.25)))
            
            age_days = self.rng.randint(60, 2200)
            days_since_maint = self.rng.randint(10, 365)
            
            # Ground truth decay & condition
            decay = (days_since_maint / 365.0) * (crit / 3.0) * 0.4 * latent
            cond = max(0.12, min(0.98, round(1.0 - decay + self.rng.gauss(0, 0.04), 3)))

            # Priority & Duration targets
            raw_prio = (1.0 - cond) * 0.6 + (crit / 5.0) * 0.4 + self.rng.gauss(0, 0.03)
            prio = max(0.05, min(0.99, round(raw_prio, 3)))
            
            is_stat = 1 if (self.rng.random() < 0.22 or (crit == 5 and cond < 0.40)) else 0
            
            p50 = max(20, int(base_p50 + self.rng.randint(-8, 12)))
            p90 = max(p50 + 10, int(base_p90 + self.rng.randint(-5, 18)))
            cow = round((prio ** 1.8) * 10.0, 2)

            rows.append({
                "job_id": f"HIST-JOB-{i:05d}",
                "asset_id": f"AST-{dept[:3]}-{self.rng.randint(1, 300):04d}",
                "section_id": sec_id,
                "department": dept,
                "job_type": jtype,
                "criticality": crit,
                "condition_score": cond,
                "age_days": age_days,
                "days_since_last_maint": days_since_maint,
                "dept_code": dept_map[dept],
                "safety_code": safety_map[sclass],
                "section_speed": sec_speeds[sec_id],
                "section_length": sec_lengths[sec_id],
                "is_statutory": is_stat,
                "latent_degradation_factor": round(latent, 3),
                "true_priority": prio,
                "true_duration_p50": p50,
                "true_duration_p90": p90,
                "cost_of_waiting": cow,
            })

        df = pd.DataFrame(rows)

        out_path = save_path or os.path.join(os.path.dirname(__file__), "..", "..", "data", "railway_training_corpus.csv")
        out_path = os.path.abspath(out_path)
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        df.to_csv(out_path, index=False)

        json_path = out_path.replace(".csv", ".json")
        df.to_json(json_path, orient="records", indent=2)

        return df
