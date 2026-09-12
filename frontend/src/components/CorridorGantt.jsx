import React, { useState } from 'react'

export default function CorridorGantt({ blocks, sections, jobs, onSelectBlock }) {
  const [selectedDay, setSelectedDay] = useState('ALL')
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('ALL')

  const isAllDays = selectedDay === 'ALL'
  const totalHorizonMin = 7 * 1440 // 10,080 mins

  const dayStartMin = isAllDays ? 0 : (selectedDay - 1) * 1440
  const dayEndMin = isAllDays ? totalHorizonMin : selectedDay * 1440

  const filteredSections = selectedSectionFilter === 'ALL' 
    ? (sections || [])
    : (sections || []).filter(s => s.id === selectedSectionFilter)

  // Filter blocks belonging to this day or all days
  const visibleBlocks = (blocks || []).filter(b => {
    if (isAllDays) return true
    return b.start_minute < dayEndMin && b.end_minute > dayStartMin
  })

  return (
    <div className="card-surface" style={{ marginBottom: '20px' }}>
      {/* Gantt Header & Controls Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Corridor Time-Space Possession Gantt
            </h3>
            <span className="live-indicator">ACTIVE TIMELINE</span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              {visibleBlocks.length} of {blocks?.length || 0} Blocks
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            {isAllDays 
              ? 'Showing all scheduled possessions across the full 7-day tactical horizon. Click any block to Pin, Reassign Window, or Approve.' 
              : `Showing scheduled possessions for Day ${selectedDay}. Click 'All 7 Days' to view full weekly schedule.`}
          </p>
        </div>

        {/* Day & Section Selectors */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Day Segmented Control */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-input)',
            borderRadius: '6px',
            padding: '2px',
            border: '1px solid var(--border)'
          }}>
            <button
              onClick={() => setSelectedDay('ALL')}
              style={{
                background: selectedDay === 'ALL' ? 'var(--accent-primary)' : 'transparent',
                color: selectedDay === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '4px 9px',
                borderRadius: '5px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              All 7 Days
            </button>
            {[1, 2, 3, 4, 5, 6, 7].map(d => {
              const dayBlocksCount = (blocks || []).filter(b => b.start_minute < d * 1440 && b.end_minute > (d - 1) * 1440).length
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  style={{
                    background: selectedDay === d ? 'var(--accent-primary)' : 'transparent',
                    color: selectedDay === d ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '5px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Day ${d}: ${dayBlocksCount} possessions`}
                >
                  D{d}
                </button>
              )
            })}
          </div>

          {/* Section Filter Dropdown */}
          <select
            value={selectedSectionFilter}
            onChange={(e) => setSelectedSectionFilter(e.target.value)}
            style={{
              padding: '5px 10px',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Sections</option>
            {(sections || []).map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.track_type})</option>
            ))}
          </select>

          {/* Direct Block Jump Dropdown (Clean, replaces 11+ wrapped buttons) */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                const target = blocks?.find(b => b.block_id === e.target.value)
                if (target) onSelectBlock(target)
                e.target.value = ''
              }
            }}
            defaultValue=""
            style={{
              padding: '5px 10px',
              background: 'var(--bg-input)',
              color: 'var(--accent-cyan)',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="" disabled>🔍 Jump to Block...</option>
            {(blocks || []).map(b => (
              <option key={b.block_id} value={b.block_id}>
                {b.is_pinned ? '📌 ' : b.status === 'APPROVED' ? '✅ ' : ''}{b.block_id} (D{Math.floor(b.start_minute / 1440) + 1} • {b.duration_min}m • {b.section_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Time Header Ruler */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '8px',
        marginBottom: '6px'
      }}>
        <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          Corridor Track Section
        </div>
        {isAllDays ? (
          <div style={{ position: 'relative', height: '18px', display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)' }}>
            <span>Day 1 (0h)</span>
            <span>Day 2 (24h)</span>
            <span>Day 3 (48h)</span>
            <span>Day 4 (72h)</span>
            <span>Day 5 (96h)</span>
            <span>Day 6 (120h)</span>
            <span>Day 7 (144h–168h)</span>
          </div>
        ) : (
          <div style={{ position: 'relative', height: '18px', display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)' }}>
            <span>00:00</span>
            <span>04:00 (Night Block)</span>
            <span>08:00</span>
            <span>12:00 (Off-Peak)</span>
            <span>16:00</span>
            <span>20:00</span>
            <span>24:00</span>
          </div>
        )}
      </div>

      {/* Track Section Gantt Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filteredSections.map(sec => {
          const secBlocks = visibleBlocks.filter(b => b.section_id === sec.id)

          return (
            <div key={sec.id} style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              {/* Section Identity */}
              <div>
                <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{sec.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: sec.track_type.includes('UP') ? 'rgba(59, 130, 246, 0.12)' : 'rgba(139, 92, 246, 0.12)',
                    color: sec.track_type.includes('UP') ? '#60a5fa' : '#c4b5fd'
                  }}>
                    {sec.track_type}
                  </span>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {sec.length_km}km • {sec.max_speed_kmh}km/h
                  </span>
                </div>
              </div>

              {/* Interactive Timeline Canvas */}
              <div style={{
                position: 'relative',
                height: '38px',
                background: 'var(--bg-input)',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                overflow: 'hidden'
              }}>
                {/* Night Maintenance Window Indicator (01:30 - 04:00 = mins 90 to 240) */}
                <div style={{
                  position: 'absolute',
                  left: `${(90 / 1440) * 100}%`,
                  width: `${(150 / 1440) * 100}%`,
                  top: 0,
                  bottom: 0,
                  background: 'rgba(59, 130, 246, 0.04)',
                  borderLeft: '1px dashed rgba(59, 130, 246, 0.15)',
                  borderRight: '1px dashed rgba(59, 130, 246, 0.15)',
                  pointerEvents: 'none'
                }}></div>

                {/* Mid-day Off-peak Window (11:30 - 13:00 = mins 690 to 780) */}
                <div style={{
                  position: 'absolute',
                  left: `${(690 / 1440) * 100}%`,
                  width: `${(90 / 1440) * 100}%`,
                  top: 0,
                  bottom: 0,
                  background: 'rgba(59, 130, 246, 0.03)',
                  borderLeft: '1px dashed rgba(59, 130, 246, 0.12)',
                  borderRight: '1px dashed rgba(59, 130, 246, 0.12)',
                  pointerEvents: 'none'
                }}></div>

                {/* Render Possession Blocks */}
                {secBlocks.map(b => {
                  const scaleMin = isAllDays ? totalHorizonMin : 1440
                  const relativeStart = isAllDays 
                    ? b.start_minute 
                    : Math.max(0, b.start_minute - dayStartMin)
                  const relativeEnd = isAllDays 
                    ? b.end_minute 
                    : Math.min(1440, b.end_minute - dayStartMin)
                  
                  const leftPct = (relativeStart / scaleMin) * 100
                  const widthPct = Math.max(isAllDays ? 2 : 4, ((relativeEnd - relativeStart) / scaleMin) * 100)

                  const isConvoy = b.is_convoy
                  const isPinned = b.is_pinned
                  const isApproved = b.status === 'APPROVED'

                  return (
                    <div
                      key={b.block_id}
                      onClick={() => onSelectBlock(b)}
                      className="gantt-block-bar"
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        background: isPinned
                          ? '#451a03'
                          : isApproved
                            ? '#064e3b'
                            : isConvoy
                              ? '#064e3b'
                              : '#27272a',
                        border: isPinned 
                          ? '1px solid #f59e0b' 
                          : isApproved 
                            ? '1px solid #10b981' 
                            : isConvoy 
                              ? '1px solid #10b981' 
                              : '1px solid rgba(255,255,255,0.12)',
                        color: isConvoy ? '#6ee7b7' : isPinned ? '#fde68a' : '#f4f4f5',
                        zIndex: 2,
                        boxShadow: 'var(--shadow-sm)'
                      }}
                      title={`Click to inspect or modify ${b.block_id}: Day ${Math.floor(b.start_minute / 1440) + 1} (${b.duration_min} mins)`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {isPinned ? '📌 PINNED' : isApproved ? '✅ APPR' : isConvoy ? '⚡ CONVOY' : 'BLOCK'}
                        <span style={{ opacity: 0.8, fontSize: '9.5px' }}>({b.job_ids.length}j)</span>
                      </div>
                      <span style={{ fontSize: '9.5px', fontWeight: 700, background: 'rgba(0,0,0,0.35)', padding: '1px 4px', borderRadius: '3px' }}>
                        {b.duration_min}m
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Clean Footer Legend */}
      <div style={{
        marginTop: '14px',
        paddingTop: '10px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11.5px',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#064e3b', border: '1px solid #10b981', display: 'inline-block' }}></span>
            <span>⚡ Joint Convoy (Multi-Dept)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#27272a', border: '1px solid rgba(255,255,255,0.15)', display: 'inline-block' }}></span>
            <span>Single-Department Block</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#451a03', border: '1px solid #f59e0b', display: 'inline-block' }}></span>
            <span>📌 Pinned / Locked Block</span>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Click any block to open Operator Review & Window Assignment sheet
        </div>
      </div>
    </div>
  )
}
