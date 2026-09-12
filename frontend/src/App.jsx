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

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
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
  const [validationReport, setValidationReport] = useState(null)
  const [explanationReport, setExplanationReport] = useState(null)
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('ALL')
  const [selectedJob, setSelectedJob] = useState(null)
  const [selectedDrawerBlock, setSelectedDrawerBlock] = useState(null)
  const [bdmsBundle, setBdmsBundle] = useState(null)

  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

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

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [hRes, scRes, jRes, wRes, optRes, compRes, valRes, explRes, bdmsRes] = await Promise.all([
        fetch('/api/health').then(r => r.json()),
        fetch('/api/scenarios').then(r => r.json()),
        fetch('/api/jobs').then(r => r.json()),
        fetch('/api/windows?limit=100').then(r => r.json()),
        fetch('/api/plans/optimize').then(r => r.json()),
        fetch('/api/plans/compare').then(r => r.json()),
        fetch('/api/plans/validate').then(r => r.json()),
        fetch('/api/plans/explain').then(r => r.json()),
        fetch('/api/plans/export-bdms', { method: 'POST' }).then(r => r.json()),
      ])
      setHealth(hRes)
      setScenarios(scRes)
      setJobs(jRes)
      setWindows(wRes)
      setOptimizedPlan(optRes)
      setComparison(compRes)
      setValidationReport(valRes)
      setExplanationReport(explRes)
      setBdmsBundle(bdmsRes)

      const distinctSections = [
        { id: 'SEC-NDLS-GZB-UP', name: 'New Delhi - Ghaziabad Up Main', track_type: 'UP_MAIN', length_km: 25.5, max_speed_kmh: 130 },
        { id: 'SEC-NDLS-GZB-DN', name: 'New Delhi - Ghaziabad Down Main', track_type: 'DN_MAIN', length_km: 25.5, max_speed_kmh: 130 },
        { id: 'SEC-GZB-ALJN-UP', name: 'Ghaziabad - Aligarh Up Main', track_type: 'UP_MAIN', length_km: 106.0, max_speed_kmh: 140 },
        { id: 'SEC-GZB-ALJN-DN', name: 'Ghaziabad - Aligarh Down Main', track_type: 'DN_MAIN', length_km: 106.0, max_speed_kmh: 140 },
        { id: 'SEC-ALJN-CNB-UP', name: 'Aligarh - Kanpur Up Main', track_type: 'UP_MAIN', length_km: 302.0, max_speed_kmh: 130 },
        { id: 'SEC-ALJN-CNB-DN', name: 'Aligarh - Kanpur Down Main', track_type: 'DN_MAIN', length_km: 302.0, max_speed_kmh: 130 },
      ]
      setSections(distinctSections)
    } catch (err) {
      console.error('Initial fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSeedScenario = async (scName) => {
    setLoading(true)
    setStatusMessage(`Loading ${scName} scenario...`)
    try {
      await fetch('/api/scenarios/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_name: scName, seed: 42 }),
      })
      await fetchInitialData()
      setStatusMessage(`Scenario active: ${scName}`)
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleReoptimize = async () => {
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
      const [compRes] = await Promise.all([
        fetch('/api/plans/baseline', { method: 'POST' }).then(r => r.json()),
        fetch('/api/plans/compare').then(r => r.json()).then(c => setComparison(c))
      ])
      setStatusMessage('Baseline schedule generated.')
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const filteredBlocks = selectedSectionFilter === 'ALL'
    ? (optimizedPlan?.blocks || [])
    : (optimizedPlan?.blocks || []).filter(b => b.section_id === selectedSectionFilter)

  return (
    <div className="app-shell">
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

        {/* Actionable Status Toast */}
        {statusMessage && (
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
            >
              ✕
            </button>
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
            {/* Screen 1: Overview */}
            {activeTab === 'overview' && (
              <OverviewView
                jobs={jobs}
                sections={sections}
                optimizedPlan={optimizedPlan}
                comparison={comparison}
                validationReport={validationReport}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {/* Screen 2: Possession Planner (PRIMARY WORKHORSE) */}
            {activeTab === 'planner' && (
              <PlannerView
                blocks={filteredBlocks}
                sections={sections}
                jobs={jobs}
                windows={windows}
                comparison={comparison}
                loading={loading}
                onReoptimize={handleReoptimize}
                onGenerateBaseline={handleGenerateBaseline}
                onPlanUpdated={(newPlan) => {
                  setOptimizedPlan(newPlan)
                  fetch('/api/plans/compare').then(r => r.json()).then(c => setComparison(c))
                  fetch('/api/plans/export-bdms', { method: 'POST' }).then(r => r.json()).then(b => setBdmsBundle(b))
                }}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {/* Screen 2.2: Universal Indian Railways Time-Distance Marey String Chart */}
            {activeTab === 'marey' && (
              <MareyChartView
                selectedSection={selectedSectionFilter}
                onSelectBlock={(b) => setSelectedDrawerBlock(b)}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {/* Screen 2.5: Interactive Railway Track Topology Map */}
            {activeTab === 'topology' && (
              <CorridorMap
                sections={sections}
                jobs={jobs}
                blocks={optimizedPlan?.blocks || []}
                windows={windows}
                selectedSection={selectedSectionFilter}
                onSelectSection={(sec) => setSelectedSectionFilter(sec)}
                onSelectBlock={(b) => setSelectedDrawerBlock(b)}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {/* Screen 3: Optimization & Comparison */}
            {activeTab === 'optimization' && (
              <OptimizeCompareView
                comparison={comparison}
                explanationReport={explanationReport}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {/* Screen 3.5: Custom Railway Data Ingestion & Scalability Hub */}
            {activeTab === 'customdata' && (
              <CustomDataView
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {/* Screen 4: What-If Disruption Simulator */}
            {activeTab === 'whatif' && (
              <WhatIfView
                jobs={jobs}
                blocks={optimizedPlan?.blocks || []}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {/* Screen 5: Maintenance Backlog */}
            {activeTab === 'maintenance' && (
              <MaintenanceView
                jobs={jobs}
                onSelectJob={(j) => setSelectedJob(j)}
              />
            )}

            {/* Screen 6: Review / Decision Center */}
            {activeTab === 'review' && (
              <ReviewView
                validationReport={validationReport}
                bdmsBundle={bdmsBundle}
                optimizedPlan={optimizedPlan}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {/* Screen 6.5: Field Crew Dispatcher & Digital Muster */}
            {activeTab === 'dispatch' && (
              <CrewDispatchView
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {/* Screen 6.7: Executive ROI & ESG Financial Dashboard */}
            {activeTab === 'roi' && (
              <ExecutiveRoiView
                onNavigate={(tab) => setActiveTab(tab)}
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
