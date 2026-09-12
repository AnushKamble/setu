# SETU — Six-Day Advanced Development Master Plan
### Reconciling Document A (original design), Document B (36-hour audit), and the official PS, under a 6-day + 36-hour timeline

---

## PART 1 — Reconciliation: Original vs. Audited vs. Now-Planned

| Item | Document A (original) | Document B (audit) | Now (6-day plan) | Why |
|---|---|---|---|---|
| Joint possession ledger + CP-SAT convoy optimization | Core | Kept — core moat confirmed | **Kept, unchanged in spirit** | Directly targets the PS bottleneck; nothing in the audit questioned this |
| Multi-horizon (weekly/monthly) consistency | Constraint 8, direction unspecified/backwards | Flagged as likely inverted | **Corrected**: monthly sets a coarse possession-hour envelope per section/department; weekly refines within it | Was cut for correctness, not for time — now fixed regardless of timeline |
| Independent safety validator | **Absent** | Flagged as highest-priority gap | **Added, Day 2–3** | Was never cut — it was simply missing. Now the single highest-leverage build item |
| Infeasibility relaxation / "NO FEASIBLE PLAN" path | **Absent** | Flagged as required | **Added, Day 3** | Same — missing, not cut. High feasibility, high judge value |
| Latent-noise synthetic generator (anti-circularity) | Absent (generator was rule-only) | Flagged as critical data-integrity fix | **Added, Day 1** | Genuinely enabled by extra time — doing this properly under 36-hour pressure was unrealistic |
| Resource-pool constraint (crew/equipment) | Deferred ("optional extension") | Confirmed real feasibility gap | **Added, Day 2 (minimal), Day 4 (full)** | **Cut solely for 36-hour time**, now restored — this is exactly the kind of item six extra days unlocks |
| Duration quantile (p50/p90) model | Deferred/cuttable | Recommended: use p90 in hard constraint at minimum | **p90-in-constraint on Day 2; full quantile model Day 3 if time allows** | Cut for time, not weakness — cheap win, restore first |
| LLM prose polish in explanation layer | Optional | Confirmed low value-add, real hallucination risk | **Kept optional, template-first, LLM only as a Day 6 cosmetic pass** | Correctly deprioritized in both documents — stays deprioritized |
| Auditor role/screen | Cuttable | Confirmed lowest priority | **Deferred to Day 6 stretch, likely cut** | Genuinely low value for a demo — not brought back |
| Network-level (multi-section) delay propagation | Not designed | Explicitly scoped out as Phase-2 | **Added as v0 in Day 5, deliberately shallow (1-hop only)** | This is the one place extra time justifies scope *expansion* beyond the original design, because the PS's "uninterrupted train operations" implies more than single-section reasoning |
| Full stochastic/chance-constrained optimization | Not proposed | Explicitly discouraged as over-engineering | **Still not built** — buffer-based robustness (p90 constraint) only | Correctly rejected in both prior documents; six days does not change this verdict — it would still be a bad trade against demo-facing capability |
| Job dependency chains (inspect→diagnose→repair→test) | Not modeled | Noted as acceptable scope-cut | **Still not built** | Genuinely low value for this PS's scope (block requests are typically atomic already) — six days is better spent elsewhere |

**Net effect:** six extra days are spent almost entirely on (a) fixing things that were *wrong or missing*, not merely rushed, and (b) restoring two or three genuinely valuable items that were cut purely for time. This is intentionally not "36-hour plan + 20 features."

---

## PART 2 — Fresh PS Traceability (post-fix)

| PS Requirement | Now-planned coverage | Gap remaining | New opportunity unlocked by 6 days |
|---|---|---|---|
| Integrate TMS/SMMS/TDMS + COA corridor/timetable/goods-forecast | Ingestion adapter interfaces + canonical schema, synthetic-backed | Still zero real-data validation (unavoidable — RED data) | Ask organizers on Day 0 for any sample schema; if none, this remains an honest, disclosed limitation |
| AI/ML prioritize by criticality/urgency/impact | GBM priority model, now trained against a latent-noise-augmented generator (fixes circularity) | Accuracy still unverifiable against real outcomes | A genuine held-out adversarial scenario test (Day 3) — was impossible to build carefully in 36 hours |
| Optimize block scheduling, multi-department coordination | CP-SAT + convoy + corrected horizon logic + independent validator + infeasibility fallback | Full resource/crew modeling still partial | Minimal resource-pool constraint (Day 2), extendable to fuller model if Day 4 has slack |
| Weekly and monthly plans | Corrected two-tier rolling horizon (monthly envelope → weekly refine) | Not yet load-tested at realistic multi-week scale | Explicit Day 5 test: run monthly horizon, confirm weekly refinements never violate the envelope |
| "Data-driven, coordinated process," implicit safety | Independent safety validator, audit trail, HITL controls (pin/override) | Compatibility matrix still needs a domain-knowledgeable sanity pass | Day 3: explicit mentor/domain review session scheduled, not left informal |

