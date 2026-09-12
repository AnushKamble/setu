import React from 'react'

export default function TopNavbar({
  activeTab,
  onSelectTab,
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
  const navItems = [
    { id: 'overview', label: 'Overview', icon: '🧭' },
    { id: 'planner', label: 'Possession Planner', icon: '📅', isPrimary: true },
    { id: 'marey', label: 'String Chart', icon: '📈' },
    { id: 'topology', label: 'Track Topology', icon: '🛤️' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { id: 'optimization', label: 'Optimization', icon: '📊' },
    { id: 'whatif', label: 'What-If', icon: '⚡' },
    { id: 'review', label: 'Decisions', icon: '📋' },
    { id: 'dispatch', label: 'Crew Dispatch', icon: '📲' },
    { id: 'roi', label: 'Executive ROI', icon: '💰' },
    { id: 'kavach', label: 'Kavach TCAS', icon: '🛡️' },
    { id: 'copilot', label: 'AI Co-Pilot', icon: '🎙️' },
    { id: 'audit', label: 'Audit', icon: '📜' },
  ]

  return (
    <header className="overhead-navbar">
      <div className="navbar-container">
        {/* Left: Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="navbar-brand">
            <span className="navbar-brand-badge">SETU</span>
            <div>
              <div className="navbar-brand-title">SETU Planner</div>
              <div className="navbar-brand-sub">Indian Railways • NR</div>
            </div>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)', margin: '0 4px' }}></div>
        </div>

        {/* Center: Overhead Navigation Tabs */}
        <nav className="navbar-nav-links">
          {navItems.map(item => {
            const isActive = activeTab === item.id && horizonMode !== 'MONTH'
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id)
                  if (horizonMode === 'MONTH') onToggleHorizon('WEEK')
                }}
                className={`navbar-nav-item ${isActive ? 'active' : ''} ${item.isPrimary ? 'primary-highlight' : ''}`}
              >
                <span style={{ fontSize: '13px', opacity: isActive ? 1 : 0.75 }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.isPrimary && (
                  <span className="navbar-pill-primary">Primary</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Right: Operational Controls */}
        <div className="navbar-controls">
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
            <option value="ALL">All Sections</option>
            {(sections || []).map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.track_type})</option>
            ))}
          </select>

          {/* Scenario Selector */}
          <select
            value={selectedScenario}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="navbar-select"
            style={{ color: 'var(--accent-cyan)', fontWeight: 700, minWidth: '190px' }}
            title="Switch operational scenario to stress-test the optimizer"
          >
            {[
              { id: 'NORMAL', label: '⚡ Normal Corridor (Dual-Track)' },
              { id: 'HIGH_MAINTENANCE', label: '⚡ High Backlog (36 Jobs)' },
              { id: 'CONGESTED', label: '⚡ Congested (Night Blocks)' },
              { id: 'RESOURCE_CONSTRAINED', label: '⚡ Resource Shortage' },
              { id: 'DISRUPTION_HEAVY', label: '⚡ Disruption Heavy' },
              { id: 'HARD_OPTIMIZATION', label: '⚡ Statutory Stress (Relaxation)' },
              { id: 'ENTERPRISE_DIVISION', label: '⚡ Enterprise Division (60+ Jobs)' },
            ].map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          {/* System Status Dot */}
          <div className="navbar-status-badge">
            <span className={`status-dot ${loading ? 'status-dot-busy' : 'status-dot-ready'}`}></span>
            <span>{loading ? 'Solving...' : 'Ready'}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
