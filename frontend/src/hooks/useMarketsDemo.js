import { useState, useEffect, useCallback } from 'react'
import { DEMO_MARKETS, DEMO_USDC_BALANCE } from '../config/demo'
import { formatUSDC, parseUSDC } from '../utils/web3'
import { demoApi, getDemoUserId } from '../services/demoApi'

// LocalStorage keys for persistence
const STORAGE_KEY_BALANCE = 'demo_usdc_balance'
const STORAGE_KEY_SHARES = 'demo_user_shares'
const STORAGE_KEY_MARKETS = 'demo_markets'
const STORAGE_KEY_MARKET_COUNT = 'demo_market_count'

// Demo mode hook that uses API/database instead of blockchain
export const useMarketsDemo = (signer, network = 'arcTestnet', userEmail = null) => {
  const userId = userEmail ? getDemoUserId(userEmail) : 'anonymous'
  // Load from localStorage or use defaults
  const getStoredBalance = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BALANCE)
      return stored || formatUSDC(DEMO_USDC_BALANCE)
    } catch {
      return formatUSDC(DEMO_USDC_BALANCE)
    }
  }

  const getStoredShares = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SHARES)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  const getStoredMarkets = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MARKETS)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Ensure userShares exist for all markets
        return parsed.map(m => ({
          ...m,
          userShares: m.userShares || m.outcomes.reduce((acc, _, i) => ({ ...acc, [i]: "0" }), {})
        }))
      }
    } catch {}
    // Return default markets with shares initialized
    return DEMO_MARKETS.map(m => ({
      ...m,
      userShares: m.outcomes.reduce((acc, _, i) => ({ ...acc, [i]: "0" }), {})
    }))
  }

  const getStoredMarketCount = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MARKET_COUNT)
      return stored ? parseInt(stored, 10) : DEMO_MARKETS.length
    } catch {
      return DEMO_MARKETS.length
    }
  }

  const [markets, setMarkets] = useState([])
  const [usdcBalance, setUsdcBalance] = useState('0')
  const [marketCount, setMarketCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [userShares, setUserShares] = useState({}) // { marketId: { outcome: shares } }
  const [initialized, setInitialized] = useState(false)

  // Initialize from API/database
  useEffect(() => {
    const initialize = async () => {
      if (initialized) return
      
      setLoading(true)
      try {
        // Load from API (with localStorage fallback)
        const [balance, marketsData, sharesData] = await Promise.all([
          demoApi.getBalance(userId),
          demoApi.getMarkets(userId),
          demoApi.getShares(userId)
        ])

        if (balance) {
          // Check if balance is already formatted (has decimal point) or raw (very large number)
          const balanceStr = balance.toString()
          if (balanceStr.includes('.') || balanceStr.length < 20) {
            // Already formatted
            setUsdcBalance(balanceStr)
          } else {
            // Raw format, format it
            setUsdcBalance(formatUSDC(balanceStr))
          }
        } else {
          // DEMO_USDC_BALANCE is already in raw format, format it for display
          setUsdcBalance(formatUSDC(DEMO_USDC_BALANCE))
          // Save initial balance in raw format (already in correct format)
          await demoApi.updateBalance(userId, DEMO_USDC_BALANCE)
        }

        if (marketsData && marketsData.length > 0) {
          setMarkets(marketsData)
          setMarketCount(marketsData.length)
        } else {
          // Initialize with default markets
          const defaultMarkets = DEMO_MARKETS.map(m => ({
            ...m,
            userShares: m.outcomes.reduce((acc, _, i) => ({ ...acc, [i]: "0" }), {})
          }))
          setMarkets(defaultMarkets)
          setMarketCount(defaultMarkets.length)
          await demoApi.updateMarkets(userId, defaultMarkets)
        }

        if (sharesData && Object.keys(sharesData).length > 0) {
          setUserShares(sharesData)
        } else {
          await demoApi.updateShares(userId, {})
        }

        setInitialized(true)
        console.log('🎮 Demo mode initialized with API/database')
      } catch (error) {
        console.error('Error initializing demo mode:', error)
        // Fallback to localStorage
        setUsdcBalance(getStoredBalance())
        setMarkets(getStoredMarkets())
        setMarketCount(getStoredMarketCount())
        setUserShares(getStoredShares())
        setInitialized(true)
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [userId, initialized])

  // Save to API/database whenever state changes
  useEffect(() => {
    if (!initialized) return
    
    const saveBalance = async () => {
      try {
        // Check if usdcBalance is already in raw format (very large number without decimal)
        const balanceStr = usdcBalance.toString()
        let rawBalance
        
        if (balanceStr.includes('.') || balanceStr.length < 20) {
          // Formatted balance, parse it
          rawBalance = parseUSDC(usdcBalance).toString()
        } else {
          // Already in raw format
          rawBalance = balanceStr
        }
        
        await demoApi.updateBalance(userId, rawBalance)
      } catch (e) {
        console.warn('Failed to save balance:', e)
        // If parsing fails, try to save as-is if it's a valid large number
        try {
          const balanceStr = usdcBalance.toString()
          if (balanceStr.length > 10 && !balanceStr.includes('.')) {
            await demoApi.updateBalance(userId, balanceStr)
          }
        } catch (e2) {
          // Ignore second error
        }
      }
    }
    saveBalance()
  }, [usdcBalance, userId, initialized])

  useEffect(() => {
    if (!initialized) return
    
    const saveShares = async () => {
      try {
        await demoApi.updateShares(userId, userShares)
      } catch (e) {
        console.warn('Failed to save shares:', e)
      }
    }
    saveShares()
  }, [userShares, userId, initialized])

  useEffect(() => {
    if (!initialized) return
    
    const saveMarkets = async () => {
      try {
        await demoApi.updateMarkets(userId, markets)
        setMarketCount(markets.length)
      } catch (e) {
        console.warn('Failed to save markets:', e)
      }
    }
    saveMarkets()
  }, [markets, userId, initialized])

  const loadUSDCBalance = useCallback(async (address) => {
    // In demo mode, load from API/database
    if (!initialized) return
    
    try {
      const balance = await demoApi.getBalance(userId)
      if (balance) {
        setUsdcBalance(balance)
      } else {
        const defaultBalance = formatUSDC(DEMO_USDC_BALANCE)
        setUsdcBalance(defaultBalance)
        await demoApi.updateBalance(userId, DEMO_USDC_BALANCE)
      }
    } catch (error) {
      console.warn('Failed to load balance from API, using default:', error)
      setUsdcBalance(formatUSDC(DEMO_USDC_BALANCE))
    }
  }, [userId, initialized])

  const getUSDCFromFaucet = useCallback(async () => {
    setLoading(true)
    // Simulate faucet delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    setUsdcBalance(formatUSDC(DEMO_USDC_BALANCE))
    setLoading(false)
    return '0x' + '0'.repeat(64) // Mock tx hash
  }, [])

  const loadMarketCount = useCallback(async () => {
    return DEMO_MARKETS.length
  }, [])

  const getMarket = useCallback(async (marketId) => {
    const market = DEMO_MARKETS.find(m => m.id === marketId)
    if (!market) return null
    
    // Get user shares for this market
    const shares = {}
    for (let i = 0; i < market.outcomes.length; i++) {
      shares[i] = userShares[marketId]?.[i] || '0'
    }
    
    return {
      ...market,
      userShares: shares
    }
  }, [userShares])

  const getAllProbabilities = useCallback(async (marketId) => {
    const market = DEMO_MARKETS.find(m => m.id === marketId)
    return market?.probabilities || []
  }, [])

  const getOutcomeProbability = useCallback(async (marketId, outcome) => {
    const market = DEMO_MARKETS.find(m => m.id === marketId)
    return market?.probabilities?.[outcome] || 50
  }, [])

  const getUserShares = useCallback(async (marketId, userAddress, outcome) => {
    return userShares[marketId]?.[outcome] || '0'
  }, [userShares])

  const getMarketsByCategory = useCallback(async (category) => {
    if (category === -1) {
      // All markets
      return DEMO_MARKETS.map(m => m.id)
    }
    return DEMO_MARKETS.filter(m => m.category === category).map(m => m.id)
  }, [])

  const buyShares = useCallback(async (marketId, outcome, amount) => {
    setLoading(true)
    try {
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const amountParsed = parseUSDC(amount)
      const currentBalance = parseUSDC(usdcBalance)
      const newBalance = currentBalance - amountParsed
      
      if (newBalance < 0) {
        throw new Error('Insufficient balance')
      }
      
      // Update balance
      setUsdcBalance(formatUSDC(newBalance.toString()))
      
      // Calculate shares based on probability (simplified AMM model)
      const market = markets.find(m => m.id === marketId)
      if (!market) throw new Error('Market not found')
      
      const probability = market.probabilities?.[outcome] || 50
      // Shares = amount / price, where price = probability / 100
      // Simplified: 1 USDC = ~1 share at 50% probability, scales with probability
      const priceMultiplier = probability / 50 // Higher probability = more expensive
      const sharesToAdd = Math.floor(Number(amountParsed) / (1000000 * priceMultiplier))
      
      // Update user shares
      setUserShares(prev => ({
        ...prev,
        [marketId]: {
          ...(prev[marketId] || {}),
          [outcome]: ((Number(prev[marketId]?.[outcome] || '0')) + sharesToAdd).toString()
        }
      }))
      
      // Update market probabilities (simplified AMM - buying increases probability)
      setMarkets(prev => prev.map(m => {
        if (m.id === marketId) {
          const newProbs = [...(m.probabilities || [])]
          const probIncrease = Math.min(5, (Number(amountParsed) / 1000000) / 100) // Max 5% increase
          newProbs[outcome] = Math.min(95, newProbs[outcome] + probIncrease)
          
          // Adjust other outcomes proportionally
          const totalOther = newProbs.reduce((sum, p, i) => i !== outcome ? sum + p : sum, 0)
          if (totalOther > 0) {
            newProbs.forEach((_, i) => {
              if (i !== outcome) {
                const adjustment = (newProbs[i] / totalOther) * probIncrease
                newProbs[i] = Math.max(5, newProbs[i] - adjustment)
              }
            })
          }
          
          // Update user shares in market object
          const updatedUserShares = { ...(m.userShares || {}) }
          updatedUserShares[outcome] = ((Number(updatedUserShares[outcome] || '0')) + sharesToAdd).toString()
          
          return { 
            ...m, 
            probabilities: newProbs,
            userShares: updatedUserShares,
            totalVolume: (Number(m.totalVolume || '0') + Number(amountParsed)).toString()
          }
        }
        return m
      }))
      
      return '0x' + '0'.repeat(64) // Mock tx hash
    } catch (error) {
      console.error('Error buying shares:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [usdcBalance, markets])

  const sellShares = useCallback(async (marketId, outcome, shares) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const sharesNum = Number(shares)
      const currentShares = Number(userShares[marketId]?.[outcome] || '0')
      
      if (sharesNum > currentShares) {
        throw new Error('Insufficient shares')
      }
      
      // Calculate proceeds based on current probability (simplified AMM)
      const market = markets.find(m => m.id === marketId)
      if (!market) throw new Error('Market not found')
      
      const probability = market.probabilities?.[outcome] || 50
      const priceMultiplier = probability / 50
      const proceeds = Math.floor(sharesNum * 1000000 * priceMultiplier)
      
      const currentBalance = parseUSDC(usdcBalance)
      const newBalance = currentBalance + BigInt(proceeds)
      
      setUsdcBalance(formatUSDC(newBalance.toString()))
      
      // Update shares
      setUserShares(prev => ({
        ...prev,
        [marketId]: {
          ...(prev[marketId] || {}),
          [outcome]: (currentShares - sharesNum).toString()
        }
      }))
      
      // Update probabilities (selling decreases probability)
      setMarkets(prev => prev.map(m => {
        if (m.id === marketId) {
          const newProbs = [...(m.probabilities || [])]
          const probDecrease = Math.min(5, (proceeds / 1000000) / 100) // Max 5% decrease
          newProbs[outcome] = Math.max(5, newProbs[outcome] - probDecrease)
          
          // Adjust other outcomes proportionally
          const totalOther = newProbs.reduce((sum, p, i) => i !== outcome ? sum + p : sum, 0)
          if (totalOther > 0) {
            newProbs.forEach((_, i) => {
              if (i !== outcome) {
                const adjustment = (newProbs[i] / totalOther) * probDecrease
                newProbs[i] = Math.min(95, newProbs[i] + adjustment)
              }
            })
          }
          
          // Update user shares in market object
          const updatedUserShares = { ...(m.userShares || {}) }
          updatedUserShares[outcome] = (currentShares - sharesNum).toString()
          
          return { 
            ...m, 
            probabilities: newProbs,
            userShares: updatedUserShares,
            totalVolume: (Number(m.totalVolume || '0') + proceeds).toString()
          }
        }
        return m
      }))
      
      return '0x' + '0'.repeat(64)
    } catch (error) {
      console.error('Error selling shares:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [usdcBalance, userShares, markets])

  const createMarket = useCallback(async (question, description, outcomes, duration, category) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const newMarket = {
        id: marketCount + 1,
        question,
        description: description || question, // Use question as description if not provided
        outcomes: Array.isArray(outcomes) ? outcomes : ['Yes', 'No'], // Ensure it's an array
        endTime: Math.floor(Date.now() / 1000) + (duration || 7 * 24 * 60 * 60),
        status: 0,
        category: category !== undefined ? category : 7, // Default to "Other"
        totalLiquidity: "0",
        totalVolume: "0",
        creator: "0x0000000000000000000000000000000000000000",
        probabilities: (Array.isArray(outcomes) ? outcomes : ['Yes', 'No']).map(() => Math.floor(100 / (Array.isArray(outcomes) ? outcomes.length : 2))),
        userShares: (Array.isArray(outcomes) ? outcomes : ['Yes', 'No']).reduce((acc, _, i) => ({ ...acc, [i]: "0" }), {})
      }
      
      setMarkets(prev => [...prev, newMarket])
      setMarketCount(prev => prev + 1)
      
      return '0x' + '0'.repeat(64)
    } catch (error) {
      console.error('Error creating market:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [marketCount])

  const getUserPortfolio = useCallback(async (userAddress) => {
    const marketIds = []
    const outcomes = []
    const shares = []
    
    Object.entries(userShares).forEach(([marketId, outcomeShares]) => {
      Object.entries(outcomeShares).forEach(([outcome, shareAmount]) => {
        if (Number(shareAmount) > 0) {
          marketIds.push(Number(marketId))
          outcomes.push(Number(outcome))
          shares.push(shareAmount)
        }
      })
    })
    
    return { marketIds, outcomes, shares }
  }, [userShares])

  const claimPayout = useCallback(async (marketId) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      // In demo mode, just simulate claiming
      return '0x' + '0'.repeat(64)
    } catch (error) {
      console.error('Error claiming payout:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // takePosition - same as buyShares but matches useContracts interface
  const takePosition = useCallback(async (marketId, outcome, amount) => {
    return buyShares(marketId, outcome, amount)
  }, [buyShares])

  // getUserPosition - get user's position in a market
  const getUserPosition = useCallback(async (marketId, userAddress, outcome) => {
    const shares = userShares[marketId]?.[outcome] || '0'
    const sharesNum = Number(shares)
    // Calculate total stake (simplified: 1 share = 1 USDC)
    const totalStake = formatUSDC((sharesNum * 1000000).toString())
    
    return {
      shares: shares,
      totalStake: totalStake
    }
  }, [userShares])

  // createMarket with different signature for Dashboard compatibility
  const createMarketForDashboard = useCallback(async (question, outcomes, duration) => {
    // Dashboard passes (question, outcomes, duration) without description/category
    return createMarket(question, question, outcomes, duration, 7) // Default to "Other" category
  }, [createMarket])

  return {
    markets, // Expose markets for direct access in demo mode
    contracts: {
      usdc: { faucet: true, balanceOf: () => Promise.resolve(parseUSDC(usdcBalance)) }, // Mock contract
      marketplace: true, // Mock contract
      predictionMarket: true, // Mock contract for Dashboard compatibility
      marketFactory: true // Mock contract
    },
    usdcBalance,
    marketCount,
    loading,
    loadUSDCBalance,
    loadMarketCount,
    createMarket: createMarketForDashboard, // Use Dashboard-compatible version
    takePosition,
    buyShares,
    sellShares,
    getMarket,
    getOutcomeProbability,
    getAllProbabilities,
    getUserShares,
    getUserPosition,
    getUserPortfolio,
    getMarketsByCategory,
    claimPayout,
    getUSDCFromFaucet
  }
}