**Classification:** requirements 2 and 3 (AI/ML prioritization, multi-department optimization) move from PARTIALLY→**SUBSTANTIALLY COVERED**; requirement 1 (integration) stays honestly **PARTIALLY COVERED** (data reality, not effort, is the limiter); requirement 4 (multi-horizon) moves from AMBIGUOUS→**FULLY COVERED** once the direction fix is implemented and tested.

---

## PART 3 — What Six Extra Days Actually Change (feature table)

| Feature | 36h feasibility | 6d feasibility | Technical value | Innovation value | Demo value | Real-world value | Risk |
|---|---|---|---|---|---|---|---|
| Independent safety validator | Medium | High | High | Med | Med | High | Low |
| Infeasibility relaxation engine | Low-Med | High | High | Med | High | High | Low |
| Latent-noise data generator | Low | High | High | Med | Low | High (credibility) | Low |
| Minimal resource-pool constraint | Low | High | Med | Low | Med | High | Low |
| p90-duration robustness | Trivial either way | Trivial | Low | Low | Low | Med | None |
| Corrected multi-horizon logic | Med (rushed) | High (tested properly) | High | Med | Med | High | Med |
| Convoy/opportunity mining | Medium | High (validated on harder scenarios) | High | Med-High | High | High | Low |
| Cost-of-waiting engine | Medium | High (grounded, ordinal-safe version) | Med | Med | High | Med | Low |
| Dynamic replanning w/ frozen state | Low | High | High | Med | High | High | Med |
| Network-impact v0 (1-hop propagation) | **Not feasible** | Medium | Med-High | High | High | Med-High | Med |
| Full stochastic optimization | Not feasible | **Not recommended even now** | High | Med | Low | Low (over-engineering) | High |
| Full crew-scheduling detail | Not feasible | **Not recommended — diminishing returns** | Med | Low | Low | Med | Med |
| Historical replay | Not feasible | Low (no real history exists) | Low | Low | Low | Low | Med (nothing to replay) |
| Weather-aware planning | Not feasible | Low (would be synthetic-on-synthetic) | Low | Low | Low | Low | Med |

**Conclusion:** six days justify building the safety/feasibility/data-integrity fixes properly, restoring 2–3 previously-cut items, and adding exactly one new capability (network-impact v0) that wasn't responsible to attempt in 36 hours. It does **not** justify stochastic optimization, full crew-scheduling, historical replay, or weather modeling — these remain correctly out of scope regardless of time available, because the data/impact case for them is weak, not because of a time constraint.

---

## PART 4–5 — Second-Order Progression & Product Definition

Progression selected (not the maximal chain, the *right* one):
**Scheduler → Predictive Scheduler (priority-coupled) → Opportunity-Aware Scheduler (convoy) → Risk-Managed Scheduler (safety validator + infeasibility handling + cost-of-waiting) → Network-Aware Decision Support (1-hop impact v0)**

This deliberately stops short of "full Network Decision Intelligence" — that would require the multi-section digital twin and stochastic layers this plan just rejected. The product remains named **SETU** and positioned as a **single coherent possession-planning decision-support system**, not a bundle of modules. No renaming to "Railway Infrastructure Decision Intelligence" — that positioning would overclaim relative to what's actually built, and an honest, precise name survives judge scrutiny better than an inflated one.

---

## PART 6–7 — Innovation Hunt, Scored (top candidates only; full 30-idea sweep retained in team notes)

