import React, { useState, useEffect } from 'react'
import { useAuth, useEmbeddedWallet } from '../hooks/useAuth'
import Header from '../components/Header'
import { useContracts } from '../hooks/useContracts'
import { useMarketsDemo } from '../hooks/useMarketsDemo'
import { formatAddress } from '../utils/web3'
import './Dashboard.css'

function Dashboard() {
  const { user, logout } = useAuth()
  const { signer, address, isConnected } = useEmbeddedWallet()
  
  // Check if this is a demo account
  const isDemoAccount = user?.email?.includes('demo') || user?.email?.includes('@demo.com')
  
  // Use demo mode for demo accounts
  const realContracts = useContracts(signer)
  const demoMarkets = useMarketsDemo(signer, 'arcTestnet', user?.email)
  
  const contractsHook = isDemoAccount ? demoMarkets : realContracts
  const { 
    contracts, 
    usdcBalance, 
    marketCount, 
    loading,
    loadUSDCBalance,
    loadMarketCount,
    getUSDCFromFaucet
  } = contractsHook

  const [hasAutoFaucet, setHasAutoFaucet] = useState(false)

  useEffect(() => {
    if (isDemoAccount) {
      // Demo mode - also load balance in demo mode
      if (demoMarkets.loadUSDCBalance) {
        demoMarkets.loadUSDCBalance(address)
      }
      return
    }
    
    if (isConnected && address) {
      loadUSDCBalance(address)
      loadMarketCount()
    }
  }, [isConnected, address, isDemoAccount, demoMarkets, loadUSDCBalance, loadMarketCount])

  // Auto-get USDC if balance is 0 (only once per session)
  useEffect(() => {
    if (isDemoAccount) {
      // Demo mode - balance is already set, skip faucet
      setHasAutoFaucet(true)
      return
    }
    
    const autoGetUSDC = async () => {
      if (isConnected && address && contracts.usdc && !hasAutoFaucet) {
        try {
          // Add initial delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const balance = await contracts.usdc.balanceOf(address)
          if (balance === 0n && contracts.usdc.faucet) {
            try {
              // Use the hook's getUSDCFromFaucet which has retry logic
              await getUSDCFromFaucet()
              setHasAutoFaucet(true)
            } catch (error) {
              // Silently fail - user can manually click the button
              console.log('Could not auto-get USDC (will retry on manual click):', error.message)
            }
          }
        } catch (error) {
          console.error('Error checking balance:', error)
        }
      }
    }
    autoGetUSDC()
  }, [isConnected, address, contracts.usdc, hasAutoFaucet, getUSDCFromFaucet, isDemoAccount])

  if (!isConnected) {
    return (
      <div className="dashboard">
        <div className="loading">Loading your wallet...</div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <Header />
      <div className="dashboard-page-header">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <h1>Dashboard</h1>
          <a href="/markets" className="create-btn" style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}>
            Browse Markets
          </a>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">Balance</div>
            <div className="stat-value">{usdcBalance} USDC</div>
            {usdcBalance === '0.0' && contracts.usdc?.faucet && (
              <button 
                onClick={async () => {
                  try {
                    await getUSDCFromFaucet()
                  } catch (error) {
                    alert(`Error: ${error.message}`)
                  }
                }}
                disabled={loading}
                className="faucet-btn"
              >
                {loading ? 'Getting...' : 'Get Test USDC'}
              </button>
            )}
          </div>
          <div className="stat-card">
            <div className="stat-label">Markets</div>
            <div className="stat-value">{marketCount}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
