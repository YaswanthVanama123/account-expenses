import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore'
import { auth, db } from '../firebase.js'

const AuthContext = createContext(null)

const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: '🍔', color: '#f97316' },
  { name: 'Travel', icon: '✈️', color: '#06b6d4' },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
  { name: 'Bills', icon: '💡', color: '#eab308' },
  { name: 'Rent', icon: '🏠', color: '#8b5cf6' },
  { name: 'Health', icon: '💊', color: '#ef4444' },
  { name: 'Salary', icon: '💼', color: '#10b981' },
  { name: 'Other', icon: '✨', color: '#64748b' }
]

async function seedDefaults(uid) {
  const catCol = collection(db, 'users', uid, 'categories')
  const existing = await getDocs(catCol)
  if (!existing.empty) return
  const batch = writeBatch(db)
  for (const cat of DEFAULT_CATEGORIES) {
    const ref = doc(catCol)
    batch.set(ref, { ...cat, createdAt: Date.now() })
  }
  await batch.commit()
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  async function signup(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, 'users', cred.user.uid), {
      email,
      displayName: displayName || email.split('@')[0],
      createdAt: Date.now()
    })
    await seedDefaults(cred.user.uid)
    return cred.user
  }

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await seedDefaults(cred.user.uid)
    return cred.user
  }

  function logout() {
    return signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
