import React, { useState } from 'react'
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header & Primary Guided Action */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Possession Planner
            </h1>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              TACTICAL HORIZON
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Week of 14–20 Sep 2026 • Corridor: Delhi–Ghaziabad–Aligarh (S10–S15)
          </p>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Segmented View Switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-input)',
            borderRadius: '6px',
            padding: '2px',
            border: '1px solid var(--border)'
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
              <span>📅</span>
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
              <span>🛤️</span>
              <span>Track Topology</span>
            </button>
          </div>

          <div style={{ width: '1px', height: '20px', background: 'var(--border)' }}></div>

          <button
            className="btn-action btn-secondary"
            onClick={onGenerateBaseline}
            disabled={loading}
          >
            Generate Baseline
          </button>

          <button
            className="btn-action btn-success"
            onClick={onReoptimize}
            disabled={loading}
            style={{ padding: '8px 16px', fontWeight: 700 }}
          >
            {loading ? 'Optimizing...' : '⚡ Optimize with SETU'}
          </button>

          <button
            className="btn-action btn-secondary"
            onClick={() => onNavigate('review')}
          >
            Review Plan ▸
          </button>
        </div>
      </div>

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
        border: '1px solid var(--border-subtle)'
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
      <div>
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
    </div>
  )
}
