import React, { useState, useEffect } from 'react'

export default function BlockModal({ block, jobs, onClose, onPlanUpdated }) {
  if (!block) return null

  const [candidateWindows, setCandidateWindows] = useState([])
  const [selectedNewWindow, setSelectedNewWindow] = useState('')
  const [operatorNotes, setOperatorNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionStatus, setActionStatus] = useState(null)

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

      setActionStatus({ type: 'success', message: `Successfully executed: ${action}` })
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
  const usedPct = 100 - bufferPct

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(30, 41, 59, 0.7)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {block.block_id}
              </h3>
              {block.is_convoy ? (
                <span className="dept-pill convoy">JOINT CONVOY</span>
              ) : (
                <span className="dept-pill engg">SINGLE BLOCK</span>
              )}
              {block.is_pinned && (
                <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(234, 88, 12, 0.2)', color: '#fb923c', border: '1px solid rgba(251, 146, 60, 0.4)', padding: '2px 8px', borderRadius: '4px' }}>
                  PINNED
                </span>
              )}
              {block.status === 'APPROVED' && (
                <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.4)', padding: '2px 8px', borderRadius: '4px' }}>
                  APPROVED
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
              Track Section: <b style={{ color: 'var(--text-primary)' }}>{block.section_id}</b>
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
           aria-label="Close"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
          {/* Status Message Notification */}
          {actionStatus && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px',
              fontWeight: 600,
              background: actionStatus.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              border: `1px solid ${actionStatus.type === 'success' ? '#10b981' : '#f43f5e'}`,
              color: actionStatus.type === 'success' ? '#34d399' : '#fda4af'
            }}>
              {actionStatus.message}
            </div>
          )}

          {/* Timing & Capacity Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Window Slot</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                Minute {block.start_minute} – {block.end_minute}
              </div>
            </div>
            <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Duration</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {block.duration_min} Minutes
              </div>
            </div>
            <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Safety Buffer</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-emerald)', marginTop: '2px' }}>
                +{block.buffer_min} Minutes ({bufferPct}%)
              </div>
            </div>
          </div>

          {/* Visual Duration Capacity Bar */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Capacity Consumption (P90 Buffers):</span>
              <span style={{ fontWeight: 600 }}>{block.used_duration_p90_min}m Used / {block.buffer_min}m Buffer</span>
            </div>
            <div style={{
              height: '10px',
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.06)',
              overflow: 'hidden',
              display: 'flex'
            }}>
              <div style={{ width: `${usedPct}%`, background: 'linear-gradient(90deg, #38bdf8, #6366f1)', borderRadius: '9999px 0 0 9999px' }}></div>
              <div style={{ width: `${bufferPct}%`, background: '#10b981' }}></div>
            </div>
          </div>

          {/* Operator Interactive Decision & Override Panel */}
          <div style={{
            background: 'rgba(56, 189, 248, 0.05)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '22px'
          }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Operator Human-in-the-Loop Controls</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>(Document D Part 55)</span>
            </h4>

            {/* Reassign to Alternative Window */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Change / Reassign Window Slot for this Section:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={selectedNewWindow}
                  onChange={(e) => setSelectedNewWindow(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'var(--bg-subtle)',
                    color: 'white',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '12px'
                  }}
                >
                  {candidateWindows.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.label} {w.id === block.window_id ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-action btn-secondary"
                  style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                  disabled={actionLoading || selectedNewWindow === block.window_id}
                  onClick={() => handleOperatorAction('REASSIGN_WINDOW', selectedNewWindow)}
                >
                  Apply Reassignment
                </button>
              </div>
            </div>

            {/* Action Buttons: Pin, Approve, Defer */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn-action"
                style={{
                  background: block.is_pinned ? '#b45309' : 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid #f59e0b',
                  color: block.is_pinned ? 'white' : '#fbbf24',
                  fontSize: '12px'
                }}
                disabled={actionLoading}
                onClick={() => handleOperatorAction(block.is_pinned ? 'UNPIN' : 'PIN')}
              >
                {block.is_pinned ? 'Unpin Block' : 'Pin Block (Lock)'}
              </button>

              <button
                className="btn-action btn-success"
                style={{ fontSize: '12px' }}
                disabled={actionLoading}
                onClick={() => handleOperatorAction('APPROVE')}
              >
                Approve for BDMS Export
              </button>

              <button
                className="btn-action btn-danger"
                style={{ fontSize: '12px' }}
                disabled={actionLoading}
                onClick={() => handleOperatorAction('REJECT')}
              >
                Defer / Reject Possession
              </button>
            </div>
          </div>

          {/* Bundled Maintenance Jobs */}
          <div style={{ marginBottom: '22px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Bundled Maintenance Work Orders ({jobsByBlock.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {jobsByBlock.map(j => (
                <div key={j.id} style={{
                  background: 'var(--bg-subtle)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px' }}>{j.id}</span>
                      <span className={`dept-pill ${j.department === 'ENGINEERING' ? 'engg' : j.department === 'TRD' ? 'trd' : 'snt'}`}>
                        {j.department}
                      </span>
                      {j.statutory_deadline_minute && (
                        <span style={{ fontSize: '10px', color: 'var(--accent-rose)', fontWeight: 800 }}>STATUTORY</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      {j.job_type} • P90 Duration: <b style={{ color: 'var(--text-primary)' }}>{j.duration_p90_min}m</b>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {(j.priority_score * 100).toFixed(0)}% Priority
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-amber)' }}>
                      +{j.cost_of_waiting} risk/wk
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Solver Reason Explanation */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Mathematical Solver Justification
            </h4>
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              padding: '14px',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              lineHeight: '1.6'
            }}>
              {block.explanation}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'rgba(15, 23, 42, 0.6)'
        }}>
          <button className="btn-action btn-secondary" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  )
}
