import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import TransactionForm from './TransactionForm.jsx'
import BottomNav from './BottomNav.jsx'
import ConfirmModal from './ConfirmModal.jsx'

const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export default function Dashboard() {
  const { user, displayName, logout } = useAuth()
  const [tx, setTx] = useState([])
  const [people, setPeople] = useState([])
  const [cats, setCats] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const [personFilter, setPersonFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    if (!user) return
    const qTx = query(collection(db, 'users', user.uid, 'transactions'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(qTx, snap => {
      setTx(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [user])

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(collection(db, 'users', user.uid, 'people'), snap => {
      setPeople(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name)))
    })
    return unsub
  }, [user])

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(collection(db, 'users', user.uid, 'categories'), snap => {
      setCats(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name)))
    })
    return unsub
  }, [user])

  const filtered = useMemo(() => {
    const { from, to } = dateRangeFor(dateFilter, customStart, customEnd)
    return tx.filter(t => {
      if (filter !== 'all' && t.type !== filter) return false
      if (personFilter !== 'all' && t.personId !== personFilter) return false
      if (from != null && t.createdAt < from) return false
      if (to != null && t.createdAt > to) return false
      return true
    })
  }, [tx, filter, personFilter, dateFilter, customStart, customEnd])

  const totals = useMemo(() => {
    let credit = 0, debit = 0
    for (const t of filtered) {
      if (t.type === 'credit') credit += Number(t.amount) || 0
      else debit += Number(t.amount) || 0
    }
    return { credit, debit, net: credit - debit }
  }, [filtered])

  const grouped = useMemo(() => {
    const out = []
    let lastKey = null
    for (const t of filtered) {
      const key = dayKey(t.createdAt)
      if (key !== lastKey) {
        out.push({ kind: 'header', key, label: dayLabel(t.createdAt) })
        lastKey = key
      }
      out.push({ kind: 'item', t })
    }
    return out
  }, [filtered])

  async function remove(id) {
    await deleteDoc(doc(db, 'users', user.uid, 'transactions', id))
  }

  function startEdit(t) {
    setEditing(t)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div>
            <div className="hello">Hi {displayName}</div>
            <div className="muted small">Your ledger</div>
          </div>
          <button className="icon-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <Dots />
          </button>
          {menuOpen && (
            <>
              <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="menu">
                <button onClick={() => { setMenuOpen(false); logout() }}>Sign out</button>
              </div>
            </>
          )}
        </div>

        <div className="balance-card">
          <div className="bal-label">Net balance</div>
          <div className={`bal-amount ${totals.net >= 0 ? 'pos' : 'neg'}`}>
            {totals.net >= 0 ? '+' : '−'} {fmt.format(Math.abs(totals.net))}
          </div>
          <div className="bal-row">
            <div className="bal-chip credit">
              <span className="dot" /> In
              <strong>{fmt.format(totals.credit)}</strong>
            </div>
            <div className="bal-chip debit">
              <span className="dot" /> Out
              <strong>{fmt.format(totals.debit)}</strong>
            </div>
          </div>
        </div>

        <div className="filter-row">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterChip>
          <FilterChip active={filter === 'credit'} onClick={() => setFilter('credit')}>Credit</FilterChip>
          <FilterChip active={filter === 'debit'} onClick={() => setFilter('debit')}>Debit</FilterChip>
        </div>

        <div className="ledger-filters">
          <label className="ledger-select">
            <span className="ls-label">Person</span>
            <select value={personFilter} onChange={e => setPersonFilter(e.target.value)}>
              <option value="all">Everyone</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="ledger-select">
            <span className="ls-label">When</span>
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
              <option value="custom">Custom…</option>
            </select>
          </label>
        </div>

        {dateFilter === 'custom' && (
          <div className="ledger-custom">
            <label>
              <span className="ls-label">From</span>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
            </label>
            <label>
              <span className="ls-label">To</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </label>
          </div>
        )}

        {(personFilter !== 'all' || dateFilter !== 'all' || filter !== 'all') && (
          <div className="filter-summary">
            <span className="muted small">{filtered.length} of {tx.length} entries</span>
            <button className="link-btn" onClick={() => {
              setFilter('all'); setPersonFilter('all'); setDateFilter('all'); setCustomStart(''); setCustomEnd('')
            }}>Clear filters</button>
          </div>
        )}
      </header>

      <main className="feed">
        {grouped.length === 0 && (
          <div className="empty">
            <div className="empty-emoji">📒</div>
            <h3>No entries yet</h3>
            <p className="muted">Tap the + button to log your first transaction.</p>
          </div>
        )}

        {grouped.map((g, i) => (
          g.kind === 'header'
            ? <div className="day-divider" key={g.key + i}>{g.label}</div>
            : <TxBubble key={g.t.id} t={g.t} people={people} cats={cats} onEdit={() => startEdit(g.t)} onDelete={() => setConfirmDelete(g.t)} />
        ))}
      </main>

      <button className="fab" onClick={() => setShowForm(true)} aria-label="Add transaction">
        <Plus />
      </button>

      {showForm && (
        <TransactionForm
          uid={user.uid}
          people={people}
          cats={cats}
          editing={editing}
          onClose={closeForm}
        />
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete this entry?"
        message={confirmDelete ? `${describe(confirmDelete, people, cats)} — this can't be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          const id = confirmDelete.id
          setConfirmDelete(null)
          await remove(id)
        }}
      />

      <BottomNav />
    </div>
  )
}

function describe(t, people, cats) {
  const p = people.find(x => x.id === t.personId)?.name || 'Someone'
  const c = cats.find(x => x.id === t.categoryId)?.name || 'Other'
  const sign = t.type === 'credit' ? '+' : '−'
  return `${sign} ${fmt.format(Math.abs(Number(t.amount) || 0))} · ${p} · ${c}`
}

function TxBubble({ t, people, cats, onEdit, onDelete }) {
  const person = people.find(p => p.id === t.personId)
  const cat = cats.find(c => c.id === t.categoryId)
  const isCredit = t.type === 'credit'
  return (
    <div className={`bubble ${isCredit ? 'credit' : 'debit'}`} onClick={onEdit}>
      <div className="bubble-icon" style={{ background: cat?.color || '#64748b' }}>
        <span>{cat?.icon || '•'}</span>
      </div>
      <div className="bubble-body">
        <div className="bubble-line">
          <strong className="bubble-name">{person?.name || 'Someone'}</strong>
          <span className={`bubble-amt ${isCredit ? 'pos' : 'neg'}`}>
            {isCredit ? '+' : '−'} {fmt.format(Math.abs(Number(t.amount) || 0))}
          </span>
        </div>
        <div className="bubble-meta">
          <span className="tag">{cat?.name || 'Other'}</span>
          {t.notes && <span className="notes">· {t.notes}</span>}
        </div>
        <div className="bubble-time">{timeLabel(t.createdAt)}</div>
      </div>
      <button className="bubble-del" onClick={(e) => { e.stopPropagation(); onDelete() }} aria-label="Delete">
        <Trash />
      </button>
    </div>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button className={`chip ${active ? 'active' : ''}`} onClick={onClick}>{children}</button>
  )
}

function dayKey(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}
function dayLabel(ts) {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const yest = new Date(now); yest.setDate(now.getDate() - 1)
  if (sameDay) return 'Today'
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
function timeLabel(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function dateRangeFor(kind, customStart, customEnd) {
  const now = new Date()
  if (kind === 'today') {
    const s = new Date(now); s.setHours(0, 0, 0, 0)
    const e = new Date(now); e.setHours(23, 59, 59, 999)
    return { from: s.getTime(), to: e.getTime() }
  }
  if (kind === 'week') {
    const s = new Date(now)
    const dow = s.getDay()
    s.setDate(s.getDate() - dow)
    s.setHours(0, 0, 0, 0)
    return { from: s.getTime(), to: null }
  }
  if (kind === 'month') {
    const s = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: s.getTime(), to: null }
  }
  if (kind === 'year') {
    const s = new Date(now.getFullYear(), 0, 1)
    return { from: s.getTime(), to: null }
  }
  if (kind === 'custom') {
    const from = customStart ? new Date(customStart + 'T00:00:00').getTime() : null
    const to = customEnd ? new Date(customEnd + 'T23:59:59.999').getTime() : null
    return { from, to }
  }
  return { from: null, to: null }
}

function Plus() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
}
function Dots() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
}
function Trash() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
}
