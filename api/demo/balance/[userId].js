// Vercel serverless function for demo balance
// GET: Retrieve user balance
// POST: Update user balance

const DEMO_USDC_BALANCE = "10000000000" // 10,000 USDC with 6 decimals

const formatUSDC = (balance) => {
  const num = BigInt(balance)
  const divisor = BigInt(1000000)
  const whole = num / divisor
  const fraction = num % divisor
  if (fraction === 0n) {
    return whole.toString()
  }
  const fractionStr = fraction.toString().padStart(6, '0')
  const trimmed = fractionStr.replace(/0+$/, '')
  return trimmed ? `${whole}.${trimmed}` : whole.toString()
}

// In-memory store (upgrade to Vercel KV, Supabase, or MongoDB for production)
// For production: use @vercel/kv, @supabase/supabase-js, or mongodb
const balances = new Map()

export default async function handler(req, res) {
  const { userId } = req.query

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' })
  }

  // CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'GET') {
      // Get balance
      const balance = balances.get(userId) || DEMO_USDC_BALANCE
      return res.status(200).json({ 
        balance: formatUSDC(balance),
        rawBalance: balance
      })
    } else if (req.method === 'POST') {
      // Update balance
      const { balance } = req.body
      if (balance !== undefined) {
        balances.set(userId, balance)
        return res.status(200).json({ 
          success: true,
          balance: formatUSDC(balance),
          rawBalance: balance
        })
      }
      return res.status(400).json({ error: 'Balance required' })
    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Error in balance API:', error)
    return res.status(500).json({ error: error.message })
  }
}
