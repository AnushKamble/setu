import React from 'react'

export default function OptimizeCompareView({
  comparison,
  explanationReport,
  onNavigate,
  onSelectBlockId
}) {
  if (!comparison) return <div>Loading comparison data...</div>

  const baseline = comparison.baseline
  const opt = comparison.optimized
  const deltas = comparison.deltas

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          Optimization Results
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          SETU found a significantly more efficient corridor possession schedule by bundling cross-department work.
        </p>
      </div>

      {/* 2. Before -> SETU -> After Side-by-Side Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Baseline Column */}
        <div className="card-surface" style={{ borderLeft: '3px solid #64748b', padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Manual Decentralized Baseline
            </h3>
            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
              CURRENT PRACTICE
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.4' }}>
            Independent scheduling where Engineering, Electrical, and S&T book separate, uncoordinated track possessions.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Track Possessions:</span>
              <b style={{ color: 'var(--text-primary)' }}>{baseline.possessions_opened} isolated blocks</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Line Downtime:</span>
              <b>{baseline.total_possession_minutes} mins ({(baseline.total_possession_minutes / 60).toFixed(1)} hrs)</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Cross-Department Convoys:</span>
              <span style={{ color: 'var(--text-muted)' }}>0 (Zero synergy)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Timetable Conflicts:</span>
              <span style={{ color: 'var(--accent-amber)' }}>{baseline.train_conflicts} clashes risk</span>
            </div>
          </div>
        </div>

        {/* SETU Column */}
        <div className="card-surface" style={{ borderLeft: '3px solid var(--accent-emerald)', padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              SETU Optimized Convoy Plan
            </h3>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 7px', borderRadius: '4px' }}>
              EXACT CP-SAT SOLVER
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.4' }}>
            Multi-department combinatorial optimization bundling spatially and temporally compatible jobs into unified possessions.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Track Possessions:</span>
              <b style={{ color: 'var(--accent-emerald)' }}>{opt.possessions_opened} blocks (-{deltas.percentage_possessions_reduced}%)</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Line Downtime:</span>
              <b style={{ color: 'var(--text-primary)' }}>{opt.total_possession_minutes} mins ({(opt.total_possession_minutes / 60).toFixed(1)} hrs)</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Cross-Department Convoys:</span>
              <b style={{ color: 'var(--accent-emerald)' }}>{opt.convoys_formed} joint possessions</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Solve Computation Time:</span>
              <b style={{ color: 'var(--text-primary)' }}>{opt.solve_time_seconds}s (Sub-second exact)</b>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Three Restrained Comparison Visualizations */}
      <div className="card-surface" style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Key Performance Deltas
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {/* Delta 1: Block Reduction */}
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Track Block Closures
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700 }}>
              <span style={{ color: 'var(--text-muted)' }}>{baseline.possessions_opened}</span>
              <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(opt.possessions_opened / baseline.possessions_opened) * 100}%`, height: '100%', background: 'var(--accent-emerald)' }}></div>
              </div>
              <span style={{ color: 'var(--accent-emerald)' }}>{opt.possessions_opened} blocks</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              -{deltas.possessions_avoided} isolated track closures avoided
            </div>
          </div>

          {/* Delta 2: Possession Hours */}
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Corridor Downtime Hours
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700 }}>
              <span style={{ color: 'var(--text-muted)' }}>{(baseline.total_possession_minutes/60).toFixed(1)}h</span>
              <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(opt.total_possession_minutes / baseline.total_possession_minutes) * 100}%`, height: '100%', background: 'var(--accent-primary)' }}></div>
              </div>
              <span style={{ color: 'var(--text-primary)' }}>{(opt.total_possession_minutes/60).toFixed(1)}h</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              -{(deltas.downtime_minutes_saved / 60).toFixed(1)} hours of line closure saved
            </div>
          </div>

          {/* Delta 3: Joint Convoys */}
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Multi-Department Convoys
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700 }}>
              <span style={{ color: 'var(--text-muted)' }}>0</span>
              <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: 'var(--accent-emerald)' }}></div>
              </div>
              <span style={{ color: 'var(--accent-emerald)' }}>+{deltas.convoys_created} Convoys</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Engineering, TRD, and S&T working under shared blocks
            </div>
          </div>
        </div>
      </div>

      {/* 4. "Why Did SETU Do This?" Section */}
      <div className="card-surface" style={{ padding: '20px 24px' }}>
        <div style={{ marginBottom: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Why Did SETU Make These Decisions?
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Explainable reasoning connecting mathematical solver output to human operational logic.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            onClick={() => onNavigate('planner')}
            style={{
              padding: '12px 16px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease'
            }}
            className="card-surface-hover"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>01</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Clustered 7 Maintenance Requests into Coordinated Joint Convoys
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Engineering track tamping and TRD insulator washing share the same track segment. Running them concurrently avoids having to close the corridor twice.
                </div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Inspect in Planner ▸</span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('planner')}
            style={{
              padding: '12px 16px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease'
            }}
            className="card-surface-hover"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>02</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Protected Passenger Express Trains in High-Traffic Slots
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Vande Bharat and Rajdhani express timetables were enforced as hard exclusion intervals. Heavy maintenance was scheduled into night windows (01:30–04:00).
                </div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Inspect in Planner ▸</span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('maintenance')}
            style={{
              padding: '12px 16px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease'
            }}
            className="card-surface-hover"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>03</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Strict Statutory Compliance for Overdue Safety Defects
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Statutory rail weld ultrasonic inspections and turnout switch renewals were guaranteed slots prior to regulatory deadline exhaustion.
                </div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>View Backlog ▸</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
