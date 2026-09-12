import React from 'react'
import { GitFork, Zap, ShieldCheck, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'

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
        {/* Left: Corridor Planning Status */}
        <div className="card-surface" style={{ padding: '24px 28px' }}>
          <div className="card-title-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Corridor Planning Snapshot
                </h3>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}>
                  {sections?.length || 0} TRACK SECTIONS
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                Multi-department synchronized possessions across all active corridor track sections.
              </p>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Week of 14–20 Sep 2026
            </span>
          </div>

          {/* Tabular Scrollable Container */}
          <div style={{
            marginTop: '16px',
            maxHeight: '380px',
            overflowY: 'auto',
            overflowX: 'auto',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.2)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead style={{
                position: 'sticky',
                top: 0,
                background: '#12151c',
                borderBottom: '1px solid var(--border)',
                zIndex: 2
              }}>
                <tr style={{ color: 'var(--text-muted)', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '10px 12px' }}>Track Section</th>
                  <th style={{ padding: '10px 12px' }}>Line & Type</th>
                  <th style={{ padding: '10px 12px' }}>Length</th>
                  <th style={{ padding: '10px 12px' }}>Speed</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Active Jobs</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Joint Blocks</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(sections || []).map((sec, idx) => {
                  const secJobs = (jobs || []).filter(j => j.section_id === sec.id).length
                  const secBlocks = (optimizedPlan?.blocks || []).filter(b => b.section_id === sec.id).length
                  const isUp = sec.track_type?.includes('UP')

                  return (
                    <tr
                      key={sec.id || idx}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {sec.name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {sec.id}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: isUp ? 'rgba(56, 189, 248, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: isUp ? '#38bdf8' : '#34d399',
                          border: `1px solid ${isUp ? 'rgba(56, 189, 248, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                        }}>
                          {sec.track_type || 'MAIN'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                        {sec.length_km} km
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                        {sec.max_speed_kmh} km/h
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: secJobs > 0 ? '#fbbf24' : 'var(--text-muted)',
                          background: secJobs > 0 ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                          padding: '2px 8px',
                          borderRadius: '9999px'
                        }}>
                          {secJobs} {secJobs === 1 ? 'job' : 'jobs'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: secBlocks > 0 ? '#34d399' : 'var(--text-muted)',
                          background: secBlocks > 0 ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                          border: secBlocks > 0 ? '1px solid rgba(16, 185, 129, 0.3)' : 'none',
                          padding: '2px 8px',
                          borderRadius: '9999px'
                        }}>
                          {secBlocks} {secBlocks === 1 ? 'block' : 'blocks'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button
                          onClick={() => onNavigate('planner')}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border)',
                            color: '#38bdf8',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                          title={`Open ${sec.name} in Possession Planner`}
                        >
                          Planner ↗
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Showing all <strong>{sections?.length || 0}</strong> sections (Total Corridor Length: {((sections || []).reduce((acc, s) => acc + (s.length_km || 0), 0) / 2).toFixed(1)} km)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="horizon-pill-btn"
                onClick={() => onNavigate('topology')}
                style={{ height: '30px', padding: '0 12px', background: 'rgba(255, 255, 255, 0.05)', color: '#e4e4e7', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <GitFork size={13} />
                <span>Track Topology</span>
              </button>
              <button
                className="btn-action"
                onClick={() => onNavigate('planner')}
                style={{ fontSize: '12px', height: '30px', padding: '0 14px' }}
              >
                Open Possession Planner ▸
              </button>
            </div>
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
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={13} color="var(--accent-emerald)" />
                  <span>{comparison ? comparison.deltas.convoys_created : 7} Joint Convoys Discovered</span>
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
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={13} color="#38bdf8" />
                  <span>Zero Protected Train Conflicts</span>
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
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={13} color="var(--accent-amber)" />
                  <span>Disruption Simulation Ready</span>
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
            <CheckCircle2 size={13} color="var(--accent-emerald)" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>1. Data Ingestion</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
            <CheckCircle2 size={13} color="var(--accent-emerald)" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>2. Baseline Plan</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
            <CheckCircle2 size={13} color="var(--accent-emerald)" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>3. CP-SAT Solved</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
            <CheckCircle2 size={13} color="var(--accent-emerald)" />
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

      {/* Phase Transition CTA Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 22px',
        background: 'rgba(37, 99, 235, 0.08)',
        border: '1px solid rgba(37, 99, 235, 0.25)',
        borderRadius: '12px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#93c5fd' }}>
            Next Operational Phase: Step 2 Demands, Block Windows & Train Timetable
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Review corridor backlog, available capacity slots, and real-time WTT schedules before running AI optimization.
          </div>
        </div>
        <button
          onClick={() => onNavigate('demand')}
          style={{
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '9px 18px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>Proceed to Step 2: Demands & Timetable</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
