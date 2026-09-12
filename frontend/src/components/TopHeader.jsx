import React from 'react'
import {
  Compass,
  Calendar,
  TrendingUp,
  GitFork,
  BarChart3,
  FolderDown,
  Zap,
  Wrench,
  FileCheck,
  Radio,
  Coins,
  ShieldCheck,
  Mic,
  ScrollText
} from 'lucide-react'

export default function TopHeader({
  activeTab,
  onSelectTab,
  isSidebarCollapsed,
  onToggleSidebar,
  horizonMode,
  onToggleHorizon,
  selectedSection,
  onSelectSection,
  sections,
  selectedScenario,
  onSelectScenario,
  scenarios,
  loading
}) {
  const metaMap = {
    overview: { domain: 'Traffic & Operations', title: 'Corridor Overview & Health', icon: <Compass size={15} /> },
    planner: { domain: 'Traffic & Operations', title: 'Joint Corridor Possession Planner', icon: <Calendar size={15} /> },
    marey: { domain: 'Traffic & Operations', title: 'Marey String Chart (Time-Distance Diagram)', icon: <TrendingUp size={15} /> },
    topology: { domain: 'Traffic & Operations', title: 'Schematic Corridor Track Topology', icon: <GitFork size={15} /> },
    optimization: { domain: 'Optimizer & Digital Twin', title: 'CP-SAT Solver & Baseline Comparison', icon: <BarChart3 size={15} /> },
    customdata: { domain: 'Optimizer & Digital Twin', title: 'Custom Railway Data Ingestion & Scale', icon: <FolderDown size={15} /> },
    whatif: { domain: 'Optimizer & Digital Twin', title: 'What-If Disruption Simulator', icon: <Zap size={15} /> },
    maintenance: { domain: 'Optimizer & Digital Twin', title: 'Multi-Department Maintenance Backlog', icon: <Wrench size={15} /> },
    review: { domain: 'Optimizer & Digital Twin', title: 'Review & BDMS Circular Signoff', icon: <FileCheck size={15} /> },
    portal: { domain: 'Field & Safety Suite', title: 'Field Engineer Requisition Portal (TMS/TDMS/SMMS)', icon: <Wrench size={15} /> },
    dispatch: { domain: 'Field & Safety Suite', title: 'Field Crew Dispatcher & Digital Muster', icon: <Radio size={15} /> },
    roi: { domain: 'Field & Safety Suite', title: 'Executive ROI & ESG Financial Dashboard', icon: <Coins size={15} /> },
    kavach: { domain: 'Field & Safety Suite', title: 'Kavach (TCAS) & TSR Telemetry Simulator', icon: <ShieldCheck size={15} /> },
    copilot: { domain: 'Intelligence & Audit', title: 'AI Operations Co-Pilot ("Ask SETU")', icon: <Mic size={15} /> },
    audit: { domain: 'Intelligence & Audit', title: 'Statutory Compliance & Audit Trail', icon: <ScrollText size={15} /> },
  }

  const currentMeta = metaMap[activeTab] || { domain: 'SETU System', title: activeTab, icon: <Zap size={15} /> }

  return (
    <header className="top-header">
      {/* Left: Sidebar Toggle & Clear Breadcrumb */}
      <div className="header-left">
        <button
          onClick={onToggleSidebar}
          className="header-icon-btn"
          title={isSidebarCollapsed ? "Expand Navigation (Ctrl+B)" : "Collapse Navigation (Ctrl+B)"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
        </button>

        <div className="header-breadcrumb">
          <span className="breadcrumb-domain">{currentMeta.domain}</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">
            <span style={{ marginRight: '6px', display: 'inline-flex', alignItems: 'center' }}>{currentMeta.icon}</span>
            {currentMeta.title}
          </span>
        </div>
      </div>

      {/* Right: Operational Controls */}
      <div className="header-right">
        {/* Quick Launch AI Co-Pilot button if not currently on copilot */}
        {activeTab !== 'copilot' && (
          <button
            onClick={() => onSelectTab('copilot')}
            className="header-copilot-btn"
            title="Ask SETU AI Co-Pilot"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center' }}><Mic size={14} /></span>
            <span>Ask SETU</span>
          </button>
        )}

        {/* Horizon Toggle */}
        <div className="horizon-pill-group">
          <button
            onClick={() => onToggleHorizon('WEEK')}
            className={`horizon-pill-btn ${horizonMode === 'WEEK' ? 'active' : ''}`}
          >
            WEEK
          </button>
          <button
            onClick={() => onToggleHorizon('MONTH')}
            className={`horizon-pill-btn ${horizonMode === 'MONTH' ? 'active' : ''}`}
          >
            MONTH
          </button>
        </div>

        {/* Section Filter */}
        <select
          value={selectedSection}
          onChange={(e) => onSelectSection(e.target.value)}
          className="navbar-select"
        >
          <option value="ALL">All Corridor Sections</option>
          {(sections || []).map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.track_type})</option>
          ))}
        </select>

        {/* Scenario Selector */}
        <select
          value={selectedScenario}
          onChange={(e) => onSelectScenario(e.target.value)}
          className="navbar-select scenario-select"
          title="Switch operational scenario to stress-test the optimizer"
        >
          {[
            { id: 'NORMAL', label: 'Scenario: Normal Corridor' },
            { id: 'HIGH_MAINTENANCE', label: 'Scenario: High Backlog (36 Jobs)' },
            { id: 'CONGESTED', label: 'Scenario: Congested (Night)' },
            { id: 'RESOURCE_CONSTRAINED', label: 'Scenario: Resource Shortage' },
            { id: 'DISRUPTION_HEAVY', label: 'Scenario: Disruption Heavy' },
            { id: 'HARD_OPTIMIZATION', label: 'Scenario: Statutory Stress' },
            { id: 'ENTERPRISE_DIVISION', label: 'Scenario: Enterprise Division (60+)' },
          ].map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>

        {/* Solver Ready Dot */}
        <div className="navbar-status-badge">
          <span className={`status-dot ${loading ? 'status-dot-busy' : 'status-dot-ready'}`}></span>
          <span>{loading ? 'Solving...' : 'Ready'}</span>
        </div>
      </div>
    </header>
  )
}
