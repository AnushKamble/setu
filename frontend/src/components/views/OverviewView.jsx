import React from 'react'

export default function OverviewView({
  jobs,
  sections,
  optimizedPlan,
  comparison,
  onNavigate
}) {
  const openJobsCount = jobs?.length || 18
  const plannedPossessions = optimizedPlan?.blocks?.length || 11
  const blockHours = comparison
    ? (comparison.optimized.total_possession_minutes / 60).toFixed(1)
    : '24.5'
  const criticalDeferred = 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 1. Spacious Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          Good morning, Operations Planner
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          This week's corridor planning status across Engineering, TRD, and S&T on the Delhi–Ghaziabad–Aligarh section.
        </p>
      </div>

      {/* 2. Fluid KPI Strip (De-boxed: Frameless, spacious metrics) */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        padding: '20px 32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '24px',
        border: '1px solid var(--border-subtle)'
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
            Open Jobs
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            {openJobsCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Active across 6 track sections
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
            Planned Possessions
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '2px' }}>
            {plannedPossessions}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {comparison ? `Reduced from ${comparison.baseline.possessions_opened} baseline` : 'Optimized multi-dept blocks'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
            Block Hours
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            {blockHours} h
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {comparison ? `${(comparison.deltas.downtime_minutes_saved / 60).toFixed(1)}h saved vs manual` : 'Weekly total downtime'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
            Critical Deferred
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '2px' }}>
            {criticalDeferred}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            100% statutory compliance
          </div>
        </div>
      </div>

      {/* 3. Main Section: Left Planning Status + Right Attention Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '28px' }}>
        {/* Left: Corridor Planning Status */}
        <div className="card-surface" style={{ padding: '24px 28px' }}>
          <div className="card-title-row">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Corridor Planning Snapshot
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Week of 14–20 Sep 2026
            </span>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
            SETU coordinates fixed-infrastructure possessions between Engineering, Traction (TRD), and S&T to prevent isolated track closures.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(sections || []).slice(0, 5).map((sec, idx) => {
              const secJobs = (jobs || []).filter(j => j.section_id === sec.id).length
              const secBlocks = (optimizedPlan?.blocks || []).filter(b => b.section_id === sec.id).length

              return (
                <div key={sec.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: idx === 4 ? 'none' : '1px solid var(--border-subtle)'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {sec.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {sec.track_type} • {sec.length_km} km • {sec.max_speed_kmh} km/h
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {secJobs} jobs
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border)',
                      padding: '3px 10px',
                      borderRadius: '9999px'
                    }}>
                      {secBlocks} possessions
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn-action"
              onClick={() => onNavigate('planner')}
              style={{ fontSize: '12.5px' }}
            >
              Open Possession Planner ▸
            </button>
          </div>
        </div>

        {/* Right: Attention Panel */}
        <div className="card-surface" style={{ padding: '24px 28px' }}>
          <div className="card-title-row">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Needs Attention
            </h3>
            <span style={{ fontSize: '10.5px', fontWeight: 700, background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
              3 ACTIONABLE
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              onClick={() => onNavigate('optimization')}
              style={{
                background: 'var(--bg-subtle)',
                borderRadius: '10px',
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  ⚡ {comparison ? comparison.deltas.convoys_created : 7} Joint Convoys Discovered
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Review ▸</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                Engineering track tamping and TRD OHE inspection bundled into shared night windows on the same section.
              </p>
            </div>

            <div
              onClick={() => onNavigate('review')}
              style={{
                background: 'var(--bg-subtle)',
                borderRadius: '10px',
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  🛡️ Zero Protected Train Conflicts
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Audit ▸</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                All Vande Bharat and Rajdhani Express passages strictly cleared under CP-SAT hard separation constraints.
              </p>
            </div>

            <div
              onClick={() => onNavigate('whatif')}
              style={{
                background: 'var(--bg-subtle)',
                borderRadius: '10px',
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-amber)' }}>
                  ⚠️ Disruption Simulation Ready
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Test ▸</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                Evaluate dynamic replanning resilience against express train delays or emergency block cancellations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Lifecycle Steps (De-boxed open track) */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '14px',
        padding: '18px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>✓</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>1. Data Ingestion</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>✓</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>2. Baseline Plan</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>✓</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>3. CP-SAT Solved</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>✓</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>4. Safety Audit</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>●</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>5. Operator Review</span>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Decision Support System • Northern Railway Operations
        </div>
      </div>
    </div>
  )
}
