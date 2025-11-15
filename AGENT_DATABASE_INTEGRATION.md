# Agent Trading System - Database Integration

## Overview

The agentic trading system is now fully integrated with the Vercel Postgres database. Agents can:
- ✅ Access real market data from the database
- ✅ Load markets from the database
- ✅ Query market history and trades
- ✅ Record analysis results in the database
- ✅ Track agent decisions and events

## Features

### 1. **Market Data Access**

Agents now fetch real market data from the database instead of using only mock data:

**Before:**
- Used hardcoded mock data
- No connection to actual markets

**After:**
- Queries database for market information
- Fetches market history (price trends, volume)
- Gets recent trades for volume analysis
- Falls back to mock data if database unavailable

### 2. **Market Loading**

The Agentic Trading page can now:
- Load markets from the database
- Select markets from a dropdown
- Auto-populate market context from database
- Load market by ID

### 3. **Database Recording**

When agents analyze a market, the system:
- Syncs market data to database
- Records market history snapshot (prices, probabilities)
- Logs agent analysis events
- Tracks all agent decisions

## How It Works

### Market Data Fetching

```javascript
// In dataFetcher.js
export async function fetchMarketData(marketId, marketContext) {
  // 1. Try to get market from database
  const market = await MarketDbService.getMarket(marketId)
  
  // 2. Get market history
  const history = await MarketDbService.getMarketHistory(marketId)
  
  // 3. Get recent trades
  const trades = await MarketDbService.getMarketTrades(marketId)
  
  // 4. Build data points from real data
  // - Price trends from history
  // - Volume from trades
  // - Market momentum from probabilities
  
  // 5. Fallback to mock data if database unavailable
}
```

### Agent Analysis Flow

1. **User selects/enters market ID**
2. **System loads market from database** (if available)
3. **Agents gather information:**
   - News (from news fetcher)
   - Sentiment (from sentiment fetcher)
   - Market data (from database via dataFetcher)
4. **Agents analyze and make decisions**
5. **Results recorded to database:**
   - Market sync
   - History snapshot
   - Analysis event

### Database Tables Used

| Table | Purpose |
|-------|---------|
| `markets` | Store market information |
| `market_history` | Price/volume history snapshots |
| `trades` | Trade records (if agents execute trades) |
| `market_events` | Agent analysis events |

## Usage

### Loading Markets

1. **From Dropdown:**
   - Go to Agentic Trading page
   - Select market from "Load Market from Database" dropdown
   - Market context auto-populates

2. **By Market ID:**
   - Enter market ID in "Market ID" field
   - Click "Load from DB" button
   - Market data loads from database

### Agent Analysis

1. **Set up market context:**
   - Load market from database OR
   - Enter market details manually

2. **Configure agents:**
   - Set OpenRouter API key
   - Select models for each agent

3. **Run analysis:**
   - Click "Start Analysis"
   - Agents query database for market data
   - Analysis results recorded to database

## Database Schema for Agents

### Market Events

Agent analyses are recorded as events:

```sql
INSERT INTO market_events (
  market_id,
  event_type,  -- 'AGENT_ANALYSIS'
  event_data,  -- JSON with agent decisions
  user_address,
  transaction_hash
)
```

Event data includes:
- Final decision (action, confidence, reasoning)
- Individual agent decisions
- Agent names and roles

### Market History

Each analysis creates a history snapshot:

```sql
INSERT INTO market_history (
  market_id,
  timestamp,
  yes_price,
  no_price,
  probabilities,
  total_volume,
  total_liquidity
)
```

## API Endpoints Used

Agents use these database endpoints:

- `GET /api/markets?marketId=X` - Get market
- `GET /api/markets` - List markets
- `GET /api/markets/[marketId]/history` - Get history
- `GET /api/markets/[marketId]/trades` - Get trades
- `POST /api/markets` - Sync market
- `POST /api/markets/[marketId]/history` - Add history
- `POST /api/markets/[marketId]/events` - Record event

## Future Enhancements

### Automatic Trade Execution

If agents decide to trade, we could add:

```javascript
// In agentCoordinator.js
async executeTrade(marketId, decision, userAddress) {
  // Execute trade on blockchain
  const tx = await contracts.marketplace.buyShares(...)
  
  // Record trade in database
  await MarketDbService.recordTrade(marketId, {
    userAddress,
    tradeType: decision.action.includes('BUY') ? 'BUY' : 'SELL',
    outcome: decision.outcome,
    amount: decision.amount,
    shares: decision.shares,
    transactionHash: tx.hash
  })
}
```

### Agent Performance Tracking

Track agent performance over time:

```sql
CREATE TABLE agent_performance (
  agent_name TEXT,
  market_id INTEGER,
  decision_correct BOOLEAN,
  confidence REAL,
  timestamp BIGINT
)
```

### Market Recommendations

Use agent analysis to recommend markets:

```javascript
// Get markets with recent agent activity
const activeMarkets = await MarketDbService.getMarkets({
  // Filter by markets with recent agent events
})
```

## Testing

### Test Database Integration

1. **Create a market** (via Markets page or API)
2. **Go to Agentic Trading page**
3. **Load market from database** (dropdown or by ID)
4. **Run agent analysis**
5. **Check database:**
   ```sql
   -- Check market was synced
   SELECT * FROM markets WHERE market_id = X;
   
   -- Check history was recorded
   SELECT * FROM market_history WHERE market_id = X;
   
   -- Check event was logged
   SELECT * FROM market_events WHERE market_id = X AND event_type = 'AGENT_ANALYSIS';
   ```

### Verify Data Flow

1. **Market exists in database** ✅
2. **Agent loads market** ✅
3. **Agent queries history/trades** ✅
4. **Agent makes decision** ✅
5. **Results saved to database** ✅

## Error Handling

The system gracefully handles database errors:

- **Database unavailable:** Falls back to mock data
- **Market not found:** Uses manual market context
- **Query fails:** Logs warning, continues with available data
- **Save fails:** Logs warning, doesn't break analysis

## Summary

✅ **Agents can access markets from database**  
✅ **Real market data used for analysis**  
✅ **Analysis results recorded to database**  
✅ **Market history tracked**  
✅ **Events logged for audit trail**  
✅ **Graceful fallback if database unavailable**

The agentic trading system is now fully integrated with the database and can work with real market data!

