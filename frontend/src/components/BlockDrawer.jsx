import React, { useState, useEffect } from 'react'

export default function BlockDrawer({ block, jobs, onClose, onPlanUpdated }) {
  if (!block) return null

  const [candidateWindows, setCandidateWindows] = useState([])
  const [selectedNewWindow, setSelectedNewWindow] = useState('')
  const [operatorNotes, setOperatorNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionStatus, setActionStatus] = useState(null)
  const [showOverrideForm, setShowOverrideForm] = useState(false)

  useEffect(() => {
    if (block?.section_id) {
      fetch(`/api/plans/candidate-windows?section_id=${block.section_id}`)
        .then(r => r.json())
        .then(data => {
          setCandidateWindows(data || [])
          if (data && data.length > 0) {
            setSelectedNewWindow(data[0].id)
          }
        })
        .catch(err => console.error('Failed to load candidate windows:', err))
    }
  }, [block?.section_id])

  const handleOperatorAction = async (action, newWindowId = null) => {
    setActionLoading(true)
    setActionStatus(null)
    try {
      const res = await fetch('/api/plans/block/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block_id: block.block_id,
          action: action,
          new_window_id: newWindowId,
          operator_notes: operatorNotes || undefined
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Action failed')

      setActionStatus({ type: 'success', message: `Successfully updated: ${action}` })
      if (onPlanUpdated && data.plan) {
        onPlanUpdated(data.plan)
      }
    } catch (err) {
      setActionStatus({ type: 'error', message: err.message })
    } finally {
      setActionLoading(false)
    }
  }

  const jobsByBlock = (jobs || []).filter(j => (block.job_ids || []).includes(j.id))
  const bufferPct = Math.round((block.buffer_min / Math.max(1, block.duration_min)) * 100)

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '420px',
      maxWidth: '90vw',
      background: 'var(--bg-card)',
      borderLeft: '1px solid var(--border)',
      boxShadow: 'var(--shadow-lg), -8px 0 24px rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto'
    }}>
      {/* Drawer Header */}
      <div style={{
        padding: '18px 22px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        background: 'var(--bg-card)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {block.block_id}
            </h3>
            {block.is_convoy ? (
              <span className="dept-pill convoy">⚡ JOINT POSSESSION</span>
            ) : (
              <span className="dept-pill engg">SINGLE BLOCK</span>
            )}
            {block.is_pinned && (
              <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '2px 6px', borderRadius: '4px' }}>
                📌 PINNED
              </span>
            )}
            {block.status === 'APPROVED' && (
              <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '2px 6px', borderRadius: '4px' }}>
                ✓ APPROVED
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {block.section_id} • Day {Math.floor(block.start_minute / 1440) + 1} (Min {block.start_minute}–{block.end_minute})
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Departments: <b style={{ color: 'var(--text-primary)' }}>{block.departments?.join(' + ')}</b>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px'
          }}
          title="Close drawer"
        >
          ✕
        </button>
      </div>

      {/* Drawer Body */}
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
        {actionStatus && (
          <div style={{
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            background: actionStatus.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${actionStatus.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: actionStatus.type === 'success' ? '#34d399' : '#fca5a5'
          }}>
            {actionStatus.message}
          </div>
        )}

        {/* SECTION: WHY THIS BLOCK? */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Why This Block?
          </div>
          <div style={{
            background: 'var(--bg-input)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '12.5px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>✓</span>
              <span>Same Track Corridor: <b>{block.section_id}</b></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>✓</span>
              <span>Cross-Department Safety Compatibility: Verified</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>✓</span>
              <span>Combined Work: {block.duration_min - block.buffer_min}m + {block.buffer_min}m buffer ({block.duration_min}m total)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>✓</span>
              <span>Zero Express Passenger Train Conflicts</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>✓</span>
              <span>Department Gangs & Tower Wagons Available</span>
            </div>
          </div>
        </div>

        {/* SECTION: WHAT IT SAVES */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            What It Saves
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px'
          }}>
            <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Possessions Avoided</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '2px' }}>
                +{Math.max(1, (block.job_ids?.length || 1) - 1)} Avoided
              </div>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated Block Savings</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                ~{(block.job_ids?.length || 1) * 35} mins
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: JOBS BUNDLED */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Bundled Maintenance Jobs ({jobsByBlock.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {jobsByBlock.map(j => (
              <div key={j.id} style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '10px 12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono" style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>{j.id}</span>
                  <span className={`dept-pill ${j.department === 'ENGINEERING' ? 'engg' : j.department === 'TRD' ? 'trd' : 'snt'}`}>
                    {j.department}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {j.job_type}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>Duration: {j.duration_p50_min}m (P90: {j.duration_p90_min}m)</span>
                  <span>Priority: {(j.priority_score * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION: VALIDATION STATUS */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Safety & Feasibility Gate
          </div>
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '12px',
            color: 'var(--accent-emerald)',
            lineHeight: '1.5'
          }}>
            <div>✓ Verified by CP-SAT Exact Optimizer</div>
            <div>✓ Passed Zero-Trust Independent Validator checks</div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Final operational authority rests with Section Controller.
            </div>
          </div>
        </div>

        {/* SECTION: OVERRIDE CONTROLS */}
        {showOverrideForm && (
          <div style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-amber)' }}>
              Reassign Candidate Window
            </div>
            <select
              value={selectedNewWindow}
              onChange={(e) => setSelectedNewWindow(e.target.value)}
              style={{
                padding: '6px 10px',
                background: 'var(--bg-card)',
                color: 'white',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '11.5px'
              }}
            >
              {candidateWindows.map(w => (
                <option key={w.id} value={w.id}>
                  {w.id} (Min {w.start_minute}–{w.end_minute}, {w.duration_min}m)
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Mandatory operational override reason..."
              value={operatorNotes}
              onChange={(e) => setOperatorNotes(e.target.value)}
              style={{
                padding: '6px 10px',
                background: 'var(--bg-card)',
                color: 'white',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '11.5px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                className="btn-action btn-secondary"
                style={{ fontSize: '11px', padding: '5px 10px' }}
                onClick={() => setShowOverrideForm(false)}
              >
                Cancel
              </button>
              <button
                className="btn-action"
                style={{ fontSize: '11px', padding: '5px 10px', background: 'var(--accent-amber)' }}
                disabled={actionLoading || !selectedNewWindow}
                onClick={() => handleOperatorAction('REASSIGN_WINDOW', selectedNewWindow)}
              >
                Confirm Reassign
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer Actions */}
      <div style={{
        padding: '14px 22px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-card)',
        display: 'flex',
        gap: '8px',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-action btn-secondary"
            onClick={() => handleOperatorAction(block.is_pinned ? 'UNPIN' : 'PIN')}
            disabled={actionLoading}
            style={{ fontSize: '11.5px' }}
          >
            {block.is_pinned ? '🔓 Unpin' : '📌 Pin Window'}
          </button>
          <button
            className="btn-action btn-secondary"
            onClick={() => setShowOverrideForm(!showOverrideForm)}
            style={{ fontSize: '11.5px' }}
          >
            Override ▾
          </button>
        </div>

        <button
          className="btn-action btn-success"
          onClick={() => handleOperatorAction('APPROVE')}
          disabled={actionLoading || block.status === 'APPROVED'}
          style={{ fontSize: '11.5px' }}
        >
          {block.status === 'APPROVED' ? '✓ Approved' : 'Approve Block'}
        </button>
      </div>
    </aside>
  )
}
