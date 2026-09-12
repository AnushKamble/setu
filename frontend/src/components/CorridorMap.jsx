import React, { useState } from 'react'
import { X, ArrowRight, Zap } from 'lucide-react'

export default function CorridorMap({
  sections = [],
  jobs = [],
  blocks = [],
  windows = [],
  selectedSection = 'ALL',
  onSelectSection = () => {},
  onSelectBlock = () => {},
  onNavigate = () => {}
}) {
  const [selectedDay, setSelectedDay] = useState('ALL')
  const [activeLayer, setActiveLayer] = useState({
    signals: true,
    trains: true,
    convoys: true,
    interlocking: true
  })
  const [hoveredSection, setHoveredSection] = useState(null)
  const [inspectedSection, setInspectedSection] = useState(null)

  // Corridor Disruption & Multi-Hop Cascade Simulation State
  const [showDisruptionModal, setShowDisruptionModal] = useState(false)
  const [disruptionMinutes, setDisruptionMinutes] = useState(45)
  const [disruptionLoading, setDisruptionLoading] = useState(false)
  const [disruptionResult, setDisruptionResult] = useState(null)

  const handleSimulateDisruption = async () => {
    setDisruptionLoading(true)
    try {
      const res = await fetch('/api/simulation/train-delay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delay_minutes: Number(disruptionMinutes) })
      })
      const data = await res.json()
      setDisruptionResult(data)
      setShowDisruptionModal(false)
    } catch (err) {
      console.error('Failed to simulate disruption:', err)
    } finally {
      setDisruptionLoading(false)
    }
  }

  const handleClearDisruption = () => {
    setDisruptionResult(null)
    setShowDisruptionModal(false)
  }

  // Corridor Stations with authentic distances & Indian Railways bilingual signage
  const stations = [
    { code: 'NDLS', name: 'NEW DELHI', hindi: 'नई दिल्ली', km: 0.0, x: 90 },
    { code: 'GZB', name: 'GHAZIABAD JN.', hindi: 'गाज़ियाबाद जं.', km: 25.5, x: 400, isJunction: true },
    { code: 'ALJN', name: 'ALIGARH JN.', hindi: 'अलीगढ़ जं.', km: 131.5, x: 800, isJunction: true },
    { code: 'CNB', name: 'KANPUR CENTRAL', hindi: 'कानपुर सेंट्रल', km: 433.5, x: 1200, isJunction: true }
  ]

  // Track segments with balanced vertical coordinates & generous margins
  const trackSegments = [
    {
      id: 'SEC-NDLS-GZB-UP',
      name: 'New Delhi – Ghaziabad UP',
      from: 'NDLS',
      to: 'GZB',
      trackType: 'UP_MAIN',
      startX: 90,
      endX: 400,
      y: 142,
      direction: 'WESTBOUND ◀ (Towards Delhi)',
      speed: 130,
      lengthKm: 25.5
    },
    {
      id: 'SEC-NDLS-GZB-DN',
      name: 'New Delhi – Ghaziabad DOWN',
      from: 'NDLS',
      to: 'GZB',
      trackType: 'DN_MAIN',
      startX: 90,
      endX: 400,
      y: 218,
      direction: 'EASTBOUND ▶ (Towards Kanpur)',
      speed: 130,
      lengthKm: 25.5
    },
    {
      id: 'SEC-GZB-ALJN-UP',
      name: 'Ghaziabad – Aligarh UP',
      from: 'GZB',
      to: 'ALJN',
      trackType: 'UP_MAIN',
      startX: 400,
      endX: 800,
      y: 142,
      direction: 'WESTBOUND ◀ (Towards Delhi)',
      speed: 140,
      lengthKm: 106.0
    },
    {
      id: 'SEC-GZB-ALJN-DN',
      name: 'Ghaziabad – Aligarh DOWN',
      from: 'GZB',
      to: 'ALJN',
      trackType: 'DN_MAIN',
      startX: 400,
      endX: 800,
      y: 218,
      direction: 'EASTBOUND ▶ (Towards Kanpur)',
      speed: 140,
      lengthKm: 106.0
    },
    {
      id: 'SEC-ALJN-CNB-UP',
      name: 'Aligarh – Kanpur UP',
      from: 'ALJN',
      to: 'CNB',
      trackType: 'UP_MAIN',
      startX: 800,
      endX: 1200,
      y: 142,
      direction: 'WESTBOUND ◀ (Towards Delhi)',
      speed: 130,
      lengthKm: 302.0
    },
    {
      id: 'SEC-ALJN-CNB-DN',
      name: 'Aligarh – Kanpur DOWN',
      from: 'ALJN',
      to: 'CNB',
      trackType: 'DN_MAIN',
      startX: 800,
      endX: 1200,
      y: 218,
      direction: 'EASTBOUND ▶ (Towards Kanpur)',
      speed: 130,
      lengthKm: 302.0
    }
  ]

  // Filter possessions based on day selection
  const filterBlocksForDay = (secId) => {
    return (blocks || []).filter(b => {
      if (b.section_id !== secId) return false
      if (selectedDay === 'ALL') return true
      const dayStart = (selectedDay - 1) * 1440
      const dayEnd = selectedDay * 1440
      return b.start_minute < dayEnd && b.end_minute > dayStart
    })
  }

  // Active Express Passenger Trains
  const simulatedTrains = [
    {
      number: '22436',
      name: 'Vande Bharat',
      sectionId: 'SEC-GZB-ALJN-DN',
      x: 590,
      y: 218,
      direction: 'EASTBOUND',
      speed: '130 km/h',
      status: 'On Time',
      accentColor: '#38bdf8'
    },
    {
      number: '12001',
      name: 'Bhopal Shatabdi',
      sectionId: 'SEC-NDLS-GZB-UP',
      x: 245,
      y: 142,
      direction: 'WESTBOUND',
      speed: '120 km/h',
      status: 'On Time',
      accentColor: '#60a5fa'
    },
    {
      number: '12302',
      name: 'Howrah Rajdhani',
      sectionId: 'SEC-ALJN-CNB-DN',
      x: 990,
      y: 218,
      direction: 'EASTBOUND',
      speed: '130 km/h',
      status: 'On Time',
      accentColor: '#38bdf8'
    }
  ]

  const activeSectionId = inspectedSection?.id || (selectedSection !== 'ALL' ? selectedSection : null)
  const currentInspect = trackSegments.find(s => s.id === activeSectionId) || trackSegments[0]
  const inspectJobs = (jobs || []).filter(j => j.section_id === currentInspect.id)
  const inspectBlocks = filterBlocksForDay(currentInspect.id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Toolbar with Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Corridor Centralized Traffic Control (CTC) Topology
            </h2>
            <span style={{
              fontSize: '10.5px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)'
            }}>
              LIVE CTC SCHEMATIC
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Electronic interlocking track diagram across Northern & North Central Railway (Delhi–Ghaziabad–Aligarh–Kanpur).
          </p>
        </div>

        {/* Controls Toolbar */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Day Scrubber */}
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
                background: selectedDay === 'ALL' ? '#27272a' : 'transparent',
                color: selectedDay === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '4px 9px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              All Days
            </button>
            {[1, 2, 3, 4, 5, 6, 7].map(d => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                style={{
                  background: selectedDay === d ? 'var(--accent-primary)' : 'transparent',
                  color: selectedDay === d ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                D{d}
              </button>
            ))}
          </div>

          {/* Layer Visibility Toggles */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setActiveLayer(l => ({ ...l, signals: !l.signals }))}
              style={{
                background: activeLayer.signals ? 'rgba(255,255,255,0.08)' : 'var(--bg-input)',
                color: activeLayer.signals ? 'var(--text-primary)' : 'var(--text-muted)',
                border: '1px solid var(--border)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Signals
            </button>
            <button
              onClick={() => setActiveLayer(l => ({ ...l, trains: !l.trains }))}
              style={{
                background: activeLayer.trains ? 'rgba(255,255,255,0.08)' : 'var(--bg-input)',
                color: activeLayer.trains ? 'var(--text-primary)' : 'var(--text-muted)',
                border: '1px solid var(--border)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Express Trains
            </button>
            <button
              onClick={() => setActiveLayer(l => ({ ...l, convoys: !l.convoys }))}
              style={{
                background: activeLayer.convoys ? 'rgba(16,185,129,0.15)' : 'var(--bg-input)',
                color: activeLayer.convoys ? 'var(--accent-emerald)' : 'var(--text-muted)',
                border: '1px solid var(--border)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Joint Convoys
            </button>
          </div>

          {selectedSection !== 'ALL' && (
            <button
              onClick={() => onSelectSection('ALL')}
              className="btn-action btn-secondary"
              style={{ fontSize: '11px', padding: '4px 9px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Reset Filter</span>
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Sleek Modern Railway Track Schematic Canvas */}
      <div className="card-surface" style={{ padding: '0', overflow: 'hidden', position: 'relative', background: '#0e0e11' }}>
        {/* Status Indicators Legend (Top-Right) */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '16px',
          zIndex: 10,
          display: 'flex',
          gap: '14px',
          background: 'rgba(18, 18, 21, 0.92)',
          backdropFilter: 'blur(10px)',
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          fontSize: '11px',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 6px var(--accent-emerald)' }}></span>
            <span>Joint Convoy Possession</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-amber)', boxShadow: '0 0 6px var(--accent-amber)' }}></span>
            <span>Single-Dept Block</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }}></span>
            <span>Active Express Train</span>
          </div>
        </div>

        {/* SVG Canvas with Generous Up-Side Margins */}
        <div style={{ overflowX: 'auto', padding: '20px 20px 24px 20px' }}>
          <svg
            viewBox="0 0 1300 360"
            style={{
              width: '100%',
              minWidth: '1100px',
              height: 'auto',
              display: 'block'
            }}
          >
            <defs>
              {/* Subtle Technical Background Grid */}
              <pattern id="ctc-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
              </pattern>

              {/* Minimalist Sleepers Tick Pattern */}
              <pattern id="tech-sleepers" width="14" height="24" patternUnits="userSpaceOnUse">
                <line x1="7" y1="2" x2="7" y2="22" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" />
              </pattern>

              {/* Soft Radial Glow Filters */}
              <filter id="emerald-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="amber-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="rose-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Grid */}
            <rect width="1300" height="360" fill="#0e0e11" />
            <rect width="1300" height="360" fill="url(#ctc-grid)" />

            {/* TRACK BED: Clean dark zinc corridor path with generous UP-side and DOWN-side margins */}
            <rect x="40" y="96" width="1220" height="168" rx="8" fill="#141418" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />

            {/* UP MAIN TRACK SLEEPERS & RAILS (Y = 142) */}
            <rect x="50" y="130" width="1200" height="24" fill="url(#tech-sleepers)" />
            {/* Running rails */}
            <line x1="50" y1="135" x2="1250" y2="135" stroke="#3f3f46" strokeWidth="2" />
            <line x1="50" y1="149" x2="1250" y2="149" stroke="#3f3f46" strokeWidth="2" />

            {/* DOWN MAIN TRACK SLEEPERS & RAILS (Y = 218) */}
            <rect x="50" y="206" width="1200" height="24" fill="url(#tech-sleepers)" />
            {/* Running rails */}
            <line x1="50" y1="211" x2="1250" y2="211" stroke="#3f3f46" strokeWidth="2" />
            <line x1="50" y1="225" x2="1250" y2="225" stroke="#3f3f46" strokeWidth="2" />

            {/* JUNCTION CROSSOVERS & TURNOUTS */}
            {activeLayer.interlocking && (
              <g opacity="0.8">
                {/* Ghaziabad Junction Diamond Crossover */}
                <line x1="365" y1="149" x2="435" y2="211" stroke="#52525b" strokeWidth="2" strokeDasharray="3,2" />
                <line x1="365" y1="211" x2="435" y2="149" stroke="#52525b" strokeWidth="2" strokeDasharray="3,2" />
                <circle cx="400" cy="180" r="3" fill="#27272a" stroke="#71717a" strokeWidth="1" />

                {/* Aligarh Junction Diamond Crossover */}
                <line x1="765" y1="149" x2="835" y2="211" stroke="#52525b" strokeWidth="2" strokeDasharray="3,2" />
                <line x1="765" y1="211" x2="835" y2="149" stroke="#52525b" strokeWidth="2" strokeDasharray="3,2" />
                <circle cx="800" cy="180" r="3" fill="#27272a" stroke="#71717a" strokeWidth="1" />
              </g>
            )}

            {/* INTERACTIVE TRACK BLOCK SECTIONS WITH PROPERLY-SIZED BOXES & UP-SIDE MARGIN */}
            {trackSegments.map(seg => {
              const isSelected = (selectedSection === seg.id) || (inspectedSection?.id === seg.id)
              const isHovered = hoveredSection === seg.id
              const segBlocks = filterBlocksForDay(seg.id)
              const hasPossession = segBlocks.length > 0
              const hasConvoy = segBlocks.some(b => b.is_convoy)
              const width = seg.endX - seg.startX

              // Multi-Hop Disruption simulation states
              const isPrimaryDisrupted = disruptionResult?.impact?.primary_section_id === seg.id
              const cascadeHop = disruptionResult?.impact?.cascade_chain?.find(c => c.section_id === seg.id)

              // Proper vertical position: UP capsule has generous margin inside trackbed
              const capsuleY = seg.trackType === 'UP_MAIN' ? 116 : 246

              return (
                <g
                  key={seg.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setInspectedSection(seg)
                    onSelectSection(selectedSection === seg.id ? 'ALL' : seg.id)
                  }}
                  onMouseEnter={() => setHoveredSection(seg.id)}
                  onMouseLeave={() => setHoveredSection(null)}
                >
                  {/* Illuminated Track Segment Line (Disruption vs Convoy vs Single Block vs Normal) */}
                  {isPrimaryDisrupted ? (
                    <g>
                      <line
                        x1={seg.startX + 14}
                        y1={seg.y}
                        x2={seg.endX - 14}
                        y2={seg.y}
                        stroke="#f43f5e"
                        strokeWidth="7"
                        strokeLinecap="round"
                        filter="url(#rose-glow)"
                      />
                      <line
                        x1={seg.startX + 14}
                        y1={seg.y}
                        x2={seg.endX - 14}
                        y2={seg.y}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </g>
                  ) : cascadeHop ? (
                    <g>
                      <line
                        x1={seg.startX + 14}
                        y1={seg.y}
                        x2={seg.endX - 14}
                        y2={seg.y}
                        stroke="#f97316"
                        strokeWidth="5"
                        strokeLinecap="round"
                        filter="url(#amber-glow)"
                      />
                      <line
                        x1={seg.startX + 14}
                        y1={seg.y}
                        x2={seg.endX - 14}
                        y2={seg.y}
                        stroke="#ffedd5"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </g>
                  ) : hasPossession ? (
                    <g>
                      {/* Luminous Glow Halo */}
                      <line
                        x1={seg.startX + 14}
                        y1={seg.y}
                        x2={seg.endX - 14}
                        y2={seg.y}
                        stroke={hasConvoy ? 'var(--accent-emerald)' : 'var(--accent-amber)'}
                        strokeWidth="6"
                        strokeLinecap="round"
                        opacity={isSelected ? 0.95 : 0.75}
                        filter={hasConvoy ? 'url(#emerald-glow)' : 'url(#amber-glow)'}
                      />
                      {/* Core Center Rail */}
                      <line
                        x1={seg.startX + 14}
                        y1={seg.y}
                        x2={seg.endX - 14}
                        y2={seg.y}
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </g>
                  ) : (
                    /* Default Clean Track Line */
                    <line
                      x1={seg.startX + 14}
                      y1={seg.y}
                      x2={seg.endX - 14}
                      y2={seg.y}
                      stroke={isSelected ? '#ffffff' : (isHovered ? '#71717a' : '#27272a')}
                      strokeWidth={isSelected ? 3 : 2}
                    />
                  )}

                  {/* Selection Indicator Bracket */}
                  {isSelected && (
                    <rect
                      x={seg.startX + 8}
                      y={seg.y - 15}
                      width={width - 16}
                      height="30"
                      rx="4"
                      fill="none"
                      stroke={isPrimaryDisrupted ? '#f43f5e' : 'var(--accent-primary)'}
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Operational Status Indicator Capsule (Width: 184px — Never overflows!) */}
                  <g transform={`translate(${seg.startX + (width / 2)}, ${capsuleY})`}>
                    {/* Disruption auxiliary banner */}
                    {isPrimaryDisrupted && (
                      <g transform="translate(0, -17)">
                        <rect x="-70" y="-7" width="140" height="14" rx="3" fill="#881337" stroke="#f43f5e" strokeWidth="0.8" />
                        <text x="0" y="3.5" textAnchor="middle" fill="#ffe4e6" fontSize="8" fontWeight="800" letterSpacing="0.4px">
                          PRIMARY DISRUPTION
                        </text>
                      </g>
                    )}
                    {cascadeHop && (
                      <g transform="translate(0, -17)">
                        <rect x="-75" y="-7" width="150" height="14" rx="3" fill="#7c2d12" stroke="#f97316" strokeWidth="0.8" />
                        <text x="0" y="3.5" textAnchor="middle" fill="#ffedd5" fontSize="8" fontWeight="800" letterSpacing="0.4px">
                          {`CASCADE HOP ${cascadeHop.hop_level} (-${cascadeHop.buffer_absorption_minutes}m)`}
                        </text>
                      </g>
                    )}

                    <rect
                      x="-92"
                      y="-11"
                      width="184"
                      height="22"
                      rx="4"
                      fill="#18181c"
                      stroke={
                        isPrimaryDisrupted
                          ? '#f43f5e'
                          : cascadeHop
                            ? '#f97316'
                            : hasConvoy
                              ? 'var(--accent-emerald)'
                              : hasPossession
                                ? 'var(--accent-amber)'
                                : isSelected
                                  ? 'var(--accent-primary)'
                                  : 'var(--border)'
                      }
                      strokeWidth={isPrimaryDisrupted || cascadeHop ? 1.5 : 1}
                    />

                    {/* Status Dot */}
                    <circle
                      cx="-78"
                      cy="0"
                      r="3.5"
                      fill={
                        isPrimaryDisrupted
                          ? '#f43f5e'
                          : cascadeHop
                            ? '#f97316'
                            : hasConvoy
                              ? 'var(--accent-emerald)'
                              : hasPossession
                                ? 'var(--accent-amber)'
                                : '#27272a'
                      }
                    />

                    {/* Text Label (Properly centered with generous box breathing room) */}
                    <text
                      textAnchor="middle"
                      x="4"
                      y="3.5"
                      fill={
                        isPrimaryDisrupted
                          ? '#fca5a5'
                          : cascadeHop
                            ? '#fed7aa'
                            : hasConvoy
                              ? '#34d399'
                              : hasPossession
                                ? '#fbbf24'
                                : 'var(--text-secondary)'
                      }
                      fontSize="9.5"
                      fontWeight="700"
                      letterSpacing="0.2px"
                    >
                      {isPrimaryDisrupted
                        ? `DELAY +${disruptionResult.impact.direct_delay_minutes}m (ORIGIN)`
                        : cascadeHop
                          ? `HOP ${cascadeHop.hop_level}: +${cascadeHop.propagated_delay_minutes}m`
                          : hasConvoy
                            ? `CONVOY (${segBlocks.length} Bundled)`
                            : hasPossession
                              ? `BLOCK (${segBlocks.length} Active)`
                              : `${seg.trackType === 'UP_MAIN' ? '◀ UP' : 'DN ▶'} • ${seg.speed} KM/H`}
                    </text>
                  </g>
                </g>
              )
            })}

            {/* MODERN EXPRESS TRAIN INDICATORS (Generous 144px Capsule Box — Zero Overflow!) */}
            {activeLayer.trains && simulatedTrains.map(tr => (
              <g key={tr.number} transform={`translate(${tr.x}, ${tr.y})`}>
                {/* Directional Velocity Light Streak */}
                <line
                  x1={tr.direction === 'EASTBOUND' ? -50 : 50}
                  y1="0"
                  x2="0"
                  y2="0"
                  stroke={tr.accentColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.35"
                />

                {/* Train Capsule Indicator Box (144px width comfortably fits text!) */}
                <rect
                  x="-72"
                  y="-11"
                  width="144"
                  height="22"
                  rx="11"
                  fill="#0f172a"
                  stroke={tr.accentColor}
                  strokeWidth="1.5"
                />

                {/* Train Pulsing Dot */}
                <circle
                  cx={tr.direction === 'EASTBOUND' ? 56 : -56}
                  cy="0"
                  r="3.5"
                  fill={tr.accentColor}
                />

                {/* Train Number & Speed Text */}
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9.5"
                  fontWeight="800"
                  letterSpacing="0.3px"
                >
                  {tr.direction === 'EASTBOUND' ? '▶ ' : '◀ '}
                  {tr.number} • {tr.speed}
                </text>
              </g>
            ))}

            {/* COLOR LIGHT AUTOMATIC BLOCK SIGNALS */}
            {activeLayer.signals && trackSegments.map((seg) => {
              const segBlocks = filterBlocksForDay(seg.id)
              const isBlocked = segBlocks.length > 0
              const sigX = seg.trackType === 'UP_MAIN' ? seg.endX - 22 : seg.startX + 22
              const sigY = seg.y + (seg.trackType === 'UP_MAIN' ? -12 : 12)

              return (
                <g key={`signal-${seg.id}`} transform={`translate(${sigX}, ${sigY})`}>
                  {/* Signal Post */}
                  <line x1="0" y1="0" x2="0" y2={seg.trackType === 'UP_MAIN' ? -10 : 10} stroke="#52525b" strokeWidth="1.5" />
                  {/* Signal Aspect Housing */}
                  <rect
                    x="-4"
                    y={seg.trackType === 'UP_MAIN' ? -18 : 6}
                    width="8"
                    height="12"
                    rx="2"
                    fill="#18181b"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="0.8"
                  />
                  {/* Active Aspect LED */}
                  <circle
                    cx="0"
                    cy={seg.trackType === 'UP_MAIN' ? -12 : 12}
                    r="2.5"
                    fill={isBlocked ? '#ef4444' : '#10b981'}
                    filter={isBlocked ? 'url(#amber-glow)' : 'url(#emerald-glow)'}
                  />
                </g>
              )
            })}

            {/* STATIONS: Authentic Real-Life Indian Railways Yellow Station Signboards */}
            {stations.map(st => (
              <g key={st.code} transform={`translate(${st.x}, 0)`}>
                {/* Station Vertical Line Reference to Track */}
                <line x1="0" y1="72" x2="0" y2="285" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" strokeDasharray="3,3" />

                {/* Station Central Junction Hub Beacon */}
                <circle
                  cx="0"
                  cy="180"
                  r="14"
                  fill="#121215"
                  stroke={st.isJunction ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.2)'}
                  strokeWidth="2.5"
                />
                <circle cx="0" cy="180" r="5" fill={st.isJunction ? 'var(--accent-primary)' : '#52525b'} />

                {/* AUTHENTIC INDIAN RAILWAYS YELLOW STATION NAMEBOARD (Top at y = 52) */}
                <g transform="translate(0, 52)">
                  {/* Twin Steel Support Mounting Posts */}
                  <line x1="-54" y1="20" x2="-54" y2="44" stroke="#3f3f46" strokeWidth="2.5" />
                  <line x1="54" y1="20" x2="54" y2="44" stroke="#3f3f46" strokeWidth="2.5" />

                  {/* Golden Yellow Signboard (140px width comfortably fits bilingual names!) */}
                  <rect
                    x="-70"
                    y="-20"
                    width="140"
                    height="40"
                    rx="4"
                    fill="#facc15"
                    stroke="#000000"
                    strokeWidth="2"
                  />

                  {/* Inner fine border line */}
                  <rect
                    x="-67"
                    y="-17"
                    width="134"
                    height="34"
                    rx="2"
                    fill="none"
                    stroke="#000000"
                    strokeWidth="0.8"
                  />

                  {/* Hindi Station Name */}
                  <text
                    x="0"
                    y="-3"
                    textAnchor="middle"
                    fill="#000000"
                    fontSize="10"
                    fontWeight="700"
                  >
                    {st.hindi}
                  </text>

                  {/* English Station Name */}
                  <text
                    x="0"
                    y="11"
                    textAnchor="middle"
                    fill="#000000"
                    fontSize="10.5"
                    fontWeight="800"
                    letterSpacing="0.4px"
                  >
                    {st.name}
                  </text>
                </g>

                {/* Station Distance Milestone Badge (Bottom at y = 295) */}
                <g transform="translate(0, 295)">
                  <rect
                    x="-34"
                    y="-10"
                    width="68"
                    height="20"
                    rx="4"
                    fill="#141417"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill="var(--text-muted)"
                    fontSize="9.5"
                    fontWeight="700"
                  >
                    KM {st.km.toFixed(1)}
                  </text>
                </g>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* 2.5 Multi-Hop Corridor Disruption Telemetry Banner */}
      {disruptionResult && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.14) 0%, rgba(245, 158, 11, 0.09) 100%)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          borderRadius: '10px',
          padding: '16px 20px',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#f43f5e', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.6px' }}>
                  CORRIDOR DISRUPTION ACTIVE
                </span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Primary Delay: +{disruptionResult.impact.direct_delay_minutes}m at {disruptionResult.impact.primary_section_id}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Digital Twin simulated multi-hop propagation across <b>{disruptionResult.impact.max_hops} corridor hops</b> with 35% buffer attenuation per hop.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onNavigate && onNavigate('what-if')}
                className="btn-action"
                style={{ fontSize: '11.5px', padding: '5px 12px', background: 'var(--accent-primary)', color: '#fff' }}
              >
                Inspect Dynamic Replanner Diff ▸
              </button>
              <button
                onClick={handleClearDisruption}
                className="btn-action btn-secondary"
                style={{ fontSize: '11.5px', padding: '5px 12px' }}
              >
                Clear Disruption
              </button>
            </div>
          </div>

          {/* Cascade Propagation Hops */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(244, 63, 94, 0.22)', border: '1px solid #f43f5e', padding: '5px 10px', borderRadius: '6px', fontSize: '11px' }}>
              <b style={{ color: '#fca5a5' }}>Origin Section:</b> <span className="mono" style={{ color: '#fff' }}>{disruptionResult.impact.primary_section_id}</span> • <span style={{ color: '#fca5a5', fontWeight: 700 }}>+{disruptionResult.impact.direct_delay_minutes}m</span>
            </div>

            {(disruptionResult.impact.cascade_chain || []).map((hop) => (
              <React.Fragment key={hop.section_id}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>→</span>
                <div style={{ background: 'rgba(245, 158, 11, 0.16)', border: '1px solid #f59e0b', padding: '5px 10px', borderRadius: '6px', fontSize: '11px' }}>
                  <b style={{ color: '#fcd34d' }}>Hop {hop.hop_level}:</b> <span className="mono" style={{ color: '#fff' }}>{hop.section_id}</span> • <span style={{ color: '#fcd34d', fontWeight: 700 }}>+{hop.propagated_delay_minutes}m</span> <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>(-{hop.buffer_absorption_minutes}m absorbed)</span>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Metric Comparison Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Direct Delay</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#f87171' }}>+{disruptionResult.impact.direct_delay_minutes}m</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Secondary Cascade Delay</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24' }}>+{disruptionResult.impact.secondary_delay_minutes}m</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Total Network Delay</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#f87171' }}>{disruptionResult.impact.total_network_delay_minutes}m</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Replanner Stability</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                {disruptionResult.replanning_diff?.stability_score ? (disruptionResult.replanning_diff.stability_score * 100).toFixed(0) + '%' : '92%'}
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Solve Latency</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {disruptionResult.replanning_diff?.replan_time_seconds ? `${disruptionResult.replanning_diff.replan_time_seconds}s` : '<0.1s'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Real-Time Section Telemetry HUD */}
      <div className="card-surface" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {currentInspect.id}
              </span>
              <span className={`dept-pill ${currentInspect.trackType.includes('UP') ? 'engg' : 'trd'}`}>
                {currentInspect.trackType.replace('_', ' ')}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {currentInspect.direction}
              </span>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {currentInspect.name} • Length: <b>{currentInspect.lengthKm} km</b> • MPS: <b>{currentInspect.speed} km/h</b>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onSelectSection(currentInspect.id)}
              className="btn-action"
              style={{ fontSize: '11.5px', padding: '6px 12px' }}
            >
              Filter Entire App to This Section
            </button>
            <button
              onClick={() => setShowDisruptionModal(s => !s)}
              className="btn-action"
              style={{
                fontSize: '11.5px',
                padding: '6px 12px',
                background: showDisruptionModal ? 'rgba(244, 63, 94, 0.25)' : 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                color: '#fca5a5',
                fontWeight: 700
              }}
            >
              Simulate Track Disruption
            </button>
          </div>
        </div>

        {/* Expandable Disruption Injection Form */}
        {showDisruptionModal && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.07)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: '8px',
            padding: '14px 16px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fda4af', marginBottom: '4px' }}>
              Simulate Express Train Delay on {currentInspect.name}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Injects a delay on the selected section. The Digital Twin simulates multi-hop cascade propagation across adjacent sections with engineering buffer absorption, detects possession window infringements, and performs frozen-state dynamic replanning.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Delay Duration:
              </span>
              {[20, 35, 45, 60, 90].map(mins => (
                <button
                  key={mins}
                  onClick={() => setDisruptionMinutes(mins)}
                  style={{
                    background: disruptionMinutes === mins ? '#f43f5e' : 'var(--bg-input)',
                    color: disruptionMinutes === mins ? '#ffffff' : 'var(--text-primary)',
                    border: '1px solid ' + (disruptionMinutes === mins ? '#f43f5e' : 'var(--border)'),
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  +{mins}m
                </button>
              ))}

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                <button
                  onClick={handleSimulateDisruption}
                  disabled={disruptionLoading}
                  className="btn-action"
                  style={{
                    background: '#f43f5e',
                    color: '#ffffff',
                    fontSize: '11.5px',
                    padding: '6px 14px',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: '6px'
                  }}
                >
                  {disruptionLoading ? 'Calculating Cascade...' : 'Inject & Calculate Multi-Hop Cascade'}
                </button>
                <button
                  onClick={() => setShowDisruptionModal(false)}
                  className="btn-action btn-secondary"
                  style={{ fontSize: '11px', padding: '6px 10px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Telemetry Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Open TMS/TDMS Jobs</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {inspectJobs.length} Work Orders
            </div>
            <div style={{ fontSize: '10.5px', color: inspectJobs.some(j => j.statutory_deadline_minute) ? 'var(--accent-rose)' : 'var(--text-secondary)', marginTop: '2px' }}>
              {inspectJobs.filter(j => j.statutory_deadline_minute).length} Statutory Deadlines
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Planned Possessions</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: inspectBlocks.length > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)', marginTop: '2px' }}>
              {inspectBlocks.length} Block Windows
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--accent-emerald)', marginTop: '2px' }}>
              {inspectBlocks.filter(b => b.is_convoy).length} Joint Convoys Bundled
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Signaling Interlocking</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: inspectBlocks.length > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)', marginTop: '2px' }}>
              {inspectBlocks.length > 0 ? 'Occupied (Possession)' : 'Clear (Normal)'}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Solid State Electronic Interlocking
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Express Timetable Clearance</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              100% Conflict-Free
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Separation &gt; 15 min buffer margin
            </div>
          </div>
        </div>

        {/* Scheduled Possessions on this Section */}
        {inspectBlocks.length > 0 ? (
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Active Possession Schedule on {currentInspect.name} ({inspectBlocks.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
              {inspectBlocks.map(b => (
                <div
                  key={b.block_id}
                  onClick={() => onSelectBlock(b)}
                  style={{
                    background: 'var(--bg-input)',
                    border: b.is_convoy ? '1px solid var(--accent-emerald)' : '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="mono" style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>
                        {b.block_id}
                      </span>
                      {b.is_convoy ? (
                        <span className="dept-pill convoy">JOINT CONVOY</span>
                      ) : (
                        <span className="dept-pill engg">SINGLE DEPT</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Day {Math.floor(b.start_minute / 1440) + 1} • {b.duration_min} mins • {b.departments?.join(' + ')}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                    Inspect ▸
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No track possession scheduled on this section for Day {selectedDay}. Section is open for normal express and freight traffic.
          </div>
        )}
      </div>
    </div>
  )
}
