// Demo mode configuration
// When enabled, uses mock data instead of blockchain calls

export const DEMO_MODE = true // Set to false to use real blockchain

// Mock markets data for demo mode
export const DEMO_MARKETS = [
  {
    id: 1,
    question: "Will Bitcoin reach $100,000 by end of 2025?",
    description: "Bitcoin price prediction for 2025",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0, // Active
    category: 2, // Crypto
    totalLiquidity: "10000000000", // 10,000 USDC
    totalVolume: "5000000000", // 5,000 USDC
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
    category: 3, // Economics
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
    category: 1, // Sports
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
    category: 2, // Crypto
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
    category: 3, // Economics
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
    category: 4, // Technology
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
    category: 3, // Economics
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
    category: 5, // Entertainment
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
    category: 2, // Crypto
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
    category: 4, // Technology
    totalLiquidity: "10000000000",
    totalVolume: "5000000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [25, 75],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 11,
    question: "Will Google's stock price exceed $200 by end of 2025?",
    description: "Alphabet Inc. stock price prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 3, // Economics
    totalLiquidity: "8800000000",
    totalVolume: "4200000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [48, 52],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 12,
    question: "Will AI-generated content win an Oscar by 2026?",
    description: "AI in entertainment industry prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 730 * 24 * 60 * 60,
    status: 0,
    category: 5, // Entertainment
    totalLiquidity: "9200000000",
    totalVolume: "4800000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [20, 80],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 13,
    question: "Will the Fed cut interest rates 3+ times in 2025?",
    description: "Federal Reserve monetary policy prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 3, // Economics
    totalLiquidity: "10500000000",
    totalVolume: "5200000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [65, 35],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 14,
    question: "Will SpaceX successfully land humans on Mars by 2030?",
    description: "Space exploration milestone prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 1825 * 24 * 60 * 60,
    status: 0,
    category: 4, // Technology
    totalLiquidity: "7800000000",
    totalVolume: "3200000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [15, 85],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 15,
    question: "Will the Lakers win the 2025 NBA Championship?",
    description: "NBA Finals winner prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 120 * 24 * 60 * 60,
    status: 0,
    category: 1, // Sports
    totalLiquidity: "11500000000",
    totalVolume: "5800000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [22, 78],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 16,
    question: "Will Cardano (ADA) reach $2 by end of 2025?",
    description: "Cardano cryptocurrency price prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 2, // Crypto
    totalLiquidity: "8200000000",
    totalVolume: "3800000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [30, 70],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 17,
    question: "Will Amazon's revenue exceed $700 billion in 2025?",
    description: "Amazon financial performance prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 3, // Economics
    totalLiquidity: "9600000000",
    totalVolume: "4600000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [55, 45],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 18,
    question: "Will quantum computing achieve practical advantage by 2026?",
    description: "Quantum computing breakthrough prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 730 * 24 * 60 * 60,
    status: 0,
    category: 4, // Technology
    totalLiquidity: "7400000000",
    totalVolume: "2900000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [35, 65],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 19,
    question: "Will Taylor Swift's next album break first-week sales records?",
    description: "Music industry sales prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 180 * 24 * 60 * 60,
    status: 0,
    category: 5, // Entertainment
    totalLiquidity: "10800000000",
    totalVolume: "5400000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [75, 25],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 20,
    question: "Will the US unemployment rate stay below 4% in 2025?",
    description: "Labor market economic indicator prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 3, // Economics
    totalLiquidity: "8900000000",
    totalVolume: "4100000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [42, 58],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 21,
    question: "Will the next iPhone feature satellite internet connectivity?",
    description: "Apple technology feature prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 180 * 24 * 60 * 60,
    status: 0,
    category: 4, // Technology
    totalLiquidity: "10100000000",
    totalVolume: "5100000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [38, 62],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 22,
    question: "Will the US men's soccer team reach World Cup quarterfinals in 2026?",
    description: "FIFA World Cup performance prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 730 * 24 * 60 * 60,
    status: 0,
    category: 1, // Sports
    totalLiquidity: "8700000000",
    totalVolume: "4000000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [28, 72],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 23,
    question: "Will Polygon (MATIC) reach $3 by end of 2025?",
    description: "Polygon cryptocurrency price prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 2, // Crypto
    totalLiquidity: "7600000000",
    totalVolume: "3100000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [33, 67],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 24,
    question: "Will Netflix add 20+ million subscribers in 2025?",
    description: "Streaming service growth prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 5, // Entertainment
    totalLiquidity: "9300000000",
    totalVolume: "4700000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [52, 48],
    userShares: { 0: "0", 1: "0" }
  },
  {
    id: 25,
    question: "Will Nvidia's stock price exceed $200 by end of 2025?",
    description: "Nvidia stock price prediction",
    outcomes: ["Yes", "No"],
    endTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    status: 0,
    category: 3, // Economics
    totalLiquidity: "11200000000",
    totalVolume: "5600000000",
    creator: "0x0000000000000000000000000000000000000000",
    probabilities: [68, 32],
    userShares: { 0: "0", 1: "0" }
  }
]

// Demo user balance (in USDC with 6 decimals)
export const DEMO_USDC_BALANCE = "10000000000" // 10,000 USDC

