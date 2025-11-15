# Vercel Postgres Database Setup

This guide explains how to set up and use the Vercel Postgres database for storing markets, trades, and history.

## Prerequisites

1. A Vercel account
2. A project deployed on Vercel (or connected to Vercel)

## Step 1: Create Vercel Postgres Database

1. Go to your Vercel Dashboard
2. Navigate to your project
3. Go to the **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Choose a name for your database (e.g., `prediction-market-db`)
7. Select a region closest to your users
8. Click **Create**

## Step 2: Run Database Schema

1. In the Vercel Dashboard, go to your Postgres database
2. Click on the **Query** tab
3. Copy the contents of `api/db/schema.sql`
4. Paste and execute the SQL to create all tables

Alternatively, you can use the Vercel CLI:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link your project
vercel link

# Run the schema
vercel db execute api/db/schema.sql
```

## Step 3: Environment Variables

Vercel automatically provides environment variables for your Postgres database:
- `POSTGRES_URL` - Connection string
- `POSTGRES_PRISMA_URL` - Prisma connection string
- `POSTGRES_URL_NON_POOLING` - Non-pooling connection string

These are automatically available in your serverless functions. No manual configuration needed!

## Step 4: Install Dependencies

The API endpoints use `@vercel/postgres`. Make sure it's installed:

```bash
cd api
npm install @vercel/postgres
```

Or add to your root `package.json`:

```json
{
  "dependencies": {
    "@vercel/postgres": "^0.5.1"
  }
}
```

## Step 5: Deploy

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Add Vercel Postgres database integration"
   git push
   ```

2. Vercel will automatically deploy and the database will be available

## API Endpoints

Once set up, the following endpoints are available:

### Markets
- `GET /api/markets` - Get all markets (with optional filters)
- `GET /api/markets?marketId=123` - Get specific market
- `POST /api/markets` - Create/update market
- `GET /api/markets/[marketId]` - Get market details
- `PUT /api/markets/[marketId]` - Update market

### Market History
- `GET /api/markets/[marketId]/history` - Get price/volume history
- `POST /api/markets/[marketId]/history` - Add history entry

### Trades
- `GET /api/markets/[marketId]/trades` - Get trades for a market
- `POST /api/markets/[marketId]/trades` - Record a new trade

### Events
- `GET /api/markets/[marketId]/events` - Get market events
- `POST /api/markets/[marketId]/events` - Add market event

### User Positions
- `GET /api/users/[userAddress]/positions` - Get user positions

## Frontend Integration

The frontend service `frontend/src/services/marketDb.js` provides methods to interact with these APIs:

```javascript
import { MarketDbService } from '../services/marketDb'

// Sync a market to database
await MarketDbService.syncMarket(marketData)

// Record a trade
await MarketDbService.recordTrade(marketId, {
  userAddress: '0x...',
  tradeType: 'BUY',
  outcome: 0,
  amount: '1000000',
  shares: '100',
  transactionHash: '0x...'
})

// Get market history
const history = await MarketDbService.getMarketHistory(marketId)
```

## Database Schema

The database includes the following tables:

1. **markets** - All market information
2. **market_history** - Price and volume history over time
3. **trades** - All buy/sell transactions
4. **user_positions** - User holdings per market
5. **market_events** - Important market events (created, resolved, etc.)

## Usage in Frontend

Update your `useMarkets` hook to sync with the database:

```javascript
import { MarketDbService } from '../services/marketDb'

// After creating a market
const createMarket = async (question, description, outcomes, duration, category) => {
  // ... create on blockchain ...
  const tx = await contracts.marketplace.createMarket(...)
  await tx.wait()
  
  // Sync to database
  const marketData = await getMarket(marketId)
  await MarketDbService.syncMarket(marketData)
  
  // Add creation event
  await MarketDbService.addMarketEvent(marketId, {
    eventType: 'CREATED',
    userAddress: address,
    transactionHash: tx.hash
  })
}

// After a trade
const buyShares = async (marketId, outcome, amount) => {
  // ... execute trade on blockchain ...
  const tx = await contracts.marketplace.buyShares(...)
  await tx.wait()
  
  // Record trade in database
  await MarketDbService.recordTrade(marketId, {
    userAddress: address,
    tradeType: 'BUY',
    outcome,
    amount: amount.toString(),
    shares: shares.toString(),
    transactionHash: tx.hash
  })
  
  // Add trade event
  await MarketDbService.addMarketEvent(marketId, {
    eventType: 'TRADE',
    userAddress: address,
    transactionHash: tx.hash,
    eventData: { outcome, amount, shares }
  })
}
```

## Benefits

✅ **Persistent Storage** - All market data is stored in Postgres  
✅ **History Tracking** - Price and volume history over time  
✅ **Trade Records** - Complete audit trail of all transactions  
✅ **User Positions** - Track user holdings across markets  
✅ **Event Logging** - Important market events are recorded  
✅ **Fast Queries** - Indexed tables for quick lookups  
✅ **Scalable** - Vercel Postgres handles scaling automatically  

## Troubleshooting

### Database Connection Issues

If you see connection errors:
1. Check that the database is created in Vercel Dashboard
2. Verify environment variables are set (they're automatic)
3. Check that `@vercel/postgres` is installed

### Schema Errors

If tables don't exist:
1. Run the schema SQL in the Vercel Dashboard Query tab
2. Or use `vercel db execute api/db/schema.sql`

### API Errors

Check the Vercel function logs:
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on the function that's failing
3. Check the logs for error messages

## Next Steps

1. Update your frontend hooks to sync with the database
2. Add periodic history snapshots (e.g., every hour)
3. Implement market analytics using the history data
4. Add user portfolio tracking
5. Create admin dashboard for market management

