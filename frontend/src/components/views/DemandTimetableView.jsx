import React, { useState, useEffect, useMemo } from 'react'
import {
  Wrench,
  Calendar,
  Train,
  GitFork,
  Search,
  Filter,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  Layers,
  Zap,
  Info
} from 'lucide-react'
import MaintenanceView from './MaintenanceView'
import FieldPortalView from './FieldPortalView'
import CorridorMap from '../CorridorMap'

export default function DemandTimetableView({
  jobs = [],
  windows = [],
  sections = [],
  optimizedPlan = null,
  activeSubTab = 'backlog',
  onSelectSubTab,
  onNavigate,
  onPlanUpdated,
  onDisruptionApplied
}) {
  const [subTab, setSubTab] = useState(activeSubTab || 'backlog')

  // Timetable State
  const [timetableDay, setTimetableDay] = useState(1)
  const [timetableSection, setTimetableSection] = useState('ALL')
  const [timetableClass, setTimetableClass] = useState('ALL')
  const [delayedOnly, setDelayedOnly] = useState(false)
  const [timetableSearch, setTimetableSearch] = useState('')
  const [timetableData, setTimetableData] = useState(null)
  const [timetableLoading, setTimetableLoading] = useState(false)
  const [resettingSchedule, setResettingSchedule] = useState(false)
  const [statusNotice, setStatusNotice] = useState('')

  // Corridor Windows Filter State
  const [windowSectionFilter, setWindowSectionFilter] = useState('ALL')
  const [windowTierFilter, setWindowTierFilter] = useState('ALL')
  const [windowSearch, setWindowSearch] = useState('')

  useEffect(() => {
    if (activeSubTab) {
      setSubTab(activeSubTab)
    }
  }, [activeSubTab])

  useEffect(() => {
    fetchTimetable()
  }, [timetableDay, timetableSection, timetableClass, delayedOnly])

  const fetchTimetable = async () => {
    setTimetableLoading(true)
    try {
      let url = `/api/trains?day=${timetableDay}&delayed_only=${delayedOnly}`
      if (timetableSection !== 'ALL') url += `&section_id=${timetableSection}`
      if (timetableClass !== 'ALL') url += `&priority_class=${timetableClass}`

      const res = await fetch(url)
      const data = await res.json()
      setTimetableData(data)
    } catch (err) {
      console.error('Failed to load train timetable:', err)
    } finally {
      setTimetableLoading(false)
    }
  }

  const handleResetDisruption = async () => {
    setResettingSchedule(true)
    try {
      const res = await fetch('/api/simulation/reset', { method: 'POST' })
      const data = await res.json()
      setStatusNotice('Timetable and corridor possession plan restored to nominal baseline.')
      await fetchTimetable()
      if (onPlanUpdated) {
        onPlanUpdated()
      }
    } catch (err) {
      console.error('Failed to reset timetable:', err)
    } finally {
      setResettingSchedule(false)
    }
  }

  // Filtered Timetable Trains
  const filteredTrains = useMemo(() => {
    if (!timetableData?.trains) return []
    if (!timetableSearch.trim()) return timetableData.trains
    const q = timetableSearch.toLowerCase()
    return timetableData.trains.filter(t =>
      (t.train_number || '').toLowerCase().includes(q) ||
      (t.train_name || '').toLowerCase().includes(q) ||
      (t.section_id || '').toLowerCase().includes(q)
    )
  }, [timetableData, timetableSearch])

  // Filtered Corridor Windows
  const filteredWindows = useMemo(() => {
    return (windows || []).filter(w => {
      if (windowSectionFilter !== 'ALL' && w.section_id !== windowSectionFilter) return false
      if (windowTierFilter !== 'ALL' && w.traffic_impact_tier !== windowTierFilter) return false
      if (windowSearch.trim()) {
        const q = windowSearch.toLowerCase()
        return (w.id || '').toLowerCase().includes(q) || (w.section_id || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [windows, windowSectionFilter, windowTierFilter, windowSearch])

  const subTabs = [
    { id: 'backlog', label: 'Asset Backlog', badge: `${jobs?.length || 18}`, icon: Wrench },
    { id: 'windows', label: 'Block Windows', badge: `${windows?.length || 24}`, icon: Calendar },
    { id: 'timetable', label: 'Train Timetable', badge: timetableData?.summary?.is_corridor_disrupted ? `${timetableData.summary.delayed_count} Del` : `${timetableData?.summary?.total_trains || '140+'}`, badgeColor: timetableData?.summary?.is_corridor_disrupted ? '#ef4444' : '#38bdf8', icon: Train },
    { id: 'portal', label: 'Field Portal', badge: 'Submit', icon: Layers },
    { id: 'topology', label: 'Track Topology', badge: `${sections?.length || 6}`, icon: GitFork },
  ]

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Corridor Demands, Block Windows & Train Timetable
            </h1>
            <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              STEP 02 OF 05
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Comprehensive unified repository of physical track constraints: multi-department asset backlog, available corridor block windows, and the Working Time Table (WTT).
          </p>
        </div>

        {timetableData?.summary?.is_corridor_disrupted && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '8px 14px',
            borderRadius: '6px'
          }}>
            <AlertTriangle size={15} color="#ef4444" />
            <div style={{ fontSize: '12px', color: '#f87171', fontWeight: 600 }}>
              Live Disruption Active: <b>+{timetableData.summary.total_network_delay_minutes}m</b> delay across {timetableData.summary.delayed_count + timetableData.summary.knocked_on_count} trains
            </div>
            <button
              onClick={handleResetDisruption}
              disabled={resettingSchedule}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RefreshCw size={11} className={resettingSchedule ? 'animate-spin' : ''} />
              <span>Reset to Nominal</span>
            </button>
          </div>
        )}
      </div>

      {statusNotice && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid var(--accent-emerald)',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={15} />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* 2. Sub-Tab Switcher (Single Unified Row, Zero Horizontal Scrollbar) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: '6px',
        padding: '5px',
        background: 'rgba(20, 24, 33, 0.95)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none'
      }}>
        {subTabs.map(t => {
          const isActive = subTab === t.id
          const IconCmp = t.icon
          return (
            <button
              key={t.id}
              onClick={() => {
                setSubTab(t.id)
                if (onSelectSubTab) onSelectSubTab(t.id)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 8px',
                borderRadius: '6px',
                background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(56, 189, 248, 0.4)' : 'transparent'}`,
                color: isActive ? '#38bdf8' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                width: '100%',
                minWidth: 0,
                overflow: 'hidden'
              }}
              title={t.label}
            >
              <IconCmp size={14} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
              {t.badge && (
                <span style={{
                  fontSize: '9.5px',
                  padding: '1.5px 5px',
                  borderRadius: '4px',
                  background: isActive ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.07)',
                  color: t.badgeColor || (isActive ? '#38bdf8' : 'var(--text-muted)'),
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {t.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 3. Sub-Tab Content */}
      <div style={{ width: '100%' }}>
        {/* SUBTAB 1: ASSET BACKLOG */}
        {subTab === 'backlog' && (
          <MaintenanceView jobs={jobs} />
        )}

        {/* SUBTAB 2: CORRIDOR BLOCKS & WINDOWS */}
        {subTab === 'windows' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Filter Bar */}
            <div className="card-surface" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px' }}>
                  <Search size={14} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Search block ID or section..."
                    value={windowSearch}
                    onChange={(e) => setWindowSearch(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '12px', outline: 'none', width: '180px' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <Filter size={13} />
                  <span>Section:</span>
                  <select
                    value={windowSectionFilter}
                    onChange={(e) => setWindowSectionFilter(e.target.value)}
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'white', padding: '5px 8px', borderRadius: '4px', fontSize: '12px' }}
                  >
                    <option value="ALL">All Sections</option>
                    {(sections || []).map(s => (
                      <option key={s.id} value={s.id}>{s.name || s.id}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>Tier:</span>
                  <select
                    value={windowTierFilter}
                    onChange={(e) => setWindowTierFilter(e.target.value)}
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'white', padding: '5px 8px', borderRadius: '4px', fontSize: '12px' }}
                  >
                    <option value="ALL">All Impact Tiers</option>
                    <option value="NIGHT_BLOCK">NIGHT_BLOCK (00:30-05:00)</option>
                    <option value="DAY_OFF_PEAK">DAY_OFF_PEAK (Midday)</option>
                  </select>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Showing <b>{filteredWindows.length}</b> of <b>{windows.length}</b> Corridor Windows
              </div>
            </div>

            {/* Windows Table */}
            <div className="card-surface" style={{ overflowX: 'auto', padding: '0px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>WINDOW ID</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>SECTION</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>TIMING (HH:MM)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>DURATION</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>TRAFFIC IMPACT TIER</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>ALLOWED DEPARTMENTS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWindows.map((win, idx) => {
                    const startH = Math.floor(win.start_minute / 60)
                    const startM = win.start_minute % 60
                    const endH = Math.floor(win.end_minute / 60)
                    const endM = win.end_minute % 60
                    const timeStr = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')} - ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`

                    return (
                      <tr key={win.id || idx} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }} className="mono">
                          {win.id}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                          {win.section_id}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#38bdf8' }} className="mono">
                          {timeStr}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                          <span style={{ background: 'var(--bg-input)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                            {win.duration_min} mins
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: win.traffic_impact_tier === 'NIGHT_BLOCK' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: win.traffic_impact_tier === 'NIGHT_BLOCK' ? '#34d399' : '#fbbf24'
                          }}>
                            {win.traffic_impact_tier}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {(win.allowed_departments || []).map((d, dIdx) => (
                              <span key={dIdx} style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 6px', borderRadius: '3px', color: 'var(--text-secondary)' }}>
                                {d}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 3: TRAIN TIMETABLE (WTT) */}
        {subTab === 'timetable' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* KPI Summary Cards */}
            {timetableData?.summary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="card-surface" style={{ padding: '14px 18px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>TOTAL CORRIDOR TRAINS</div>
                  <div className="mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {timetableData.summary.total_trains}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Quadruple Arterial Movements</div>
                </div>

                <div className="card-surface" style={{ padding: '14px 18px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>ON-TIME PERFORMANCE</div>
                  <div className="mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
                    {timetableData.summary.on_time_count}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Within 5m punctuality tolerance</div>
                </div>

                <div className="card-surface" style={{ padding: '14px 18px', borderLeft: timetableData.summary.delayed_count > 0 ? '3px solid #ef4444' : '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>DELAYED / KNOCKED-ON</div>
                  <div className="mono" style={{ fontSize: '22px', fontWeight: 800, color: timetableData.summary.delayed_count > 0 ? '#f87171' : 'var(--text-primary)', marginTop: '4px' }}>
                    {timetableData.summary.delayed_count + timetableData.summary.knocked_on_count}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {timetableData.summary.delayed_count} Origin • {timetableData.summary.knocked_on_count} Knocked-on
                  </div>
                </div>

                <div className="card-surface" style={{ padding: '14px 18px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>NET NETWORK DELAY</div>
                  <div className="mono" style={{ fontSize: '22px', fontWeight: 800, color: timetableData.summary.total_network_delay_minutes > 0 ? '#fbbf24' : 'var(--accent-emerald)', marginTop: '4px' }}>
                    {timetableData.summary.total_network_delay_minutes}m
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Max single: +{timetableData.summary.max_single_delay_minutes}m</div>
                </div>
              </div>
            )}

            {/* Filter Controls */}
            <div className="card-surface" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px' }}>
                  <Search size={14} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Search train no. or name..."
                    value={timetableSearch}
                    onChange={(e) => setTimetableSearch(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '12px', outline: 'none', width: '180px' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>Day:</span>
                  <select
                    value={timetableDay}
                    onChange={(e) => setTimetableDay(Number(e.target.value))}
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'white', padding: '5px 8px', borderRadius: '4px', fontSize: '12px' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(d => (
                      <option key={d} value={d}>Day {d}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>Section:</span>
                  <select
                    value={timetableSection}
                    onChange={(e) => setTimetableSection(e.target.value)}
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'white', padding: '5px 8px', borderRadius: '4px', fontSize: '12px' }}
                  >
                    <option value="ALL">All Sections</option>
                    {(sections || []).map(s => (
                      <option key={s.id} value={s.id}>{s.name || s.id}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>Class:</span>
                  <select
                    value={timetableClass}
                    onChange={(e) => setTimetableClass(e.target.value)}
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'white', padding: '5px 8px', borderRadius: '4px', fontSize: '12px' }}
                  >
                    <option value="ALL">All Classes</option>
                    <option value="EXPRESS">Express Only</option>
                    <option value="FREIGHT_SCHEDULED">Freight Only</option>
                  </select>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={delayedOnly}
                    onChange={(e) => setDelayedOnly(e.target.checked)}
                  />
                  <span>Delayed Only</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={fetchTimetable}
                  style={{
                    background: 'var(--bg-input)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <RefreshCw size={12} className={timetableLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Timetable Table */}
            <div className="card-surface" style={{ overflowX: 'auto', padding: '0px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>TRAIN NO & NAME</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>CLASS</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>SECTION</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>SCHEDULED (WTT)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>LIVE ESTIMATED</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>REAL-TIME STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrains.map((t, idx) => {
                    const isDelayed = t.delay_minutes > 0
                    const isKnockedOn = t.status === 'KNOCKED_ON'

                    return (
                      <tr
                        key={t.id || idx}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: isDelayed ? 'rgba(239, 68, 68, 0.04)' : 'transparent'
                        }}
                        className="table-row-hover"
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            <span className="mono" style={{ color: '#38bdf8', marginRight: '6px' }}>{t.train_number}</span>
                            <span>{t.train_name}</span>
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }} className="mono">
                            {t.id}
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: t.priority_class === 'EXPRESS' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: t.priority_class === 'EXPRESS' ? '#38bdf8' : '#fbbf24'
                          }}>
                            {t.priority_class}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                          {t.section_name || t.section_id}
                        </td>

                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }} className="mono">
                          {t.original_entry_hhmm} - {t.original_exit_hhmm}
                        </td>

                        <td style={{ padding: '12px 16px', fontWeight: 600, color: isDelayed ? '#f87171' : 'var(--text-primary)' }} className="mono">
                          {t.entry_hhmm} - {t.exit_hhmm}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          {isDelayed ? (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: isKnockedOn ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: isKnockedOn ? '#fbbf24' : '#f87171',
                              border: `1px solid ${isKnockedOn ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Clock size={11} />
                              <span>+{t.delay_minutes}m {isKnockedOn ? '(Cascade)' : '(Origin)'}</span>
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#34d399',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <CheckCircle2 size={11} />
                              <span>ON TIME</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 4: FIELD REQUISITION PORTAL */}
        {subTab === 'portal' && (
          <FieldPortalView
            sections={sections}
            onNavigate={onNavigate}
            onPlanUpdated={onPlanUpdated}
          />
        )}

        {/* SUBTAB 5: TRACK TOPOLOGY */}
        {subTab === 'topology' && (
          <CorridorMap
            sections={sections}
            jobs={jobs}
            blocks={optimizedPlan?.blocks || []}
            windows={windows}
            onNavigate={onNavigate}
          />
        )}
      </div>

      {/* 4. Guided Phase Transition Action Bar */}
      <div style={{
        marginTop: '8px',
        padding: '16px 20px',
        background: 'rgba(56, 189, 248, 0.06)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Corridor Demand & Timetable Constraints Reconciled
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Proceed to trigger the CP-SAT Convoy Solver to co-locate cross-department jobs into unified possession windows.
          </div>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('optimization')}
          style={{
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '9px 18px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>Proceed to Step 3: AI Solver & Convoy Optimization</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
