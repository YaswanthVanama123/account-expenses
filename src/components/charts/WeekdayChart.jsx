const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function WeekdayChart({ data }) {
  const W = 600, H = 200, P = { l: 8, r: 8, t: 12, b: 24 }
  const max = Math.max(1, ...data.map(d => Math.max(d.credit, d.debit)))
  const innerW = W - P.l - P.r
  const innerH = H - P.t - P.b
  const groupW = innerW / 7
  const barW = (groupW - 8) / 2

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart">
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={P.l} x2={W - P.r} y1={P.t + innerH * (1 - f)} y2={P.t + innerH * (1 - f)} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 4" />
      ))}
      {data.map((d, i) => {
        const gx = P.l + i * groupW + 4
        const dh = (d.debit / max) * innerH
        const ch = (d.credit / max) * innerH
        return (
          <g key={i}>
            <rect x={gx} y={P.t + innerH - dh} width={barW} height={dh} rx={3} fill="#f87171">
              <title>{LABELS[i]} debit: {fmt.format(d.debit)}</title>
            </rect>
            <rect x={gx + barW + 4} y={P.t + innerH - ch} width={barW} height={ch} rx={3} fill="#34d399">
              <title>{LABELS[i]} credit: {fmt.format(d.credit)}</title>
            </rect>
            <text x={gx + barW + 2} y={H - 6} textAnchor="middle" fontSize="10" fill="rgba(232,236,248,0.5)">{LABELS[i]}</text>
          </g>
        )
      })}
    </svg>
  )
}
