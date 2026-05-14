import { useState } from 'react'

const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export default function DonutChart({ data }) {
  const [active, setActive] = useState(0)
  const total = data.reduce((a, b) => a + b.value, 0)
  const W = 220, R = 90, r = 60, cx = W / 2, cy = W / 2

  let cursor = -Math.PI / 2
  const arcs = data.map((d, i) => {
    const angle = (d.value / total) * Math.PI * 2
    const start = cursor
    const end = cursor + angle
    cursor = end
    return { ...d, start, end, i }
  })

  const focus = arcs[active] || arcs[0]

  return (
    <div className="donut-wrap">
      <svg viewBox={`0 0 ${W} ${W}`} className="donut">
        {arcs.map(a => (
          <path
            key={a.id}
            d={ringSlice(cx, cy, R, r, a.start, a.end)}
            fill={a.color}
            opacity={a.i === active ? 1 : 0.55}
            onMouseEnter={() => setActive(a.i)}
            onClick={() => setActive(a.i)}
            style={{ cursor: 'pointer', transition: 'opacity .15s' }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="rgba(232,236,248,0.55)">
          {focus?.label}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="18" fontWeight="800" fill="#e8ecf8">
          {fmt.format(focus?.value || 0)}
        </text>
        <text x={cx} y={cy + 30} textAnchor="middle" fontSize="11" fill="rgba(232,236,248,0.5)">
          {(focus?.pct || 0).toFixed(1)}%
        </text>
      </svg>

      <ul className="donut-legend">
        {data.map((d, i) => (
          <li
            key={d.id}
            className={`legend-row ${i === active ? 'on' : ''}`}
            onMouseEnter={() => setActive(i)}
            onClick={() => setActive(i)}
          >
            <span className="legend-icon" style={{ background: d.color }}>{d.icon}</span>
            <span className="legend-label">{d.label}</span>
            <span className="legend-pct">{d.pct.toFixed(0)}%</span>
            <span className="legend-val">{fmt.format(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ringSlice(cx, cy, R, r, a0, a1) {
  if (a1 - a0 >= Math.PI * 2 - 0.001) {
    return [
      `M ${cx + R} ${cy}`,
      `A ${R} ${R} 0 1 1 ${cx - R} ${cy}`,
      `A ${R} ${R} 0 1 1 ${cx + R} ${cy}`,
      `M ${cx + r} ${cy}`,
      `A ${r} ${r} 0 1 0 ${cx - r} ${cy}`,
      `A ${r} ${r} 0 1 0 ${cx + r} ${cy}`,
      'Z'
    ].join(' ')
  }
  const large = a1 - a0 > Math.PI ? 1 : 0
  const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0)
  const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1)
  const xi0 = cx + r * Math.cos(a1), yi0 = cy + r * Math.sin(a1)
  const xi1 = cx + r * Math.cos(a0), yi1 = cy + r * Math.sin(a0)
  return [
    `M ${x0} ${y0}`,
    `A ${R} ${R} 0 ${large} 1 ${x1} ${y1}`,
    `L ${xi0} ${yi0}`,
    `A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1}`,
    'Z'
  ].join(' ')
}
