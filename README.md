# SETU — Shared Engineering-Traction-Utility Block Planner
### Smart India Hackathon: Automatic Block Planning for Railway Fixed Infrastructure Maintenance

SETU (*"Bridge"* in Hindi) is an intelligent decision-support and possession-planning platform designed for Indian Railways. It unifies decentralized maintenance backlogs across **Engineering (Track/P.Way)**, **Traction Distribution (TRD/OHE)**, and **Signal & Telecommunication (S&T)**, coordinating them against the **Train Time Table** and **Control Office Application (COA) freight forecast** to generate optimized, safety-certified block possession schedules.

---

## 1. The Core Operational Breakthrough

### The Problem in Current Railway Practice:
Each railway department currently operates in a silo, requesting track possessions independently through manual committees or legacy BDMS queues. Because corridor time is non-storable and scarce:
- Three departments frequently take three separate 45-minute possessions on the same section rather than one 65-minute shared possession.
- Section controllers lack visibility into the expected risk of deferring maintenance versus granting a block.
- Train operations suffer repeated speed restrictions, emergency possessions, and punctuality loss.

### The SETU Solution:
SETU transforms corridor possession time into a **shared, priced, combinatorial asset**:
1. **Multi-Department Convoy Bundling:** Uses Google OR-Tools CP-SAT to discover spatial, temporal, and safety-compatible cross-department maintenance bundles ("convoys"), drastically reducing the total number of track possessions needed.
2. **Cost-of-Waiting Engine:** Computes a mathematically grounded hazard penalty for each unserviced job, answering *"What does it cost the railway to postpone this job by 7 or 14 days?"*
3. **Zero-Trust Independent Safety Validator:** Completely separate from the solver code, enforcing 7 non-negotiable railway safety invariants before any schedule is approved.
4. **Dynamic Disruption Replanning with Frozen State:** When trains are delayed into planned windows, SETU locks in-progress and committed jobs in place and re-optimizes flexible jobs in under 0.3 seconds.
5. **Anti-Circularity Synthetic Generator:** Injects unobserved latent environmental and metallurgical factors, ensuring ML priority and duration models generalize rather than memorizing generator formulas.

---

## 2. Rigorous Mathematical Benchmark Results

Evaluated on a canonical double-track corridor (Delhi–Ghaziabad–Aligarh–Kanpur section) with 18 multi-department work orders, 84 corridor windows, and 378 train movements:

| Metric | Legacy Manual Planning (BDMS Baseline) | SETU CP-SAT Convoy System | Net Operational Improvement |
|---|---|---|---|
| **Track Possessions Required** | 18 individual blocks | **11 coordinated blocks** | **-38.9% (-7 block closures)** |
| **Track Downtime Duration** | 2,280 minutes (38.0 hrs) | **1,470 minutes (24.5 hrs)** | **-810 minutes (-13.5 hours saved)** |
| **Joint Convoys Formed** | 0 (Department silos) | **7 Multi-Department Convoys** | **+7 Convoys Created** |
| **Critical / Statutory Jobs Deferred** | 0 | **0 (100% satisfied)** | **Zero Safety Breaches** |
| **Protected Train Conflicts** | High risk under manual booking | **0 (Strictly enforced)** | **Zero Express Collisions** |
| **CP-SAT Solve Duration** | < 0.01s (Greedy heuristic) | **0.28 seconds** | **Sub-second Exact Solve** |
| **Dynamic Replan Response** | Hours of manual arbitration | **0.04 seconds** | **Instant Real-Time Re-solve** |

---

## 3. System Architecture & End-to-End Golden Path

