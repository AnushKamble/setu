import enum
from datetime import datetime
from typing import List
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum as SqlEnum,
    JSON,
)
from sqlalchemy.orm import relationship
from backend.app.database import Base


class DepartmentEnum(str, enum.Enum):
    ENGINEERING = "ENGINEERING"  # Track / P.Way
    TRD = "TRD"                  # Traction Distribution / OHE
    S_AND_T = "S_AND_T"          # Signal & Telecom
    OPERATIONS = "OPERATIONS"    # Traffic Control / COA


class JobStatusEnum(str, enum.Enum):
    BACKLOG = "BACKLOG"
    PROPOSED = "PROPOSED"
    COMMITTED = "COMMITTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    DEFERRED = "DEFERRED"


class SafetyClassEnum(str, enum.Enum):
    STANDARD = "STANDARD"
    ISOLATION_REQUIRED = "ISOLATION_REQUIRED"      # Requires OHE power block
    INTERLOCKED = "INTERLOCKED"                    # Requires S&T signal disconnection
    HEAVY_EQUIPMENT = "HEAVY_EQUIPMENT"            # Track machine; restricts adjacent line


class TrainPriorityEnum(str, enum.Enum):
    EXPRESS = "EXPRESS"                            # Rajdhani, Vande Bharat, Mail/Express (Protected)
    PASSENGER = "PASSENGER"                        # Suburban / Passenger
    FREIGHT_SCHEDULED = "FREIGHT_SCHEDULED"        # Container / Timetabled freight
    FREIGHT_DEMAND = "FREIGHT_DEMAND"              # Coal / Rake on-demand forecast


class Section(Base):
    __tablename__ = "sections"

    id = Column(String(50), primary_key=True)  # e.g., "SEC-GZB-ALJN-01"
    name = Column(String(100), nullable=False)
    division = Column(String(50), nullable=False)
    track_type = Column(String(20), default="UP_MAIN")
    length_km = Column(Float, nullable=False)
    max_speed_kmh = Column(Integer, default=130)
    adjacent_section_ids = Column(JSON, default=list)  # For 1-hop delay propagation

    assets = relationship("Asset", back_populates="section", cascade="all, delete-orphan")
    windows = relationship("CorridorWindow", back_populates="section")
    trains = relationship("TrainMovement", back_populates="section")


class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(50), primary_key=True)  # e.g., "AST-TRK-101"
    section_id = Column(String(50), ForeignKey("sections.id"), nullable=False)
    department = Column(String(20), nullable=False)
    asset_type = Column(String(50), nullable=False)  # RAIL_FASTENING, OHE_INSULATOR, TRACK_CIRCUIT
    criticality = Column(Integer, nullable=False)    # 1 (lowest) to 5 (highest, statutory inspection)
    install_date = Column(DateTime, default=datetime.utcnow)
    last_maintenance_date = Column(DateTime, default=datetime.utcnow)
    condition_score = Column(Float, default=1.0)     # 0.0 (failed) to 1.0 (new)
    # Anti-circularity: hidden latent factor (metallurgy, soil/ballast moisture, environmental stress)
    # NOT exposed as an observed feature to the ML model!
    latent_degradation_factor = Column(Float, default=1.0)

    section = relationship("Section", back_populates="assets")
    jobs = relationship("MaintenanceJob", back_populates="asset")


class MaintenanceJob(Base):
    __tablename__ = "maintenance_jobs"

    id = Column(String(50), primary_key=True)  # e.g., "JOB-ENG-001"
    asset_id = Column(String(50), ForeignKey("assets.id"), nullable=False)
    section_id = Column(String(50), ForeignKey("sections.id"), nullable=False)
    department = Column(String(20), nullable=False)
    job_type = Column(String(60), nullable=False)
    description = Column(Text, nullable=True)
    duration_p50_min = Column(Integer, nullable=False)
    duration_p90_min = Column(Integer, nullable=False)
    priority_score = Column(Float, default=0.5)      # ML / hazard estimated [0.0, 1.0]
    cost_of_waiting = Column(Float, default=1.0)     # Expected risk escalation if deferred 7 days
    safety_class = Column(String(30), default="STANDARD")
    statutory_deadline_minute = Column(Integer, nullable=True)  # Horizon minute by which job must run
    status = Column(String(20), default=JobStatusEnum.BACKLOG.value)
    required_resources = Column(JSON, default=list)  # e.g., ["ENG_GANG", "TAMPING_MCH"]

    asset = relationship("Asset", back_populates="jobs")


class CorridorWindow(Base):
    __tablename__ = "corridor_windows"

    id = Column(String(50), primary_key=True)  # e.g., "WIN-001"
    section_id = Column(String(50), ForeignKey("sections.id"), nullable=False)
    start_minute = Column(Integer, nullable=False)  # Minute offset from horizon start (0 = Day 1 00:00)
    end_minute = Column(Integer, nullable=False)
    duration_min = Column(Integer, nullable=False)
    allowed_departments = Column(JSON, default=list)
    traffic_impact_tier = Column(String(30), default="LOW_OFF_PEAK")

    section = relationship("Section", back_populates="windows")


class TrainMovement(Base):
    __tablename__ = "train_movements"

    id = Column(String(50), primary_key=True)
    train_number = Column(String(20), nullable=False)
    train_name = Column(String(100), nullable=False)
    priority_class = Column(String(20), default=TrainPriorityEnum.EXPRESS.value)
    section_id = Column(String(50), ForeignKey("sections.id"), nullable=False)
    entry_minute = Column(Integer, nullable=False)
    exit_minute = Column(Integer, nullable=False)
    is_goods_forecast = Column(Boolean, default=False)
    delay_probability = Column(Float, default=0.1)

    section = relationship("Section", back_populates="trains")


class DepartmentResource(Base):
    __tablename__ = "department_resources"

    id = Column(String(50), primary_key=True)
    department = Column(String(20), nullable=False)
    resource_type = Column(String(50), nullable=False)  # GANG, TOWER_WAGON, TAMPING_MACHINE
    total_units = Column(Integer, default=2)


class Plan(Base):
    __tablename__ = "plans"

    id = Column(String(50), primary_key=True)
    horizon_type = Column(String(20), default="WEEKLY")  # WEEKLY or MONTHLY
    scenario_name = Column(String(50), default="NORMAL")
    created_at = Column(DateTime, default=datetime.utcnow)
    solver_status = Column(String(20), default="FEASIBLE")
    solve_time_seconds = Column(Float, default=0.0)
    kpis = Column(JSON, default=dict)

    blocks = relationship("PlanBlock", back_populates="plan", cascade="all, delete-orphan")


class PlanBlock(Base):
    __tablename__ = "plan_blocks"

    id = Column(String(50), primary_key=True)
    plan_id = Column(String(50), ForeignKey("plans.id"), nullable=False)
    window_id = Column(String(50), ForeignKey("corridor_windows.id"), nullable=False)
    section_id = Column(String(50), nullable=False)
    start_minute = Column(Integer, nullable=False)
    end_minute = Column(Integer, nullable=False)
    job_ids = Column(JSON, default=list)
    is_convoy = Column(Boolean, default=False)
    departments = Column(JSON, default=list)
    explanation = Column(Text, nullable=True)

    plan = relationship("Plan", back_populates="blocks")
