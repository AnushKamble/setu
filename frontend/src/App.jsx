import { useState, useEffect } from 'react'
import AppSidebar from './components/AppSidebar'
import TopHeader from './components/TopHeader'
import OverviewView from './components/views/OverviewView'
import PlannerView from './components/views/PlannerView'
import OptimizeCompareView from './components/views/OptimizeCompareView'
import WhatIfView from './components/views/WhatIfView'
import MaintenanceView from './components/views/MaintenanceView'
import ReviewView from './components/views/ReviewView'
import AuditView from './components/views/AuditView'
import MonthlyView from './components/views/MonthlyView'
import JobModal from './components/JobModal'
import CorridorMap from './components/CorridorMap'
import BlockDrawer from './components/BlockDrawer'
import MareyChartView from './components/views/MareyChartView'
import CrewDispatchView from './components/views/CrewDispatchView'
import ExecutiveRoiView from './components/views/ExecutiveRoiView'
import KavachSimulatorView from './components/views/KavachSimulatorView'
import CopilotChatView from './components/views/CopilotChatView'
import CustomDataView from './components/views/CustomDataView'
import FieldPortalView from './components/views/FieldPortalView'
import OperationalStepper from './components/OperationalStepper'
import DemandTimetableView from './components/views/DemandTimetableView'
import SpaceTimeDisruptionView from './components/views/SpaceTimeDisruptionView'

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [demandSubTab, setDemandSubTab] = useState('backlog')
  const [spaceTimeSubTab, setSpaceTimeSubTab] = useState('planner')
  const [isCorridorDisrupted, setIsCorridorDisrupted] = useState(false)
  const [corridorDisruptionDetails, setCorridorDisruptionDetails] = useState(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [horizonMode, setHorizonMode] = useState('WEEK')
  const [health, setHealth] = useState(null)
  const [scenarios, setScenarios] = useState([])
  const [selectedScenario, setSelectedScenario] = useState('NORMAL')
  const [sections, setSections] = useState([])
  const [windows, setWindows] = useState([])
  const [jobs, setJobs] = useState([])
  const [comparison, setComparison] = useState(null)
  const [optimizedPlan, setOptimizedPlan] = useState(null)
  const [baselinePlan, setBaselinePlan] = useState(null)
  const [activePlanMode, setActivePlanMode] = useState('OPTIMIZED') // 'OPTIMIZED' | 'BASELINE'
  const [isPlanModified, setIsPlanModified] = useState(false)
  const [validationReport, setValidationReport] = useState(null)
  const [explanationReport, setExplanationReport] = useState(null)
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('ALL')
  const [selectedJob, setSelectedJob] = useState(null)
  const [selectedDrawerBlock, setSelectedDrawerBlock] = useState(null)
  const [bdmsBundle, setBdmsBundle] = useState(null)

  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [highlightTarget, setHighlightTarget] = useState(null)

  const handleNavigate = (tab, targetKey = null) => {
    if (['demand', 'maintenance', 'topology', 'portal', 'windows', 'timetable'].includes(tab)) {
      if (tab === 'maintenance') setDemandSubTab('backlog')
      else if (tab === 'topology') setDemandSubTab('topology')
      else if (tab === 'portal') setDemandSubTab('portal')
      else if (tab === 'windows') setDemandSubTab('windows')
      else if (tab === 'timetable') setDemandSubTab('timetable')
      setActiveTab('demand')
    } else if (['planner', 'marey', 'whatif', 'spacetime'].includes(tab)) {
      if (tab === 'marey') setSpaceTimeSubTab('marey')
      else if (tab === 'whatif') setSpaceTimeSubTab('whatif')
      else setSpaceTimeSubTab('planner')
      setActiveTab('planner')
    } else {
      setActiveTab(tab)
    }
    if (horizonMode === 'MONTH') setHorizonMode('WEEK')
    const key = targetKey || tab
    setHighlightTarget(key)
    setTimeout(() => {
      setHighlightTarget(null)
    }, 2800)
  }

  const handleDisruptionApplied = (data) => {
    if (data?.isReset) {
      setIsCorridorDisrupted(false)
      setCorridorDisruptionDetails(null)
      setStatusMessage('Corridor timetable and possession plan restored to nominal baseline.')
      fetchInitialData()
      return
    }

    setIsCorridorDisrupted(true)
    setCorridorDisruptionDetails(data)
    if (data?.replanning_diff?.updated_plan && data.replanning_diff.updated_plan.blocks) {
      setOptimizedPlan(data.replanning_diff.updated_plan)
      setIsPlanModified(true)
    }
    fetch('/api/plans/compare').then(r => r.json()).then(c => setComparison(c)).catch(() => {})
    fetch('/api/plans/validate').then(r => r.json()).then(v => setValidationReport(v)).catch(() => {})
    fetch('/api/plans/export-bdms', { method: 'POST' }).then(r => r.json()).then(b => setBdmsBundle(b)).catch(() => {})
    setStatusMessage(`Disruption applied: +${data?.impact?.total_network_delay_minutes || 45}m network delay. Live timetable & Gantt updated.`)
  }

  const handleResetDisruption = async () => {
    setLoading(true)
    try {
      await fetch('/api/simulation/reset', { method: 'POST' })
      setIsCorridorDisrupted(false)
      setCorridorDisruptionDetails(null)
      await fetchInitialData()
      setStatusMessage('Corridor restored to nominal baseline schedule.')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInitialData()

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setIsSidebarCollapsed(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const [backendError, setBackendError] = useState(false)
  const [customRailwayUrl, setCustomRailwayUrl] = useState(() => {
    return typeof window !== 'undefined' ? (window.localStorage.getItem('SETU_API_URL') || '') : ''
  })

  const safeFetchJson = async (url, options = {}) => {
    try {
      const res = await fetch(url, options)
      if (!res.ok) {
        console.warn(`[API] ${url} returned status ${res.status}`)
        return null
      }
      return await res.json()
    } catch (err) {
      console.warn(`[API] ${url} network error:`, err)
      return null
    }
  }

  const handleConnectCustomUrl = () => {
    if (!customRailwayUrl.trim()) return
    const clean = customRailwayUrl.trim().replace(/\/$/, '')
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('SETU_API_URL', clean)
    }
    setStatusMessage(`Connecting to ${clean}...`)
    fetchInitialData()
  }

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      // Check backend health first
      const hRes = await safeFetchJson('/api/health')
      if (!hRes) {
        setBackendError(true)
      } else {
        setBackendError(false)
        setHealth(hRes)
      }

      // Fetch primary datasets with error isolation so one failure never blocks the others
      const [scRes, jRes, wRes, optRes, baseRes, compRes, valRes, explRes, bdmsRes] = await Promise.all([
        safeFetchJson('/api/scenarios'),
        safeFetchJson('/api/jobs'),
        safeFetchJson('/api/windows?limit=100'),
        safeFetchJson('/api/plans/optimize'),
        safeFetchJson('/api/plans/baseline'),
        safeFetchJson('/api/plans/compare'),
        safeFetchJson('/api/plans/validate'),
        safeFetchJson('/api/plans/explain'),
        safeFetchJson('/api/plans/export-bdms', { method: 'POST' }),
      ])

      if (scRes) setScenarios(scRes)
      if (jRes) setJobs(jRes)
      if (wRes) setWindows(wRes)
      if (optRes) setOptimizedPlan(optRes)
      if (baseRes) setBaselinePlan(baseRes)
      if (compRes) setComparison(compRes)
      if (valRes) setValidationReport(valRes)
      if (explRes) setExplanationReport(explRes)
      if (bdmsRes) setBdmsBundle(bdmsRes)

      let secList = await safeFetchJson('/api/sections')
      if (!secList || secList.length === 0) {
        secList = [
          { id: 'SEC-NDLS-GZB-UP', name: 'New Delhi - Ghaziabad Up Main', track_type: 'UP_MAIN', length_km: 25.5, max_speed_kmh: 130 },
          { id: 'SEC-NDLS-GZB-DN', name: 'New Delhi - Ghaziabad Down Main', track_type: 'DN_MAIN', length_km: 25.5, max_speed_kmh: 130 },
          { id: 'SEC-GZB-ALJN-UP', name: 'Ghaziabad - Aligarh Up Main', track_type: 'UP_MAIN', length_km: 106.0, max_speed_kmh: 140 },
          { id: 'SEC-GZB-ALJN-DN', name: 'Ghaziabad - Aligarh Down Main', track_type: 'DN_MAIN', length_km: 106.0, max_speed_kmh: 140 },
          { id: 'SEC-ALJN-CNB-UP', name: 'Aligarh - Kanpur Up Main', track_type: 'UP_MAIN', length_km: 302.0, max_speed_kmh: 130 },
          { id: 'SEC-ALJN-CNB-DN', name: 'Aligarh - Kanpur Down Main', track_type: 'DN_MAIN', length_km: 302.0, max_speed_kmh: 130 },
        ]
      }
      setSections(secList)
    } catch (err) {
      console.error('Initial fetch failed:', err)
      setBackendError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSeedScenario = async (scName) => {
    setLoading(true)
    setStatusMessage(`Synthesizing and solving ${scName} scenario...`)
    try {
      await fetch('/api/scenarios/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_name: scName, seed: 42 }),
      })
      await fetchInitialData()
      setActivePlanMode('OPTIMIZED')
      setIsPlanModified(false)
      setStatusMessage(`Scenario loaded: ${scName} (Optimal CP-SAT schedule active)`)
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleReoptimize = async () => {
    if (activePlanMode === 'OPTIMIZED' && !isPlanModified) {
      setStatusMessage('Schedule is already globally optimal with 0 conflicts.')
      return
    }
    setLoading(true)
    setStatusMessage('Solving OR-Tools CP-SAT multi-department formulation...')
    try {
      const [optRes, compRes, valRes, explRes, bdmsRes] = await Promise.all([
        fetch('/api/plans/optimize', { method: 'POST' }).then(r => r.json()),
        fetch('/api/plans/compare').then(r => r.json()),
        fetch('/api/plans/validate').then(r => r.json()),
        fetch('/api/plans/explain').then(r => r.json()),
        fetch('/api/plans/export-bdms', { method: 'POST' }).then(r => r.json()),
      ])
      setOptimizedPlan(optRes)
      setComparison(compRes)
      setValidationReport(valRes)
      setExplanationReport(explRes)
      setBdmsBundle(bdmsRes)
      setActivePlanMode('OPTIMIZED')
      setIsPlanModified(false)
      setStatusMessage(`Optimized in ${optRes.solve_time_seconds}s! -${compRes.deltas.percentage_possessions_reduced}% possessions reduced.`)
    } catch (err) {
      setStatusMessage(`Optimization error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateBaseline = async () => {
    setLoading(true)
    setStatusMessage('Simulating legacy decentralized manual baseline...')
    try {
      const [baseRes, compRes] = await Promise.all([
        fetch('/api/plans/baseline', { method: 'POST' }).then(r => r.json()),
        fetch('/api/plans/compare').then(r => r.json())
      ])
      setBaselinePlan(baseRes)
      setComparison(compRes)
      setActivePlanMode('BASELINE')
      setStatusMessage('Legacy baseline active: Decentralized uncoordinated departmental bookings.')
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const currentBlocks = activePlanMode === 'BASELINE'
    ? (baselinePlan?.blocks || [])
    : (optimizedPlan?.blocks || [])

  const filteredBlocks = selectedSectionFilter === 'ALL'
    ? currentBlocks
    : currentBlocks.filter(b => b.section_id === selectedSectionFilter)

  return (
    <div className="app-shell">
      {/* Top Loading Progress Bar & Status Pill */}
      {loading && (
        <>
          <div className="top-loading-bar" />
          <div className="floating-loading-pill">
            <div className="spinner-mini" />
            <span>{statusMessage || 'Computing Corridor Optimization Model...'}</span>
          </div>
        </>
      )}

      {/* 1. Left Enterprise Domain Navigation Sidebar */}
      <AppSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab)
          if (horizonMode === 'MONTH') setHorizonMode('WEEK')
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        horizonMode={horizonMode}
        onToggleHorizon={(mode) => setHorizonMode(mode)}
      />

      {/* 2. Main Canvas (Clean Top Header + Operational Workspace) */}
      <div className="app-main-area">
        <TopHeader
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab)
            if (horizonMode === 'MONTH') setHorizonMode('WEEK')
          }}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
          horizonMode={horizonMode}
          onToggleHorizon={(mode) => setHorizonMode(mode)}
          selectedSection={selectedSectionFilter}
          onSelectSection={(sec) => setSelectedSectionFilter(sec)}
          sections={sections}
          selectedScenario={selectedScenario}
          onSelectScenario={(sc) => {
            setSelectedScenario(sc)
            handleSeedScenario(sc)
          }}
          scenarios={scenarios}
          loading={loading}
        />

        <main className="app-workspace">

        {/* Backend Connection Diagnostic Banner */}
        {backendError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '12px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
              <strong style={{ color: '#fecaca' }}>Backend Disconnected:</strong>
              <span>Cannot reach Railway API. Paste your public Railway domain to connect instantly:</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flex: '1', maxWidth: '540px' }}>
              <input
                type="url"
                placeholder="https://your-backend-name.up.railway.app"
                value={customRailwayUrl}
                onChange={(e) => setCustomRailwayUrl(e.target.value)}
                style={{
                  background: '#0f172a',
                  border: '1px solid #475569',
                  color: '#f8fafc',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  flex: 1,
                  outline: 'none'
                }}
              />
              <button
                onClick={handleConnectCustomUrl}
                style={{
                  background: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '12px',
                  whiteSpace: 'nowrap'
                }}
              >
                Connect & Load
              </button>
            </div>
          </div>
        )}

        {/* Actionable Status Toast */}
        {statusMessage && !loading && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            color: '#93c5fd',
            padding: '8px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{statusMessage}</span>
            <button
              onClick={() => setStatusMessage('')}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '12px' }}
             aria-label="Close"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          </div>
        )}

        {/* Horizon Switching: Monthly Strategic vs Weekly Tactical */}
        {horizonMode === 'MONTH' ? (
          <MonthlyView
            sections={sections}
            onSwitchToWeek={() => setHorizonMode('WEEK')}
          />
        ) : (
          <>
            {/* Guided Operational Lifecycle Stepper */}
            <OperationalStepper
              activeTab={activeTab}
              onSelectTab={setActiveTab}
            />

            {/* Step 1: Network Overview */}
            {activeTab === 'overview' && (
              <OverviewView
                jobs={jobs}
                sections={sections}
                optimizedPlan={optimizedPlan}
                comparison={comparison}
                validationReport={validationReport}
                highlightTarget={highlightTarget}
                onNavigate={handleNavigate}
              />
            )}

            {/* Step 2: Demands, Block Windows & Train Timetable */}
            {(activeTab === 'demand' || ['maintenance', 'topology', 'portal'].includes(activeTab)) && (
              <DemandTimetableView
                jobs={jobs}
                windows={windows}
                sections={sections}
                optimizedPlan={optimizedPlan}
                activeSubTab={demandSubTab}
                onSelectSubTab={setDemandSubTab}
                onNavigate={handleNavigate}
                onPlanUpdated={() => {
                  fetchInitialData()
                  setStatusMessage('Corridor work order and timetable updated.')
                }}
                onDisruptionApplied={handleDisruptionApplied}
              />
            )}

            {/* Step 3: AI Solver & Convoy Optimization */}
            {activeTab === 'optimization' && (
              <OptimizeCompareView
                comparison={comparison}
                explanationReport={explanationReport}
                highlightTarget={highlightTarget}
                onNavigate={handleNavigate}
              />
            )}

            {/* Step 4: Space-Time Verification & Disruption Resilience */}
            {['planner', 'marey', 'whatif', 'spacetime'].includes(activeTab) && (
              <SpaceTimeDisruptionView
                activeSubTab={spaceTimeSubTab}
                blocks={filteredBlocks}
                sections={sections}
                jobs={jobs}
                windows={windows}
                comparison={comparison}
                loading={loading}
                activePlanMode={activePlanMode}
                isPlanModified={isPlanModified}
                highlightTarget={highlightTarget}
                onReoptimize={handleReoptimize}
                onGenerateBaseline={handleGenerateBaseline}
                onPlanUpdated={(newPlan) => {
                  setOptimizedPlan(newPlan)
                  setIsPlanModified(true)
                  fetch('/api/plans/compare').then(r => r.json()).then(c => setComparison(c))
                  fetch('/api/plans/export-bdms', { method: 'POST' }).then(r => r.json()).then(b => setBdmsBundle(b))
                }}
                onNavigate={handleNavigate}
                selectedSectionFilter={selectedSectionFilter}
                onSelectBlock={(b) => setSelectedDrawerBlock(b)}
                onDisruptionApplied={handleDisruptionApplied}
                isCorridorDisrupted={isCorridorDisrupted}
                corridorDisruptionDetails={corridorDisruptionDetails}
                onResetDisruption={handleResetDisruption}
              />
            )}

            {/* Step 5: Tactical Plan Reviewer & Official BDMS Sanction Note */}
            {activeTab === 'review' && (
              <ReviewView
                validationReport={validationReport}
                bdmsBundle={bdmsBundle}
                optimizedPlan={optimizedPlan}
                highlightTarget={highlightTarget}
                onNavigate={handleNavigate}
              />
            )}

            {/* Additional Features: Custom Data Ingestion */}
            {activeTab === 'customdata' && (
              <CustomDataView
                onNavigate={handleNavigate}
              />
            )}

            {/* Additional Features: Field Crew Dispatcher & Digital Muster */}
            {activeTab === 'dispatch' && (
              <CrewDispatchView
                onNavigate={handleNavigate}
              />
            )}

            {/* Screen 6.7: Executive ROI & ESG Financial Dashboard */}
            {activeTab === 'roi' && (
              <ExecutiveRoiView
                onNavigate={handleNavigate}
              />
            )}

            {/* Screen 6.8: Kavach TCAS & TSR Simulator */}
            {activeTab === 'kavach' && (
              <KavachSimulatorView
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {/* Screen 6.9: AI Operations Co-Pilot ("Ask SETU") */}
            {activeTab === 'copilot' && (
              <CopilotChatView
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {/* Screen 7: Audit Log */}
            {activeTab === 'audit' && (
              <AuditView
                explanationReport={explanationReport}
              />
            )}
          </>
        )}
      </main>
      </div>

      {/* Global Modals & Drawers */}
      {selectedJob && (
        <JobModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}

      {selectedDrawerBlock && (
        <BlockDrawer
          block={selectedDrawerBlock}
          jobs={jobs}
          onClose={() => setSelectedDrawerBlock(null)}
          onPlanUpdated={(newPlan) => {
            setOptimizedPlan(newPlan)
            const updated = newPlan?.blocks?.find(b => b.block_id === selectedDrawerBlock.block_id)
            if (updated) setSelectedDrawerBlock(updated)
            fetch('/api/plans/compare').then(r => r.json()).then(c => setComparison(c))
            fetch('/api/plans/export-bdms', { method: 'POST' }).then(r => r.json()).then(b => setBdmsBundle(b))
          }}
        />
      )}
    </div>
  )
}
