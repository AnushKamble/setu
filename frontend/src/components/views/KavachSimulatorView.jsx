import React, { useState, useEffect } from 'react'

export default function KavachSimulatorView({
  onNavigate = () => {}
}) {
  const [tsrData, setTsrData] = useState(null)
  const [simulating, setSimulating] = useState(false)
  const [simResult, setSimResult] = useState(null)
  const [activeSpeed, setActiveSpeed] = useState(120)
  const [activeDistance, setActiveDistance] = useState(1400)
  const [brakeStatus, setBrakeStatus] = useState('NORMAL')
  const [warningActive, setWarningActive] = useState(false)
  const [selectedTrain, setSelectedTrain] = useState('12004')

  useEffect(() => {
    fetchTsrFeed()
  }, [])

  const fetchTsrFeed = async () => {
    try {
      const res = await fetch('/api/kavach/tsr-feed')
      const data = await res.json()
      setTsrData(data)
    } catch (err) {
      console.error('Failed to load Kavach TSR feed:', err)
    }
  }

  // Authentic Kavach Cab Alert Audio Synthesizer (Web Audio API)
  const playKavachAlarm = (type = 'warning') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()

      if (type === 'warning') {
        // High-pitched rapid cab alert buzzer (1000Hz pulses)
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(1046.5, ctx.currentTime + (i * 0.15))
          gain.gain.setValueAtTime(0.18, ctx.currentTime + (i * 0.15))
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i * 0.15) + 0.12)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(ctx.currentTime + (i * 0.15))
          osc.stop(ctx.currentTime + (i * 0.15) + 0.12)
        }
      } else {
        // Continuous emergency brake tone (1500Hz siren)
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(1500, ctx.currentTime)
        gain.gain.setValueAtTime(0.25, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.5)
      }
    } catch (e) {
      console.warn('AudioContext warning:', e)
    }
  }

  const runSimulation = async (driverCompliant) => {
    setSimulating(true)
    setSimResult(null)
    setBrakeStatus('NORMAL')
    setWarningActive(false)
    setActiveSpeed(120)
    setActiveDistance(1400)

    try {
      const res = await fetch('/api/kavach/simulate-intervention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          train_no: selectedTrain,
          train_name: selectedTrain === '12004' ? 'Lucknow Shatabdi Express' : 'Dibrugarh Rajdhani Express',
          initial_speed_kmh: 120.0,
          driver_braking_applied: driverCompliant
        })
      })
      const result = await res.json()
      setSimResult(result)

      // Animate trajectory samples over time
      const samples = result.trajectory_samples || []
      let idx = 0

      const timer = setInterval(() => {
        if (idx >= samples.length) {
          clearInterval(timer)
          setSimulating(false)
          return
        }
        const s = samples[idx]
        setActiveSpeed(s.speed_kmh)
        setActiveDistance(s.distance_to_tsr_boundary_m)

        if (s.kavach_warning) {
          setWarningActive(true)
          if (idx % 2 === 0) playKavachAlarm('warning')
        }

        if (s.kavach_aeb_active) {
          setBrakeStatus('AEB_EMERGENCY_ACTIVE')
          if (idx % 2 === 0) playKavachAlarm('emergency')
        } else if (driverCompliant && s.distance_to_tsr_boundary_m <= 1000) {
          setBrakeStatus('SERVICE_BRAKE')
        }

        idx++
      }, 120)

    } catch (err) {
      console.error('Kavach simulation failed:', err)
      setSimulating(false)
    }
  }

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Kavach (TCAS) & Electronic Interlocking TSR Simulator
            </h1>
            <span style={{ fontSize: '11px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
              RDSO SPEC-0024 REV 4.0
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Flagship Indian Railways Automatic Train Protection (ATP) integration. Broadcasts digital Temporary Speed Restrictions (TSR) from SETU blocks to on-board locomotive units and enforces automatic emergency braking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            UHF Radio Link: <b style={{ color: '#34d399' }}>457.125 MHz (DUPLEX LOCKED)</b>
          </div>
        </div>
      </div>

      {/* 2. Interactive Locomotive Cab Display (Kavach DMI Console) */}
      <div className="card-surface" style={{
        padding: '24px',
        border: brakeStatus === 'AEB_EMERGENCY_ACTIVE' ? '2px solid #ef4444' : '1px solid #38bdf8',
        background: 'linear-gradient(180deg, #09090b 0%, #18181b 100%)',
        boxShadow: brakeStatus === 'AEB_EMERGENCY_ACTIVE' ? '0 0 30px rgba(239, 68, 68, 0.3)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        {/* Cab Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #27272a', paddingBottom: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px' }}>🛡️</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.5px' }}>
                KAVACH DMI — CAB DISPLAY UNIT (LOCOMOTIVE ON-BOARD CONSOLE)
              </div>
              <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
                Locomotive: WAP-7 #30214 • Train: {selectedTrain === '12004' ? '12004 Shatabdi Express' : '12424 Rajdhani Express'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '4px',
              background: warningActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: warningActive ? '#ef4444' : '#34d399',
              border: `1px solid ${warningActive ? '#ef4444' : '#10b981'}`
            }}>
              {warningActive ? '⚠️ KAVACH OVER-SPEED ALARM' : '● FULL SUPERVISION (FS)'}
            </span>

            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '4px',
              background: brakeStatus === 'AEB_EMERGENCY_ACTIVE' ? '#ef4444' : brakeStatus === 'SERVICE_BRAKE' ? '#f59e0b' : '#27272a',
              color: '#ffffff'
            }}>
              BRAKE: {brakeStatus.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Center: Instruments Cluster */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'center' }}>
          {/* Speedometer Gauge Display */}
          <div style={{
            background: '#040404',
            border: '2px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              ACTUAL LOCOMOTIVE SPEED
            </div>
            <div className="mono" style={{
              fontSize: '64px',
              fontWeight: 900,
              color: activeSpeed > 35 ? '#f87171' : '#34d399',
              marginTop: '4px',
              lineHeight: '1'
            }}>
              {Math.round(activeSpeed)}
            </div>
            <div style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: 800, marginTop: '2px' }}>
              KM / H
            </div>

            {/* Target Limit Box */}
            <div style={{
              marginTop: '16px',
              background: '#18181b',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              padding: '6px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '11px', color: '#a1a1aa' }}>TARGET PERMITTED:</span>
              <span className="mono" style={{ fontSize: '16px', fontWeight: 900, color: '#fbbf24' }}>
                30 KM/H
              </span>
            </div>
          </div>

          {/* Distance & Telemetry Readouts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Distance to Caution Zone */}
            <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#a1a1aa', marginBottom: '6px' }}>
                <span>DISTANCE TO TRACK POSSESSION BOUNDARY</span>
                <span className="mono" style={{ color: '#38bdf8', fontWeight: 800 }}>{Math.round(activeDistance)}m</span>
              </div>
              <div style={{ width: '100%', height: '12px', background: '#27272a', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, Math.max(0, (activeDistance / 1400) * 100))}%`,
                  height: '100%',
                  background: activeDistance < 600 ? '#ef4444' : activeDistance < 900 ? '#f59e0b' : '#34d399',
                  transition: 'width 0.1s linear, background 0.3s ease'
                }}></div>
              </div>
            </div>

            {/* Brake Cylinder Pressure */}
            <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#a1a1aa' }}>
                <span>BRAKE CYLINDER PRESSURE (BCP)</span>
                <span className="mono" style={{ color: brakeStatus === 'AEB_EMERGENCY_ACTIVE' ? '#ef4444' : '#fbbf24', fontWeight: 800 }}>
                  {brakeStatus === 'AEB_EMERGENCY_ACTIVE' ? '3.8 kg/cm² (EMERGENCY)' : brakeStatus === 'SERVICE_BRAKE' ? '2.4 kg/cm² (SERVICE)' : '0.0 kg/cm² (RELEASED)'}
                </span>
              </div>
            </div>

            {/* RFID Tag Interlocking Status */}
            <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '14px 16px', fontSize: '11.5px' }}>
              <div style={{ color: '#a1a1aa', marginBottom: '4px' }}>TRACKSIDE TCAS BEACON TELEGRAM</div>
              <div className="mono" style={{ color: '#38bdf8', fontSize: '12px' }}>
                RFID-NR-KM-22-400 • STU-GZB-RRI • 30 km/h TSR ACTIVE
              </div>
            </div>
          </div>
        </div>

        {/* Simulator Interactive Triggers */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #27272a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Select Test Train:</span>
            <select
              value={selectedTrain}
              onChange={(e) => setSelectedTrain(e.target.value)}
              className="navbar-select"
              style={{ fontSize: '11.5px', padding: '4px 10px', color: '#38bdf8' }}
            >
              <option value="12004">12004 Lucknow Shatabdi (WAP-7, 120 km/h)</option>
              <option value="12424">12424 Dibrugarh Rajdhani (WAP-5, 130 km/h)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => runSimulation(true)}
              disabled={simulating}
              className="btn-action"
              style={{
                fontSize: '12px',
                padding: '8px 16px',
                background: '#059669',
                color: '#ffffff',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {simulating ? 'Simulating...' : '✓ Test Compliant Driver (Service Brake)'}
            </button>

            <button
              onClick={() => runSimulation(false)}
              disabled={simulating}
              className="btn-action"
              style={{
                fontSize: '12px',
                padding: '8px 18px',
                background: '#dc2626',
                color: '#ffffff',
                fontWeight: 800,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(220, 38, 38, 0.4)'
              }}
            >
              {simulating ? 'Simulating Intervention...' : '⚠️ Test Distracted Driver (Kavach AEB Auto-Brake)'}
            </button>
          </div>
        </div>

        {/* Simulation Outcome Alert */}
        {simResult && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: simResult.kavach_emergency_brake_engaged ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${simResult.kavach_emergency_brake_engaged ? '#ef4444' : '#10b981'}`,
            color: simResult.kavach_emergency_brake_engaged ? '#fca5a5' : '#34d399',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>{simResult.kavach_emergency_brake_engaged ? '🛡️' : '✓'}</span>
            <div>
              <b style={{ color: '#ffffff' }}>
                {simResult.kavach_emergency_brake_engaged ? 'KAVACH AUTOMATIC EMERGENCY BRAKE (AEB) INTERVENTION SUCCESSFUL' : 'DRIVER COMPLIANT SPEED REDUCTION'}
              </b>
              <div style={{ fontSize: '11.5px', marginTop: '2px' }}>
                {simResult.outcome_message}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Active Digital TSR Profiles Feed (Generated by SETU Blocks) */}
      <div className="card-surface" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Active Digital TSR (Temporary Speed Restriction) Feed
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Digital caution orders generated automatically from approved possession blocks and broadcast to stationary trackside Kavach units.
            </div>
          </div>
          <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '3px 10px', borderRadius: '4px', fontWeight: 700 }}>
            {tsrData?.active_tsrs_count || 6} ACTIVE TSR PROFILES
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>TSR Reference</th>
                <th style={{ padding: '10px 12px' }}>Section & Track</th>
                <th style={{ padding: '10px 12px' }}>Kilometer Span</th>
                <th style={{ padding: '10px 12px' }}>Caution Speed</th>
                <th style={{ padding: '10px 12px' }}>Reason (IRPWM Rule)</th>
                <th style={{ padding: '10px 12px' }}>Trackside RFID Beacon</th>
                <th style={{ padding: '10px 12px' }}>TCAS Radio Packet</th>
              </tr>
            </thead>
            <tbody>
              {(tsrData?.tsr_profiles || []).map((tsr, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-primary)' }} className="mono">
                    {tsr.tsr_id}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <b>{tsr.section_id}</b> <span style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>({tsr.track_type})</span>
                  </td>
                  <td style={{ padding: '12px' }} className="mono">
                    KM {tsr.start_km} – KM {tsr.end_km}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                      {tsr.caution_speed_kmh} km/h
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '11.5px' }}>
                    {tsr.reason}
                  </td>
                  <td style={{ padding: '12px' }} className="mono" style={{ fontSize: '11px', color: '#38bdf8' }}>
                    {tsr.rfid_tag_boundary_inrear}
                  </td>
                  <td style={{ padding: '12px' }} className="mono" style={{ fontSize: '10.5px', color: '#a1a1aa' }}>
                    {tsr.tcas_packet_hex}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
