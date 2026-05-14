import { useMemo, useState } from 'react'

const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export default function TrendChart({ trend }) {
  const W = 600, H = 220, P = { l: 8, r: 8, t: 16, b: 24 }
  const [hoverIdx, setHoverIdx] = useState(null)

  const { points } = trend
  const max = Math.max(1, ...points.map(p => Math.max(p.credit, p.debit)))

  const innerW = W - P.l - P.r
  const innerH = H - P.t - P.b
  const stepX = points.length > 1 ? innerW / (points.length - 1) : innerW

  const x = i => P.l + i * stepX
  const y = v => P.t + innerH - (v / max) * innerH

  const pathDebit = useMemo(() => buildSmoothPath(points.map((p, i) => [x(i), y(p.debit)])), [points, max])
  const pathCredit = useMemo(() => buildSmoothPath(points.map((p, i) => [x(i), y(p.credit)])), [points, max])

  const areaDebit = pathDebit ? `${pathDebit} L ${x(points.length - 1)} ${P.t + innerH} L ${x(0)} ${P.t + innerH} Z` : ''
  const areaCredit = pathCredit ? `${pathCredit} L ${x(points.length - 1)} ${P.t + innerH} L ${x(0)} ${P.t + innerH} Z` : ''

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W - P.l
    const i = Math.max(0, Math.min(points.length - 1, Math.round(px / stepX)))
    setHoverIdx(i)
  }

  const hover = hoverIdx != null ? points[hoverIdx] : null

  return (
    <div className="trend">
      <div className="legend">
        <span className="legend-item"><span className="dot debit" /> Debit</span>
        <span className="legend-item"><span className="dot credit" /> Credit</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
        onTouchMove={(e) => {
          const t = e.touches[0]
          handleMove({ clientX: t.clientX, currentTarget: e.currentTarget })
        }}
        onTouchEnd={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="gd" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f87171" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gc" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1={P.l} x2={W - P.r} y1={P.t + innerH * f} y2={P.t + innerH * f} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 4" />
        ))}

        <path d={areaDebit} fill="url(#gd)" />
        <path d={areaCredit} fill="url(#gc)" />
        <path d={pathDebit} fill="none" stroke="#f87171" strokeWidth="2" />
        <path d={pathCredit} fill="none" stroke="#34d399" strokeWidth="2" />

        {hover && (
          <g>
            <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={P.t} y2={P.t + innerH} stroke="rgba(255,255,255,0.18)" strokeDasharray="2 3" />
            <circle cx={x(hoverIdx)} cy={y(hover.debit)} r="3.5" fill="#f87171" stroke="#0b1020" strokeWidth="1.5" />
            <circle cx={x(hoverIdx)} cy={y(hover.credit)} r="3.5" fill="#34d399" stroke="#0b1020" strokeWidth="1.5" />
          </g>
        )}

        {labelTicks(points).map((t, i) => (
          <text key={i} x={x(t.idx)} y={H - 6} textAnchor="middle" fontSize="10" fill="rgba(232,236,248,0.45)">{t.label}</text>
        ))}
      </svg>

      <div className="trend-readout">
        <div>
          <span className="muted small">{hover ? formatDate(hover.date) : 'Hover / drag'}</span>
        </div>
        <div className="readout-row">
          <span><span className="dot debit" /> {fmt.format(hover?.debit ?? 0)}</span>
          <span><span className="dot credit" /> {fmt.format(hover?.credit ?? 0)}</span>
        </div>
      </div>
    </div>
  )
}

function buildSmoothPath(pts) {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const cx = (x0 + x1) / 2
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`
  }
  return d
}

function labelTicks(points) {
  if (points.length === 0) return []
  const want = 4
  const step = Math.max(1, Math.floor(points.length / want))
  const out = []
  for (let i = 0; i < points.length; i += step) {
    out.push({ idx: i, label: shortDate(points[i].date) })
  }
  return out
}

function shortDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}
function formatDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}
