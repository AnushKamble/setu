# DECISIONS.md — Strategic Architectural Decision Log

*System: SETU (Shared Engineering-Traction-Utility Block Planner)*

---

### DECISION 001: Selection of Google OR-Tools CP-SAT for Core Optimization
- **Date:** 2026-09-11
- **Status:** APPROVED
- **Context:** The problem requires discrete combinatorial scheduling of heterogeneous maintenance tasks into corridor time slots, subject to non-linear logical constraints (boolean safety compatibility `safe(j,j')`, department exclusivity, and binary convoy combination `z_{j,j',w}`).
- **Alternative Evaluated:**
  - *Mixed-Integer Linear Programming (MILP / PuLP / SCIP):* Feasible, but linearizing pairwise safety logic and large boolean matrices requires excess auxiliary variables and big-M relaxations, degrading solver performance.
  - *Genetic Algorithms / Heuristics:* Fast, but cannot guarantee zero safety violations or prove bounds on critical statutory deadlines.
  - *Large Language Models (LLM as scheduler):* Rejected definitively. LLMs hallucinate time overlaps and cannot solve NP-hard combinatorial constraints reliably.
- **Decision:** Use Google OR-Tools CP-SAT. It provides state-of-the-art constraint programming with SAT-based conflict-driven clause learning, native interval variables for time windows, and deterministic execution.

---

### DECISION 002: Inversion of Multi-Horizon Planning Dependency
- **Date:** 2026-09-11
- **Status:** APPROVED
- **Context:** Document A's original design posited that the monthly horizon was a "superset-consistent restriction of the weekly-horizon solve". The red-team audit noted this has the standard strategic-to-tactical dependency direction inverted.
- **Decision:** Correct the multi-horizon architecture:
  - *Monthly Solve:* Coarse macro-level optimization over a 30-day window. Establishes possession-hour quotas and statutory task allocations per section.
  - *Weekly Solve:* Tactical micro-level optimization over a 7-day window. Solves exact 5-minute time slots, constrained to not violate the monthly section envelope.

---

### DECISION 003: Addition of Independent Zero-Trust Safety Validator
- **Date:** 2026-09-11
- **Status:** APPROVED
- **Context:** The red-team audit flagged that the original design trusted the optimizer's internal constraint satisfaction without an external verification layer. In railway safety-critical operations, this is a major vulnerability.
- **Decision:** Build an independent Safety Validator module completely decoupled from the OR-Tools solver. Before any schedule can be displayed or exported, the validator independently executes exhaustive checks on train conflicts, section exclusivity, safety compatibility matrices, and duration bounds.

---

### DECISION 004: Latent-Noise Synthetic Generation (Anti-Circularity Strategy)
- **Date:** 2026-09-11
- **Status:** APPROVED
- **Context:** TMS, SMMS, TDMS, and COA data are internal to Indian Railways and cannot be accessed publicly. If synthetic data is generated using the exact same deterministic rules as the ML priority model and optimizer, the evaluation becomes circular and artificial.
- **Decision:** Augment the synthetic data generator with latent unobserved variables (e.g., hidden environmental factors, metallurgy batch anomalies, unrecorded ballast moisture) that impact true asset degradation. The ML model is trained only on observable features and must learn to generalize in the presence of noise.

---

### DECISION 005: Automated Infeasibility Handling via Slack Relaxation
- **Date:** 2026-09-11
- **Status:** APPROVED
- **Context:** A pure constraint satisfaction solver returns `INFEASIBLE` when hard statutory deadlines collide with train paths or corridor closures, yielding a blank plan or a crash.
- **Decision:** Implement an automated Infeasibility Relaxation Engine. When CP-SAT reports `INFEASIBLE`, a secondary relaxation model identifies the minimal constraint violation, relaxes the softest constraint with an explicit penalty, surfaces alternative time windows, and raises an urgent escalation flag for the human controller.

---

### DECISION 006: Rejection of Full Stochastic Optimization and Deep-Net Scheduling
- **Date:** 2026-09-11
- **Status:** APPROVED
- **Context:** Consideration of chance-constrained stochastic programming and deep reinforcement learning.
- **Decision:** Rejected as unnecessary over-engineering. Full stochastic optimization introduces severe computational overhead without reliable real-world probability distributions. Deep RL is opaque, unsafe, and untrusted by railway operators. SETU achieves robust scheduling via P90 duration buffers, rolling-horizon warm-starts, and deterministic CP-SAT constraints.
