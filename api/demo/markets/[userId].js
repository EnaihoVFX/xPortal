// Vercel serverless function for demo markets
// GET: Retrieve user's markets
// POST: Update markets

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

// In-memory store (upgrade to database in production)
const markets = new Map()

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
      // Get markets
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
      if (updatedMarkets) {
        markets.set(userId, updatedMarkets)
        return res.status(200).json({ 
          success: true,
          markets: updatedMarkets
        })
      }
      return res.status(400).json({ error: 'Markets required' })
    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Error in markets API:', error)
    return res.status(500).json({ error: error.message })
  }
}
