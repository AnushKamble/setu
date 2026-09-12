import React from 'react'

export default function NavigationRail({ activeTab, onSelectTab }) {
  return (
    <aside className="command-sidebar">
      {/* Brand & Context */}
      <div className="sidebar-header">
        <div className="brand-badge">SETU</div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
            SETU Planner
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
            Railway Possession System
          </div>
        </div>
      </div>

      {/* Main Navigation Flow */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {/* OVERVIEW */}
        <button
          onClick={() => onSelectTab('overview')}
          className={`sidebar-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🧭</span>
            <span>Overview</span>
          </span>
        </button>

        {/* SUITE: PLAN */}
        <div className="nav-suite-title">Plan</div>

        <button
          onClick={() => onSelectTab('planner')}
          className={`sidebar-nav-btn ${activeTab === 'planner' ? 'active' : ''}`}
          style={{
            fontWeight: activeTab === 'planner' ? 800 : 700,
            background: activeTab === 'planner' ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📅</span>
            <span>Possession Planner</span>
          </span>
          <span className="nav-counter-pill" style={{ background: 'rgba(59, 130, 246, 0.25)', color: '#93c5fd' }}>
            Primary
          </span>
        </button>

        <button
          onClick={() => onSelectTab('maintenance')}
          className={`sidebar-nav-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔧</span>
            <span>Maintenance</span>
          </span>
        </button>

        <button
          onClick={() => onSelectTab('optimization')}
          className={`sidebar-nav-btn ${activeTab === 'optimization' ? 'active' : ''}`}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📊</span>
            <span>Optimization</span>
          </span>
        </button>

        {/* SUITE: RESPOND */}
        <div className="nav-suite-title">Respond</div>

        <button
          onClick={() => onSelectTab('whatif')}
          className={`sidebar-nav-btn ${activeTab === 'whatif' ? 'active' : ''}`}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span>
            <span>What-If</span>
          </span>
        </button>

        {/* SUITE: REVIEW */}
        <div className="nav-suite-title">Review</div>

        <button
          onClick={() => onSelectTab('review')}
          className={`sidebar-nav-btn ${activeTab === 'review' ? 'active' : ''}`}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🛡️</span>
            <span>Decisions</span>
          </span>
          <span className="nav-counter-pill" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
            Sign-off
          </span>
        </button>

        <button
          onClick={() => onSelectTab('audit')}
          className={`sidebar-nav-btn ${activeTab === 'audit' ? 'active' : ''}`}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📜</span>
            <span>Audit</span>
          </span>
        </button>
      </div>

      {/* Calm Operational Status Footer */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '16px',
        borderTop: '1px solid var(--border)',
        fontSize: '11px',
        color: 'var(--text-muted)',
        lineHeight: '1.6'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-emerald)', display: 'inline-block' }}></span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>System: Ready</span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          DEMO DATA • Synthetic railway scenario
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Officer: Northern Railway
        </div>
      </div>
    </aside>
  )
}
