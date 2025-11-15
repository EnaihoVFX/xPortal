// API endpoint for market events
// GET: Get market events
// POST: Add market event

import {
  getMarketEvents,
  insertMarketEvent
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
      const { eventType, limit } = req.query
      
      const options = {}
      if (eventType) options.eventType = eventType
      if (limit) options.limit = parseInt(limit)

      const events = await getMarketEvents(parseInt(marketId), options)
      return res.status(200).json({ events })

    } else if (req.method === 'POST') {
      // Add market event
      const {
        eventType,
        eventData,
        userAddress,
        transactionHash
      } = req.body

      if (!eventType) {
        return res.status(400).json({ 
          error: 'Missing required field: eventType' 
        })
      }

      const event = await insertMarketEvent({
        marketId: parseInt(marketId),
        eventType,
        eventData,
        userAddress,
        transactionHash
      })

      return res.status(200).json({ 
        success: true,
        event 
      })
    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Error in market events API:', error)
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    })
  }
}

