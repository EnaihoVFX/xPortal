import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useEmbeddedWallet } from '../hooks/useAuth'
import { formatAddress } from '../utils/web3'
import Header from '../components/Header'
import './Profile.css'

function Profile() {
  const { user, logout } = useAuth()
  const { address } = useEmbeddedWallet()
  const navigate = useNavigate()

  return (
    <div className="profile-page">
      <Header />
      <div className="profile-page-header">
        <h1>Profile</h1>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <h2>Account</h2>
          <div className="profile-info">
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{user?.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Wallet Address</span>
              <span className="info-value">{formatAddress(address)}</span>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <h2>Actions</h2>
          <button onClick={logout} className="logout-btn">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
