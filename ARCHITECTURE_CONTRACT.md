# ARCHITECTURE_CONTRACT.md — SETU Architectural Specification

*System: SETU (Shared Engineering-Traction-Utility Block Planner)*  
*Standard: Option B Architecture (Master Plan / Red-Team Audited)*

---

## 1. Core Paradigm & Product Definition

SETU is an upstream **decision-support and possession-planning intelligence platform** for Indian Railways. It integrates maintenance demands across three independent departments (Engineering/Track, Traction Distribution/OHE, and Signal & Telecom) and arbitrates access to scarce corridor possession windows against train timetables and freight forecasts.

```
+-------------------------------------------------------------------------------+
|                       SETU PIPELINE ARCHITECTURE                              |
+-------------------------------------------------------------------------------+
|                                                                               |
|  [TMS/SMMS/TDMS + COA Timetable/Freight Data]                                 |
|                         |                                                     |
|                         v                                                     |
|  +-------------------------------------------------------------------------+  |
|  | 1. CANONICAL RAILWAY LEDGER (State Machine, Resource Pools, Geometry)   |  |
|  +-------------------------------------------------------------------------+  |
|                         |                                                     |
|                         v                                                     |
|  +-------------------------------------------------------------------------+  |
|  | 2. PREDICTIVE ENGINE (Latent-Noise De-circularized Priority, P90 Dur.)  |  |
|  +-------------------------------------------------------------------------+  |
|                         |                                                     |
|                         v                                                     |
|  +-------------------------------------------------------------------------+  |
|  | 3. OPPORTUNITY MINING (Spatial + Temporal + Safety Compatibility)       |  |
|  +-------------------------------------------------------------------------+  |
|                         |                                                     |
|                         v                                                     |
|  +-------------------------------------------------------------------------+  |
|  | 4. CP-SAT OPTIMIZER (Convoy 'z' vars, Lexicographic Multi-Stage)        |  |
|  |    - Stage 1: Minimize Missed Statutory Deadlines (Hard)                |  |
|  |    - Stage 2: Minimize Cost of Waiting (Deferred Risk)                  |  |
|  |    - Stage 3: Minimize Total Possession-Hours (Uptime Maximization)     |  |
|  +-------------------------------------------------------------------------+  |
|              |                                              |                 |
|       (If Feasible)                                   (If Infeasible)         |
|              v                                              v                 |
|  +---------------------------------------+    +----------------------------+  |
|  | 5. INDEPENDENT SAFETY VALIDATOR       |    | 6. INFEASIBILITY ENGINE    |  |
|  |    (Separate path: checks conflicts,  |    |    (Slack relaxation,      |  |
|  |     overlap, safe(j,j'), resources)   |    |     alternative windows,   |  |
|  +---------------------------------------+    |     escalation flags)      |  |
|              |                                +----------------------------+  |
|              v                                                                |
|  +---------------------------------------+                                    |
|  | 7. NETWORK IMPACT v0 (1-Hop Delay)    |                                    |
|  +---------------------------------------+                                    |
|              |                                                                |
|              v                                                                |
|  +---------------------------------------+                                    |
|  | 8. EXPLANATION ENGINE (Typed Reasons) |                                    |
|  +---------------------------------------+                                    |
|              |                                                                |
|              v                                                                |
|  +---------------------------------------+                                    |
|  | 9. OPERATOR REVIEW (HITL Pin/Override)|                                    |
|  +---------------------------------------+                                    |
|              |                                                                |
|   (On Live Disruption Event)                                                  |
|              v                                                                |
|  +-------------------------------------------------------------------------+  |
|  | 10. DYNAMIC REPLANNER (Rolling-Horizon Re-solve with Frozen State)      |  |
|  +-------------------------------------------------------------------------+  |
|                                                                               |
+-------------------------------------------------------------------------------+
```

---

## 2. Module Boundaries & Responsibilities

### Module 1: Data & Canonical Ledger (`backend/app/core/ledger/`)
- **Responsibility:** Ingests raw maintenance work-orders (TMS/SMMS/TDMS) and corridor traffic windows (COA/Timetable). Enforces uniform typing and entity schemas.
- **State Machine:**
  - `JobStatus`: `BACKLOG` -> `PROPOSED` -> `COMMITTED` -> `IN_PROGRESS` -> `COMPLETED` / `DEFERRED`
  - `WindowState`: `AVAILABLE` -> `RESERVED` -> `ACTIVE` -> `RELEASED`
