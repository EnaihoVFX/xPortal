// API endpoint for user positions
// GET: Get user positions across all markets or for a specific market

import {
  getUserPositions
} from '../../db/index.js'

export default async function handler(req, res) {
  const { userAddress, marketId } = req.query

  if (!userAddress) {
    return res.status(400).json({ error: 'User address required' })
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'GET') {
      if (marketId) {
        // Get positions for specific market
        const positions = await getUserPositions(parseInt(marketId), userAddress)
        return res.status(200).json({ positions })
      } else {
        // Get all positions for user (would need a new function)
        // For now, return empty array
        return res.status(200).json({ positions: [] })
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Error in user positions API:', error)
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    })
  }
}

