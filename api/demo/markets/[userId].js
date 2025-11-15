// Vercel serverless function for demo markets
// GET: Retrieve user's markets
// POST: Update markets
// Now uses Vercel Postgres database when available, falls back to in-memory

import {
  getMarkets,
  insertMarket
} from '../../db/index.js'

// Demo markets data (inline for serverless function)
const DEMO_MARKETS = [
  {
    id: 1,
    question: "Will Bitcoin reach $100,000 by end of 2025?",
    description: "Bitcoin price prediction for 2025",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 2,
    totalLiquidity: "10000000000",
    totalVolume: "5000000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [45, 55],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 2,
    question: "Will the US have a recession in 2025?",
    description: "Economic recession prediction for 2025",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 3,
    totalLiquidity: "8000000000",
    totalVolume: "3000000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [30, 70],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 3,
    question: "Who will win the 2025 Super Bowl?",
    description: "NFL Super Bowl LIX winner",
    outcomes: ["Kansas City Chiefs", "San Francisco 49ers", "Buffalo Bills", "Other"],
    endTime: Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60,
    status: 0,
    category: 1,
    totalLiquidity: "12000000000",
    totalVolume: "6000000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [35, 25, 20, 20],
    userShares: { 0: "0", 1: "0", 2: "0", 3: "0" }
  },
  {
    id: 4,
    question: "Will Ethereum reach $5,000 by end of 2025?",
    description: "Ethereum price prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 2,
    totalLiquidity: "9000000000",
    totalVolume: "4000000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [40, 60],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 5,
    question: "Will Tesla stock reach $300 by end of 2025?",
    description: "Tesla stock price prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 3,
    totalLiquidity: "7000000000",
    totalVolume: "2500000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [50, 50],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 6,
    question: "Will OpenAI release GPT-6 in 2025?",
    description: "AI model release prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 4,
    totalLiquidity: "11000000000",
    totalVolume: "5500000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [60, 40],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 7,
    question: "Will the S&P 500 close above 6,000 in 2025?",
    description: "Stock market index prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 3,
    totalLiquidity: "9500000000",
    totalVolume: "4500000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [55, 45],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 8,
    question: "Will the next Marvel movie gross over $1 billion worldwide?",
    description: "Box office performance prediction for Marvel films",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 180 * 24 * 60 * 60,
    status: 0,
    category: 5,
    totalLiquidity: "8500000000",
    totalVolume: "3500000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [70, 30],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 9,
    question: "Will Solana's market cap exceed $200 billion in 2025?",
    description: "Cryptocurrency market capitalization prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 2,
    totalLiquidity: "7500000000",
    totalVolume: "3000000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [35, 65],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 10,
    question: "Will Apple release a foldable iPhone by 2026?",
    description: "Apple product release prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 4,
    totalLiquidity: "10000000000",
    totalVolume: "5000000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [25, 75],
    userShares: { 0: "0", 1: "0" }
  }
]

// In-memory store (fallback if database not available)
const markets = new Map()

// Helper to check if database is available
const useDatabase = () => {
  try {
    // Check if POSTGRES_URL is set (Vercel automatically provides this)
    return !!process.env.POSTGRES_URL
  } catch {
    return false
  }
}

// Convert demo market format to database format
const marketToDbFormat = (market, userId) => ({
  marketId: market.id,
  creator: market.creator || `demo_${userId}`,
  question: market.question,
  description: market.description || market.question,
  outcomes: Array.isArray(market.outcomes) ? market.outcomes : ['Yes', 'No'],
  endTime: market.endTime || Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
  resolutionTime: null,
  status: market.status || 0,
  category: market.category || 7,
  totalLiquidity: market.totalLiquidity || '0',
  totalVolume: market.totalVolume || '0',
  totalFees: '0',
  creationTime: Math.floor(Date.now() / 1000)
})

// Convert database format to demo market format
const dbToMarketFormat = (dbMarket, userShares = {}) => ({
  id: dbMarket.market_id,
  question: dbMarket.question,
  description: dbMarket.description,
  outcomes: dbMarket.outcomes || ['Yes', 'No'],
  endTime: Number(dbMarket.end_time),
  status: Number(dbMarket.status),
  category: Number(dbMarket.category),
  totalLiquidity: dbMarket.total_liquidity || '0',
  totalVolume: dbMarket.total_volume || '0',
  creator: dbMarket.creator,
  probabilities: dbMarket.probabilities || dbMarket.outcomes.map(() => 50),
  userShares: userShares
})

export default async function handler(req, res) {
  const { userId } = req.query

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' })
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
      // Try to use database first
      if (useDatabase()) {
        try {
          // Get markets for this demo user (creator = demo_userId)
          const dbMarkets = await getMarkets({ creator: `demo_${userId}` })
          
          if (dbMarkets && dbMarkets.length > 0) {
            // Convert to demo format
            const userMarkets = dbMarkets.map(m => {
              const outcomes = m.outcomes || ['Yes', 'No']
              const userShares = outcomes.reduce((acc, _, i) => ({ ...acc, [i]: "0" }), {})
              return dbToMarketFormat(m, userShares)
            })
            return res.status(200).json({ markets: userMarkets })
          }
        } catch (dbError) {
          console.warn('Database query failed, falling back to in-memory:', dbError.message)
        }
      }
      
      // Fallback to in-memory storage
      let userMarkets = markets.get(userId)
      
      if (!userMarkets) {
        // Initialize with default markets
        userMarkets = DEMO_MARKETS.map(m => ({
          ...m,
          userShares: m.outcomes.reduce((acc, _, i) => ({ ...acc, [i]: "0" }), {})
        }))
        markets.set(userId, userMarkets)
      }
      
      return res.status(200).json({ markets: userMarkets })
      
    } else if (req.method === 'POST') {
      // Update markets
      const { markets: updatedMarkets } = req.body
      if (!updatedMarkets) {
        return res.status(400).json({ error: 'Markets required' })
      }

      // Try to save to database first
      if (useDatabase()) {
        try {
          // Save each market to database
          for (const market of updatedMarkets) {
            await insertMarket(marketToDbFormat(market, userId))
          }
          return res.status(200).json({ 
            success: true,
            markets: updatedMarkets,
            saved: 'database'
          })
        } catch (dbError) {
          console.warn('Database save failed, falling back to in-memory:', dbError.message)
        }
      }
      
      // Fallback to in-memory storage
      markets.set(userId, updatedMarkets)
      return res.status(200).json({ 
        success: true,
        markets: updatedMarkets,
        saved: 'memory'
      })
    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Error in markets API:', error)
    return res.status(500).json({ error: error.message })
  }
}
