# Demo Mode with Database Support

## How It Works

Demo mode now supports **both** database storage and in-memory fallback:

### ✅ **With Database (Recommended)**
1. Create a Vercel Postgres database
2. Run the schema (`api/db/schema.sql`)
3. Demo markets are stored in the database
4. Data persists across deployments and function restarts
5. Each demo user gets their own markets (isolated by `creator = demo_userId`)

### ✅ **Without Database (Still Works)**
1. Demo mode uses in-memory storage in serverless functions
2. Falls back to localStorage in the browser
3. Data resets when serverless functions restart
4. But localStorage keeps data in the user's browser

## Testing Demo Mode

### Option 1: Test Without Database (Quick Test)
1. Deploy to Vercel
2. Create a demo account (email with `demo` or `@demo.com`)
3. Markets will work using in-memory storage + localStorage
4. Data persists in the browser but resets on server restart

### Option 2: Test With Database (Full Persistence)
1. **Create Vercel Postgres Database:**
   - Go to Vercel Dashboard → Your Project → Storage
   - Create Postgres database
   - Note: Vercel automatically sets `POSTGRES_URL` environment variable

2. **Run Database Schema:**
   - Go to your Postgres database → Query tab
   - Copy and run `api/db/schema.sql`

3. **Deploy:**
   ```bash
   git add .
   git commit -m "Add database support for demo mode"
   git push
   ```

4. **Test:**
   - Create demo account
   - Create markets, make trades
   - Data persists in database
   - Check Vercel function logs to see if database is being used

## What Gets Stored

### In Database (when available):
- ✅ All markets created by demo users
- ✅ Market updates (probabilities, volume, etc.)
- ✅ Market history (if you add history tracking)
- ✅ Trades (if you integrate trade recording)

### In localStorage (always):
- ✅ User balance
- ✅ User shares
- ✅ Markets (as fallback)

## API Endpoints

Demo mode uses these endpoints:
- `GET /api/demo/markets/[userId]` - Get user's markets
- `POST /api/demo/markets/[userId]` - Update markets
- `GET /api/demo/balance/[userId]` - Get balance
- `POST /api/demo/balance/[userId]` - Update balance
- `GET /api/demo/shares/[userId]` - Get shares
- `POST /api/demo/shares/[userId]` - Update shares

## How to Verify Database is Working

1. **Check Function Logs:**
   - Go to Vercel Dashboard → Your Project → Functions
   - Look for logs like "Database query failed" or "saved: database"

2. **Check Response:**
   - When saving markets, response includes `saved: 'database'` or `saved: 'memory'`
   - `saved: 'database'` means it's using the database

3. **Query Database:**
   - Go to Vercel Dashboard → Your Postgres Database → Query
   - Run: `SELECT * FROM markets WHERE creator LIKE 'demo_%'`
   - Should see demo markets if database is working

## Troubleshooting

### "Database query failed" in logs
- Database might not be set up
- Check that `POSTGRES_URL` is set (automatic in Vercel)
- Verify schema has been run

### Markets not persisting
- Check if database is being used (look for `saved: 'database'` in response)
- If using in-memory, data resets on function restart (this is expected)
- localStorage should still keep data in browser

### Demo mode not working at all
- Check that demo account email contains `demo` or `@demo.com`
- Check browser console for API errors
- Verify API endpoints are deployed correctly

## Summary

**Yes, demo mode will work when you deploy!**

- ✅ Works without database (in-memory + localStorage)
- ✅ Works better with database (full persistence)
- ✅ Automatic fallback if database unavailable
- ✅ No code changes needed - just deploy

The demo markets endpoint now:
1. Tries database first (if available)
2. Falls back to in-memory storage
3. Frontend uses localStorage as additional fallback

You can deploy and test immediately - it will work either way!

