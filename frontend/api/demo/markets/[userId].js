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
  },
  {
    id: 11,
    question: "Will NVIDIA stock reach $200 by end of 2025?",
    description: "NVIDIA stock price prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 3,
    totalLiquidity: "13000000000",
    totalVolume: "6500000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [65, 35],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 12,
    question: "Will the Fed cut interest rates 3+ times in 2025?",
    description: "Federal Reserve interest rate prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 3,
    totalLiquidity: "10500000000",
    totalVolume: "5200000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [48, 52],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 13,
    question: "Will Google release Gemini 2.0 in 2025?",
    description: "Google AI model release prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 4,
    totalLiquidity: "8800000000",
    totalVolume: "4400000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [72, 28],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 14,
    question: "Will the Lakers win the 2025 NBA Championship?",
    description: "NBA championship prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 180 * 24 * 60 * 60,
    status: 0,
    category: 1,
    totalLiquidity: "9200000000",
    totalVolume: "4600000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [22, 78],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 15,
    question: "Will Cardano reach $2 by end of 2025?",
    description: "Cardano cryptocurrency price prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 2,
    totalLiquidity: "6800000000",
    totalVolume: "3400000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [38, 62],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 16,
    question: "Will Amazon stock reach $200 by end of 2025?",
    description: "Amazon stock price prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 3,
    totalLiquidity: "11500000000",
    totalVolume: "5750000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [58, 42],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 17,
    question: "Will Taylor Swift release a new album in 2025?",
    description: "Music release prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 5,
    totalLiquidity: "7800000000",
    totalVolume: "3900000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [80, 20],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 18,
    question: "Will Meta's stock price exceed $600 in 2025?",
    description: "Meta stock price prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 3,
    totalLiquidity: "10200000000",
    totalVolume: "5100000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [42, 58],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 19,
    question: "Will the US unemployment rate stay below 4% in 2025?",
    description: "Economic indicator prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 3,
    totalLiquidity: "8700000000",
    totalVolume: "4350000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [33, 67],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 20,
    question: "Will Microsoft release Windows 12 in 2025?",
    description: "Microsoft product release prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 4,
    totalLiquidity: "9600000000",
    totalVolume: "4800000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [55, 45],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 21,
    question: "Will the next James Bond movie release in 2025?",
    description: "Film release prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 5,
    totalLiquidity: "7400000000",
    totalVolume: "3700000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [28, 72],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 22,
    question: "Will Chainlink reach $50 by end of 2025?",
    description: "Chainlink cryptocurrency price prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 2,
    totalLiquidity: "8200000000",
    totalVolume: "4100000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [32, 68],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 23,
    question: "Will the next US election have record voter turnout?",
    description: "Political prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 0,
    totalLiquidity: "10800000000",
    totalVolume: "5400000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [62, 38],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 24,
    question: "Will SpaceX launch Starship to Mars in 2025?",
    description: "Space exploration prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 4,
    totalLiquidity: "8900000000",
    totalVolume: "4450000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [15, 85],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 25,
    question: "Will the average global temperature increase by 0.5°C in 2025?",
    description: "Climate change prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 6,
    totalLiquidity: "7100000000",
    totalVolume: "3550000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [18, 82],
    userShares: { 0: "0", 1: "0" }
  }
]

// Simple in-memory store (upgrade to database in production)
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

