import { NavLink } from 'react-router-dom'

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => `bnav ${isActive ? 'on' : ''}`}>
        <Ledger />
        <span>Ledger</span>
      </NavLink>
      <NavLink to="/analytics" className={({ isActive }) => `bnav ${isActive ? 'on' : ''}`}>
        <Chart />
        <span>Analytics</span>
      </NavLink>
      <NavLink to="/people" className={({ isActive }) => `bnav ${isActive ? 'on' : ''}`}>
        <Users />
        <span>People</span>
      </NavLink>
      <NavLink to="/categories" className={({ isActive }) => `bnav ${isActive ? 'on' : ''}`}>
        <Grid />
        <span>Categories</span>
      </NavLink>
    </nav>
  )
}

function Ledger() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h13a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z"/><path d="M4 16h16"/><path d="M9 8h7"/></svg>
}
function Chart() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-7"/></svg>
}
function Users() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function Grid() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
}
