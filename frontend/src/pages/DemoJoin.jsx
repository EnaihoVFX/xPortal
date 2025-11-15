import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useAuth, useEmbeddedWallet } from '../hooks/useAuth'
import { useMarkets } from '../hooks/useMarkets'
import { useMarketsDemo } from '../hooks/useMarketsDemo'
import './DemoJoin.css'

function DemoJoin() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const token = searchParams.get('token')
  const isPublic = location.pathname.includes('/public')
  const navigate = useNavigate()
  const { register } = useAuth()
  const { signer, isConnected } = useEmbeddedWallet()
  const realMarkets = useMarkets(signer)
  const demoMarkets = useMarketsDemo(signer)
  // Demo accounts use demo mode, which doesn't need faucet
  const { contracts, getUSDCFromFaucet } = realMarkets
  const [status, setStatus] = useState('Creating your demo account...')

  const [accountCreated, setAccountCreated] = useState(false)

  useEffect(() => {
    const createDemoAccount = async () => {
      try {
        setStatus('Generating wallet...')
        
        // Create a unique test account - use timestamp + random for uniqueness
        // This ensures multiple people scanning at the same time get different accounts
        const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.floor(Math.random() * 10000)}`
        const testEmail = isPublic 
          ? `public_${uniqueId}@demo.com`
          : `demo_${uniqueId}@demo.com`
        const testPassword = 'demo123'
        
        setStatus('Setting up account...')
        const result = await register(testEmail, testPassword)
        
        if (result.success) {
          setAccountCreated(true)
          setStatus('Success! Redirecting...')
          setTimeout(() => {
            navigate('/dashboard')
          }, 1000)
        } else {
          setStatus('Error creating account. Please try again.')
        }
      } catch (error) {
        setStatus(`Error: ${error.message}`)
      }
    }

    // Allow both token-based and public demo
    if ((token || isPublic) && !accountCreated) {
      createDemoAccount()
    } else if (!token && !isPublic) {
      // No token and not public, redirect to demo page
      navigate('/demo')
    }
  }, [token, isPublic, register, navigate, accountCreated])

  // Skip faucet for demo accounts - they use demo mode with pre-loaded balance
  // Demo accounts created here have @demo.com email, which triggers demo mode
  useEffect(() => {
    // Demo accounts don't need faucet - demo mode provides balance automatically
    // Only non-demo accounts would need this, but all accounts created here are demo
    if (accountCreated) {
      console.log('🎮 Demo account created - using demo mode (no faucet needed)')
    }
  }, [accountCreated])

  return (
    <div className="demo-join-page">
      <div className="demo-join-content">
        <div className="spinner"></div>
        <h2>{status}</h2>
        <p>This will only take a moment...</p>
      </div>
    </div>
  )
}

export default DemoJoin