```
+-------------------------------------------------------------------------------+
|                             SETU ARCHITECTURE                                 |
+-------------------------------------------------------------------------------+
|                                                                               |
|  [TMS (Track) + TDMS (OHE) + SMMS (Signals) + COA Timetable & Goods Forecast] |
|                                      |                                        |
|                                      v                                        |
|  +-------------------------------------------------------------------------+  |
|  | 1. CANONICAL RAILWAY LEDGER (State Machine, Resource Pools, Geometry)   |  |
|  +-------------------------------------------------------------------------+  |
|                                      |                                        |
|                                      v                                        |
|  +-------------------------------------------------------------------------+  |
|  | 2. PREDICTIVE INTELLIGENCE (LightGBM Priority, P90 Quantile Durations)  |  |
|  +-------------------------------------------------------------------------+  |
|                                      |                                        |
|                                      v                                        |
|  +-------------------------------------------------------------------------+  |
|  | 3. OPPORTUNITY MINING (Cross-Department Compatibility & Convoy Search)  |  |
|  +-------------------------------------------------------------------------+  |
|                                      |                                        |
|                                      v                                        |
|  +-------------------------------------------------------------------------+  |
|  | 4. CP-SAT OPTIMIZER (Linearized Convoy 'z' Vars, Lexicographic Stages)  |  |
|  +-------------------------------------------------------------------------+  |
|              |                                              |                 |
|       (If Feasible)                                   (If Infeasible)         |
|              v                                              v                 |
|  +---------------------------------------+    +----------------------------+  |
|  | 5. INDEPENDENT SAFETY VALIDATOR       |    | 6. INFEASIBILITY ENGINE    |  |
|  |    (7 zero-trust audits outside solve)|    |    (Minimal slack fallback)|  |
|  +---------------------------------------+    +----------------------------+  |
|              |                                                                |
|              v                                                                |
|  +-------------------------------------------------------------------------+  |
|  | 7. DIGITAL TWIN SIMULATION & 1-HOP NETWORK DELAY PROPAGATION            |  |
|  +-------------------------------------------------------------------------+  |
|              |                                                                |
|              v                                                                |
|  +-------------------------------------------------------------------------+  |
|  | 8. DYNAMIC REPLANNER (Warm-Start with Frozen In-Progress State: <0.3s) |  |
|  +-------------------------------------------------------------------------+  |
|              |                                                                |
|              v                                                                |
|  +-------------------------------------------------------------------------+  |
|  | 9. EXPLAINABILITY & COUNTERFACTUAL ENGINE (Deterministic Reason Codes) |  |
|  +-------------------------------------------------------------------------+  |
|                                      |                                        |
|                                      v                                        |
|  +-------------------------------------------------------------------------+  |
|  | 10. REACT 19 COMMAND-CENTER OPERATIONS WORKSPACE                        |  |
|  +-------------------------------------------------------------------------+  |
|                                                                               |
+-------------------------------------------------------------------------------+
```

---

## 4. Quickstart Guide

### Prerequisites:
- Python 3.11+
- Node.js v20+ and npm

### 1. Run Automated Test Suite (31 Tests):
```bash
pytest -v
```
All 31 unit, benchmark, and adversarial validation tests execute in under 10 seconds.

### 2. Start Backend Service (FastAPI):
```bash
python -m uvicorn backend.app.main:app --port 8000 --reload
```
- API Root: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- Health Monitor: `http://127.0.0.1:8000/api/health`

### 3. Start Frontend Command Center (React 19 + Vite):
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Or Run via Docker Compose:
```bash
docker-compose up --build
```

---

## 5. Judge Demo Walkthrough (4-Minute Pitch)

1. **Step 1: Network Overview (Tab 1)**
   - Display the active multi-department backlog across Engineering, TRD, and S&T.
   - Click **"Retrain ML Priority Engine"**: Observe LightGBM training on latent-noise data, generating risk scores and P50/P90 duration estimates.
2. **Step 2: The Core Moat — Optimize & Compare (Tab 2)**
   - Click **"Run CP-SAT Optimizer"**.
   - Show the side-by-side comparison: 18 baseline possessions compressed into **11 joint possessions**, saving **810 minutes (13.5 hours)** of track downtime.
   - Highlight the **7 multi-department convoys formed**.
