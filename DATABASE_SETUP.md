# Database Setup for Demo Mode on Vercel

## Current Implementation

Demo mode currently uses **in-memory storage** in Vercel serverless functions. This works for testing but data is lost when functions restart.

## Upgrade to Persistent Database

For production, choose one of these options:

### Option 1: Vercel KV (Redis) - Recommended for Vercel

1. **Install Vercel KV:**
   ```bash
   npm install @vercel/kv
   ```

2. **Set up Vercel KV:**
   - Go to Vercel Dashboard → Your Project → Storage
   - Create a KV database
   - Get connection string

3. **Update API routes:**
   ```javascript
   import { kv } from '@vercel/kv'
   
   // Get balance
   const balance = await kv.get(`balance:${userId}`) || DEMO_USDC_BALANCE
   
   // Set balance
   await kv.set(`balance:${userId}`, balance)
   ```

### Option 2: Supabase (PostgreSQL) - Free Tier Available

1. **Create Supabase project:**
   - Go to supabase.com
   - Create new project
   - Get API URL and anon key

2. **Create tables:**
   ```sql
   CREATE TABLE demo_balances (
     user_id TEXT PRIMARY KEY,
     balance TEXT NOT NULL,
     updated_at TIMESTAMP DEFAULT NOW()
   );
   
   CREATE TABLE demo_markets (
     user_id TEXT,
     market_id INTEGER,
     data JSONB,
     PRIMARY KEY (user_id, market_id)
   );
   
   CREATE TABLE demo_shares (
     user_id TEXT,
     market_id INTEGER,
     outcome INTEGER,
     shares TEXT,
     PRIMARY KEY (user_id, market_id, outcome)
   );
   ```

3. **Update API routes:**
   ```javascript
   import { createClient } from '@supabase/supabase-js'
   
   const supabase = createClient(
     process.env.SUPABASE_URL,
     process.env.SUPABASE_ANON_KEY
   )
   ```

### Option 3: MongoDB Atlas - Free Tier Available

1. **Create MongoDB Atlas cluster:**
   - Go to mongodb.com/cloud/atlas
   - Create free cluster
   - Get connection string

2. **Update API routes:**
   ```javascript
   import { MongoClient } from 'mongodb'
   
   const client = new MongoClient(process.env.MONGODB_URI)
   const db = client.db('demo')
   const balances = db.collection('balances')
   ```

## Environment Variables

Add to Vercel project settings:

```
# For Vercel KV
KV_REST_API_URL=...
KV_REST_API_TOKEN=...

# For Supabase
SUPABASE_URL=...
SUPABASE_ANON_KEY=...

# For MongoDB
MONGODB_URI=...
```

## Current Fallback

The current implementation:
- Uses in-memory Map storage (lost on restart)
- Falls back to localStorage if API unavailable
- Works for demos but not persistent across deployments

## Migration Path

1. **Phase 1 (Current):** In-memory + localStorage fallback ✅
2. **Phase 2:** Add Vercel KV for persistence
3. **Phase 3:** Migrate to Supabase/MongoDB for full features

