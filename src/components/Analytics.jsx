import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import StatsGrid from './charts/StatsGrid.jsx'
import TrendChart from './charts/TrendChart.jsx'
import DonutChart from './charts/DonutChart.jsx'
import BarChart from './charts/BarChart.jsx'
import WeekdayChart from './charts/WeekdayChart.jsx'
import HeatmapChart from './charts/HeatmapChart.jsx'
import FiltersBar from './FiltersBar.jsx'
import BottomNav from './BottomNav.jsx'

const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }

export default function Analytics() {
  const { user } = useAuth()
  const [tx, setTx] = useState([])
  const [people, setPeople] = useState([])
  const [cats, setCats] = useState([])

  const [range, setRange] = useState('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [catFilter, setCatFilter] = useState(new Set())
  const [personFilter, setPersonFilter] = useState(new Set())

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'transactions'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setTx(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [user])

  useEffect(() => {
    if (!user) return
    return onSnapshot(collection(db, 'users', user.uid, 'people'), snap =>
      setPeople(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name)))
    )
  }, [user])

  useEffect(() => {
    if (!user) return
    return onSnapshot(collection(db, 'users', user.uid, 'categories'), snap =>
      setCats(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name)))
    )
  }, [user])

  const window = useMemo(() => rangeWindow(range, customStart, customEnd, tx), [range, customStart, customEnd, tx])

  const filtered = useMemo(() => {
    return tx.filter(t => {
      if (window.from != null && t.createdAt < window.from) return false
      if (window.to != null && t.createdAt > window.to) return false
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (catFilter.size > 0 && !catFilter.has(t.categoryId)) return false
      if (personFilter.size > 0 && !personFilter.has(t.personId)) return false
      return true
    })
  }, [tx, window, typeFilter, catFilter, personFilter])

  const stats = useMemo(() => computeStats(filtered, window), [filtered, window])
  const trend = useMemo(() => computeTrend(filtered, window, range), [filtered, window, range])
  const byCategory = useMemo(() => computeByCategory(filtered, cats), [filtered, cats])
  const byPerson = useMemo(() => computeByPerson(filtered, people), [filtered, people])
  const byWeekday = useMemo(() => computeByWeekday(filtered), [filtered])
  const heatmap = useMemo(() => computeHeatmap(filtered, window), [filtered, window])

  return (
    <div className="app-shell">
      <header className="topbar slim">
        <div className="topbar-inner">
          <div>
            <div className="hello">Analytics</div>
            <div className="muted small">{filtered.length} entries · {labelForRange(range, window)}</div>
          </div>
        </div>
      </header>

      <FiltersBar
        range={range} setRange={setRange}
        customStart={customStart} setCustomStart={setCustomStart}
        customEnd={customEnd} setCustomEnd={setCustomEnd}
        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        cats={cats} catFilter={catFilter} setCatFilter={setCatFilter}
        people={people} personFilter={personFilter} setPersonFilter={setPersonFilter}
      />

      <main className="page">
        <StatsGrid stats={stats} />

        <Section title="Spend & income trend" subtitle={trend.subtitle}>
          {trend.points.length > 1
            ? <TrendChart trend={trend} />
            : <Empty>Not enough data in this range.</Empty>}
        </Section>

        <Section title="By category" subtitle="Where your money goes">
          {byCategory.length > 0
            ? <DonutChart data={byCategory} />
            : <Empty>No categorised entries yet.</Empty>}
        </Section>

        <Section title="Top people" subtitle="Biggest counterparties">
          {byPerson.length > 0
            ? <BarChart data={byPerson} />
            : <Empty>No people activity in this range.</Empty>}
        </Section>

        <Section title="By weekday" subtitle="Which day costs you most">
          {filtered.length > 0
            ? <WeekdayChart data={byWeekday} />
            : <Empty>No data for the chosen range.</Empty>}
        </Section>

        <Section title="Activity heatmap" subtitle={heatmap.subtitle}>
          {heatmap.cells.length > 0
            ? <HeatmapChart data={heatmap} />
            : <Empty>No activity to plot.</Empty>}
        </Section>
      </main>

      <BottomNav />
    </div>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <section className="card">
      <div className="card-head">
        <h3>{title}</h3>
        {subtitle && <span className="muted small">{subtitle}</span>}
      </div>
      <div className="card-body">{children}</div>
    </section>
  )
}

function Empty({ children }) {
  return <div className="chart-empty muted small">{children}</div>
}

