import React from 'react'
import { useAuth, useEmbeddedWallet } from '../hooks/useAuth'
import logoImage from '../public/logo.png'
import './Header.css'

function Header() {
  const { user, logout } = useAuth()
  const { address } = useEmbeddedWallet()

  return (
    <header className="site-header">
      <div className="header-content">
        <div className="header-left">
          <a href="/">
            <img src={logoImage} alt="Logo" className="header-logo" />
          </a>
        </div>
        <div className="user-info">
          <a href="/dashboard" className="dashboard-btn">Dashboard</a>
          <a href="/profile" className="profile-circle">
            {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </a>
          <button onClick={logout} className="sign-out-btn">Sign Out</button>
        </div>
      </div>
    </header>
  )
}

export default Header


