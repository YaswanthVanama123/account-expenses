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

export default function People() {
  const { user } = useAuth()
  const [people, setPeople] = useState([])
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(collection(db, 'users', user.uid, 'people'), snap => {
      setPeople(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name)))
    })
    return unsub
  }, [user])

  async function add(e) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    setBusy(true)
    try {
      await addDoc(collection(db, 'users', user.uid, 'people'), {
        name: n,
        createdAt: Date.now()
      })
      setName('')
    } finally { setBusy(false) }
  }

  async function save(id) {
    const n = editingName.trim()
    if (!n) return
    await updateDoc(doc(db, 'users', user.uid, 'people', id), { name: n })
    setEditingId(null)
    setEditingName('')
  }

  async function remove(id) {
    if (!confirm('Remove this person? Existing entries will keep their reference.')) return
    await deleteDoc(doc(db, 'users', user.uid, 'people', id))
  }

  return (
    <div className="app-shell">
      <header className="topbar slim">
        <div className="topbar-inner">
          <Link to="/" className="icon-btn ghost" aria-label="Back"><Back /></Link>
          <div className="title">People</div>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className="page">
        <form className="add-row" onSubmit={add}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Add a person (e.g. Mom)"
          />
          <button className="btn-primary" disabled={busy || !name.trim()}>Add</button>
        </form>

        {people.length === 0 && (
          <div className="empty">
            <div className="empty-emoji">👥</div>
            <h3>No people yet</h3>
            <p className="muted">Add anyone you transact with — friends, family, vendors.</p>
          </div>
        )}

        <ul className="list">
          {people.map(p => (
            <li className="list-item" key={p.id}>
              <div className="avatar">{initials(p.name)}</div>
              {editingId === p.id ? (
                <>
                  <input
                    className="inline-edit"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    autoFocus
                  />
                  <button className="link-btn" onClick={() => save(p.id)}>Save</button>
                  <button className="link-btn muted" onClick={() => setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <div className="list-name">{p.name}</div>
                  <button className="link-btn" onClick={() => { setEditingId(p.id); setEditingName(p.name) }}>Edit</button>
                  <button className="link-btn danger" onClick={() => remove(p.id)}>Delete</button>
                </>
              )}
            </li>
          ))}
        </ul>
      </main>

      <BottomNav />
    </div>
  )
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '•'
}
function Back() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
}
