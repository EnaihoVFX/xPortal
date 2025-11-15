// API endpoint for individual market operations
// GET: Get market details
// PUT: Update market

import {
  getMarket,
  insertMarket
} from '../../db/index.js'

export default async function handler(req, res) {
  const { marketId } = req.query

  if (!marketId) {
    return res.status(400).json({ error: 'Market ID required' })
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'GET') {
      const market = await getMarket(parseInt(marketId))
      if (!market) {
        return res.status(404).json({ error: 'Market not found' })
      }
      return res.status(200).json({ market })

    } else if (req.method === 'PUT') {
      // Update market
      const marketData = req.body
      marketData.marketId = parseInt(marketId)

      const market = await insertMarket(marketData)
      return res.status(200).json({ 
        success: true,
        market 
      })
    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Error in market API:', error)
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    })
  }
}

