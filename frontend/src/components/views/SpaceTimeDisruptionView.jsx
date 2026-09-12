import React, { useState, useEffect } from 'react'
import { Calendar, TrendingUp, Zap, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react'
import PlannerView from './PlannerView'
import MareyChartView from './MareyChartView'
import WhatIfView from './WhatIfView'

export default function SpaceTimeDisruptionView({
  activeSubTab = 'planner',
  blocks = [],
  sections = [],
  jobs = [],
  windows = [],
  comparison = null,
  loading = false,
  activePlanMode = 'OPTIMIZED',
  isPlanModified = false,
  highlightTarget = null,
  onReoptimize,
  onGenerateBaseline,
  onPlanUpdated,
  onNavigate,
  selectedSectionFilter = 'ALL',
  onSelectBlock,
  onDisruptionApplied,
  isCorridorDisrupted = false,
  corridorDisruptionDetails = null,
  onResetDisruption
}) {
  const [subTab, setSubTab] = useState(activeSubTab || 'planner')

  useEffect(() => {
    if (activeSubTab) {
      setSubTab(activeSubTab)
    }
  }, [activeSubTab])

  const subTabs = [
    { id: 'planner', label: '1. Corridor Possession Gantt', badge: '7-Day Horizon', badgeColor: '#10b981', icon: Calendar },
    { id: 'marey', label: '2. Marey Distance-Time Chart', badge: 'Live String Trajectories', badgeColor: '#38bdf8', icon: TrendingUp },
    { id: 'whatif', label: '3. What-If Disruption Simulator', badge: isCorridorDisrupted ? 'Disruption Active' : 'Resilience Test', badgeColor: isCorridorDisrupted ? '#ef4444' : '#f59e0b', icon: Zap },
  ]

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Space-Time Verification & Disruption Resilience
            </h1>
            <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              STEP 04 OF 05
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Verify physical conflict-free clearance across 7 days on the Gantt and Marey String Chart, and stress-test real-time network delay resilience.
          </p>
        </div>

        {isCorridorDisrupted && (
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
              {corridorDisruptionDetails?.message || 'Corridor Disrupted: Train delays propagated and timetable updated.'}
            </div>
            {onResetDisruption && (
              <button
                onClick={onResetDisruption}
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
                <RefreshCw size={11} />
                <span>Reset to Nominal</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Sub-Tab Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px',
        background: 'rgba(24, 24, 27, 0.95)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        overflowX: 'auto',
        userSelect: 'none'
      }}>
        {subTabs.map(t => {
          const isActive = subTab === t.id
          const IconCmp = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '6px',
                background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(56, 189, 248, 0.4)' : 'transparent'}`,
                color: isActive ? '#38bdf8' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <IconCmp size={15} />
              <span>{t.label}</span>
              {t.badge && (
                <span style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: isActive ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                  color: t.badgeColor || (isActive ? '#38bdf8' : 'var(--text-muted)'),
                  fontWeight: 700
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
        {subTab === 'planner' && (
          <PlannerView
            blocks={blocks}
            sections={sections}
            jobs={jobs}
            windows={windows}
            comparison={comparison}
            loading={loading}
            activePlanMode={activePlanMode}
            isPlanModified={isPlanModified}
            highlightTarget={highlightTarget}
            onReoptimize={onReoptimize}
            onGenerateBaseline={onGenerateBaseline}
            onPlanUpdated={onPlanUpdated}
            onNavigate={onNavigate}
          />
        )}

        {subTab === 'marey' && (
          <MareyChartView
            selectedSection={selectedSectionFilter}
            highlightTarget={highlightTarget}
            onSelectBlock={onSelectBlock}
            onNavigate={onNavigate}
          />
        )}

        {subTab === 'whatif' && (
          <WhatIfView
            jobs={jobs}
            blocks={blocks}
            highlightTarget={highlightTarget}
            onNavigate={onNavigate}
            onDisruptionApplied={onDisruptionApplied}
          />
        )}
      </div>

      {/* 4. Bottom Guided CTA */}
      <div style={{
        marginTop: '8px',
        padding: '16px 20px',
        background: 'rgba(16, 185, 129, 0.06)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Space-Time Clearance & Resilience Verified
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Proceed to Step 5 to review the statutory safety invariants and issue the official Indian Railways BDMS Sanction Requisition Circular Note.
          </div>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('review')}
          style={{
            background: '#10b981',
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
          <span>Proceed to Step 5: Tactical Plan Reviewer</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
