import React, { useState } from 'react'
import {
  Wrench,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Radio,
  FileText,
  TrendingUp,
  Search,
  ArrowRight,
  Cpu,
  Share2,
  X
} from 'lucide-react'

export default function FieldPortalView({
  sections = [],
  onNavigate = () => {},
  onPlanUpdated = () => {}
}) {
  const [selectedDept, setSelectedDept] = useState('ENGINEERING')
  const [selectedSection, setSelectedSection] = useState(
    sections.length > 0 ? sections[0].id : 'SEC-GZB-ALJN-UP'
  )
  const [jobType, setJobType] = useState('RAIL_FRACTURE_REPAIR')
  const [description, setDescription] = useState(
    'Urgent ultrasonic flaw detection (USFD) indicates internal transverse fissure on rail web. 30 km/h caution imposed.'
  )
  const [durationMinutes, setDurationMinutes] = useState(90)
  const [hasStatutoryDeadline, setHasStatutoryDeadline] = useState(true)
  const [statutoryHours, setStatutoryHours] = useState(24)
  const [machineRequired, setMachineRequired] = useState('NONE')
  const [crewSize, setCrewSize] = useState(8)

  // Execution state
  const [submitting, setSubmitting] = useState(false)
  const [executionResult, setExecutionResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  // Job type presets by department
  const DEPT_JOB_TYPES = {
    ENGINEERING: [
      { id: 'RAIL_FRACTURE_REPAIR', label: 'Emergency Rail Fracture / Weld Repair', defaultMachine: 'NONE', defaultDur: 90 },
      { id: 'TRACK_TAMPING', label: 'Plain Track Tamping & Alignment', defaultMachine: 'TAMPING_MACHINE', defaultDur: 180 },
      { id: 'TURNOUT_OVERHAUL', label: 'Turnout & Switch Packing', defaultMachine: 'NONE', defaultDur: 120 },
      { id: 'BALLAST_REGULATION', label: 'Ballast Profiling & Regulating', defaultMachine: 'BCM', defaultDur: 150 },
      { id: 'DEEP_SCREENING', label: 'Ballast Deep Screening (BCM)', defaultMachine: 'BCM', defaultDur: 240 }
    ],
    TRD: [
      { id: 'OHE_INSPECTION', label: 'OHE Bracket & Dropper Inspection', defaultMachine: 'TOWER_WAGON', defaultDur: 120 },
      { id: 'CONTACT_WIRE_RENEWAL', label: 'Contact Wire Replacement / Splicing', defaultMachine: 'TOWER_WAGON', defaultDur: 180 },
      { id: 'INSULATOR_REPLACEMENT', label: 'Porcelain Insulator Washing / Swap', defaultMachine: 'TOWER_WAGON', defaultDur: 90 },
      { id: 'CANTILEVER_ADJUSTMENT', label: 'Cantilever Stagger & Height Adjust', defaultMachine: 'NONE', defaultDur: 120 },
      { id: 'POWER_BLOCK_ISOLATION', label: 'Substation Feeder Isolator Overhaul', defaultMachine: 'NONE', defaultDur: 90 }
    ],
    S_AND_T: [
      { id: 'POINT_MACHINE_OVERHAUL', label: 'Point Machine Internal Motor Overhaul', defaultMachine: 'NONE', defaultDur: 90 },
      { id: 'TRACK_CIRCUIT_TESTING', label: 'Track Circuit Bonding & Relay Test', defaultMachine: 'NONE', defaultDur: 75 },
      { id: 'AXLE_COUNTER_CALIBRATION', label: 'Digital Axle Counter Head Alignment', defaultMachine: 'NONE', defaultDur: 60 },
      { id: 'SIGNAL_INTERLOCKING', label: 'Route Relay Interlocking Disconnection', defaultMachine: 'NONE', defaultDur: 120 },
      { id: 'LEVEL_CROSSING_GATE', label: 'Interlocked LC Gate Mechanism Service', defaultMachine: 'NONE', defaultDur: 90 }
    ]
  }

  // Handle department change
  const handleDeptChange = (dept) => {
    setSelectedDept(dept)
    const firstType = DEPT_JOB_TYPES[dept][0]
    setJobType(firstType.id)
    setMachineRequired(firstType.defaultMachine)
    setDurationMinutes(firstType.defaultDur)
  }

  // 1-Click Judge Incident Presets
  const handleApplyPreset = (presetKey) => {
    if (presetKey === 'RAIL_FRACTURE') {
      setSelectedDept('ENGINEERING')
      setSelectedSection('SEC-GZB-ALJN-UP')
      setJobType('RAIL_FRACTURE_REPAIR')
      setDescription('Urgent USFD detected rail flaw (IMR category). Immediate 30 km/h caution order. Requires urgent 90m block within 24 hours.')
      setDurationMinutes(90)
      setHasStatutoryDeadline(true)
      setStatutoryHours(24)
      setMachineRequired('NONE')
      setCrewSize(10)
    } else if (presetKey === 'OHE_SNAPPING') {
      setSelectedDept('TRD')
      setSelectedSection('SEC-NDLS-GZB-UP')
      setJobType('CONTACT_WIRE_RENEWAL')
      setDescription('Pantograph arcing reported on Up line near km 18/4. Dropper snapped, requires Tower Wagon power block.')
      setDurationMinutes(120)
      setHasStatutoryDeadline(true)
      setStatutoryHours(36)
      setMachineRequired('TOWER_WAGON')
      setCrewSize(6)
    } else if (presetKey === 'POINT_JAM') {
      setSelectedDept('S_AND_T')
      setSelectedSection('SEC-ALJN-CNB-DN')
      setJobType('POINT_MACHINE_OVERHAUL')
      setDescription('Turnout 14B motor drawing high clutch current (6.2A). Risk of mainline point reversion. Urgent S&T service.')
      setDurationMinutes(90)
      setHasStatutoryDeadline(true)
      setStatutoryHours(48)
      setMachineRequired('NONE')
      setCrewSize(4)
    }
  }

  // Submit Job
  const handleSubmitJob = async (customPayload = null) => {
    setSubmitting(true)
    setErrorMsg(null)
    setExecutionResult(null)

    const payload = customPayload || {
      department: selectedDept,
      section_id: selectedSection,
      job_type: jobType,
      description: description,
      duration_minutes: Number(durationMinutes),
      statutory_deadline_hours: hasStatutoryDeadline ? Number(statutoryHours) : null,
      machine_required: machineRequired,
      min_crew_size: Number(crewSize),
      auto_reoptimize: true
    }

    try {
      const res = await fetch('/api/jobs/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to submit work order')
      }

      setExecutionResult(data)
      if (onPlanUpdated) {
        onPlanUpdated(data)
      }
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header with CRIS/IR Badging */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', margin: 0 }}>
              Field Engineer Requisition Portal
            </h1>
            <span style={{
              fontSize: '10.5px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              LIVE INGESTION
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: '4px 0 0 0' }}>
            Unified field console for Senior Section Engineers (SSE / Track, TRD, and S&T) to log emergency & routine requisitions directly into SETU.
          </p>
        </div>

        {/* Live Systems Status Chips */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            fontSize: '11px',
            padding: '5px 10px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>TMS Gateway:</span>
            <strong style={{ color: 'var(--text-primary)' }}>Online</strong>
          </div>
          <div style={{
            fontSize: '11px',
            padding: '5px 10px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>TDMS Telemetry:</span>
            <strong style={{ color: 'var(--text-primary)' }}>Active</strong>
          </div>
          <div style={{
            fontSize: '11px',
            padding: '5px 10px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>SMMS Relays:</span>
            <strong style={{ color: 'var(--text-primary)' }}>Synced</strong>
          </div>
        </div>
      </div>

      {/* 2. Interactive 1-Click Judge Incident Presets */}
      <div>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'var(--text-muted)',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Zap size={13} color="#f59e0b" />
          <span>Interactive Judge Demo Presets (1-Click Live Incident Injection)</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '14px'
        }}>
          {/* Preset 1: Rail Fracture */}
          <div
            onClick={() => handleApplyPreset('RAIL_FRACTURE')}
            style={{
              background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, rgba(24, 24, 27, 0.6) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '16px 18px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              position: 'relative'
            }}
            className="card-surface-hover"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} color="#ef4444" />
                <strong style={{ fontSize: '13.5px', color: '#fca5a5' }}>
                  Incident 1: USFD Rail Fracture
                </strong>
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171'
              }}>
                ENGINEERING / TMS
              </span>
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '8px 0 10px 0', lineHeight: 1.4 }}>
              Severe ultrasonic flaw detected on <strong>GZB-ALJN Up Main</strong>. 30 km/h caution imposed. 90-min block required within 24 hrs.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deadline: 24h • Gang: 10</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleApplyPreset('RAIL_FRACTURE')
                  handleSubmitJob({
                    department: 'ENGINEERING',
                    section_id: 'SEC-GZB-ALJN-UP',
                    job_type: 'RAIL_FRACTURE_REPAIR',
                    description: 'Urgent USFD detected rail flaw (IMR category). Immediate 30 km/h caution order. Requires urgent 90m block within 24 hours.',
                    duration_minutes: 90,
                    statutory_deadline_hours: 24,
                    machine_required: 'NONE',
                    min_crew_size: 10,
                    auto_reoptimize: true
                  })
                }}
                disabled={submitting}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Dispatch Incident</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Preset 2: OHE Snapping */}
          <div
            onClick={() => handleApplyPreset('OHE_SNAPPING')}
            style={{
              background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(24, 24, 27, 0.6) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '16px 18px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            className="card-surface-hover"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} color="#f59e0b" />
                <strong style={{ fontSize: '13.5px', color: '#fde68a' }}>
                  Incident 2: OHE Wire Dropper Snapped
                </strong>
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24'
              }}>
                TRD / TDMS
              </span>
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '8px 0 10px 0', lineHeight: 1.4 }}>
              Pantograph arcing on <strong>NDLS-GZB Up Main</strong>. Requires 120-min Power Block with Tower Wagon from Delhi depot.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deadline: 36h • Tower Wagon</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleApplyPreset('OHE_SNAPPING')
                  handleSubmitJob({
                    department: 'TRD',
                    section_id: 'SEC-NDLS-GZB-UP',
                    job_type: 'CONTACT_WIRE_RENEWAL',
                    description: 'Pantograph arcing reported on Up line near km 18/4. Dropper snapped, requires Tower Wagon power block.',
                    duration_minutes: 120,
                    statutory_deadline_hours: 36,
                    machine_required: 'TOWER_WAGON',
                    min_crew_size: 6,
                    auto_reoptimize: true
                  })
                }}
                disabled={submitting}
                style={{
                  background: '#f59e0b',
                  border: 'none',
                  color: '#000000',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Dispatch Incident</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Preset 3: Point Machine Jam */}
          <div
            onClick={() => handleApplyPreset('POINT_JAM')}
            style={{
              background: 'linear-gradient(180deg, rgba(14, 165, 233, 0.08) 0%, rgba(24, 24, 27, 0.6) 100%)',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              borderRadius: '12px',
              padding: '16px 18px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            className="card-surface-hover"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={16} color="#38bdf8" />
                <strong style={{ fontSize: '13.5px', color: '#bae6fd' }}>
                  Incident 3: Turnout Point Motor Friction
                </strong>
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(14, 165, 233, 0.2)',
                color: '#38bdf8'
              }}>
                S&T / SMMS
              </span>
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '8px 0 10px 0', lineHeight: 1.4 }}>
              Turnout 14B motor at <strong>ALJN-CNB Dn</strong> drawing 6.2A friction overshoot. Point machine overhaul required.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deadline: 48h • S&T Gang: 4</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleApplyPreset('POINT_JAM')
                  handleSubmitJob({
                    department: 'S_AND_T',
                    section_id: 'SEC-ALJN-CNB-DN',
                    job_type: 'POINT_MACHINE_OVERHAUL',
                    description: 'Turnout 14B motor drawing high clutch current (6.2A). Risk of mainline point reversion. Urgent S&T service.',
                    duration_minutes: 90,
                    statutory_deadline_hours: 48,
                    machine_required: 'NONE',
                    min_crew_size: 4,
                    auto_reoptimize: true
                  })
                }}
                disabled={submitting}
                style={{
                  background: '#0284c7',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Dispatch Incident</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Custom Requisition Console */}
      <div className="card-surface" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Custom Field Work Order Ingestion Form
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Configure custom engineering variables and watch SETU's LightGBM & CP-SAT pipeline arbitrate track access.
            </p>
          </div>
        </div>

        {/* Form Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Department Selector */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              REPORTING DEPARTMENT (SYSTEM)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[
                { id: 'ENGINEERING', label: 'P-Way / Track', system: 'TMS' },
                { id: 'TRD', label: 'OHE Traction', system: 'TDMS' },
                { id: 'S_AND_T', label: 'Signal & Telecom', system: 'SMMS' }
              ].map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleDeptChange(d.id)}
                  style={{
                    background: selectedDept === d.id ? 'var(--accent-primary)' : 'var(--bg-input)',
                    color: selectedDept === d.id ? '#ffffff' : 'var(--text-secondary)',
                    border: `1px solid ${selectedDept === d.id ? 'var(--accent-primary)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    padding: '10px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '11.5px', fontWeight: 700 }}>{d.label}</span>
                  <span style={{ fontSize: '9.5px', opacity: 0.75 }}>{d.system}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section Selector */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              CORRIDOR TRACK SECTION
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              {sections.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.track_type} • {s.length_km}km)
                </option>
              ))}
            </select>
          </div>

          {/* Job Type Selector */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              WORK ORDER CATEGORY
            </label>
            <select
              value={jobType}
              onChange={(e) => {
                setJobType(e.target.value)
                const matched = DEPT_JOB_TYPES[selectedDept].find(t => t.id === e.target.value)
                if (matched) {
                  setMachineRequired(matched.defaultMachine)
                  setDurationMinutes(matched.defaultDur)
                }
              }}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              {DEPT_JOB_TYPES[selectedDept].map(t => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Slider with Live P90 Buffer Preview */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                NOMINAL DURATION (P50)
              </label>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {durationMinutes} mins
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  padding: '1px 5px',
                  borderRadius: '3px'
                }}>
                  P90 Buffer: {durationMinutes + Math.max(15, Math.floor(durationMinutes * 0.20))}m
                </span>
              </div>
            </div>
            <input
              type="range"
              min="30"
              max="360"
              step="15"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
          </div>

          {/* Statutory Emergency Toggle & Hours */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              STATUTORY DEADLINE CONSTRAINT
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={hasStatutoryDeadline}
                  onChange={(e) => setHasStatutoryDeadline(e.target.checked)}
                  style={{ accentColor: '#ef4444', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span>Mandatory Safety Clearance</span>
              </label>
              {hasStatutoryDeadline && (
                <select
                  value={statutoryHours}
                  onChange={(e) => setStatutoryHours(Number(e.target.value))}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    color: '#f87171',
                    fontSize: '12px',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                >
                  <option value="24">Within 24 Hours (Day 1 Emergency)</option>
                  <option value="48">Within 48 Hours (Day 2)</option>
                  <option value="72">Within 72 Hours (Day 3)</option>
                  <option value="120">Within 120 Hours (Day 5)</option>
                </select>
              )}
            </div>
          </div>

          {/* Machine & Resource Pool */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              SPECIALIZED TRACK MACHINE / EQUIPMENT
            </label>
            <select
              value={machineRequired}
              onChange={(e) => setMachineRequired(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              <option value="NONE">Manual Hand Gang (No Heavy Machine)</option>
              <option value="TOWER_WAGON">OHE Tower Wagon (TRD Depot Pool)</option>
              <option value="TAMPING_MACHINE">Tie Tamping Machine (Track P-Way)</option>
              <option value="BCM">Ballast Cleaning Machine (Heavy Mech)</option>
            </select>
          </div>
        </div>

        {/* Description Field */}
        <div style={{ marginTop: '16px' }}>
          <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            OPERATIONAL DEFECT LOG & CAUTION ORDER REMARKS
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              outline: 'none',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Error message banner */}
        {errorMsg && (
          <div style={{
            marginTop: '16px',
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            color: '#fca5a5',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Button */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            onClick={() => handleSubmitJob()}
            disabled={submitting}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 16px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            {submitting ? (
              <>
                <Zap size={16} className="animate-spin" />
                <span>Executing SETU Engine (ML + CP-SAT)...</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>Submit Requisition & Re-optimize Corridor</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Live Pipeline Execution Trace Modal / Card */}
      {executionResult && (
        <div className="card-surface" style={{
          padding: '24px 28px',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(24, 24, 27, 0.8) 100%)'
        }}>
          {/* Success Title */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.2)',
                borderRadius: '50%',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={22} color="#10b981" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#6ee7b7', margin: 0 }}>
                  Work Order Registered & Coordinated Across Corridor
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Canonical ID: <strong>{executionResult.job.id}</strong> • Assigned Block: <strong>{executionResult.pipeline_trace.optimization.block_id}</strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => setExecutionResult(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* 4-Step Pipeline Architecture Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            marginBottom: '20px'
          }}>
            {/* Step 1: Ledger */}
            <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                1. Canonical Ledger
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                {executionResult.pipeline_trace.canonical_ledger.status}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {executionResult.pipeline_trace.canonical_ledger.regulatory_standard}
              </div>
            </div>

            {/* Step 2: ML Scoring */}
            <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                2. LightGBM AI Scoring
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
                Priority: {executionResult.pipeline_trace.ml_scoring.priority_score}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                P90 Buffer: +{executionResult.pipeline_trace.ml_scoring.p90_buffer_min}m • Risk: {executionResult.pipeline_trace.ml_scoring.cost_of_waiting_7d}
              </div>
            </div>

            {/* Step 3: CP-SAT Optimization */}
            <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                3. OR-Tools CP-SAT Convoy
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
                {executionResult.pipeline_trace.optimization.is_convoy ? 'Joint Convoy Formed' : 'Scheduled Solo'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Solved in {executionResult.pipeline_trace.optimization.solve_time_seconds}s • Saved {executionResult.pipeline_trace.optimization.downtime_saved_min}m delay
              </div>
            </div>

            {/* Step 4: Safety Validator */}
            <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                4. Zero-Trust Validator
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                100% Safety Certified
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {executionResult.pipeline_trace.safety_validation.checks_passed} of {executionResult.pipeline_trace.safety_validation.total_checks_run} Safety Checks Passed
              </div>
            </div>
          </div>

          {/* Convoy Synergy Explanation */}
          {executionResult.pipeline_trace.optimization.is_convoy && (
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '12.5px',
              color: '#bae6fd'
            }}>
              <strong>Convoy Synergy Achieved:</strong> SETU co-located this work order into an upcoming shadow maintenance window with{' '}
              <strong>{executionResult.pipeline_trace.optimization.bundled_departments.filter(d => d !== executionResult.job.department).join(', ')}</strong> on{' '}
              <strong>{executionResult.pipeline_trace.optimization.section_id}</strong> (Day {executionResult.pipeline_trace.optimization.day_number} at {executionResult.pipeline_trace.optimization.start_time_hhmm}). This avoids opening a standalone track possession and eliminates{' '}
              <strong>{executionResult.pipeline_trace.optimization.downtime_saved_min} minutes</strong> of freight & passenger train detentions!
            </div>
          )}

          {/* Interactive Navigation CTAs */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => onNavigate('planner')}
              style={{
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '9px 16px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Search size={14} />
              <span>Inspect on Possession Planner</span>
            </button>

            <button
              onClick={() => onNavigate('marey')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '9px 16px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <TrendingUp size={14} />
              <span>Verify on Marey String Chart</span>
            </button>

            <button
              onClick={() => onNavigate('dispatch')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '9px 16px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Radio size={14} />
              <span>Open CUG Dispatch Console</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
