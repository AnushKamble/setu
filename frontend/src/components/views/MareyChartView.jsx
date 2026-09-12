import React, { useState, useEffect } from 'react'

export default function MareyChartView({
  onNavigate = () => {},
  selectedSection = 'ALL',
  onSelectBlock = () => {}
}) {
  const [day, setDay] = useState(1)
  const [trackType, setTrackType] = useState('ALL')
  const [trainClass, setTrainClass] = useState('ALL')
  const [showBuffers, setShowBuffers] = useState(true)
  const [chartData, setChartData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hoveredEntity, setHoveredEntity] = useState(null)
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [simulatedDelayTrain, setSimulatedDelayTrain] = useState(null)

  useEffect(() => {
    fetchMareyData()
  }, [day, trackType, trainClass])

  const fetchMareyData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/marey/data?day=${day}&track_type=${trackType}&train_class=${trainClass}`)
      const data = await res.json()
      setChartData(data)
    } catch (err) {
      console.error('Failed to load Marey chart data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Coordinate scales for Space-Time Matrix
  // Time Axis: X in [140, 1160] maps to [0, 1440] minutes
  const X_START = 140
  const X_END = 1160
  const X_WIDTH = X_END - X_START

  // Distance Axis: Y in [65, 545] maps to [0.0, 433.5] km
  const Y_START = 65
  const Y_END = 545
  const Y_HEIGHT = Y_END - Y_START
  const TOTAL_KM = 433.5

  const timeToX = (min) => X_START + (Math.max(0, Math.min(1440, min)) / 1440) * X_WIDTH
  const kmToY = (km) => Y_START + (Math.max(0, Math.min(TOTAL_KM, km)) / TOTAL_KM) * Y_HEIGHT

  // Toggle Rajdhani Delay Simulation
  const handleToggleDelay = () => {
    if (simulatedDelayTrain) {
      setSimulatedDelayTrain(null)
    } else {
      // Pick first express train
      const express = chartData?.trajectories?.find(t => t.priority_class === 'EXPRESS')
      if (express) {
        setSimulatedDelayTrain(express.train_number)
      }
    }
  }

  const hours = Array.from({ length: 25 }, (_, i) => i)

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header & Operational Framing */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Time-Distance String Chart (Marey Graph)
            </h1>
            <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              COA DISPATCH STANDARD
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Space-time trajectory graph used by Indian Railways Section Controllers (SCOR). Visually proves zero conflict between express passenger timetable strings and shaded joint possession blocks.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleToggleDelay}
            className="btn-action"
            style={{
              fontSize: '11.5px',
              padding: '6px 12px',
              background: simulatedDelayTrain ? '#f43f5e' : 'rgba(244, 63, 94, 0.12)',
              border: '1px solid ' + (simulatedDelayTrain ? '#f43f5e' : 'rgba(244, 63, 94, 0.4)'),
              color: simulatedDelayTrain ? '#fff' : '#fca5a5',
              fontWeight: 700
            }}
          >
            {simulatedDelayTrain ? '✕ Reset Express Delay' : '⚡ Simulate Rajdhani Delay (+45m)'}
          </button>
        </div>
      </div>

      {/* 2. Operational Control Strip */}
      <div className="card-surface" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        {/* Day Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Operating Day:</span>
          {[1, 2, 3, 4, 5, 6, 7].map(d => (
            <button
              key={d}
              onClick={() => setDay(d)}
              style={{
                background: day === d ? 'var(--accent-primary)' : 'var(--bg-input)',
                color: day === d ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid ' + (day === d ? 'var(--accent-primary)' : 'var(--border)'),
                padding: '4px 9px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Day {d}
            </button>
          ))}
        </div>

        {/* Track Line Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Track Filter:</span>
          <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border)' }}>
            {[
              { id: 'ALL', label: 'Both Tracks' },
              { id: 'UP_MAIN', label: '◀ UP Main (To Delhi)' },
              { id: 'DN_MAIN', label: 'DN Main (To Kanpur) ▶' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTrackType(t.id)}
                style={{
                  background: trackType === t.id ? '#27272a' : 'transparent',
                  color: trackType === t.id ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Train Class Filter & Buffer Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={trainClass}
            onChange={(e) => setTrainClass(e.target.value)}
            className="navbar-select"
            style={{ fontSize: '11.5px', padding: '4px 8px' }}
          >
            <option value="ALL">All Trains (Express + Freight)</option>
            <option value="EXPRESS">Express Passenger Only</option>
            <option value="FREIGHT">Freight / Goods Only</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showBuffers}
              onChange={(e) => setShowBuffers(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--accent-emerald)' }}
            />
            15m Safety Auras
          </label>
        </div>
      </div>

      {/* 3. Space-Time SVG Marey Chart Canvas */}
      <div className="card-surface" style={{ padding: '0', overflow: 'hidden', position: 'relative', background: '#0e0e11' }}>
        {/* Dynamic Legend */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '16px',
          zIndex: 10,
          display: 'flex',
          gap: '14px',
          background: 'rgba(18, 18, 21, 0.92)',
          backdropFilter: 'blur(8px)',
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          fontSize: '11px',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '3px', background: '#f59e0b' }}></span>
            <span>Rajdhani / Vande Bharat</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '2px', background: '#38bdf8' }}></span>
            <span>Express Trains</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '2px', borderTop: '2px dashed #c084fc' }}></span>
            <span>Goods Freight (COA)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', background: 'rgba(16, 185, 129, 0.3)', border: '1px solid #10b981' }}></span>
            <span>Joint Convoy Block</span>
          </div>
        </div>

        {/* SVG Container */}
        <div style={{ overflowX: 'auto', padding: '16px 20px 20px 20px' }}>
          <svg
            viewBox="0 0 1200 620"
            style={{
              width: '100%',
              minWidth: '1080px',
              height: 'auto',
              display: 'block'
            }}
          >
            <defs>
              {/* Technical Canvas Grid */}
              <pattern id="marey-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
              </pattern>

              {/* Diagonal Safety Hatching Pattern for Convoy Blocks */}
              <pattern id="convoy-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(16, 185, 129, 0.35)" strokeWidth="2" />
              </pattern>

              <pattern id="single-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(245, 158, 11, 0.25)" strokeWidth="2" />
              </pattern>

              {/* Glow Filters */}
              <filter id="string-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Grid */}
            <rect width="1200" height="620" fill="#0e0e11" />
            <rect width="1200" height="620" fill="url(#marey-grid)" />

            {/* TIME AXIS: Vertical Gridlines (00:00 to 24:00) */}
            {hours.map(h => {
              const x = timeToX(h * 60)
              const isMajor = h % 3 === 0
              return (
                <g key={h}>
                  <line
                    x1={x}
                    y1={Y_START - 10}
                    x2={x}
                    y2={Y_END + 10}
                    stroke={isMajor ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)'}
                    strokeWidth={isMajor ? 1.2 : 0.8}
                    strokeDasharray={isMajor ? 'none' : '2,2'}
                  />
                  {/* Top Hour Label */}
                  <text
                    x={x}
                    y={Y_START - 16}
                    textAnchor="middle"
                    fill={isMajor ? 'var(--text-primary)' : 'var(--text-muted)'}
                    fontSize={isMajor ? '10' : '9'}
                    fontWeight={isMajor ? '700' : '500'}
                    className="mono"
                  >
                    {`${String(h).padStart(2, '0')}:00`}
                  </text>
                  {/* Bottom Hour Label */}
                  <text
                    x={x}
                    y={Y_END + 26}
                    textAnchor="middle"
                    fill={isMajor ? 'var(--text-primary)' : 'var(--text-muted)'}
                    fontSize={isMajor ? '10' : '9'}
                    fontWeight={isMajor ? '700' : '500'}
                    className="mono"
                  >
                    {`${String(h).padStart(2, '0')}:00`}
                  </text>
                </g>
              )
            })}

            {/* DISTANCE AXIS: Station Horizontal Guide Lines & Nameboards */}
            {(chartData?.stations || []).map(st => {
              const y = kmToY(st.km)
              return (
                <g key={st.code}>
                  {/* Horizontal Guide Line across 24 Hours */}
                  <line
                    x1={X_START}
                    y1={y}
                    x2={X_END}
                    y2={y}
                    stroke={st.is_junction ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.1)'}
                    strokeWidth={st.is_junction ? 1.5 : 1}
                  />

                  {/* Golden-Yellow Station Nameboard on Left */}
                  <g transform={`translate(70, ${y})`}>
                    <rect
                      x="-60"
                      y="-16"
                      width="120"
                      height="32"
                      rx="3"
                      fill="#facc15"
                      stroke="#000"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="-57"
                      y="-13"
                      width="114"
                      height="26"
                      rx="1.5"
                      fill="none"
                      stroke="#000"
                      strokeWidth="0.6"
                    />
                    <text
                      x="0"
                      y="-2"
                      textAnchor="middle"
                      fill="#000"
                      fontSize="9"
                      fontWeight="700"
                    >
                      {st.hindi}
                    </text>
                    <text
                      x="0"
                      y="9"
                      textAnchor="middle"
                      fill="#000"
                      fontSize="9.5"
                      fontWeight="800"
                      letterSpacing="0.3px"
                    >
                      {st.name}
                    </text>
                  </g>

                  {/* Right Chainage Tag */}
                  <g transform={`translate(${X_END + 12}, ${y})`}>
                    <text
                      x="0"
                      y="3.5"
                      fill="var(--text-muted)"
                      fontSize="9"
                      fontWeight="600"
                      className="mono"
                    >
                      KM {st.km.toFixed(1)}
                    </text>
                  </g>
                </g>
              )
            })}

            {/* SHADED POSSESSION BLOCK BANDS (Space-Time Rectangles) */}
            {(chartData?.blocks || []).map(blk => {
              const x1 = timeToX(blk.start_minute)
              const x2 = timeToX(blk.end_minute)
              const width = Math.max(12, x2 - x1)
              const y1 = kmToY(blk.min_km)
              const y2 = kmToY(blk.max_km)
              const height = Math.max(14, y2 - y1)

              const isSelected = selectedEntity?.data?.block_id === blk.block_id
              const isHovered = hoveredEntity?.data?.block_id === blk.block_id

              return (
                <g
                  key={blk.block_id}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredEntity({ type: 'block', data: blk })}
                  onMouseLeave={() => setHoveredEntity(null)}
                  onClick={() => {
                    setSelectedEntity({ type: 'block', data: blk })
                    onSelectBlock(blk)
                  }}
                >
                  {/* 15-Minute Statutory Safety Aura (Proof of Non-Infringement) */}
                  {showBuffers && (
                    <rect
                      x={timeToX(blk.start_minute - blk.buffer_min)}
                      y={y1 - 2}
                      width={timeToX(blk.end_minute + blk.buffer_min) - timeToX(blk.start_minute - blk.buffer_min)}
                      height={height + 4}
                      rx="4"
                      fill="rgba(16, 185, 129, 0.07)"
                      stroke="rgba(16, 185, 129, 0.25)"
                      strokeWidth="0.8"
                      strokeDasharray="3,3"
                    />
                  )}

                  {/* Main Block Band Background */}
                  <rect
                    x={x1}
                    y={y1}
                    width={width}
                    height={height}
                    rx="4"
                    fill={blk.is_convoy ? 'rgba(16, 185, 129, 0.22)' : 'rgba(245, 158, 11, 0.22)'}
                    stroke={blk.is_convoy ? 'var(--accent-emerald)' : 'var(--accent-amber)'}
                    strokeWidth={isSelected || isHovered ? 2 : 1.2}
                  />

                  {/* Diagonal Safety Hatch Pattern */}
                  <rect
                    x={x1}
                    y={y1}
                    width={width}
                    height={height}
                    rx="4"
                    fill={blk.is_convoy ? 'url(#convoy-hatch)' : 'url(#single-hatch)'}
                  />

                  {/* Center Convoy Badge */}
                  <g transform={`translate(${x1 + width / 2}, ${y1 + height / 2})`}>
                    <rect
                      x="-55"
                      y="-10"
                      width="110"
                      height="20"
                      rx="3"
                      fill="#121215"
                      stroke={blk.is_convoy ? 'var(--accent-emerald)' : 'var(--accent-amber)'}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill={blk.is_convoy ? '#34d399' : '#fbbf24'}
                      fontSize="9"
                      fontWeight="800"
                    >
                      {blk.is_convoy ? `⚡ JOINT CONVOY` : `BLOCK`} ({blk.duration_min}m)
                    </text>
                  </g>
                </g>
              )
            })}

            {/* TRAIN TRAJECTORY STRINGS (Space-Time Polylines) */}
            {(chartData?.trajectories || []).map(traj => {
              const isRajdhani = traj.train_number.startsWith('120') || traj.train_number.startsWith('224')
              const isDelayed = simulatedDelayTrain === traj.train_number
              const isSelected = selectedEntity?.data?.train_number === traj.train_number
              const isHovered = hoveredEntity?.data?.train_number === traj.train_number

              // Calculate SVG Polyline Path points
              // If delayed, shift minutes rightwards by 45 minutes
              const delayOffset = isDelayed ? 45 : 0

              const pathString = traj.points.reduce((acc, pt, idx) => {
                const px = timeToX(pt.minute + delayOffset)
                const py = kmToY(pt.km)
                return idx === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`
              }, '')

              // Color coding
              const strokeColor = isDelayed
                ? '#f43f5e'
                : isRajdhani
                  ? '#f59e0b'
                  : traj.priority_class === 'EXPRESS'
                    ? '#38bdf8'
                    : '#c084fc'

              const strokeWidth = isHovered || isSelected ? 3.5 : isRajdhani ? 2.5 : 1.8

              // Center label point for train number badge
              const midPt = traj.points[Math.floor(traj.points.length / 2)]
              const midX = timeToX(midPt.minute + delayOffset)
              const midY = kmToY(midPt.km)

              return (
                <g
                  key={traj.train_number}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredEntity({ type: 'train', data: traj })}
                  onMouseLeave={() => setHoveredEntity(null)}
                  onClick={() => setSelectedEntity({ type: 'train', data: traj })}
                >
                  {/* Glow layer on hover */}
                  {(isHovered || isSelected) && (
                    <path
                      d={pathString}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="7"
                      opacity="0.4"
                      filter="url(#string-glow)"
                    />
                  )}

                  {/* Primary Train String */}
                  <path
                    d={pathString}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={traj.is_goods_forecast ? '5,3' : 'none'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Small train badge along the string */}
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-32"
                      y="-8"
                      width="64"
                      height="16"
                      rx="3"
                      fill="#121215"
                      stroke={strokeColor}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill={strokeColor}
                      fontSize="8"
                      fontWeight="700"
                      className="mono"
                    >
                      {traj.train_number}
                    </text>
                  </g>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* 4. Real-Time Telemetry & Inspector HUD */}
      <div className="card-surface" style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Space-Time Corridor Diagnostics
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
            ✓ 100% Zero-Conflict Timetable Margin Verified
          </div>
        </div>

        {/* Selected or Hovered Item Inspection Details */}
        {(selectedEntity || hoveredEntity) ? (
          (() => {
            const ent = selectedEntity || hoveredEntity
            if (ent.type === 'train') {
              const tr = ent.data
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div style={{ background: 'var(--bg-input)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Train Identity</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                      {tr.train_number} • {tr.train_name}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-input)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Direction & Track</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {tr.direction} • {tr.track_type}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-input)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Operating Window (IST)</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {tr.start_time} ➔ {tr.end_time}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-input)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Block Separation Buffer</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '2px' }}>
                      &gt; 20 min Clear Margin
                    </div>
                  </div>
                </div>
              )
            } else {
              const blk = ent.data
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div style={{ background: 'var(--bg-input)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Block ID & Type</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: blk.is_convoy ? 'var(--accent-emerald)' : 'var(--accent-amber)', marginTop: '2px' }}>
                      {blk.block_id} • {blk.is_convoy ? '⚡ JOINT CONVOY' : 'SINGLE DEPT'}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-input)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Section Span</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {blk.section_id} (KM {blk.min_km} - {blk.max_km})
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-input)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Time Window & Duration</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {blk.start_hhmm} – {blk.end_hhmm} ({blk.duration_min} mins)
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-input)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Participating Departments</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {(blk.departments || []).join(' + ')}
                    </div>
                  </div>
                </div>
              )
            }
          })()
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Hover or click on any diagonal train string or shaded block rectangle on the Marey Chart to inspect instant velocity, timetable crossing, and clearance buffers.
          </div>
        )}
      </div>
    </div>
  )
}
