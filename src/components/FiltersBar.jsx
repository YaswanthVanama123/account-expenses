import { useState } from 'react'

export default function FiltersBar({
  range, setRange,
  typeFilter, setTypeFilter,
  cats, catFilter, setCatFilter,
  people, personFilter, setPersonFilter
}) {
  const [open, setOpen] = useState(null)

  function toggleSet(setter, current, id) {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setter(next)
  }

  return (
    <div className="filters-bar">
      <div className="chip-row">
        {[['7d', '7D'], ['30d', '30D'], ['90d', '90D'], ['1y', '1Y'], ['all', 'All']].map(([k, l]) => (
          <button key={k} className={`chip ${range === k ? 'active' : ''}`} onClick={() => setRange(k)}>{l}</button>
        ))}
        <span className="chip-divider" />
        {[['all', 'Any'], ['debit', 'Debit'], ['credit', 'Credit']].map(([k, l]) => (
          <button key={k} className={`chip ${typeFilter === k ? 'active' : ''}`} onClick={() => setTypeFilter(k)}>{l}</button>
        ))}
        <span className="chip-divider" />
        <button className={`chip ${catFilter.size > 0 ? 'active' : ''}`} onClick={() => setOpen(open === 'cat' ? null : 'cat')}>
          Categories{catFilter.size > 0 ? ` · ${catFilter.size}` : ''}
        </button>
        <button className={`chip ${personFilter.size > 0 ? 'active' : ''}`} onClick={() => setOpen(open === 'p' ? null : 'p')}>
          People{personFilter.size > 0 ? ` · ${personFilter.size}` : ''}
        </button>
        {(catFilter.size > 0 || personFilter.size > 0) && (
          <button className="chip ghost" onClick={() => { setCatFilter(new Set()); setPersonFilter(new Set()) }}>Reset</button>
        )}
      </div>

      {open === 'cat' && (
        <div className="filter-panel">
          {cats.length === 0 && <div className="muted small">No categories yet.</div>}
          <div className="multi-grid">
            {cats.map(c => (
              <button
                key={c.id}
                className={`pill ${catFilter.has(c.id) ? 'on' : ''}`}
                style={{ '--pill': c.color }}
                onClick={() => toggleSet(setCatFilter, catFilter, c.id)}
              >
                <span>{c.icon}</span> {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {open === 'p' && (
        <div className="filter-panel">
          {people.length === 0 && <div className="muted small">No people yet.</div>}
          <div className="multi-grid">
            {people.map(p => (
              <button
                key={p.id}
                className={`pill ${personFilter.has(p.id) ? 'on' : ''}`}
                onClick={() => toggleSet(setPersonFilter, personFilter, p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
