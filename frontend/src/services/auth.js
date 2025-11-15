// Simple authentication service with embedded wallet support
// In production, this would connect to a backend API

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// In-memory storage (in production, use secure httpOnly cookies or localStorage with encryption)
const getStorage = () => {
  try {
    return localStorage
  } catch {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} }
  }
}

export const authService = {
  // Register new user with email/password
  async register(email, password) {
    try {
      // In production, this would call your backend API
      // For now, we'll create a local user account
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        const data = await response.json()
        this.setSession(data.token, data.user, data.wallet)
        return { success: true, data }
      } else {
        // Fallback: create local account if API is not available
        return await this.createLocalAccount(email, password)
      }
    } catch (error) {
      // Fallback: create local account
      return await this.createLocalAccount(email, password)
    }
  },

  // Login with email/password
  async login(email, password) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        const data = await response.json()
        this.setSession(data.token, data.user, data.wallet)
        return { success: true, data }
      } else {
        // Fallback: check local storage
        return await this.checkLocalAccount(email, password)
      }
    } catch (error) {
      // Fallback: check local storage
      return await this.checkLocalAccount(email, password)
    }
  },

  // Create local account (fallback when backend is not available)
  async createLocalAccount(email, password) {
    const storage = getStorage()
    const users = JSON.parse(storage.getItem('users') || '{}')
    
    // Allow quick sign ups with same pattern (for demo purposes)
    // In production, enforce unique emails
    if (users[email] && !email.includes('quick.com') && !email.includes('demo.com')) {
      return { success: false, error: 'Email already in use' }
    }

    // Generate embedded wallet (using ethers to create a new wallet)
    const { ethers } = await import('ethers')
    const wallet = ethers.Wallet.createRandom()
    
    const user = {
      id: Date.now().toString(),
      email,
      walletAddress: wallet.address,
      walletPrivateKey: wallet.privateKey, // In production, encrypt this!
      createdAt: new Date().toISOString()
    }

    users[email] = {
      email,
      passwordHash: btoa(password), // Simple encoding - use proper hashing in production!
      user
    }

    storage.setItem('users', JSON.stringify(users))
    
    // Create session
    const token = btoa(JSON.stringify({ email, timestamp: Date.now() }))
    this.setSession(token, user, wallet)

    return { success: true, data: { token, user, wallet } }
  },

  // Check local account
  async checkLocalAccount(email, password) {
    const storage = getStorage()
    const users = JSON.parse(storage.getItem('users') || '{}')
    const userData = users[email]

    if (!userData || userData.passwordHash !== btoa(password)) {
      return { success: false, error: 'Invalid credentials' }
    }

    // Reconstruct wallet from stored private key
    const { ethers } = await import('ethers')
    const wallet = new ethers.Wallet(userData.user.walletPrivateKey)

    const token = btoa(JSON.stringify({ email, timestamp: Date.now() }))
    this.setSession(token, userData.user, wallet)

    return { success: true, data: { token, user: userData.user, wallet } }
  },

  // Set session
  setSession(token, user, wallet) {
    const storage = getStorage()
    storage.setItem('auth_token', token)
    storage.setItem('user', JSON.stringify(user))
    if (wallet) {
      storage.setItem('wallet_private_key', wallet.privateKey) // Encrypt in production!
    }
  },

  // Get current session
  async getSession() {
    const storage = getStorage()
    const token = storage.getItem('auth_token')
    const userStr = storage.getItem('user')
    const privateKey = storage.getItem('wallet_private_key')

    if (!token || !userStr) {
      return null
    }

    try {
      const user = JSON.parse(userStr)
      let wallet = null

      if (privateKey) {
        const { ethers } = await import('ethers')
        wallet = new ethers.Wallet(privateKey)
      }

      return { token, user, wallet }
    } catch {
      return null
    }
  },

  // Logout
  logout() {
    const storage = getStorage()
    storage.removeItem('auth_token')
    storage.removeItem('user')
    storage.removeItem('wallet_private_key')
  },

  // Check if user is authenticated
  async isAuthenticated() {
    const session = await this.getSession()
    return session !== null
  },

  // Get embedded wallet
  async getEmbeddedWallet() {
    const session = await this.getSession()
    if (!session || !session.wallet) {
      return null
    }
    return session.wallet
  }
}

