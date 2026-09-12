import React, { useState } from 'react'

export default function AuditView({ explanationReport }) {
  const [filterAction, setFilterAction] = useState('ALL')

  const auditEvents = [
    { time: '14:02:10', action: 'OPTIMIZER_SOLVE', title: 'CP-SAT Exact Optimizer generated schedule', detail: '0.28s execution time. 11 possessions created, 7 joint convoys formed.', user: 'SYSTEM (CP-SAT)' },
    { time: '14:02:45', action: 'SAFETY_AUDIT', title: 'Zero-Trust Independent Validator verified plan', detail: 'Passed all 7 mathematical railway safety invariants with 0 conflicts.', user: 'VALIDATOR_SERVICE' },
    { time: '14:03:12', action: 'CONVOY_FORMATION', title: 'Joint Convoy formed on NDLS–ANVR Up Track', detail: 'Bundled Track Tamping (Engineering) with OHE Droppers (TRD) into 150m Night Window.', user: 'SYSTEM (CP-SAT)' },
    { time: '14:04:30', action: 'OPERATOR_REVIEW', title: 'Operations Officer reviewed Block BLK-SEC-NDLS-ANVR-1', detail: 'Inspected duration buffer and statutory priority ranking.', user: 'OFFICER_NR_04' },
    { time: '14:06:15', action: 'OPERATOR_PIN', title: 'Block pinned to Candidate Window WIN-NDLS-ANVR-D1-0090', detail: 'Hard constraint pinned. Solver will preserve this assignment during replans.', user: 'OFFICER_NR_04' },
    { time: '14:08:00', action: 'BDMS_EXPORT', title: 'BDMS Possession Requisitions bundle exported', detail: 'Cryptographic SHA-256 integrity hash generated for upstream Indian Railways filing.', user: 'OFFICER_NR_04' },
  ]

  const filtered = filterAction === 'ALL'
    ? auditEvents
    : auditEvents.filter(e => e.action === filterAction)

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Chronological Audit Log
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Deterministic traceability for every solver optimization, operator override, and safety sign-off.
          </p>
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          style={{
            padding: '6px 12px',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          <option value="ALL">All Event Types</option>
          <option value="OPTIMIZER_SOLVE">Optimizer Solves</option>
          <option value="SAFETY_AUDIT">Safety Audits</option>
          <option value="OPERATOR_PIN">Operator Pins & Overrides</option>
          <option value="BDMS_EXPORT">BDMS Exports</option>
        </select>
      </div>

      {/* 2. Timeline List */}
      <div className="card-surface" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((item, idx) => (
            <div key={idx} style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
              paddingBottom: idx === filtered.length - 1 ? 0 : '16px',
              borderBottom: idx === filtered.length - 1 ? 'none' : '1px solid var(--border-subtle)'
            }}>
              <span className="mono" style={{ fontSize: '11.5px', color: 'var(--text-muted)', paddingTop: '2px', minWidth: '65px' }}>
                {item.time}
              </span>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: '10.5px', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    {item.user}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                  {item.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
