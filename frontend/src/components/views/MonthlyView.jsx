import React from 'react'

export default function MonthlyView({ sections, onSwitchToWeek }) {
  const monthlyBudgets = [
    { section: 'NDLS–ANVR Up Main', allocatedHours: 24.0, plannedHours: 16.5, remainingHours: 7.5, healthIndex: 88 },
    { section: 'ANVR–GZB Down Main', allocatedHours: 20.0, plannedHours: 14.0, remainingHours: 6.0, healthIndex: 82 },
    { section: 'GZB–MTC Chord Line', allocatedHours: 18.0, plannedHours: 11.5, remainingHours: 6.5, healthIndex: 91 },
    { section: 'GZB–ALJN Up Fast', allocatedHours: 28.0, plannedHours: 21.0, remainingHours: 7.0, healthIndex: 76 },
    { section: 'ALJN–TDL Down Slow', allocatedHours: 22.0, plannedHours: 15.0, remainingHours: 7.0, healthIndex: 84 },
    { section: 'Sahibabad Bypass Freight', allocatedHours: 16.0, plannedHours: 9.5, remainingHours: 6.5, healthIndex: 94 },
  ]

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Strategic Monthly Horizon
            </h1>
            <span style={{ fontSize: '10.5px', fontWeight: 700, background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd', padding: '2px 8px', borderRadius: '4px' }}>
              ENVELOPE TIER 1
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            30-day corridor downtime envelopes ensuring tactical weekly block plans do not exhaust monthly line capacity.
          </p>
        </div>

        <button
          className="btn-action"
          onClick={onSwitchToWeek}
          style={{ fontSize: '12px' }}
        >
          Refine to 7-Day Tactical Plan ▸
        </button>
      </div>

      {/* Monthly Aggregate Capacity Envelope Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        <div className="card-surface" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly Quota Budget</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            128.0 Hours
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Total corridor allowance</div>
        </div>

        <div className="card-surface" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Committed Tactical Hours</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#60a5fa', marginTop: '2px' }}>
            88.5 Hours
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>69.1% consumption</div>
        </div>

        <div className="card-surface" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Remaining Reserve</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '2px' }}>
            39.5 Hours
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Emergency & weather buffer</div>
        </div>
      </div>

      {/* Section Strategic Envelopes */}
      <div className="card-surface" style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Section Possession Consumption
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {monthlyBudgets.map((b, i) => {
            const pct = Math.round((b.plannedHours / b.allocatedHours) * 100)
            return (
              <div key={i} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {b.section}
                  </span>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      <b>{b.plannedHours}h</b> / {b.allocatedHours}h ({pct}%)
                    </span>
                    <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                      +{b.remainingHours}h reserve
                    </span>
                  </div>
                </div>

                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: pct > 85 ? 'var(--accent-amber)' : 'var(--accent-primary)',
                    borderRadius: '3px'
                  }}></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
