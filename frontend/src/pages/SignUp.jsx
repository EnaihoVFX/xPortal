import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Auth.css'

function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const result = await register(email, password)
    setLoading(false)

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Something went wrong')
    }
  }

  const handleQuickSignUp = async () => {
    const quickEmail = `user_${Date.now()}@quick.com`
    const quickPassword = 'quick123'
    
    setLoading(true)
    setError('')
    const result = await register(quickEmail, quickPassword)
    setLoading(false)

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError('Failed to create account. Please try the form above.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Get Started</h1>
        <p>Create your account in seconds</p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            disabled={loading}
            autoFocus
            className="auth-input"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (6+ characters)"
            required
            disabled={loading}
            minLength={6}
            className="auth-input"
          />

          <button type="submit" className="auth-button primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button 
          onClick={handleQuickSignUp}
          disabled={loading}
          className="auth-button quick"
        >
          {loading ? 'Creating...' : 'Continue as Guest'}
        </button>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}

export default SignUp
