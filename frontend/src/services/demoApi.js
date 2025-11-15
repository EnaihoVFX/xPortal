// API service for demo mode - uses Vercel serverless functions
// Falls back to localStorage if API is unavailable

const API_BASE = import.meta.env.VITE_API_URL || '/api/demo'

// Get user ID from email (for demo accounts)
// Uses a more robust method to ensure uniqueness and avoid collisions
const getUserId = (email) => {
  if (!email) return 'anonymous'
  // Normalize email: lowercase, then create a safe identifier
  const normalized = email.toLowerCase().trim()
  // Replace all non-alphanumeric with underscore, but preserve structure
  // This ensures user@example.com and user@example_com are different
  const userId = normalized.replace(/[^a-zA-Z0-9@._-]/g, '_')
  // Add a hash-like suffix to prevent collisions from similar emails
  // Simple hash of the original email for uniqueness
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  // Use first 6 chars of hash (as hex) to ensure uniqueness
  const hashSuffix = Math.abs(hash).toString(16).substring(0, 6)
  return `${userId}_${hashSuffix}`
}

export const demoApi = {
  // Balance operations
  async getBalance(userId) {
    try {
      const response = await fetch(`${API_BASE}/balance/${userId}`)
      if (response.ok) {
        const data = await response.json()
        return data.balance
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage fallback:', error)
    }
    
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(`demo_balance_${userId}`)
      return stored || null
    } catch {
      return null
    }
  },

  async updateBalance(userId, balance) {
    try {
      const response = await fetch(`${API_BASE}/balance/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance })
      })
      if (response.ok) {
        const data = await response.json()
        return data.balance
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage fallback:', error)
    }
    
    // Fallback to localStorage
    try {
      localStorage.setItem(`demo_balance_${userId}`, balance)
      return balance
    } catch {
      return balance
    }
  },

  // Markets operations
  async getMarkets(userId) {
    try {
      const response = await fetch(`${API_BASE}/markets/${userId}`)
      if (response.ok) {
        const data = await response.json()
        return data.markets
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage fallback:', error)
    }
    
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(`demo_markets_${userId}`)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  },

  async updateMarkets(userId, markets) {
    try {
      const response = await fetch(`${API_BASE}/markets/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markets })
      })
      if (response.ok) {
        const data = await response.json()
        return data.markets
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage fallback:', error)
    }
    
    // Fallback to localStorage
    try {
      localStorage.setItem(`demo_markets_${userId}`, JSON.stringify(markets))
      return markets
    } catch {
      return markets
    }
  },

  // Shares operations
  async getShares(userId) {
    try {
      const response = await fetch(`${API_BASE}/shares/${userId}`)
      if (response.ok) {
        const data = await response.json()
        return data.shares
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage fallback:', error)
    }
    
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(`demo_shares_${userId}`)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  },

  async updateShares(userId, shares) {
    try {
      const response = await fetch(`${API_BASE}/shares/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shares })
      })
      if (response.ok) {
        const data = await response.json()
        return data.shares
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage fallback:', error)
    }
    
    // Fallback to localStorage
    try {
      localStorage.setItem(`demo_shares_${userId}`, JSON.stringify(shares))
      return shares
    } catch {
      return shares
    }
  }
}

// Helper to get user ID from email
export const getDemoUserId = (email) => {
  return getUserId(email)
}


