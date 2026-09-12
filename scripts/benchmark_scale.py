"""
Comprehensive Large-Scale Stress Testing & Benchmarking Suite for SETU
Evaluates OR-Tools CP-SAT formulation, Marey space-time conflict invariance,
and Digital Twin simulation latency across escalating problem scales.
"""
import sys
import os
import time
import psutil

# Ensure utf-8 output on Windows terminal
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure project root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database import reset_db, SessionLocal
from backend.app.datagen.generator import RailwayDataGenerator
from backend.app.optimizer.solver import BlockOptimizer
from backend.app.validator.checker import IndependentValidator
from backend.app.simulation.digital_twin import DigitalTwinState
from backend.app.models.railway import Section, Asset, MaintenanceJob, CorridorWindow, TrainMovement, DepartmentResource


def run_scale_test(name: str, job_count: int, train_count_mult: float, num_sections: int = 6, horizon_days: int = 7):
    print(f"\n{'='*70}")
    print(f"🚀 RUNNING BENCHMARK: {name}")
    print(f"   Target: {job_count} Jobs | Train Multiplier: {train_count_mult}x | {num_sections} Sections | {horizon_days}-Day Horizon")
    print(f"{'='*70}")

    process = psutil.Process(os.getpid())
    mem_before = process.memory_info().rss / (1024 * 1024)

    # 1. Synthetic Network Scaling
    t0 = time.perf_counter()
    gen = RailwayDataGenerator(seed=42)
    base_sections = gen.generate_network()
    
    sections = list(base_sections)
    if num_sections > len(base_sections):
        for i in range(len(base_sections), num_sections):
            track_type = "UP_MAIN" if i % 2 == 0 else "DN_MAIN"
            sec = Section(
                id=f"SEC-EXT-{i:02d}-{track_type[:2]}",
                name=f"Extended Corridor Sector {i+1}",
                division="DELHI",
                track_type=track_type,
                length_km=50.0 + (i * 10),
                max_speed_kmh=130,
                adjacent_section_ids=[]
            )
            sections.append(sec)

    resources = gen.generate_resources()
    res_mult = max(1, job_count // 30)
    for r in resources:
        r.total_units = r.total_units * res_mult

    assets, jobs = gen.generate_assets_and_jobs(sections, job_count_target=job_count, statutory_ratio=0.25)
    windows, trains = gen.generate_windows_and_trains(sections, horizon_days=horizon_days)
    
    if train_count_mult > 1.0:
        extra_trains = []
        multiplier = int(train_count_mult)
        for m in range(1, multiplier):
            for t in trains:
                new_t = TrainMovement(
                    id=f"{t.id}-X{m}",
                    train_number=f"{t.train_number}{m}",
                    train_name=f"{t.train_name} Ext-{m}",
                    priority_class=t.priority_class,
                    section_id=t.section_id,
                    entry_minute=min(10080, t.entry_minute + (m * 45)),
                    exit_minute=min(10080, t.exit_minute + (m * 45)),
                    is_goods_forecast=t.is_goods_forecast,
                    delay_probability=t.delay_probability
                )
                extra_trains.append(new_t)
        trains.extend(extra_trains)

    datagen_time = time.perf_counter() - t0
    print(f"  [1/4] Network Generation: {datagen_time:.3f}s (Jobs: {len(jobs)}, Windows: {len(windows)}, Trains: {len(trains)})")

    # 2. OR-Tools CP-SAT Optimization Solver
    t1 = time.perf_counter()
    optimizer = BlockOptimizer(
        jobs=jobs,
        windows=windows,
        trains=trains,
        resources=resources,
        time_limit_seconds=15.0
    )
    result = optimizer.solve()
    solver_time = time.perf_counter() - t1
    print(f"  [2/4] CP-SAT Solver Execution: {solver_time:.3f}s | Status: {result.status}")
    print(f"        Scheduled: {result.scheduled_jobs_count}/{len(jobs)} Jobs ({result.scheduled_jobs_count*100//max(1,len(jobs))}%) | Convoys Formed: {result.convoys_formed_count}")
    print(f"        Possessions Avoided by Convoy Bundling: {result.possessions_avoided_by_convoy}")

    # 3. Independent Safety & Conflict Validation
    t2 = time.perf_counter()
    validation = IndependentValidator.validate(
        plan=result,
        jobs=jobs,
        windows=windows,
        trains=trains,
        resources=resources
    )
    val_time = time.perf_counter() - t2
    status_str = "PASSED (Zero Incompatibilities)" if validation.is_valid else f"FAILED ({validation.violations_count} violations)"
    print(f"  [3/4] Schedule Validation: {val_time:.3f}s | Status: {status_str}")
    print(f"        Checks Run: {validation.total_checks_run} | Violations Count: {validation.violations_count}")

    # 4. Digital Twin Cascade Simulation Latency
    t3 = time.perf_counter()
    twin = DigitalTwinState(
        sections=sections,
        assets=assets,
        jobs=jobs,
        windows=windows,
        trains=trains
    )
    disrupted_id = trains[0].id if trains else "T-1"
    sim_result = twin.inject_train_delay(
        train_id=disrupted_id,
        delay_minutes=45
    )
    sim_time = time.perf_counter() - t3
    affected_count = len(sim_result.trains_knocked_on)
    print(f"  [4/4] Digital Twin Simulation: {sim_time:.3f}s | Knock-on Affected Trains: {affected_count}")

    mem_after = process.memory_info().rss / (1024 * 1024)
    mem_delta = mem_after - mem_before
    print(f"  [RAM] Memory: {mem_after:.1f} MB (Delta: +{mem_delta:.1f} MB)")

    return {
        "scale": name,
        "jobs": len(jobs),
        "trains": len(trains),
        "windows": len(windows),
        "solver_time_s": solver_time,
        "solver_status": result.status,
        "jobs_scheduled": result.scheduled_jobs_count,
        "convoys": result.convoys_formed_count,
        "avoided": result.possessions_avoided_by_convoy,
        "is_valid": validation.is_valid,
        "sim_time_s": sim_time,
        "ram_mb": mem_after,
    }


def main():
    print("=" * 75)
    print("SETU ENTERPRISE BENCHMARK HARNESS - OR-TOOLS CP-SAT SCALABILITY")
    print("=" * 75)

    scales = [
        ("Level 1: Section Sub-division", 25, 1.0, 6, 7),
        ("Level 2: Standard Division (Delhi Div)", 60, 1.5, 6, 7),
        ("Level 3: Dense Freight/Express Division", 120, 2.0, 8, 7),
        ("Level 4: High-Density Trunk Corridor (NDLS-CNB)", 200, 3.0, 10, 7),
        ("Level 5: Mega-Division Enterprise Stress Limit", 350, 4.0, 12, 14),
    ]

    results = []
    for name, jobs, train_mult, secs, days in scales:
        try:
            res = run_scale_test(name, jobs, train_mult, secs, days)
            results.append(res)
        except Exception as e:
            print(f"❌ Error at scale {name}: {e}")
            import traceback
            traceback.print_exc()

    print("\n" + "=" * 90)
    print(f"{'BENCHMARK SUMMARY RESULTS TABLE':^90}")
    print("=" * 90)
    print(f"{'Scale Level':<42} | {'Jobs':<5} | {'Trains':<6} | {'Solve(s)':<8} | {'Status':<10} | {'Valid?':<6}")
    print("-" * 90)
    for r in results:
        valid_mark = "✅ YES" if r['is_valid'] else "❌ NO"
        print(f"{r['scale']:<42} | {r['jobs']:<5} | {r['trains']:<6} | {r['solver_time_s']:<8.2f} | {r['solver_status']:<10} | {valid_mark:<6}")
    print("=" * 90)


if __name__ == "__main__":
    main()
