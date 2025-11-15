// Database utility for Vercel Postgres
// Uses @vercel/postgres for database connections

import { sql } from '@vercel/postgres'

/**
 * Get database connection
 * This uses Vercel Postgres which automatically handles connection pooling
 */
export async function getDb() {
  return sql
}

/**
 * Execute a SQL query
 */
export async function query(text, params) {
  try {
    const result = await sql.query(text, params)
    return result
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

/**
 * Insert a new market
 */
export async function insertMarket(marketData) {
  const {
    marketId,
    creator,
    question,
    description,
    outcomes,
    endTime,
    resolutionTime,
    status,
    category,
    totalLiquidity,
    totalVolume,
    totalFees,
    creationTime
  } = marketData

  const result = await sql.query(
    `INSERT INTO markets (
      market_id, creator, question, description, outcomes, end_time,
      resolution_time, status, category, total_liquidity, total_volume,
      total_fees, creation_time
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (market_id) 
    DO UPDATE SET
      question = EXCLUDED.question,
      description = EXCLUDED.description,
      outcomes = EXCLUDED.outcomes,
      end_time = EXCLUDED.end_time,
      status = EXCLUDED.status,
      total_liquidity = EXCLUDED.total_liquidity,
      total_volume = EXCLUDED.total_volume,
      total_fees = EXCLUDED.total_fees,
      updated_at = NOW()
    RETURNING *`,
    [
      marketId, creator, question, description, outcomes, endTime,
      resolutionTime || null, status || 0, category || 7,
      totalLiquidity || '0', totalVolume || '0', totalFees || '0',
      creationTime || Math.floor(Date.now() / 1000)
    ]
  )
  return result.rows[0]
}

/**
 * Get market by ID
 */
export async function getMarket(marketId) {
  const result = await sql.query(
    'SELECT * FROM markets WHERE market_id = $1',
    [marketId]
  )
  return result.rows[0] || null
}

/**
 * Get all markets with optional filters
 */
export async function getMarkets(filters = {}) {
  let query = 'SELECT * FROM markets WHERE 1=1'
  const params = []
  let paramIndex = 1

  if (filters.status !== undefined) {
    query += ` AND status = $${paramIndex}`
    params.push(filters.status)
    paramIndex++
  }

  if (filters.category !== undefined && filters.category !== -1) {
    query += ` AND category = $${paramIndex}`
    params.push(filters.category)
    paramIndex++
  }

  if (filters.creator) {
    query += ` AND creator = $${paramIndex}`
    params.push(filters.creator)
    paramIndex++
  }

  query += ' ORDER BY creation_time DESC'

  if (filters.limit) {
    query += ` LIMIT $${paramIndex}`
    params.push(filters.limit)
  }

  const result = await sql.query(query, params)
  return result.rows
}

/**
 * Insert market history entry
 */
export async function insertMarketHistory(historyData) {
  const {
    marketId,
    timestamp,
    yesPrice,
    noPrice,
    probabilities,
    totalVolume,
    totalLiquidity
  } = historyData

  const result = await sql.query(
    `INSERT INTO market_history (
      market_id, timestamp, yes_price, no_price, probabilities,
      total_volume, total_liquidity
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      marketId,
      timestamp || Math.floor(Date.now() / 1000),
      yesPrice || null,
      noPrice || null,
      probabilities || null,
      totalVolume || null,
      totalLiquidity || null
    ]
  )
  return result.rows[0]
}

/**
 * Get market history
 */
export async function getMarketHistory(marketId, options = {}) {
  let query = 'SELECT * FROM market_history WHERE market_id = $1'
  const params = [marketId]
  let paramIndex = 2

  if (options.startTime) {
    query += ` AND timestamp >= $${paramIndex}`
    params.push(options.startTime)
    paramIndex++
  }

  if (options.endTime) {
    query += ` AND timestamp <= $${paramIndex}`
    params.push(options.endTime)
    paramIndex++
  }

  query += ' ORDER BY timestamp DESC'

  if (options.limit) {
    query += ` LIMIT $${paramIndex}`
    params.push(options.limit)
  }

  const result = await sql.query(query, params)
  return result.rows
}

/**
 * Insert a trade
 */
export async function insertTrade(tradeData) {
  const {
    marketId,
    userAddress,
    tradeType,
    outcome,
    amount,
    shares,
    price,
    transactionHash,
    blockNumber
  } = tradeData

  const result = await sql.query(
    `INSERT INTO trades (
      market_id, user_address, trade_type, outcome, amount, shares,
      price, transaction_hash, block_number
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      marketId, userAddress, tradeType, outcome, amount, shares,
      price || null, transactionHash || null, blockNumber || null
    ]
  )
  return result.rows[0]
}

/**
 * Get trades for a market
 */
export async function getMarketTrades(marketId, options = {}) {
  let query = 'SELECT * FROM trades WHERE market_id = $1'
  const params = [marketId]
  let paramIndex = 2

  if (options.userAddress) {
    query += ` AND user_address = $${paramIndex}`
    params.push(options.userAddress)
    paramIndex++
  }

  query += ' ORDER BY created_at DESC'

  if (options.limit) {
    query += ` LIMIT $${paramIndex}`
    params.push(options.limit)
  }

  const result = await sql.query(query, params)
  return result.rows
}

/**
 * Update user position
 */
export async function updateUserPosition(positionData) {
  const {
    marketId,
    userAddress,
    outcome,
    shares,
    totalInvested
  } = positionData

  const result = await sql.query(
    `INSERT INTO user_positions (
      market_id, user_address, outcome, shares, total_invested
    ) VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (market_id, user_address, outcome)
    DO UPDATE SET
      shares = EXCLUDED.shares,
      total_invested = EXCLUDED.total_invested,
      last_updated = NOW()
    RETURNING *`,
    [marketId, userAddress, outcome, shares || '0', totalInvested || '0']
  )
  return result.rows[0]
}

/**
 * Get user positions for a market
 */
export async function getUserPositions(marketId, userAddress) {
  const result = await sql.query(
    `SELECT * FROM user_positions 
     WHERE market_id = $1 AND user_address = $2`,
    [marketId, userAddress]
  )
  return result.rows
}

/**
 * Insert market event
 */
export async function insertMarketEvent(eventData) {
  const {
    marketId,
    eventType,
    eventData: data,
    userAddress,
    transactionHash
  } = eventData

  const result = await sql.query(
    `INSERT INTO market_events (
      market_id, event_type, event_data, user_address, transaction_hash
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [marketId, eventType, JSON.stringify(data || {}), userAddress || null, transactionHash || null]
  )
  return result.rows[0]
}

/**
 * Get market events
 */
export async function getMarketEvents(marketId, options = {}) {
  let query = 'SELECT * FROM market_events WHERE market_id = $1'
  const params = [marketId]
  let paramIndex = 2

  if (options.eventType) {
    query += ` AND event_type = $${paramIndex}`
    params.push(options.eventType)
    paramIndex++
  }

  query += ' ORDER BY created_at DESC'

  if (options.limit) {
    query += ` LIMIT $${paramIndex}`
    params.push(options.limit)
  }

  const result = await sql.query(query, params)
  return result.rows.map(row => ({
    ...row,
    event_data: typeof row.event_data === 'string' ? JSON.parse(row.event_data) : row.event_data
  }))
}