| Idea | Novelty | Tech depth | Railway value | Data feasibility | Math sophistication | 6d feasibility | 36h integration | Demo | Judge memorability | Competition resistance | Future value | **Total/110** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Independent safety validator | 6 | 6 | 9 | 8 | 5 | 9 | 9 | 6 | 8 | 9 | 8 | **83** |
| Infeasibility relaxation engine | 7 | 7 | 9 | 8 | 6 | 9 | 8 | 8 | 8 | 8 | 8 | **86** |
| Convoy + opportunity mining (validated) | 8 | 8 | 9 | 6 | 7 | 8 | 7 | 9 | 9 | 8 | 8 | **87** |
| Cost-of-waiting (ordinal, honest) | 7 | 6 | 8 | 5 | 6 | 8 | 7 | 8 | 8 | 7 | 7 | **77** |
| Dynamic replanning (frozen-state) | 7 | 8 | 8 | 6 | 6 | 8 | 6 | 9 | 8 | 7 | 8 | **81** |
| Network-impact v0 | 8 | 7 | 7 | 4 | 6 | 6 | 4 | 8 | 8 | 8 | 7 | **73** |
| Latent-noise generator fix | 5 | 6 | 6 | 9 | 5 | 9 | 8 | 3 | 4 | 6 | 7 | **68** (low demo value, but a prerequisite for everything else's credibility — kept regardless of score) |

**Selected 6 (final):** safety validator, infeasibility relaxation, convoy/opportunity mining (hardened), cost-of-waiting (ordinal), dynamic replanning, network-impact v0 — plus the latent-noise fix as a mandatory prerequisite that doesn't need to "win" on demo score to be required.

---

## PART 36 — Architecture Options, Scored, and Final Choice

| | Option A: Conservative 36h-only | Option B: 6-day corrected | Option C: Maximum feasible (stochastic + full network + crew-scheduling) |
|---|---|---|---|
| Feasibility | High | High | **Low — rejected** |
| PS coverage | Partial | Strong | Strong but fragile |
| Safety credibility | Weak (no validator) | **Strong** | Strong |
| Demo impact | Medium | **High** | High but over-built, more likely to break live |
| Judge memorability | Medium | **High** | Risk of "impressive but couldn't defend it" |
| Overall | 62/100 | **86/100** | 58/100 (penalized heavily for fragility and unverifiable claims) |

**Chosen: Option B** — the corrected, six-day-scoped architecture from Part 3/6-7 above. Option C is explicitly rejected: it would reintroduce exactly the "sound sophisticated, can't defend it" failure mode the audit warned against.

---

## PART 55 (final architecture diagram)

```
RAILWAY STATE (canonical ledger, status state-machine, resource pools)
        ↓
PREDICTIVE ENGINE (GBM priority model trained on latent-noise-augmented data;
                    p90 duration; ordinal cost-of-waiting trend)
        ↓
OPPORTUNITY MINING (spatial + safety + temporal + resource-disjoint compatibility)
        ↓
CP-SAT OPTIMIZER (convoy z-vars, lexicographic staged objective — configurable order,
                   corrected monthly-envelope → weekly-refine horizon)
        ↓
   ├── FEASIBLE → INDEPENDENT SAFETY VALIDATOR (separate code path)
   │        ↓
   │   NETWORK-IMPACT v0 (1-hop propagation estimate on adjacent section)
   │        ↓
   │   EXPLANATION LAYER (typed SolverResult → template; optional LLM prose)
   │        ↓
   │   OPERATOR REVIEW (approve / pin / override) → FINAL PLAN
   │        ↓
   │   DISRUPTION EVENT → ROLLING-HORIZON RE-SOLVE (frozen in-progress state excluded)
   │
   └── INFEASIBLE → RELAXATION ENGINE → alternative window / defer / manual-intervention flag
```

---

## PART 37–38 — Six-Day Schedule with Exit Criteria

| Day | Build | Exit criterion (must be true by end of day) |
|---|---|---|
| **1** | Canonical schema (status state-machine, resource pools); latent-noise synthetic generator; greedy baseline scheduler | Baseline scheduler runs end-to-end on generated data and produces a KPI table |
| **2** | CP-SAT model (core sets/vars/constraints, corrected horizon logic, p90 constraint, minimal resource-pool constraint) | Optimizer runs and beats the baseline on the same scenario, with printed KPI deltas |
| **3** | GBM priority model (trained on de-circularized data) wired into the optimizer objective; adversarial held-out stress-test scenario run | Priority predictions demonstrably change which jobs the optimizer selects (not decorative) |
| **4** | Independent safety validator (separate module); infeasibility relaxation engine; convoy/opportunity mining hardened against the stress-test scenario | An intentionally-impossible scenario is fed in and the system returns a structured "NO FEASIBLE PLAN + alternatives" response, not a crash or silent violation |
| **5** | Dynamic replanning with frozen in-progress state; network-impact v0 (1-hop); cost-of-waiting (ordinal) | A disruption event triggers a re-solve that respects frozen jobs and completes in a measured, reported time |
| **6** | Frontend (5 screens + pin/override controls); explanation layer wired to typed SolverResult; full integration; benchmarking at 3 scales | Full Golden Path (Part 55) runs once, end-to-end, without manual intervention |

**No day is allowed to end without a working increment** — Day 6 is explicitly not the first time the pipeline is connected end-to-end (partial integration happens progressively from Day 2 onward, per the Golden Path in Part 55/72 below).

---

## PART 39–40 — 36-Hour Finale Plan & Feature Freeze

| Checkpoint | Time | Rule |
|---|---|---|
| T-36h (start) | Hour 0 | Re-verify Day-6 Golden Path still runs on fresh checkout; refresh demo data |
| T-24h | Architecture freeze | No new modules; only bug fixes and integration work inside existing modules |
| T-12h | Feature freeze | No new features of any kind, including "small" ones |
| T-6h | Demo freeze | Demo script and scenario data are locked; no further changes to the demo path, only fixes to bugs found in rehearsal |
| T-2h | Emergency-only | Only fixes for crashes/regressions; no cosmetic changes |

36-hour priority order: **(1) reliability, (2) integration, (3) demo scenario polish, (4) performance, (5) visual polish, (6) last-minute corrections** — matching Part 39's instruction exactly; no new research modules attempted in this window under any circumstance, even with slack time (that slack goes to rehearsal, per the prior audit's Section 60 recommendation).