- **Resource Pools:** Tracks gang availability and specialized equipment (e.g., Tower Wagon for TRD, BCM/Tamping machine for Engg).

### Module 2: Data Generation & De-circularization (`backend/app/datagen/`)
- **Responsibility:** Generates domain-grounded synthetic railway networks and maintenance backlogs using RDSO/Railway Board operational rules.
- **Anti-Circularity Mechanism:** Injects latent unobserved factors (simulated environmental exposure, metallurgy batch variance, unmeasured ballast contamination) that affect true degradation but are *not* provided as input features to the ML priority model.

### Module 3: Predictive Intelligence (`backend/app/ml/`)
- **Responsibility:**
  1. Priority Scoring: Gradient Boosted Trees (LightGBM/XGBoost) outputting normalized priority score $\in [0, 1]$ based on observed age, traffic density, defect severity, and track geometry tolerances.
  2. Duration Estimation: Quantile model outputting P50 and P90 expected job duration. The optimizer consumes P90 as a buffer against overrun.
  3. Cost-of-Waiting: Monotonic ordinal hazard function estimating expected risk escalation if maintenance is deferred 7 to 30 days.

### Module 4: Opportunity Mining (`backend/app/optimizer/convoy.py`)
- **Responsibility:** Identifies candidate bundles across departments before and during optimization.
- **Compatibility Function `safe(j, j')`:**
  - Spatial: Same section or contiguous block section.
  - Temporal: Execution within window boundary.
  - Safety Matrix: Explicit departmental separation rules (e.g., OHE power isolation permits pantograph inspection while track tamping occurs, but forbids simultaneous heavy crane swinging directly under live overhead wires).

### Module 5: Combinatorial Optimization Engine (`backend/app/optimizer/solver.py`)
- **Responsibility:** Google OR-Tools CP-SAT formulation.
- **Decision Variables:**
  - $x_{j, w} \in \{0, 1\}$: Job $j$ assigned to corridor window $w$.
  - $y_w \in \{0, 1\}$: Window $w$ opened for possession.
  - $z_{j, j', w} \in \{0, 1\}$: Jobs $j$ and $j'$ executed jointly in window $w$.
- **Multi-Horizon Formulation (Corrected):**
  - **Monthly Horizon (Coarse Envelope):** Establishes aggregate possession-hour quotas and statutory maintenance allocations per section.
  - **Weekly Horizon (Tactical Refinement):** Solves exact slot allocations constrained within the monthly section envelope.
- **Staged Lexicographic Objective:**
  1. $\min \sum_{j \in J_{\text{statutory}}} (1 - \sum_w x_{j,w})$ (Strictly schedule mandatory statutory inspections).
  2. $\min \sum_j (1 - \sum_w x_{j,w}) \cdot \text{defer\_cost}_j$ (Minimize risk escalation of deferred backlog).
  3. $\min \sum_w y_w \cdot \text{cost}(w)$ (Minimize total opened possession-hours / maximize track availability).

### Module 6: Infeasibility Relaxation Engine (`backend/app/optimizer/relaxation.py`)
- **Responsibility:** Triggers when hard operational constraints prevent a feasible plan.
- **Action:** Formulates a slack-minimization model that identifies the minimal constraint violation, surfaces alternative time windows, and tags conflicts for human controller intervention.

### Module 7: Independent Safety Validator (`backend/app/validator/`)
- **Responsibility:** Zero-trust auditing module completely decoupled from the solver code.
- **Verification Checks:**
  1. Train conflict overlap: Asserts no possession is granted during protected express train paths.
  2. Section exclusivity: Asserts no two conflicting possession windows are active concurrently on the same block section.
  3. Duration bounds: Asserts $\sum_{j \in w} \text{dur\_p90}_j \le \text{length}(w)$.
  4. Compatibility: Asserts $\forall j, j' \in w, \text{safe}(j, j') == \text{True}$.
  5. Resource bounds: Asserts active jobs per department in slot $t$ do not exceed available department gang/equipment capacity.

