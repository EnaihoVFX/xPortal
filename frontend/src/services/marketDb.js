// Service for interacting with market database API
// This service handles syncing market data with Vercel Postgres

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

/**
 * Market Database Service
 */
export class MarketDbService {
  /**
   * Sync market to database
   */
  static async syncMarket(marketData) {
    try {
      const response = await fetch(`${API_BASE}/markets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          marketId: marketData.id || marketData.marketId,
          creator: marketData.creator,
          question: marketData.question,
          description: marketData.description,
          outcomes: marketData.outcomes,
          endTime: marketData.endTime,
          resolutionTime: marketData.resolutionTime,
          status: marketData.status || 0,
          category: marketData.category || 7,
          totalLiquidity: marketData.totalLiquidity || '0',
          totalVolume: marketData.totalVolume || '0',
          totalFees: marketData.totalFees || '0',
          creationTime: marketData.creationTime || Math.floor(Date.now() / 1000)
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to sync market: ${response.statusText}`)
      }

      const result = await response.json()
      return result.market
    } catch (error) {
      console.error('Error syncing market to database:', error)
      // Don't throw - allow app to continue if DB sync fails
      return null
    }
  }

  /**
   * Get market from database
   */
  static async getMarket(marketId) {
    try {
      const response = await fetch(`${API_BASE}/markets?marketId=${marketId}`)
      if (!response.ok) {
        return null
      }
      const result = await response.json()
      return result.market
    } catch (error) {
      console.error('Error getting market from database:', error)
      return null
    }
  }

  /**
   * Get all markets from database
   */
  static async getMarkets(filters = {}) {
    try {
      const params = new URLSearchParams()
      if (filters.status !== undefined) params.append('status', filters.status)
      if (filters.category !== undefined) params.append('category', filters.category)
      if (filters.creator) params.append('creator', filters.creator)
      if (filters.limit) params.append('limit', filters.limit)

      const response = await fetch(`${API_BASE}/markets?${params.toString()}`)
      if (!response.ok) {
        return []
      }
      const result = await response.json()
      return result.markets || []
    } catch (error) {
      console.error('Error getting markets from database:', error)
      return []
    }
  }

  /**
   * Record a trade in the database
   */
  static async recordTrade(marketId, tradeData) {
    try {
      const response = await fetch(`${API_BASE}/markets/${marketId}/trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userAddress: tradeData.userAddress,
          tradeType: tradeData.tradeType, // 'BUY' or 'SELL'
          outcome: tradeData.outcome,
          amount: tradeData.amount,
          shares: tradeData.shares,
          price: tradeData.price,
          transactionHash: tradeData.transactionHash,
          blockNumber: tradeData.blockNumber
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to record trade: ${response.statusText}`)
      }

      const result = await response.json()
      return result.trade
    } catch (error) {
      console.error('Error recording trade to database:', error)
      // Don't throw - allow app to continue if DB sync fails
      return null
    }
  }

  /**
   * Get market history
   */
  static async getMarketHistory(marketId, options = {}) {
    try {
      const params = new URLSearchParams()
      if (options.startTime) params.append('startTime', options.startTime)
      if (options.endTime) params.append('endTime', options.endTime)
      if (options.limit) params.append('limit', options.limit)

      const response = await fetch(`${API_BASE}/markets/${marketId}/history?${params.toString()}`)
      if (!response.ok) {
        return []
      }
      const result = await response.json()
      return result.history || []
    } catch (error) {
      console.error('Error getting market history from database:', error)
      return []
    }
  }

  /**
   * Add market history entry
   */
  static async addMarketHistory(marketId, historyData) {
    try {
      const response = await fetch(`${API_BASE}/markets/${marketId}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: historyData.timestamp || Math.floor(Date.now() / 1000),
          yesPrice: historyData.yesPrice,
          noPrice: historyData.noPrice,
          probabilities: historyData.probabilities,
          totalVolume: historyData.totalVolume,
          totalLiquidity: historyData.totalLiquidity
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to add history: ${response.statusText}`)
      }

      const result = await response.json()
      return result.history
    } catch (error) {
      console.error('Error adding market history to database:', error)
      return null
    }
  }

  /**
   * Get market trades
   */
  static async getMarketTrades(marketId, options = {}) {
    try {
      const params = new URLSearchParams()
      if (options.userAddress) params.append('userAddress', options.userAddress)
      if (options.limit) params.append('limit', options.limit)

      const response = await fetch(`${API_BASE}/markets/${marketId}/trades?${params.toString()}`)
      if (!response.ok) {
        return []
      }
      const result = await response.json()
      return result.trades || []
    } catch (error) {
      console.error('Error getting trades from database:', error)
      return []
    }
  }

  /**
   * Add market event
   */
  static async addMarketEvent(marketId, eventData) {
    try {
      const response = await fetch(`${API_BASE}/markets/${marketId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventType: eventData.eventType, // 'CREATED', 'TRADE', 'RESOLVED', 'CANCELLED'
          eventData: eventData.eventData,
          userAddress: eventData.userAddress,
          transactionHash: eventData.transactionHash
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to add event: ${response.statusText}`)
      }

      const result = await response.json()
      return result.event
    } catch (error) {
      console.error('Error adding market event to database:', error)
      return null
    }
  }

  /**
   * Get market events
   */
  static async getMarketEvents(marketId, options = {}) {
    try {
      const params = new URLSearchParams()
      if (options.eventType) params.append('eventType', options.eventType)
      if (options.limit) params.append('limit', options.limit)

      const response = await fetch(`${API_BASE}/markets/${marketId}/events?${params.toString()}`)
      if (!response.ok) {
        return []
      }
      const result = await response.json()
      return result.events || []
    } catch (error) {
      console.error('Error getting events from database:', error)
      return []
    }
  }

  /**
   * Get user positions
   */
  static async getUserPositions(userAddress, marketId = null) {
    try {
      const params = new URLSearchParams()
      if (marketId) params.append('marketId', marketId)

      const response = await fetch(`${API_BASE}/users/${userAddress}/positions?${params.toString()}`)
      if (!response.ok) {
        return []
      }
      const result = await response.json()
      return result.positions || []
    } catch (error) {
      console.error('Error getting user positions from database:', error)
      return []
    }
  }
}

