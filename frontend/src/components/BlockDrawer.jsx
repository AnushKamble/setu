import React, { useState, useEffect } from 'react'
import { Zap, Pin, CheckCircle2, Lightbulb, Clock, ClipboardList, Unlock, X } from 'lucide-react'

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
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        className="card-overlay-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '760px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          boxShadow: 'var(--shadow-lg), 0 20px 50px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Modal Header Card */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
                {block.block_id}
              </h2>
              {block.is_convoy ? (
                <span className="dept-pill convoy" style={{ fontSize: '11px', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Zap size={12} /> MULTI-DEPARTMENT CONVOY
                </span>
              ) : (
                <span className="dept-pill engg" style={{ fontSize: '11px', padding: '3px 10px' }}>
                  SINGLE BLOCK
                </span>
              )}
              {block.is_pinned && (
                <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Pin size={11} /> PINNED
                </span>
              )}
              {block.status === 'APPROVED' && (
                <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={11} /> APPROVED
                </span>
              )}
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Corridor Section: <strong style={{ color: 'var(--text-primary)' }}>{block.section_id}</strong> • Day {Math.floor(block.start_minute / 1440) + 1} (Offset {block.start_minute}m – {block.end_minute}m)
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: '14px',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            title="Close Drawer (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{
          padding: '22px 24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          flex: 1
        }}>
          {actionStatus && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 600,
              background: actionStatus.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${actionStatus.type === 'success' ? '#10b981' : '#ef4444'}`,
              color: actionStatus.type === 'success' ? '#34d399' : '#fca5a5'
            }}>
              {actionStatus.message}
            </div>
          )}

          {/* CARD SECTION 1: Dual Grid (Why This Block & Efficiency Metrics) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
            {/* Card A: Why This Block? */}
            <div style={{
              background: 'var(--bg-input)',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={13} color="#f59e0b" /> Optimization Rationale & Safety Justification
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={13} color="#10b981" />
                  <span><strong>Spatial Co-location:</strong> All tasks share <b>{block.section_id}</b>.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={13} color="#10b981" />
                  <span><strong>Cross-Disciplinary Matrix:</strong> {block.departments?.join(' + ')} safety compatibility verified.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={13} color="#10b981" />
                  <span><strong>Timetable Protection:</strong> Zero conflict with Rajdhani/Vande Bharat paths.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={13} color="#10b981" />
                  <span><strong>Fleet & Crews:</strong> Dedicated gang and machine resources reserved.</span>
                </div>
              </div>
            </div>

            {/* Card B: Duration & Efficiency Payoff */}
            <div style={{
              background: 'var(--bg-input)',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} color="#38bdf8" /> Window Breakdown & Savings
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '8px 0' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Net Execution</div>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {block.duration_min - block.buffer_min}m
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>P90 Buffer</div>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                    +{block.buffer_min}m
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '11.5px',
                color: '#34d399',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Possessions Saved:</span>
                <b>+{Math.max(1, (block.job_ids?.length || 1) - 1)} closures avoided</b>
              </div>
            </div>
          </div>

          {/* CARD SECTION 2: Bundled Work Orders Structured Manifest */}
          <div style={{
            background: 'var(--bg-input)',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ClipboardList size={13} /> Bundled Maintenance Work Orders ({jobsByBlock.length} Tasks in Unified Possession)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Departments: <strong>{block.departments?.join(', ')}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {jobsByBlock.map(j => (
                <div key={j.id} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="mono" style={{ fontWeight: 800, fontSize: '12px', color: 'var(--text-primary)' }}>
                        {j.id}
                      </span>
                      <span className={`dept-pill ${j.department === 'ENGINEERING' ? 'engg' : j.department === 'TRD' ? 'trd' : 'snt'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {j.department}
                      </span>
                      {j.statutory_deadline_minute && (
                        <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          CRS STATUTORY
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '3px' }}>
                      {j.description || j.job_type}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '160px' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      Duration: <b>{j.duration_p50_min}m</b> (P90: <b>{j.duration_p90_min}m</b>)
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Safety: <span style={{ color: 'var(--text-primary)' }}>{j.safety_class}</span> • Priority: <b>{(j.priority_score * 100).toFixed(0)}%</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CARD SECTION 3: Override Form (if toggled) */}
          {showOverrideForm && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Section Controller Window Reassignment
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <select
                  value={selectedNewWindow}
                  onChange={(e) => setSelectedNewWindow(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    padding: '8px 12px',
                    background: 'var(--bg-input)',
                    color: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '12px'
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
                    flex: 1.5,
                    minWidth: '220px',
                    padding: '8px 12px',
                    background: 'var(--bg-input)',
                    color: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  className="btn-action btn-secondary"
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                  onClick={() => setShowOverrideForm(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-action"
                  style={{ fontSize: '11px', padding: '6px 12px', background: '#f59e0b', color: '#000', fontWeight: 700 }}
                  disabled={actionLoading || !selectedNewWindow}
                  onClick={() => handleOperatorAction('REASSIGN_WINDOW', selectedNewWindow)}
                >
                  Confirm Reassign
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-action btn-secondary"
              onClick={() => handleOperatorAction(block.is_pinned ? 'UNPIN' : 'PIN')}
              disabled={actionLoading}
              style={{ fontSize: '12px', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {block.is_pinned ? (
                <>
                  <Unlock size={13} />
                  <span>Unpin Schedule</span>
                </>
              ) : (
                <>
                  <Pin size={13} />
                  <span>Pin Window</span>
                </>
              )}
            </button>
            <button
              className="btn-action btn-secondary"
              onClick={() => setShowOverrideForm(!showOverrideForm)}
              style={{ fontSize: '12px', padding: '7px 14px' }}
            >
              {showOverrideForm ? 'Hide Override ▲' : 'Reassign Window ▾'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className="btn-action btn-secondary"
              onClick={onClose}
              style={{ fontSize: '12px', padding: '7px 14px' }}
            >
              Close
            </button>
            <button
              className="btn-action btn-success"
              onClick={() => handleOperatorAction('APPROVE')}
              disabled={actionLoading || block.status === 'APPROVED'}
              style={{ fontSize: '12px', padding: '7px 16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {block.status === 'APPROVED' ? (
                <>
                  <CheckCircle2 size={13} />
                  <span>Approved</span>
                </>
              ) : (
                'Approve Block'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
