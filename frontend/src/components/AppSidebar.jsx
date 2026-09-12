import React from 'react'

export default function AppSidebar({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  horizonMode,
  onToggleHorizon
}) {
  const navSections = [
    {
      groupTitle: 'Traffic & Possessions',
      items: [
        { id: 'planner', label: 'Possession Planner', icon: '📅', badge: 'PRIMARY', badgeColor: '#10b981' },
        { id: 'marey', label: 'Marey String Chart', icon: '📈', badge: '24H', badgeColor: '#38bdf8' },
        { id: 'overview', label: 'Network Overview', icon: '🧭' },
        { id: 'topology', label: 'Track Topology', icon: '🛤️' },
      ]
    },
    {
      groupTitle: 'Optimizer & Digital Twin',
      items: [
        { id: 'optimization', label: 'Solver & Compare', icon: '📊' },
        { id: 'customdata', label: 'Custom Data & Scale', icon: '📂', badge: 'CSV', badgeColor: '#38bdf8' },
        { id: 'whatif', label: 'What-If Simulation', icon: '⚡' },
        { id: 'maintenance', label: 'Asset Backlog', icon: '🔧' },
        { id: 'review', label: 'Decisions & Signoff', icon: '📋' },
      ]
    },
    {
      groupTitle: 'Field & Safety Suite',
      items: [
        { id: 'dispatch', label: 'Crew Dispatcher', icon: '📲', badge: 'CUG', badgeColor: '#22c55e' },
        { id: 'kavach', label: 'Kavach TCAS Sim', icon: '🛡️', badge: 'UHF', badgeColor: '#eab308' },
        { id: 'roi', label: 'Executive ROI & ESG', icon: '💰', badge: '₹ CR', badgeColor: '#a855f7' },
      ]
    },
    {
      groupTitle: 'Intelligence & Audit',
      items: [
        { id: 'copilot', label: 'AI Co-Pilot', icon: '🎙️', badge: 'AI', badgeColor: '#ec4899' },
        { id: 'audit', label: 'Statutory Audit', icon: '📜' },
      ]
    }
  ]

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* 1. Header: Brand Logo & Collapse Toggle */}
      <div className="sidebar-header">
        <div className="sidebar-brand" onClick={() => onSelectTab('overview')} title="SETU Operations Room">
          <span className="navbar-brand-badge">SETU</span>
          {!isCollapsed && (
            <div className="sidebar-brand-text">
              <div className="sidebar-brand-title">SETU Control</div>
              <div className="sidebar-brand-sub">Northern Railway • DL</div>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="sidebar-collapse-btn"
          title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
        >
          {isCollapsed ? '»' : '«'}
        </button>
      </div>

      {/* 2. Grouped Navigation Links */}
      <div className="sidebar-nav-scroll">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="sidebar-group">
            {!isCollapsed ? (
              <div className="sidebar-group-title">{section.groupTitle}</div>
            ) : (
              <div className="sidebar-group-divider" />
            )}

            <div className="sidebar-group-items">
              {section.items.map(item => {
                const isActive = activeTab === item.id && horizonMode !== 'MONTH'
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id)
                      if (horizonMode === 'MONTH') onToggleHorizon('WEEK')
                    }}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    title={isCollapsed ? `${item.label} (${section.groupTitle})` : undefined}
                  >
                    <span className="sidebar-item-icon">{item.icon}</span>
                    {!isCollapsed && (
                      <span className="sidebar-item-label">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span
                        className="sidebar-item-badge"
                        style={{
                          backgroundColor: `${item.badgeColor}22`,
                          color: item.badgeColor,
                          border: `1px solid ${item.badgeColor}55`
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Footer: Engine Health & Quick Indicator */}
      <div className="sidebar-footer">
        {!isCollapsed ? (
          <div className="sidebar-engine-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>
                OPTIMIZER ENGINE
              </span>
              <span className="status-dot status-dot-ready" />
            </div>
            <div style={{ fontSize: '11px', color: '#e4e4e7', fontWeight: 600 }}>
              OR-Tools CP-SAT v9.1
            </div>
            <div style={{ fontSize: '10px', color: '#71717a', marginTop: '2px' }}>
              Corridor Invariant: <span style={{ color: '#10b981' }}>0 Conflicts</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
            <span className="status-dot status-dot-ready" title="OR-Tools CP-SAT Active & Ready" />
          </div>
        )}
      </div>
    </aside>
  )
}
