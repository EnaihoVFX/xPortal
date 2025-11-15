// API endpoint for market trades
// GET: Get trades for a market
// POST: Record a new trade

import {
  getMarketTrades,
  insertTrade,
  updateUserPosition
} from '../../db/index.js'

export default async function handler(req, res) {
  const { marketId } = req.query

  if (!marketId) {
    return res.status(400).json({ error: 'Market ID required' })
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'GET') {
      const { userAddress, limit } = req.query
      
      const options = {}
      if (userAddress) options.userAddress = userAddress
      if (limit) options.limit = parseInt(limit)

      const trades = await getMarketTrades(parseInt(marketId), options)
      return res.status(200).json({ trades })

    } else if (req.method === 'POST') {
      // Record a new trade
      const {
        userAddress,
        tradeType,
        outcome,
        amount,
        shares,
        price,
        transactionHash,
        blockNumber
      } = req.body

      if (!userAddress || !tradeType || outcome === undefined || !amount || !shares) {
        return res.status(400).json({ 
          error: 'Missing required fields: userAddress, tradeType, outcome, amount, shares' 
        })
      }

      // Insert trade
      const trade = await insertTrade({
        marketId: parseInt(marketId),
        userAddress,
        tradeType: tradeType.toUpperCase(),
        outcome: parseInt(outcome),
        amount,
        shares,
        price,
        transactionHash,
        blockNumber: blockNumber ? parseInt(blockNumber) : null
      })

      // Update user position
      if (tradeType.toUpperCase() === 'BUY') {
        // Get current position
        const { getUserPositions } = await import('../../db/index.js')
        const positions = await getUserPositions(parseInt(marketId), userAddress)
        const existingPosition = positions.find(p => p.outcome === parseInt(outcome))
        
        const currentShares = existingPosition ? existingPosition.shares : '0'
        const currentInvested = existingPosition ? existingPosition.total_invested : '0'
        
        const newShares = (BigInt(currentShares) + BigInt(shares)).toString()
        const newInvested = (BigInt(currentInvested) + BigInt(amount)).toString()

        await updateUserPosition({
          marketId: parseInt(marketId),
          userAddress,
          outcome: parseInt(outcome),
          shares: newShares,
          totalInvested: newInvested
        })
      } else if (tradeType.toUpperCase() === 'SELL') {
        // Get current position
        const { getUserPositions } = await import('../../db/index.js')
        const positions = await getUserPositions(parseInt(marketId), userAddress)
        const existingPosition = positions.find(p => p.outcome === parseInt(outcome))
        
        if (existingPosition) {
          const currentShares = existingPosition.shares
          const currentInvested = existingPosition.total_invested
          
          const newShares = BigInt(currentShares) >= BigInt(shares) 
            ? (BigInt(currentShares) - BigInt(shares)).toString()
            : '0'
          
          // Calculate proportional reduction in invested amount
          const sharesRatio = BigInt(shares) * BigInt(1000000) / BigInt(currentShares || 1)
          const investedReduction = (BigInt(currentInvested) * sharesRatio / BigInt(1000000)).toString()
          const newInvested = BigInt(currentInvested) >= BigInt(investedReduction)
            ? (BigInt(currentInvested) - BigInt(investedReduction)).toString()
            : '0'

          await updateUserPosition({
            marketId: parseInt(marketId),
            userAddress,
            outcome: parseInt(outcome),
            shares: newShares,
            totalInvested: newInvested
          })
        }
      }

      return res.status(200).json({ 
        success: true,
        trade 
      })
    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Error in trades API:', error)
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    })
  }
}

