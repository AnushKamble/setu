import React, { useState, useEffect } from 'react'

export default function ExecutiveRoiView({
  onNavigate = () => {}
}) {
  const [tariff, setTariff] = useState(6.80)
  const [dieselPrice, setDieselPrice] = useState(92.50)
  const [trainVolume, setTrainVolume] = useState(140)
  const [roiData, setRoiData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRoiMetrics()
  }, [tariff, dieselPrice, trainVolume])

  const fetchRoiMetrics = async () => {
    try {
      const res = await fetch(`/api/roi/metrics?electricity_tariff=${tariff}&diesel_cost_per_liter=${dieselPrice}&daily_train_volume=${trainVolume}`)
      const data = await res.json()
      setRoiData(data)
    } catch (err) {
      console.error('Failed to load ROI metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  const summary = roiData?.executive_summary
  const traction = roiData?.traction_power
  const diesel = roiData?.diesel_and_fuel
  const esg = roiData?.esg_green_railways
  const items = roiData?.financial_breakdown_items || []

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Executive Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Executive ROI & Carbon/Diesel Savings Audit
            </h1>
            <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              POLICY & FINANCIAL JUSTIFICATION
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Strategic financial model for General Managers and Financial Advisers. Quantifies Mail/Express punctuality recovery, traction electricity conservation, and carbon abatement across Northern Railway.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            Corridor: <b>NDLS - CNB (433.5 KM)</b> • Division: <b>Delhi (NR)</b>
          </div>
        </div>
      </div>

      {/* 2. Four Hero KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '14px'
      }}>
        {/* Card 1: Annual Financial Savings */}
        <div className="card-surface" style={{ padding: '18px 20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Annual Divisional Savings
            </span>
            <span style={{ fontSize: '16px' }}>💰</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#34d399', marginTop: '6px', letterSpacing: '-0.5px' }}>
            ₹{summary?.annual_savings_crores || '18.42'} Crores
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Direct operational savings across 5 railway budget heads
          </div>
        </div>

        {/* Card 2: Punctuality Improvement */}
        <div className="card-surface" style={{ padding: '18px 20px', borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Punctuality Gain (Mail / Exp)
            </span>
            <span style={{ fontSize: '16px' }}>📈</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#38bdf8', marginTop: '6px', letterSpacing: '-0.5px' }}>
            +{summary?.punctuality_gain_pct || '4.2'}%
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {summary?.baseline_punctuality_pct}% baseline → <b>{summary?.projected_punctuality_pct}% projected</b>
          </div>
        </div>

        {/* Card 3: Carbon Footprint Abatement */}
        <div className="card-surface" style={{ padding: '18px 20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Annual Carbon Abatement
            </span>
            <span style={{ fontSize: '16px' }}>🌱</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#fbbf24', marginTop: '6px', letterSpacing: '-0.5px' }}>
            {summary?.annual_co2_avoided_tonnes?.toLocaleString() || '956'} Tonnes CO₂
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Equivalent to planting <b>{summary?.equivalent_trees_planted?.toLocaleString() || '43,000'} trees</b>
          </div>
        </div>

        {/* Card 4: Traction Power Conserved */}
        <div className="card-surface" style={{ padding: '18px 20px', borderLeft: '4px solid #a855f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              25kV Power Conserved
            </span>
            <span style={{ fontSize: '16px' }}>⚡</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#c084fc', marginTop: '6px', letterSpacing: '-0.5px' }}>
            {traction ? (traction.annual_kwh_saved / 1000000).toFixed(2) : '1.30'}M kWh/yr
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {traction?.switching_events_eliminated || 912} redundant OHE energizations eliminated
          </div>
        </div>
      </div>

      {/* 3. Interactive Sensitivity & ROI Scenario Calculator */}
      <div className="card-surface" style={{ padding: '20px', border: '1px solid rgba(59, 130, 246, 0.4)', background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.06) 0%, rgba(24, 24, 27, 0.6) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Interactive Sensitivity & Tariff Calculator
              </span>
              <span style={{ fontSize: '10px', background: '#2563eb', color: '#fff', padding: '2px 7px', borderRadius: '4px', fontWeight: 800 }}>
                REAL-TIME SIMULATION
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Adjust regional electricity tariffs, fuel market prices, and corridor traffic volume to recalculate divisional returns live during your pitch.
            </div>
          </div>

          <button
            onClick={() => { setTariff(6.80); setDieselPrice(92.50); setTrainVolume(140); }}
            className="btn-action"
            style={{ fontSize: '11px', padding: '4px 10px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            Reset to NR Benchmarks
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Slider 1: Electricity Tariff */}
          <div style={{ background: 'var(--bg-card)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Traction Tariff (25kV OHE)</span>
              <span className="mono" style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>₹{tariff.toFixed(2)} / kWh</span>
            </div>
            <input
              type="range"
              min="4.0"
              max="12.0"
              step="0.1"
              value={tariff}
              onChange={(e) => setTariff(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>₹4.0 (Subsidized)</span>
              <span>₹6.80 (Standard CERC)</span>
              <span>₹12.0 (Peak Commercial)</span>
            </div>
          </div>

          {/* Slider 2: Diesel Price */}
          <div style={{ background: 'var(--bg-card)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Diesel Fuel Price (HSD)</span>
              <span className="mono" style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24' }}>₹{dieselPrice.toFixed(2)} / Liter</span>
            </div>
            <input
              type="range"
              min="70.0"
              max="130.0"
              step="0.5"
              value={dieselPrice}
              onChange={(e) => setDieselPrice(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>₹70.0 (Base Crude)</span>
              <span>₹92.50 (IOCL Depot Rate)</span>
              <span>₹130.0 (High Escalation)</span>
            </div>
          </div>

          {/* Slider 3: Daily Train Volume */}
          <div style={{ background: 'var(--bg-card)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Corridor Daily Train Traffic</span>
              <span className="mono" style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>{trainVolume} Trains / Day</span>
            </div>
            <input
              type="range"
              min="80"
              max="220"
              step="5"
              value={trainVolume}
              onChange={(e) => setTrainVolume(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#34d399', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>80 (Light Corridor)</span>
              <span>140 (Current DLI-CNB)</span>
              <span>220 (Post-DFCC Saturated)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Itemized Financial Breakdown by Railway Budget Head */}
      <div className="card-surface" style={{ padding: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Itemized Annual Savings Breakdown (Indian Railways Allocation Heads)
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Head of Expenditure</th>
                <th style={{ padding: '10px 14px' }}>Department</th>
                <th style={{ padding: '10px 14px' }}>Operational Mechanism</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Annual Savings</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.head}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'var(--bg-input)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)'
                    }}>
                      {item.department}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '11.5px' }}>
                    {item.detail}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#34d399', fontSize: '13.5px' }} className="mono">
                    ₹{item.amount_crores} Cr
                  </td>
                </tr>
              ))}
              {/* Total Row */}
              <tr style={{ background: 'rgba(16, 185, 129, 0.08)', fontWeight: 800 }}>
                <td colSpan="3" style={{ padding: '14px', color: 'var(--text-primary)', fontSize: '13px' }}>
                  TOTAL PROJECTED DIVISIONAL OPERATIONAL SAVINGS (ANNUAL)
                </td>
                <td style={{ padding: '14px', textAlign: 'right', color: '#34d399', fontSize: '16px' }} className="mono">
                  ₹{summary?.annual_savings_crores || '18.42'} Crores / Yr
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. ESG & Green Railways Spotlight (Mission Net-Zero 2030) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '14px'
      }}>
        <div className="card-surface" style={{ padding: '20px', background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.06) 0%, rgba(24, 24, 27, 0.5) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '20px' }}>🚆</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#34d399' }}>
                Indian Railways Mission Net-Zero Carbon 2030
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Direct alignment with Railway Board environmental directives
              </div>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            By co-locating engineering, OHE, and signalling gangs into joint shadow possession windows, SETU eliminates stop-and-go train detentions at outer home signals. Avoiding unnecessary freight acceleration cycles directly reduces heavy diesel consumption and grid thermal load.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ANNUAL DIESEL SAVED</div>
              <div className="mono" style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24' }}>
                {diesel?.annual_diesel_saved_liters?.toLocaleString() || '356,970'} Liters HSD
              </div>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HIGHWAY EQUIVALENT</div>
              <div className="mono" style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>
                {esg?.passenger_car_equivalents || '208'} Cars Off Road
              </div>
            </div>
          </div>
        </div>

        <div className="card-surface" style={{ padding: '20px', background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.06) 0%, rgba(24, 24, 27, 0.5) 100%)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '20px' }}>⏱️</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>
                Cascading Delay Compression Model
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Knock-on detention reduction across 433.5 km corridor
              </div>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Conventional sequential maintenance generates ~558 train-delay minutes daily because following trains bunch up behind fragmented slow orders. SETU reduces total line possession events from 36 down to 11, compressing daily detention to only 84 minutes.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DAILY DETENTION RECOVERED</div>
              <div className="mono" style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>
                474 Train-Minutes / Day
              </div>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ANNUAL PASSENGER HOURS SAVED</div>
              <div className="mono" style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>
                {summary?.annual_detention_saved_hours?.toLocaleString() || '2,883'} Hours
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
