import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES, PREDICTION_MARKET_ABI, MARKET_FACTORY_ABI, ERC20_ABI, ORACLE_ABI, MOCK_USDC_ABI } from '../config/contracts'
import { formatUSDC, parseUSDC } from '../utils/web3'

export const useContracts = (signer, network = 'arcTestnet') => {
  const [contracts, setContracts] = useState({
    usdc: null,
    predictionMarket: null,
    marketFactory: null,
    oracle: null
  })
  const [usdcBalance, setUsdcBalance] = useState('0')
  const [marketCount, setMarketCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (signer) {
      const addresses = CONTRACT_ADDRESSES[network]
      if (addresses) {
        setContracts({
          usdc: new ethers.Contract(addresses.USDC, MOCK_USDC_ABI, signer), // Use MockUSDC ABI to access faucet
          predictionMarket: new ethers.Contract(addresses.PredictionMarket, PREDICTION_MARKET_ABI, signer),
          marketFactory: new ethers.Contract(addresses.MarketFactory, MARKET_FACTORY_ABI, signer),
          oracle: new ethers.Contract(addresses.Oracle, ORACLE_ABI, signer)
        })
      }
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
        // Check if faucet function exists (MockUSDC)
        if (contracts.usdc.faucet) {
          // Add delay before transaction to avoid rate limits
          if (attempt > 0) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 10000) // Exponential backoff, max 10s
            await new Promise(resolve => setTimeout(resolve, delay))
          }
          
          const tx = await contracts.usdc.faucet()
          await tx.wait()
          // Reload balance
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
    if (!contracts.predictionMarket) return
    try {
      const count = await contracts.predictionMarket.getMarketCount()
      setMarketCount(Number(count))
    } catch (error) {
      console.error('Error loading market count:', error)
    }
  }

  const createMarket = async (question, outcomes, duration) => {
    if (!contracts.marketFactory) throw new Error('MarketFactory not initialized')
    setLoading(true)
    try {
      const tx = await contracts.marketFactory.createMarket(question, outcomes, duration)
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

  const takePosition = async (marketId, outcome, amount) => {
    if (!contracts.predictionMarket) throw new Error('PredictionMarket not initialized')
    setLoading(true)
    try {
      // First approve if needed
      const amountParsed = parseUSDC(amount)
      const userAddress = await signer.getAddress()
      const marketAddress = contracts.predictionMarket.target || contracts.predictionMarket.address
      const allowance = await contracts.usdc.allowance(userAddress, marketAddress)
      if (allowance < amountParsed) {
        const approveTx = await contracts.usdc.approve(marketAddress, ethers.MaxUint256)
        await approveTx.wait()
      }
      
      const tx = await contracts.predictionMarket.takePosition(marketId, outcome, amountParsed)
      await tx.wait()
      return tx.hash
    } catch (error) {
      console.error('Error taking position:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getMarket = async (marketId) => {
    if (!contracts.predictionMarket) return null
    try {
      const market = await contracts.predictionMarket.getMarket(marketId)
      return {
        id: marketId,
        creator: market[0],
        question: market[1],
        outcomes: market[2],
        endTime: Number(market[3]),
        resolutionTime: Number(market[4]),
        status: Number(market[5]),
        totalLiquidity: market[6].toString(), // Keep as raw string, format in display layer
        totalFees: market[7].toString() // Keep as raw string, format in display layer
      }
    } catch (error) {
      console.error('Error getting market:', error)
      return null
    }
  }

  const getUserPosition = async (marketId, userAddress, outcome) => {
    if (!contracts.predictionMarket) return null
    try {
      const position = await contracts.predictionMarket.getUserPosition(marketId, userAddress, outcome)
      return {
        shares: position[0].toString(),
        totalStake: position[1].toString() // Keep as raw string, format in display layer
      }
    } catch (error) {
      console.error('Error getting user position:', error)
      return null
    }
  }

  const claimPayout = async (marketId) => {
    if (!contracts.predictionMarket) throw new Error('PredictionMarket not initialized')
    setLoading(true)
    try {
      const tx = await contracts.predictionMarket.claimPayout(marketId)
      await tx.wait()
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
    takePosition,
    getMarket,
    getUserPosition,
    claimPayout,
    getUSDCFromFaucet
  }
}

