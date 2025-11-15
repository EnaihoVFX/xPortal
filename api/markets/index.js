// API endpoint for markets
// GET: Get all markets with optional filters
// POST: Create or update a market

import {
  getMarkets,
  getMarket,
  insertMarket
} from '../db/index.js'

export default async function handler(req, res) {
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
      const { marketId, status, category, creator, limit } = req.query

      if (marketId) {
        // Get single market
        const market = await getMarket(parseInt(marketId))
        if (!market) {
          return res.status(404).json({ error: 'Market not found' })
        }
        return res.status(200).json({ market })
      }

      // Get all markets with filters
      const filters = {}
      if (status !== undefined) filters.status = parseInt(status)
      if (category !== undefined) filters.category = parseInt(category)
      if (creator) filters.creator = creator
      if (limit) filters.limit = parseInt(limit)

      const markets = await getMarkets(filters)
      return res.status(200).json({ markets })

    } else if (req.method === 'POST') {
      // Create or update market
      const {
        marketId,
        creator,
        question,
        description,
        outcomes,
        endTime,
        resolutionTime,
        status,
        category,
        totalLiquidity,
        totalVolume,
        totalFees,
        creationTime
      } = req.body

      if (!marketId || !creator || !question || !outcomes) {
        return res.status(400).json({ 
          error: 'Missing required fields: marketId, creator, question, outcomes' 
        })
      }

      const market = await insertMarket({
        marketId: parseInt(marketId),
        creator,
        question,
        description,
        outcomes: Array.isArray(outcomes) ? outcomes : [outcomes],
        endTime: endTime ? parseInt(endTime) : null,
        resolutionTime: resolutionTime ? parseInt(resolutionTime) : null,
        status: status !== undefined ? parseInt(status) : 0,
        category: category !== undefined ? parseInt(category) : 7,
        totalLiquidity: totalLiquidity || '0',
        totalVolume: totalVolume || '0',
        totalFees: totalFees || '0',
        creationTime: creationTime ? parseInt(creationTime) : Math.floor(Date.now() / 1000)
      })

      return res.status(200).json({ 
        success: true,
        market 
      })
    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Error in markets API:', error)
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    })
  }
}

