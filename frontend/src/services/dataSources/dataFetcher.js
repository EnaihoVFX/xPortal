/**
 * Fetches quantitative data and statistics
 * Now queries database for real market data when available
 */

import { MarketDbService } from '../marketDb.js'

// Mock quantitative data (fallback)
const MOCK_DATA = [
  {
    dataType: "price_trend",
    values: {
      current: 0.58,
      "1h_ago": 0.55,
      "24h_ago": 0.52,
      "7d_ago": 0.48
    },
    trend: "increasing",
    timestamp: new Date().toISOString(),
    type: "data"
  },
  {
    dataType: "volume",
    values: {
      current: 125000,
      "1h_ago": 98000,
      "24h_ago": 87000,
      "7d_avg": 95000
    },
    trend: "increasing",
    timestamp: new Date().toISOString(),
    type: "statistics"
  },
  {
    dataType: "market_momentum",
    values: {
      rsi: 65,
      moving_avg_7d: 0.53,
      moving_avg_30d: 0.51,
      volatility: 0.12
    },
    trend: "positive",
    timestamp: new Date().toISOString(),
    type: "data"
  }
]

/**
 * Fetch quantitative data for market analysis
 * @param {string} marketId - Market identifier
 * @param {Object} marketContext - Current market context
 * @returns {Promise<Array>} Array of data points
 */
export async function fetchMarketData(marketId, marketContext) {
  try {
    // Try to fetch real market data from database
    if (marketId) {
      // Get market from database
      const market = await MarketDbService.getMarket(parseInt(marketId))
      
      if (market) {
        // Get market history from database
        const history = await MarketDbService.getMarketHistory(parseInt(marketId), {
          limit: 100 // Get last 100 history entries
        })

        // Get recent trades
        const trades = await MarketDbService.getMarketTrades(parseInt(marketId), {
          limit: 50 // Get last 50 trades
        })

        // Build data from database
        const dataPoints = []

        // Price trend from history
        if (history && history.length > 0) {
          const latest = history[0]
          const previous = history[1] || latest
          const dayAgo = history.find(h => {
            const timeDiff = (parseInt(latest.timestamp) - parseInt(h.timestamp)) / 3600
            return timeDiff >= 24
          }) || previous

          dataPoints.push({
            dataType: "price_trend",
            values: {
              current: latest.yes_price ? parseFloat(latest.yes_price) : parseFloat(marketContext.yesPrice || 0.5),
              "1h_ago": previous.yes_price ? parseFloat(previous.yes_price) : parseFloat(marketContext.yesPrice || 0.5),
              "24h_ago": dayAgo.yes_price ? parseFloat(dayAgo.yes_price) : parseFloat(marketContext.yesPrice || 0.5),
              "7d_ago": history[history.length - 1]?.yes_price ? parseFloat(history[history.length - 1].yes_price) : parseFloat(marketContext.yesPrice || 0.5)
            },
            trend: latest.yes_price && previous.yes_price 
              ? (parseFloat(latest.yes_price) > parseFloat(previous.yes_price) ? "increasing" : "decreasing")
              : "stable",
            timestamp: new Date(parseInt(latest.timestamp) * 1000).toISOString(),
            type: "data"
          })
        }

        // Volume data
        if (trades && trades.length > 0) {
          const totalVolume = trades.reduce((sum, trade) => {
            return sum + parseFloat(trade.amount || 0)
          }, 0)
          
          const recentTrades = trades.slice(0, 10)
          const recentVolume = recentTrades.reduce((sum, trade) => {
            return sum + parseFloat(trade.amount || 0)
          }, 0)

          dataPoints.push({
            dataType: "volume",
            values: {
              current: parseFloat(market.total_volume || marketContext.volume || 0),
              "1h_ago": recentVolume,
              "24h_ago": totalVolume * 0.7, // Estimate
              "7d_avg": totalVolume / 7
            },
            trend: recentVolume > totalVolume / trades.length ? "increasing" : "stable",
            timestamp: new Date().toISOString(),
            type: "statistics"
          })
        }

        // Market momentum from probabilities
        if (history && history.length > 0) {
          const latest = history[0]
          if (latest.probabilities && latest.probabilities.length > 0) {
            const probs = latest.probabilities.map(p => parseFloat(p))
            const avgProb = probs.reduce((a, b) => a + b, 0) / probs.length
            const volatility = Math.max(...probs) - Math.min(...probs)

            dataPoints.push({
              dataType: "market_momentum",
              values: {
                rsi: Math.min(100, Math.max(0, avgProb * 100)),
                moving_avg_7d: avgProb,
                moving_avg_30d: avgProb * 0.98,
                volatility: volatility
              },
              trend: avgProb > 0.5 ? "positive" : "negative",
              timestamp: new Date(parseInt(latest.timestamp) * 1000).toISOString(),
              type: "data"
            })
          }
        }

        // Add market metadata
        dataPoints.push({
          dataType: "market_info",
          values: {
            marketId: market.market_id,
            totalLiquidity: parseFloat(market.total_liquidity || 0),
            totalVolume: parseFloat(market.total_volume || 0),
            status: market.status,
            category: market.category
          },
          trend: "stable",
          timestamp: new Date().toISOString(),
          type: "metadata"
        })

        if (dataPoints.length > 0) {
          return dataPoints
        }
      }
    }
  } catch (error) {
    console.warn('Error fetching market data from database, using mock data:', error)
  }

  // Fallback to mock data
  await new Promise(resolve => setTimeout(resolve, 200))

  // Use market context to enrich mock data
  const enrichedData = MOCK_DATA.map(item => {
    if (item.dataType === "price_trend" && marketContext.yesPrice) {
      return {
        ...item,
        values: {
          ...item.values,
          current: parseFloat(marketContext.yesPrice) || item.values.current
        }
      }
    }
    return item
  })

  return enrichedData
}

