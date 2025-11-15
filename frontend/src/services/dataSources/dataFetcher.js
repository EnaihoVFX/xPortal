/**
 * Fetches quantitative data and statistics
 * For demo purposes, uses mock data
 */

// Mock quantitative data
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
  // In a real implementation, this would:
  // - Fetch historical price data
  // - Calculate technical indicators
  // - Get volume statistics
  // - Fetch related market data

  // Simulate API delay
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

