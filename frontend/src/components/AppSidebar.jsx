import React from 'react'
import {
  Calendar,
  TrendingUp,
  Compass,
  GitFork,
  BarChart3,
  FolderDown,
  Zap,
  Wrench,
  FileCheck,
  Radio,
  ShieldCheck,
  Coins,
  Mic,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react'

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
      groupTitle: 'Core Operational Pipeline',
      items: [
        { id: 'overview', label: '1. Network Overview', icon: <Compass size={16} /> },
        { id: 'demand', label: '2. Demands & Timetable', icon: <Layers size={16} />, badge: 'WTT', badgeColor: '#38bdf8' },
        { id: 'optimization', label: '3. AI Solver & Convoys', icon: <BarChart3 size={16} />, badge: 'CP-SAT', badgeColor: '#10b981' },
        { id: 'planner', label: '4. Space-Time & Disruption', icon: <Calendar size={16} />, badge: '7-DAY', badgeColor: '#f59e0b' },
        { id: 'review', label: '5. Tactical Plan Reviewer', icon: <FileCheck size={16} />, badge: 'BDMS', badgeColor: '#10b981' },
      ]
    },
    {
      groupTitle: 'Additional Operational Features',
      items: [
        { id: 'dispatch', label: 'Crew Dispatcher', icon: <Radio size={16} />, badge: 'CUG', badgeColor: '#22c55e' },
        { id: 'roi', label: 'Executive ROI & ESG', icon: <Coins size={16} />, badge: '₹ CR', badgeColor: '#a855f7' },
        { id: 'copilot', label: 'AI Operations Co-Pilot', icon: <Mic size={16} />, badge: 'AI', badgeColor: '#ec4899' },
        { id: 'kavach', label: 'Kavach TCAS Sim', icon: <ShieldCheck size={16} />, badge: 'UHF', badgeColor: '#eab308' },
        { id: 'customdata', label: 'Custom Data CSV', icon: <FolderDown size={16} />, badge: 'CSV', badgeColor: '#38bdf8' },
        { id: 'audit', label: 'Statutory Safety Audit', icon: <ScrollText size={16} /> },
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
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
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
                const isActive = (
                  activeTab === item.id ||
                  (item.id === 'demand' && ['demand', 'maintenance', 'topology', 'portal'].includes(activeTab)) ||
                  (item.id === 'planner' && ['planner', 'marey', 'whatif', 'spacetime'].includes(activeTab))
                ) && horizonMode !== 'MONTH'
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
