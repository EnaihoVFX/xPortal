import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES, MARKETPLACE_ABI, ERC20_ABI, MOCK_USDC_ABI } from '../config/contracts'
import { formatUSDC, parseUSDC } from '../utils/web3'

export const useMarkets = (signer, network = 'arcTestnet') => {
  const [contracts, setContracts] = useState({
    usdc: null,
    marketplace: null
  })
  const [usdcBalance, setUsdcBalance] = useState('0')
  const [marketCount, setMarketCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (signer) {
      const addresses = CONTRACT_ADDRESSES[network]
      console.log('useMarkets: Initializing contracts with addresses:', addresses)
      if (addresses && addresses.MarketPlace) {
        const usdcContract = new ethers.Contract(addresses.USDC, MOCK_USDC_ABI, signer)
        const marketplaceContract = new ethers.Contract(addresses.MarketPlace, MARKETPLACE_ABI, signer)
        console.log('useMarkets: Contracts created', {
          usdc: addresses.USDC,
          marketplace: addresses.MarketPlace
        })
        setContracts({
          usdc: usdcContract,
          marketplace: marketplaceContract
        })
      } else {
        console.error('useMarkets: MarketPlace address not found in config')
      }
    } else {
      console.log('useMarkets: No signer available')
    }
  }, [signer, network])

  const loadUSDCBalance = async (address) => {
    if (!contracts.usdc || !address) return
    try {
      const balance = await contracts.usdc.balanceOf(address)
      setUsdcBalance(formatUSDC(balance))
    } catch (error) {
      console.error('Error loading USDC balance:', error)
    }
  }

  const getUSDCFromFaucet = async (retries = 3) => {
    if (!contracts.usdc) throw new Error('USDC contract not initialized')
    setLoading(true)
    
    const attemptFaucet = async (attempt = 0) => {
      try {
        if (contracts.usdc.faucet) {
          // Add delay before transaction to avoid rate limits
          if (attempt > 0) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 10000) // Exponential backoff, max 10s
            await new Promise(resolve => setTimeout(resolve, delay))
          }
          
          const tx = await contracts.usdc.faucet()
          await tx.wait()
          const userAddress = await signer.getAddress()
          await loadUSDCBalance(userAddress)
          return tx.hash
        } else {
          throw new Error('Faucet not available')
        }
      } catch (error) {
        // Check if it's a rate limit error
        const isRateLimit = error?.message?.includes('rate limit') || 
                           error?.message?.includes('request limit') ||
                           error?.code === -32007
        
        if (isRateLimit && attempt < retries) {
          console.log(`Rate limit hit, retrying in ${Math.min(1000 * Math.pow(2, attempt + 1), 10000)}ms...`)
          return attemptFaucet(attempt + 1)
        }
        
        throw error
      }
    }
    
    try {
      return await attemptFaucet()
    } catch (error) {
      console.error('Error getting USDC from faucet:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loadMarketCount = async () => {
    if (!contracts.marketplace) {
      console.log('MarketPlace contract not initialized')
      return
    }
    try {
      console.log('Fetching market count from contract...')
      const count = await contracts.marketplace.getMarketCount()
      const countNum = Number(count)
      console.log('Market count from contract:', countNum)
      setMarketCount(countNum)
      return countNum
    } catch (error) {
      console.error('Error loading market count:', error)
      return 0
    }
  }

  const createMarket = async (question, description, outcomes, duration, category) => {
    if (!contracts.marketplace) throw new Error('MarketPlace not initialized')
    setLoading(true)
    try {
      const tx = await contracts.marketplace.createMarket(question, description, outcomes, duration, category)
      await tx.wait()
      await loadMarketCount()
      return tx.hash
    } catch (error) {
      console.error('Error creating market:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const buyShares = async (marketId, outcome, amount) => {
    if (!contracts.marketplace) throw new Error('MarketPlace not initialized')
    setLoading(true)
    try {
      const amountParsed = parseUSDC(amount)
      const userAddress = await signer.getAddress()
      const marketAddress = contracts.marketplace.target || contracts.marketplace.address
      const allowance = await contracts.usdc.allowance(userAddress, marketAddress)
      if (allowance < amountParsed) {
        const approveTx = await contracts.usdc.approve(marketAddress, ethers.MaxUint256)
        await approveTx.wait()
      }
      
      const tx = await contracts.marketplace.buyShares(marketId, outcome, amountParsed)
      await tx.wait()
      await loadUSDCBalance(userAddress)
      return tx.hash
    } catch (error) {
      console.error('Error buying shares:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const sellShares = async (marketId, outcome, shares) => {
    if (!contracts.marketplace) throw new Error('MarketPlace not initialized')
    setLoading(true)
    try {
      const tx = await contracts.marketplace.sellShares(marketId, outcome, shares)
      await tx.wait()
      const userAddress = await signer.getAddress()
      await loadUSDCBalance(userAddress)
      return tx.hash
    } catch (error) {
      console.error('Error selling shares:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getMarket = async (marketId) => {
    if (!contracts.marketplace) {
      console.log(`MarketPlace contract not initialized, cannot get market ${marketId}`)
      return null
    }
    try {
      const market = await contracts.marketplace.getMarket(marketId)
      if (!market || market.length === 0) {
        console.log(`Market ${marketId} returned empty data`)
        return null
      }
      const marketData = {
        id: marketId,
        creator: market[0],
        question: market[1],
        description: market[2],
        outcomes: market[3],
        endTime: Number(market[4]),
        status: Number(market[5]),
        category: Number(market[6]),
        totalLiquidity: market[7].toString(),
        totalVolume: market[8].toString()
      }
      console.log(`Market ${marketId} loaded:`, marketData.question)
      return marketData
    } catch (error) {
      console.error(`Error getting market ${marketId}:`, error)
      return null
    }
  }

  const getOutcomeProbability = async (marketId, outcome) => {
    if (!contracts.marketplace) return 0
    try {
      const prob = await contracts.marketplace.getOutcomeProbability(marketId, outcome)
      return Number(prob) / 100 // Convert from basis points to percentage
    } catch (error) {
      console.error('Error getting probability:', error)
      return 0
    }
  }

  const getAllProbabilities = async (marketId) => {
    if (!contracts.marketplace) return []
    try {
      const probs = await contracts.marketplace.getAllProbabilities(marketId)
      return probs.map(p => Number(p) / 100)
    } catch (error) {
      console.error('Error getting probabilities:', error)
      return []
    }
  }

  const getUserShares = async (marketId, userAddress, outcome) => {
    if (!contracts.marketplace) return '0'
    try {
      const shares = await contracts.marketplace.getUserShares(marketId, userAddress, outcome)
      return shares.toString()
    } catch (error) {
      console.error('Error getting user shares:', error)
      return '0'
    }
  }

  const getUserPortfolio = async (userAddress) => {
    if (!contracts.marketplace) return []
    try {
      const portfolio = await contracts.marketplace.getUserPortfolio(userAddress)
      return {
        marketIds: portfolio[0].map(id => Number(id)),
        outcomes: portfolio[1].map(o => Number(o)),
        shares: portfolio[2].map(s => s.toString())
      }
    } catch (error) {
      console.error('Error getting portfolio:', error)
      return { marketIds: [], outcomes: [], shares: [] }
    }
  }

  const getMarketsByCategory = async (category) => {
    if (!contracts.marketplace) return []
    try {
      const marketIds = await contracts.marketplace.getMarketsByCategory(category)
      return marketIds.map(id => Number(id))
    } catch (error) {
      console.error('Error getting markets by category:', error)
      return []
    }
  }

  const claimPayout = async (marketId) => {
    if (!contracts.marketplace) throw new Error('MarketPlace not initialized')
    setLoading(true)
    try {
      const tx = await contracts.marketplace.claimPayout(marketId)
      await tx.wait()
      const userAddress = await signer.getAddress()
      await loadUSDCBalance(userAddress)
      return tx.hash
    } catch (error) {
      console.error('Error claiming payout:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    contracts,
    usdcBalance,
    marketCount,
    loading,
    loadUSDCBalance,
    loadMarketCount,
    createMarket,
    buyShares,
    sellShares,
    getMarket,
    getOutcomeProbability,
    getAllProbabilities,
    getUserShares,
    getUserPortfolio,
    getMarketsByCategory,
    claimPayout,
    getUSDCFromFaucet
  }
}

