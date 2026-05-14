import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import BottomNav from './BottomNav.jsx'

const ICONS = ['🍔', '✈️', '🛍️', '💡', '🏠', '💊', '💼', '🚗', '🎬', '🎓', '🎁', '☕', '⚽', '🐾', '🛒', '✨']
const COLORS = ['#f97316', '#06b6d4', '#ec4899', '#eab308', '#8b5cf6', '#ef4444', '#10b981', '#3b82f6', '#a855f7', '#14b8a6', '#f43f5e', '#64748b']

export default function Categories() {
  const { user } = useAuth()
  const [cats, setCats] = useState([])
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(ICONS[0])
  const [color, setColor] = useState(COLORS[0])
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(collection(db, 'users', user.uid, 'categories'), snap => {
      setCats(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name)))
    })
    return unsub
  }, [user])

  async function add(e) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    setBusy(true)
    try {
      if (editingId) {
        await updateDoc(doc(db, 'users', user.uid, 'categories', editingId), { name: n, icon, color })
        setEditingId(null)
      } else {
        await addDoc(collection(db, 'users', user.uid, 'categories'), {
          name: n, icon, color, createdAt: Date.now()
        })
      }
      setName('')
      setIcon(ICONS[0])
      setColor(COLORS[0])
    } finally { setBusy(false) }
  }

  function startEdit(c) {
    setEditingId(c.id)
    setName(c.name)
    setIcon(c.icon)
    setColor(c.color)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setName('')
    setIcon(ICONS[0])
    setColor(COLORS[0])
  }

  async function remove(id) {
    if (!confirm('Remove this category?')) return
    await deleteDoc(doc(db, 'users', user.uid, 'categories', id))
  }

  return (
    <div className="app-shell">
      <header className="topbar slim">
        <div className="topbar-inner">
          <Link to="/" className="icon-btn ghost" aria-label="Back"><Back /></Link>
          <div className="title">Categories</div>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className="page">
        <form className="cat-form" onSubmit={add}>
          <div className="cat-preview" style={{ background: color }}>
            <span>{icon}</span>
          </div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={editingId ? 'Rename category' : 'New category name'}
          />
          <div className="picker-label">Icon</div>
          <div className="picker">
            {ICONS.map(i => (
              <button type="button" key={i} className={`picker-cell ${icon === i ? 'on' : ''}`} onClick={() => setIcon(i)}>{i}</button>
            ))}
          </div>
          <div className="picker-label">Color</div>
          <div className="picker">
            {COLORS.map(c => (
              <button type="button" key={c} className={`picker-cell color ${color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />
            ))}
          </div>
          <div className="row-actions">
            {editingId && <button type="button" className="btn-ghost" onClick={cancelEdit}>Cancel</button>}
            <button className="btn-primary" disabled={busy || !name.trim()}>
              {editingId ? 'Save changes' : 'Add category'}
            </button>
          </div>
        </form>

        <ul className="list">
          {cats.map(c => (
            <li className="list-item" key={c.id}>
              <div className="avatar" style={{ background: c.color }}>{c.icon}</div>
              <div className="list-name">{c.name}</div>
              <button className="link-btn" onClick={() => startEdit(c)}>Edit</button>
              <button className="link-btn danger" onClick={() => remove(c.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </main>

      <BottomNav />
    </div>
  )
}

function Back() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
}