function rangeWindow(range, customStart, customEnd, list) {
  const now = Date.now()
  if (range === 'custom') {
    const oldest = list.length ? Math.min(...list.map(t => t.createdAt)) : now
    const from = customStart ? new Date(customStart + 'T00:00:00').getTime() : oldest
    const to = customEnd ? new Date(customEnd + 'T23:59:59.999').getTime() : now
    const days = Math.max(1, Math.ceil((to - from) / 86400000))
    return { from, to, days }
  }
  if (range === 'all') {
    const oldest = list.length ? Math.min(...list.map(t => t.createdAt)) : now
    const days = Math.max(1, Math.ceil((now - oldest) / 86400000))
    return { from: null, to: null, days }
  }
  const days = RANGE_DAYS[range]
  return { from: now - days * 86400000, to: now, days }
}

function labelForRange(range, window) {
  if (range === 'custom') {
    if (!window.from && !window.to) return 'Custom range'
    const f = window.from ? new Date(window.from).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '…'
    const t = window.to ? new Date(window.to).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'now'
    return `${f} – ${t}`
  }
  return ({ '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days', '1y': 'Last year', all: 'All time' })[range]
}

function computeStats(list, window) {
  let credit = 0, debit = 0, biggestDebit = 0, biggestCredit = 0
  for (const t of list) {
    const a = Number(t.amount) || 0
    if (t.type === 'credit') {
      credit += a
      if (a > biggestCredit) biggestCredit = a
    } else {
      debit += a
      if (a > biggestDebit) biggestDebit = a
    }
  }
  const avgDay = debit / Math.max(window.days, 1)
  return {
    debit, credit,
    net: credit - debit,
    count: list.length,
    avgDay,
    biggestDebit,
    biggestCredit
  }
}

function computeTrend(list, window, range) {
  const days = Math.min(window.days, 365)
  const end = window.to != null ? startOfDay(window.to) : startOfDay(Date.now())
  const buckets = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = end - i * 86400000
    buckets[d] = { date: d, credit: 0, debit: 0 }
  }
  for (const t of list) {
    const k = startOfDay(t.createdAt)
    if (!buckets[k]) buckets[k] = { date: k, credit: 0, debit: 0 }
    if (t.type === 'credit') buckets[k].credit += Number(t.amount) || 0
    else buckets[k].debit += Number(t.amount) || 0
  }
  const points = Object.values(buckets).sort((a, b) => a.date - b.date)
  return {
    points,
    subtitle: range === 'custom' ? labelForRange(range, window) : (range === 'all' ? `${points.length} day window` : labelForRange(range, window))
  }
}

function computeByCategory(list, cats) {
  const totals = {}
  for (const t of list) {
    if (t.type !== 'debit') continue
    if (!totals[t.categoryId]) totals[t.categoryId] = 0
    totals[t.categoryId] += Number(t.amount) || 0
  }
  const total = Object.values(totals).reduce((a, b) => a + b, 0)
  return Object.entries(totals)
    .map(([id, value]) => {
      const c = cats.find(x => x.id === id)
      return {
        id,
        label: c?.name || 'Unknown',
        icon: c?.icon || '•',
        color: c?.color || '#64748b',
        value,
        pct: total > 0 ? (value / total) * 100 : 0
      }
    })
    .sort((a, b) => b.value - a.value)
}

function computeByPerson(list, people) {
  const totals = {}
  for (const t of list) {
    if (!totals[t.personId]) totals[t.personId] = { credit: 0, debit: 0 }
    if (t.type === 'credit') totals[t.personId].credit += Number(t.amount) || 0
    else totals[t.personId].debit += Number(t.amount) || 0
  }
  return Object.entries(totals)
    .map(([id, v]) => {
      const p = people.find(x => x.id === id)
      return {
        id,
        label: p?.name || 'Unknown',
        credit: v.credit,
        debit: v.debit,
        total: v.credit + v.debit,
        net: v.credit - v.debit
      }
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
}

function computeByWeekday(list) {
  const out = [0, 0, 0, 0, 0, 0, 0].map((_, i) => ({ day: i, credit: 0, debit: 0 }))
  for (const t of list) {
    const wd = new Date(t.createdAt).getDay()
    if (t.type === 'credit') out[wd].credit += Number(t.amount) || 0
    else out[wd].debit += Number(t.amount) || 0
  }
  return out
}

function computeHeatmap(list, window) {
  const days = Math.min(window.days, 365)
  const end = window.to != null ? startOfDay(window.to) : startOfDay(Date.now())
  const start = end - (days - 1) * 86400000
  const map = {}
  for (let i = 0; i < days; i++) map[start + i * 86400000] = 0
  for (const t of list) {
    if (t.type !== 'debit') continue
    const k = startOfDay(t.createdAt)
    if (k in map) map[k] += Number(t.amount) || 0
  }
  const cells = Object.entries(map).map(([d, v]) => ({ date: Number(d), value: v }))
  const max = Math.max(...cells.map(c => c.value), 1)
  return { cells, max, start, days, subtitle: `Daily debit intensity · ${days} days` }
}

function startOfDay(ts) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
