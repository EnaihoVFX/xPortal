// API endpoint for market history
// GET: Get market price/volume history
// POST: Add history entry

import {
  getMarketHistory,
  insertMarketHistory
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
      const { startTime, endTime, limit } = req.query
      
      const options = {}
      if (startTime) options.startTime = parseInt(startTime)
      if (endTime) options.endTime = parseInt(endTime)
      if (limit) options.limit = parseInt(limit)

      const history = await getMarketHistory(parseInt(marketId), options)
      return res.status(200).json({ history })

    } else if (req.method === 'POST') {
      // Add history entry
      const {
        timestamp,
        yesPrice,
        noPrice,
        probabilities,
        totalVolume,
        totalLiquidity
      } = req.body

      const historyEntry = await insertMarketHistory({
        marketId: parseInt(marketId),
        timestamp,
        yesPrice,
        noPrice,
        probabilities: Array.isArray(probabilities) ? probabilities : null,
        totalVolume,
        totalLiquidity
      })

      return res.status(200).json({ 
        success: true,
        history: historyEntry 
      })
    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Error in market history API:', error)
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    })
  }
}