---

## PART 41–42 — Demo-Critical Features & Primary Wow Factor

Chosen narrative (Option D from Part 42 — the coherent combined flow, not three disconnected wow moments): **18 requests → convoy discovery reduces to fewer possessions → live disruption injected → digital twin propagates the effect one hop → optimizer re-plans in seconds with frozen in-progress jobs respected → "what if we postpone this job 7 days" counterfactual shown → every step explained from real solver output.** One continuous story, ~4 minutes, matching the original demo script's structure with the two audit-driven additions (infeasibility path, network-impact v0) inserted as secondary beats, not replacing the primary one.

---

## PART 43–47 — Metrics, Performance Targets, Validation (targets, to be measured not assumed)

| Metric | Target (to verify empirically on Day 6, not assumed) |
|---|---|
| Optimizer solve time, demo scenario (~20-40 jobs) | < 5 seconds |
| Rolling-horizon re-solve after disruption | < 3 seconds |
| Independent validator check | < 1 second |
| Frontend update after re-plan | < 2 seconds perceived |

All numbers here are **targets to be benchmarked**, not claims to repeat to judges until Day 6 benchmarking confirms them (Part 44's instruction: "do not fabricate" is taken literally).

Independent constraint validator (Part 47) is mandatory and built on Day 4, checking: train conflicts, possession overlap, resource conflicts, department/safety compatibility, precedence (where modeled), duration, safety windows — using code entirely separate from the CP-SAT model.

---

## PART 57–58 — Team Allocation (assuming 5–6 people)

- **Data/Sim:** canonical schema + synthetic generator (Days 1, ongoing stress-test scenarios Day 3)
- **Optimization:** CP-SAT model, safety validator, infeasibility engine (Days 2–4, core critical path)
- **ML:** priority model, cost-of-waiting formula (Days 3, coordinating closely with Optimization on the coupling)
- **Backend/API:** FastAPI, canonical schema wiring, explanation contract (Days 1–5, parallel track)
- **Frontend:** built against mocked plan JSON from Day 2 onward, integrated for real by Day 6
- **Integration/QA/Demo:** owns the Golden Path test from Day 2 onward, owns the 36-hour freeze schedule enforcement

AI coding assistants used for: boilerplate, adapters, frontend components, test scaffolding, documentation. Humans retain control of: objective function design, constraint correctness, the `safe(j,j')` compatibility matrix, dataset realism assumptions, evaluation methodology, and any claim made to judges.

---

## PART 65–66 — Red-Team Checklist (condensed; carried over from the audit, now with owners)

Bad data / impossible schedule / resource collision / train conflict / disruption mid-execution / optimizer timeout / conflicting objectives / operator override race conditions — each of these gets an explicit test case authored on Day 4 (paired with the infeasibility/validator work) rather than discovered live during the 36-hour finale.

---

## PART 68 — Final Deliverables Checklist

1. Corrected architecture — **this document, Part 55**
2. Six-day advanced feature set — **Part 6–7**
3. Feature priority matrix — **Part 3, 6–7**
4. PS compliance matrix — **Part 2**
5. Design audit findings — carried from prior audit document
6. Additional innovative features — **Part 6–7 selected 6**
7–12. Mathematical/ML/digital-twin/simulation/optimization/data architectures — specified in Parts 3, 55, and executed below in code
13–18. Database/API/frontend/testing/benchmarking/deployment — scaffolded below in execution
19–20. Six-day and 36-hour schedules — **Part 37–40**
21. Team allocation — **Part 57**
22. Demo design — **Part 41–42**
23. Judge defense — carried from prior audit's Section 58, extended with network-impact-v0 and infeasibility-path questions
24. Risk register — carried from prior audit, updated with Day-by-day owners
25. Final SIH score — pending Day 6 benchmarking; audit's 6.7/10 becomes the floor to beat once the four must-fix items are actually built

---

## PART 72 — Execution Status (live, updated as work proceeds)

See `STATUS.md` in this repository for the current DONE / IN PROGRESS / BLOCKED / NEXT log. Execution begins immediately following this document with Day 1 deliverables: canonical schema, latent-noise synthetic generator, and greedy baseline scheduler.
