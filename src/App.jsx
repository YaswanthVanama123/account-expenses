import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Login from './components/Login.jsx'
import SignUp from './components/SignUp.jsx'
import Dashboard from './components/Dashboard.jsx'
import People from './components/People.jsx'
import Categories from './components/Categories.jsx'
import Analytics from './components/Analytics.jsx'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="full-loader"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function Public({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="full-loader"><div className="spinner" /></div>
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Public><Login /></Public>} />
      <Route path="/signup" element={<Public><SignUp /></Public>} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
      <Route path="/people" element={<Protected><People /></Protected>} />
      <Route path="/categories" element={<Protected><Categories /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
