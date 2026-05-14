import { useEffect, useState } from 'react'
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { Link } from 'react-router-dom'

export default function TransactionForm({ uid, people, cats, editing, onClose }) {
  const [type, setType] = useState(editing?.type || 'debit')
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '')
  const [personId, setPersonId] = useState(editing?.personId || '')
  const [categoryId, setCategoryId] = useState(editing?.categoryId || '')
  const [notes, setNotes] = useState(editing?.notes || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!categoryId && cats.length) setCategoryId(cats[0].id)
  }, [cats, categoryId])

  useEffect(() => {
    if (!personId && people.length) setPersonId(people[0].id)
  }, [people, personId])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  async function submit(e) {
    e.preventDefault()
    setError('')
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return setError('Enter a valid amount.')
    if (!personId) return setError('Pick a person (add one if you have none).')
    if (!categoryId) return setError('Pick a category.')

    setBusy(true)
    try {
      const payload = {
        type,
        amount: amt,
        personId,
        categoryId,
        notes: notes.trim(),
        updatedAt: Date.now()
      }
      if (editing) {
        await updateDoc(doc(db, 'users', uid, 'transactions', editing.id), payload)
      } else {
        await addDoc(collection(db, 'users', uid, 'transactions'), {
          ...payload,
          createdAt: Date.now()
        })
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2>{editing ? 'Edit entry' : 'New entry'}</h2>
          <button className="icon-btn ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={submit} className="form">
          <div className="seg">
            <button
              type="button"
              className={`seg-btn ${type === 'debit' ? 'active debit' : ''}`}
              onClick={() => setType('debit')}
            >
              <span>−</span> Debit
            </button>
            <button
              type="button"
              className={`seg-btn ${type === 'credit' ? 'active credit' : ''}`}
              onClick={() => setType('credit')}
            >
              <span>+</span> Credit
            </button>
          </div>

          <div className="amount-input">
            <span className="currency">₹</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
            />
          </div>

          <label className="field">
            <span>Person</span>
            {people.length > 0 ? (
              <select value={personId} onChange={e => setPersonId(e.target.value)}>
                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            ) : (
              <Link to="/people" className="inline-link">+ Add a person first</Link>
            )}
          </label>

          <label className="field">
            <span>Category</span>
            <div className="cat-grid">
              {cats.map(c => (
                <button
                  type="button"
                  key={c.id}
                  className={`cat-tile ${categoryId === c.id ? 'active' : ''}`}
                  onClick={() => setCategoryId(c.id)}
                  style={{ '--cat': c.color }}
                >
                  <span className="cat-icon">{c.icon}</span>
                  <span className="cat-name">{c.name}</span>
                </button>
              ))}
              <Link to="/categories" className="cat-tile add">
                <span className="cat-icon">+</span>
                <span className="cat-name">More</span>
              </Link>
            </div>
          </label>

          <label className="field">
            <span>Notes <em className="muted">(optional)</em></span>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What was this for?"
            />
          </label>

          {error && <div className="error-banner">{error}</div>}

          <button className="btn-primary big" type="submit" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Update entry' : 'Save entry'}
          </button>
        </form>
      </div>
    </div>
  )
}
