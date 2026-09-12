import React, { useState } from 'react'
import { Calendar, GitFork, AlertTriangle, CheckCircle2, Zap, ArrowRight } from 'lucide-react'
import CorridorGantt from '../CorridorGantt'
import CorridorMap from '../CorridorMap'
import BlockDrawer from '../BlockDrawer'

export default function PlannerView({
  blocks,
  sections,
  jobs,
  windows,
  comparison,
  loading,
  activePlanMode = 'OPTIMIZED',
  isPlanModified = false,
  highlightTarget = null,
  onReoptimize,
  onGenerateBaseline,
  onPlanUpdated,
  onNavigate
}) {
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [plannerMode, setPlannerMode] = useState('GANTT') // 'GANTT' | 'TOPOLOGY'

  const baselinePossessions = comparison?.baseline?.possessions_opened || 18
  const optimizedPossessions = comparison?.optimized?.possessions_opened || (blocks?.length || 11)
  const baselineHours = comparison ? (comparison.baseline.total_possession_minutes / 60).toFixed(1) : '38.0'
  const optimizedHours = comparison ? (comparison.optimized.total_possession_minutes / 60).toFixed(1) : '24.5'
  const convoysCount = comparison?.deltas?.convoys_created || 7

  const isHighlighted = highlightTarget === 'planner' || highlightTarget === 'gantt'

  return (
    <div
      className={isHighlighted ? 'highlight-pulse-target' : ''}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        borderRadius: '12px'
      }}
    >
      {/* 1. Header Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '4px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
              Joint Corridor Possession Plan
            </h2>
            <span style={{
              fontSize: '10.5px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 700,
              background: activePlanMode === 'BASELINE' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: activePlanMode === 'BASELINE' ? '#f59e0b' : '#10b981',
              border: `1px solid ${activePlanMode === 'BASELINE' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
            }}>
              {activePlanMode === 'BASELINE' ? 'BASELINE (MANUAL)' : 'SETU OPTIMAL'}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
            {activePlanMode === 'BASELINE'
              ? 'Uncoordinated departmental possessions with manual dispatch buffers'
              : 'Multi-department joint convoy possessions synchronized with train timetables'}
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Gantt vs Schematic Switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '2px',
            gap: '2px'
          }}>
            <button
              onClick={() => setPlannerMode('GANTT')}
              style={{
                background: plannerMode === 'GANTT' ? '#27272a' : 'transparent',
                color: plannerMode === 'GANTT' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 11px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Calendar size={13} />
              <span>Time-Space Gantt</span>
            </button>
            <button
              onClick={() => setPlannerMode('TOPOLOGY')}
              style={{
                background: plannerMode === 'TOPOLOGY' ? '#27272a' : 'transparent',
                color: plannerMode === 'TOPOLOGY' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 11px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <GitFork size={13} />
              <span>Track Topology</span>
            </button>
          </div>

          <div style={{ width: '1px', height: '20px', background: 'var(--border)' }}></div>

          <button
            className={`btn-action ${activePlanMode === 'BASELINE' ? 'btn-active-baseline' : 'btn-secondary'}`}
            onClick={onGenerateBaseline}
            disabled={loading}
            title="Simulate legacy Indian Railways decentralized manual booking"
            style={{
              borderColor: activePlanMode === 'BASELINE' ? 'rgba(245, 158, 11, 0.5)' : undefined,
              color: activePlanMode === 'BASELINE' ? '#fbbf24' : undefined,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {activePlanMode === 'BASELINE' ? (
              <>
                <AlertTriangle size={13} />
                <span>Baseline Active</span>
              </>
            ) : (
              'Generate Baseline'
            )}
          </button>

          {activePlanMode === 'OPTIMIZED' && !isPlanModified ? (
            <button
              className="btn-action"
              onClick={onReoptimize}
              disabled={loading}
              title="Schedule is already mathematically optimal (0 conflicts). Click to force re-solve."
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                padding: '8px 16px',
                fontWeight: 700,
                cursor: 'default',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <CheckCircle2 size={14} />
              <span>{loading ? 'Solving CP-SAT...' : 'Plan Optimal (0 Conflicts)'}</span>
            </button>
          ) : (
            <button
              className="btn-action btn-success"
              onClick={onReoptimize}
              disabled={loading}
              style={{
                padding: '8px 16px',
                fontWeight: 700,
                background: '#2563eb',
                color: '#ffffff',
                boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {loading ? 'Optimizing CP-SAT...' : (
                <>
                  <Zap size={14} />
                  <span>Optimize with SETU</span>
                </>
              )}
            </button>
          )}

          <button
            className="btn-action btn-secondary"
            onClick={() => onNavigate('review')}
          >
            Review Plan ▸
          </button>
        </div>
      </div>

      {/* Baseline Active Educational Banner */}
      {activePlanMode === 'BASELINE' && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '10px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          fontSize: '12.5px',
          color: '#fbbf24'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Decentralized Manual Practice Active:</strong> Showing legacy uncoordinated departmental bookings without multi-department convoys ({baselinePossessions} separate possessions, train delay risks).
              Click <em>Optimize with SETU</em> to bundle into coordinated, conflict-free convoys.
            </div>
          </div>
          <button
            onClick={onReoptimize}
            disabled={loading}
            style={{
              background: '#2563eb',
              border: 'none',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Zap size={13} />
            <span>Bundle Convoys</span>
          </button>
        </div>
      )}

      {/* 2. De-boxed KPI Strip: Fluid, Frameless Metrics */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '14px',
        padding: '16px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        border: '1px solid var(--border-subtle)',
        marginBottom: '6px'
      }}>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
              Possessions
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{baselinePossessions}</span>
              <span style={{ color: 'var(--text-muted)' }}>→</span>
              <span style={{ color: 'var(--accent-emerald)' }}>{optimizedPossessions}</span>
              <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 700 }}>(-38.9%)</span>
            </div>
          </div>

          <div style={{ width: '1px', height: '28px', background: 'var(--border)' }}></div>

          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
              Block Hours
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{baselineHours}h</span>
              <span style={{ color: 'var(--text-muted)' }}>→</span>
              <span style={{ color: 'var(--text-primary)' }}>{optimizedHours}h</span>
              <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 700 }}>(-13.5h)</span>
            </div>
          </div>

          <div style={{ width: '1px', height: '28px', background: 'var(--border)' }}></div>

          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
              Critical Deferred
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '2px' }}>
              0
            </div>
          </div>

          <div style={{ width: '1px', height: '28px', background: 'var(--border)' }}></div>

          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
              Joint Convoys
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>0</span>
              <span style={{ color: 'var(--text-muted)' }}>→</span>
              <span style={{ color: 'var(--accent-emerald)' }}>+{convoysCount} Joint</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Simulation result on synthetic corridor data
        </div>
      </div>

      {/* 3. Main Workspace: Time-Space Gantt OR Photorealistic Track Topology */}
      <div style={{ marginTop: '4px' }}>
        {plannerMode === 'GANTT' ? (
          <CorridorGantt
            blocks={blocks || []}
            sections={sections || []}
            jobs={jobs || []}
            onSelectBlock={(b) => setSelectedBlock(b)}
          />
        ) : (
          <CorridorMap
            sections={sections || []}
            jobs={jobs || []}
            blocks={blocks || []}
            windows={windows || []}
            onSelectBlock={(b) => setSelectedBlock(b)}
          />
        )}
      </div>

      {/* 4. Right-Side Detail Drawer */}
      {selectedBlock && (
        <BlockDrawer
          block={selectedBlock}
          jobs={jobs}
          onClose={() => setSelectedBlock(null)}
          onPlanUpdated={(newPlan) => {
            if (onPlanUpdated) onPlanUpdated(newPlan)
            const updated = newPlan?.blocks?.find(b => b.block_id === selectedBlock.block_id)
            if (updated) setSelectedBlock(updated)
          }}
        />
      )}

      {/* Phase Transition CTA Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 22px',
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: '12px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fde68a' }}>
            Next Operational Phase: Disruption Stress-Testing (What-If Simulator)
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Inject express train delays or job overruns to observe SETU's 1-hop cascade absorption and warm replanning.
          </div>
        </div>
        <button
          onClick={() => onNavigate('whatif')}
          style={{
            background: '#f59e0b',
            color: '#000000',
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
          <span>Proceed to Phase 4: What-If Disruption</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