### Module 8: Network Impact Propagation v0 (`backend/app/simulation/network_impact.py`)
- **Responsibility:** Models 1-hop downstream delay propagation to adjacent track sections when a possession window alters speed limits or when train paths are re-routed.

### Module 9: Dynamic Replanning (`backend/app/optimizer/replanner.py`)
- **Responsibility:** Warm-starts CP-SAT upon receiving a live disruption event (e.g., train delayed into window, emergency defect raised).
- **Frozen State Rule:** Jobs in `IN_PROGRESS` or `COMMITTED` states are locked; only `PROPOSED` or unassigned jobs within the disruption horizon are re-optimized.

### Module 10: Explanation Engine (`backend/app/explanation/`)
- **Responsibility:** Converts typed `SolverResult` structures into deterministic, human-readable reason codes (e.g., *"Merged 3 requests from Track and TRD saving 75 mins of possession time; deferred J14 because Section S4 capacity exceeded"*).

---

## 3. Technology Stack & Runtime Contracts

| Layer | Selected Technology | Rationale |
|---|---|---|
| **Backend Runtime** | Python 3.11 | High performance, native OR-Tools & ML ecosystem support |
| **API Framework** | FastAPI + Pydantic v2 | Strict schema validation, asynchronous IO, automatic OpenAPI docs |
| **Solver Core** | Google OR-Tools CP-SAT | Industry standard for finite-domain discrete combinatorial optimization |
| **Machine Learning** | LightGBM / Scikit-Learn | Fast, explainable tabular gradient boosting with minimal memory footprint |
| **Database** | SQLite (Dev/Demo) / PostgreSQL (Prod) | Relational integrity for ledger, JSON-friendly for solver outputs |
| **Testing** | Pytest, Hypothesis | Deterministic unit tests and property-based constraint stress-testing |
| **Frontend Framework** | React 18 + Vite | Rapid reactive UI development with fast HMR |
| **Styling & UI** | Tailwind CSS + Lucide Icons | Clean, high-density industrial dashboard layout |
| **Timeline / Gantt** | Visx / Custom Canvas Timeline | Smooth rendering of multi-track possession schedules |

---

## 4. Canonical Data Contracts (Pydantic / JSON)

### 4.1 MaintenanceJob
```json
{
  "id": "JOB-ENG-104",
  "asset_id": "AST-TRK-882",
  "department": "ENGINEERING",
  "job_type": "RAIL_FRACTURE_REPAIR",
  "section_id": "SEC-DL-GZB-01",
  "priority_score": 0.89,
  "statutory_deadline": "2026-09-15T00:00:00Z",
  "duration_p50_min": 45,
  "duration_p90_min": 60,
  "safety_class": "ISOLATION_REQUIRED",
  "status": "PROPOSED",
  "required_resources": ["ENG_GANG_A", "TAMPING_MCH_01"]
}
```

### 4.2 CorridorWindow
```json
{
  "id": "WIN-20260912-01",
  "section_id": "SEC-DL-GZB-01",
  "start_time": "2026-09-12T01:30:00Z",
  "end_time": "2026-09-12T03:30:00Z",
  "duration_min": 120,
  "allowed_departments": ["ENGINEERING", "TRD", "S_AND_T"],
  "traffic_impact_tier": "LOW_OFF_PEAK"
}
```

### 4.3 PlanBlock
```json
{
  "id": "BLK-001",
  "window_id": "WIN-20260912-01",
  "section_id": "SEC-DL-GZB-01",
  "job_ids": ["JOB-ENG-104", "JOB-TRD-202", "JOB-SNT-301"],
  "is_convoy": true,
  "combined_duration_min": 105,
  "buffer_min": 15,
  "validation_status": "PASSED",
  "explanation": "Convoy formed across 3 departments; zero express train conflicts."
}
```

---

## 5. Architectural Drift Control

Any change to:
1. Solver engine selection (e.g., CP-SAT -> MILP)
2. Objective function hierarchy
3. Safety validation rules
4. Horizon dependency direction

MUST be logged in `ARCHITECTURE_CONTRACT.md` under Section 6 with:
- `OLD APPROACH`
- `NEW APPROACH`
- `TECHNICAL REASON`
- `IMPACT ASSESSMENT`
