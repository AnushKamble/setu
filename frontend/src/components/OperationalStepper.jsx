import React from 'react'
import {
  Compass,
  Cpu,
  Calendar,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react'

export const PIPELINE_STAGES = [
  {
    id: 'stage1',
    stepNumber: 1,
    badgeText: 'STEP 01',
    title: '1. Network Overview',
    subtitle: 'Corridor Health & Map',
    icon: Compass,
    primaryTab: 'overview',
    allTabs: ['overview']
  },
  {
    id: 'stage2',
    stepNumber: 2,
    badgeText: 'STEP 02',
    title: '2. Demands & Timetable',
    subtitle: 'Backlog, Blocks & WTT',
    icon: Layers,
    primaryTab: 'demand',
    allTabs: ['demand', 'maintenance', 'topology', 'portal']
  },
  {
    id: 'stage3',
    stepNumber: 3,
    badgeText: 'STEP 03',
    title: '3. AI Solver & Convoys',
    subtitle: 'CP-SAT & Analytics',
    icon: Cpu,
    primaryTab: 'optimization',
    allTabs: ['optimization']
  },
  {
    id: 'stage4',
    stepNumber: 4,
    badgeText: 'STEP 04',
    title: '4. Space-Time & Disruption',
    subtitle: 'Gantt, Marey & What-If',
    icon: Calendar,
    primaryTab: 'planner',
    allTabs: ['planner', 'marey', 'whatif', 'spacetime']
  },
  {
    id: 'stage5',
    stepNumber: 5,
    badgeText: 'STEP 05',
    title: '5. Tactical Plan Reviewer',
    subtitle: 'BDMS Sanction & Notes',
    icon: FileCheck,
    primaryTab: 'review',
    allTabs: ['review']
  }
]

export default function OperationalStepper({ activeTab, onSelectTab }) {
  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.allTabs.includes(activeTab))
  const isLifecycleTab = currentStageIndex !== -1

  return (
    <div style={{
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      userSelect: 'none'
    }}>
      {/* Rectangular Stepper Boxes Grid (Single horizontal row) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: '8px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {PIPELINE_STAGES.map((stage, idx) => {
          const isActive = stage.allTabs.includes(activeTab)
          const isCompleted = isLifecycleTab && currentStageIndex > idx
          const IconComponent = stage.icon

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onSelectTab(stage.primaryTab)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '8px',
                background: isActive
                  ? 'linear-gradient(180deg, rgba(56, 189, 248, 0.12) 0%, rgba(24, 24, 27, 0.95) 100%)'
                  : isCompleted
                    ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(24, 24, 27, 0.95) 100%)'
                    : 'var(--bg-card)',
                border: isActive
                  ? '1.5px solid #38bdf8'
                  : isCompleted
                    ? '1.5px solid rgba(16, 185, 129, 0.5)'
                    : '1px solid var(--border)',
                boxShadow: isActive
                  ? '0 0 16px rgba(56, 189, 248, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : isCompleted
                    ? '0 0 10px rgba(16, 185, 129, 0.1)'
                    : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '80px',
                minWidth: 0,
                overflow: 'hidden',
                transition: 'all 0.15s ease'
              }}
              className="card-surface-hover"
              title={`Stage ${stage.stepNumber}: ${stage.title} (${stage.subtitle})`}
            >
              {/* Top Accent Strip when active */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '12px',
                  right: '12px',
                  height: '2px',
                  background: '#38bdf8',
                  borderRadius: '2px',
                  boxShadow: '0 0 8px #38bdf8'
                }} />
              )}

              {/* Step Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '4px' }}>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  background: isActive
                    ? 'rgba(56, 189, 248, 0.25)'
                    : isCompleted
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(255, 255, 255, 0.06)',
                  color: isActive
                    ? '#38bdf8'
                    : isCompleted
                      ? '#34d399'
                      : 'var(--text-muted)'
                }}>
                  {stage.badgeText}
                </span>

                {/* Status Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {isActive ? (
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      color: '#38bdf8',
                      letterSpacing: '0.4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#38bdf8',
                        boxShadow: '0 0 6px #38bdf8'
                      }} />
                      ACTIVE
                    </span>
                  ) : isCompleted ? (
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      color: '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      <CheckCircle2 size={11} color="#34d399" />
                      DONE
                    </span>
                  ) : (
                    <IconComponent size={12} color="var(--text-muted)" />
                  )}
                </div>
              </div>

              {/* Step Title & Subtitle */}
              <div>
                <div style={{
                  fontSize: '12.5px',
                  fontWeight: 800,
                  color: isActive ? '#ffffff' : isCompleted ? 'var(--text-primary)' : 'var(--text-secondary)',
                  letterSpacing: '-0.2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {stage.title}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: isActive ? '#93c5fd' : 'var(--text-muted)',
                  marginTop: '1px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {stage.subtitle}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
