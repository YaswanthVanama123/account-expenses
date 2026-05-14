const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export default function StatsGrid({ stats }) {
  return (
    <div className="stats-grid">
      <Stat label="Spent" value={fmt.format(stats.debit)} tone="debit" sub={`${stats.count} entries`} />
      <Stat label="Received" value={fmt.format(stats.credit)} tone="credit" />
      <Stat
        label="Net"
        value={`${stats.net >= 0 ? '+' : '−'} ${fmt.format(Math.abs(stats.net))}`}
        tone={stats.net >= 0 ? 'credit' : 'debit'}
      />
      <Stat label="Avg / day" value={fmt.format(stats.avgDay)} />
      <Stat label="Biggest debit" value={fmt.format(stats.biggestDebit)} tone="debit" />
      <Stat label="Biggest credit" value={fmt.format(stats.biggestCredit)} tone="credit" />
    </div>
  )
}

function Stat({ label, value, sub, tone }) {
  return (
    <div className={`stat ${tone || ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
