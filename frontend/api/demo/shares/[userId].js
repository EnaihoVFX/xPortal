// Vercel serverless function for demo user shares
// GET: Retrieve user shares
// POST: Update user shares

// Simple in-memory store (upgrade to database in production)
const userShares = new Map()

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
      // Get shares
      const shares = userShares.get(userId) || {}
      return res.status(200).json({ shares })
    } else if (req.method === 'POST') {
      // Update shares
      const { shares } = req.body
      if (shares) {
        userShares.set(userId, shares)
        return res.status(200).json({ 
          success: true,
          shares
        })
      }
      return res.status(400).json({ error: 'Shares required' })
    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Error in shares API:', error)
    return res.status(500).json({ error: error.message })
  }
}

