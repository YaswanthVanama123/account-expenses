import { useMemo, useState } from 'react'

const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const DAY_LABELS = ['M', 'W', 'F']

export default function HeatmapChart({ data }) {
  const [hover, setHover] = useState(null)
  const cellSize = 12
  const gap = 3

  const weeks = useMemo(() => groupIntoWeeks(data.cells), [data.cells])
  const W = weeks.length * (cellSize + gap) + 22
  const H = 7 * (cellSize + gap) + 18

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} className="heatmap" style={{ minWidth: W }}>
          {[0, 2, 4].map((d, i) => (
            <text key={d} x={0} y={14 + d * (cellSize + gap) + 10} fontSize="9" fill="rgba(232,236,248,0.45)">{DAY_LABELS[i]}</text>
          ))}
          {weeks.map((week, wi) => (
            <g key={wi} transform={`translate(${22 + wi * (cellSize + gap)}, 14)`}>
              {week.map((cell, di) => {
                if (!cell) return null
                const intensity = cell.value === 0 ? 0 : 0.18 + 0.82 * (cell.value / data.max)
                return (
                  <rect
                    key={di}
                    x={0}
                    y={di * (cellSize + gap)}
                    width={cellSize}
                    height={cellSize}
                    rx={2}
                    fill={cell.value === 0 ? 'rgba(255,255,255,0.05)' : `rgba(99,102,241,${intensity})`}
                    onMouseEnter={() => setHover(cell)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <title>{new Date(cell.date).toDateString()}: {fmt.format(cell.value)}</title>
                  </rect>
                )
              })}
            </g>
          ))}
        </svg>
      </div>
      <div className="heatmap-foot">
        <span className="muted small">{hover ? `${new Date(hover.date).toDateString()} · ${fmt.format(hover.value)}` : 'Hover a square'}</span>
        <div className="legend-scale">
          <span className="muted small">less</span>
          {[0.2, 0.4, 0.6, 0.8, 1].map(i => (
            <span key={i} className="scale-cell" style={{ background: `rgba(99,102,241,${i})` }} />
          ))}
          <span className="muted small">more</span>
        </div>
      </div>
    </div>
  )
}

function groupIntoWeeks(cells) {
  if (cells.length === 0) return []
  const first = new Date(cells[0].date)
  const padStart = first.getDay()
  const padded = []
  for (let i = 0; i < padStart; i++) padded.push(null)
  for (const c of cells) padded.push(c)
  while (padded.length % 7 !== 0) padded.push(null)
  const weeks = []
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7))
  return weeks
}
