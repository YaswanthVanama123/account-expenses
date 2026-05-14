const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export default function BarChart({ data }) {
  const max = Math.max(1, ...data.map(d => Math.max(d.credit, d.debit)))
  return (
    <div className="hbars">
      {data.map(d => {
        const dW = (d.debit / max) * 100
        const cW = (d.credit / max) * 100
        return (
          <div className="hbar" key={d.id}>
            <div className="hbar-head">
              <span className="hbar-name">{d.label}</span>
              <span className="hbar-net" style={{ color: d.net >= 0 ? '#34d399' : '#f87171' }}>
                {d.net >= 0 ? '+' : '−'} {fmt.format(Math.abs(d.net))}
              </span>
            </div>
            <div className="hbar-track">
              <div className="hbar-fill debit" style={{ width: `${dW}%` }} />
            </div>
            <div className="hbar-track">
              <div className="hbar-fill credit" style={{ width: `${cW}%` }} />
            </div>
            <div className="hbar-meta muted small">
              <span>− {fmt.format(d.debit)}</span>
              <span>+ {fmt.format(d.credit)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