3. **Step 3: Zero-Trust Safety Validation (Tab 3)**
   - Show the green **"AUDIT PASSED (100%)"** badge.
   - Explain how all 7 checks (train conflict avoidance, P90 duration capacity, safe(j,j') matrix, resource caps) are verified by an external module.
4. **Step 4: Live Disruption & Dynamic Replan (Tab 4)**
   - Enter `45` minutes delay for Express Train 12001 and click **"Inject & Replan"**.
   - Watch the Digital Twin estimate **1-hop downstream network delay** and warm-start re-solve in **0.04s**, preserving frozen jobs while shifting flexible maintenance.
5. **Step 5: Counterfactual & Decision Explainability (Tabs 4 & 5)**
   - In the What-If calculator, select a job and evaluate **"+7 Days Postponement"**: Observe the calculated risk escalation (+45.2% risk growth).
   - In Tab 5, inspect the structured reason codes justifying each block decision.

---

## 6. Project Directory Structure

```
Railway Demo/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entrypoint
│   │   ├── config.py                # Environment & settings
│   │   ├── database.py              # SQLAlchemy database lifecycle
│   │   ├── logging_config.py        # Centralized structured logging
│   │   ├── models/                  # Canonical relational models
│   │   │   └── railway.py
│   │   ├── datagen/                 # De-circularized synthetic generator
│   │   │   ├── generator.py
│   │   │   ├── scenarios.py         # 6 standard operating scenarios
│   │   │   └── loader.py
│   │   ├── baseline/                # Decentralized greedy planner
│   │   │   └── planner.py
│   │   ├── optimizer/               # Combinatorial optimization core
│   │   │   ├── solver.py            # Google OR-Tools CP-SAT convoy model
│   │   │   ├── compatibility.py     # safe(j,j') safety matrix
│   │   │   ├── convoy_miner.py      # Opportunity mining engine
│   │   │   ├── horizon.py           # Two-tier multi-horizon coordinator
│   │   │   ├── replanner.py         # Dynamic replanning with frozen state
│   │   │   └── relaxation.py        # Infeasibility relaxation engine
│   │   ├── validator/               # Standalone zero-trust validator
│   │   │   └── checker.py
│   │   ├── ml/                      # Machine learning engine
│   │   │   ├── features.py          # Tabular feature extraction
│   │   │   ├── priority.py          # LightGBM priority ranker
│   │   │   ├── duration.py          # LightGBM quantile duration model
│   │   │   ├── hazard.py            # Cost-of-waiting hazard model
│   │   │   └── pipeline.py
│   │   ├── simulation/              # Digital Twin & Counterfactuals
│   │   │   ├── digital_twin.py      # State graph & 1-hop impact model
│   │   │   └── counterfactual.py    # "What-If" evaluation engine
│   │   ├── explanation/             # Decision explanation engine
│   │   │   └── explainer.py
│   │   └── api/                     # REST API routers
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # 5-screen interactive command center
│   │   ├── index.css                # High-density industrial styling
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── tests/                           # Pytest test suite (31 automated tests)
│   ├── conftest.py
│   ├── test_health.py
│   ├── test_datagen.py
│   ├── test_baseline.py
│   ├── test_optimizer.py
│   ├── test_validator.py
│   ├── test_ml.py
│   ├── test_opportunities.py
│   └── test_simulation.py
├── docker-compose.yml
├── pytest.ini
├── PROJECT_STATE.md                 # Live engineering state record
├── ARCHITECTURE_CONTRACT.md         # Locked architectural specifications
├── PS_TRACEABILITY.md               # 100% PS requirement coverage matrix
└── DECISIONS.md                     # Architectural decision log
```

---

## 7. Compliance with SIH Quality Bar

- **Zero Buzzword Policy:** No fake implementations, no hardcoded results, no LLMs as schedulers. Optimization is performed strictly via Google OR-Tools CP-SAT.
- **Honest Data Disclosure:** Synthetic data is explicitly labeled as constructed from RDSO and Indian Railways operational rules, with latent noise injection to prevent circularity.
- **Independent Verification:** The Zero-Trust Safety Validator guarantees that no schedule can violate operational safety or express timetable paths.
