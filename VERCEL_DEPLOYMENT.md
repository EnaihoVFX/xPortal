# Vercel Deployment Guide for Demo Mode

## Current Setup

Demo mode now uses **Vercel serverless functions** with API routes that can be upgraded to a database.

## File Structure

```
/
├── api/                    # Vercel serverless functions
│   └── demo/
│       ├── balance/[userId].js
│       ├── markets/[userId].js
│       └── shares/[userId].js
├── frontend/              # React frontend
│   └── src/
│       ├── services/
│       │   └── demoApi.js  # API client
│       └── hooks/
│           └── useMarketsDemo.js
└── vercel.json           # Vercel configuration
```

## How It Works

1. **User creates demo account** → Email like `demo_123@demo.com`
2. **User ID generated** → `demo_123_demo_com` (sanitized email)
3. **API calls** → `/api/demo/balance/{userId}`, `/api/demo/markets/{userId}`, etc.
4. **Data storage** → Currently in-memory (upgrade to database)

## Current Storage

- **In-memory Maps** in serverless functions
- **localStorage fallback** if API unavailable
- **Per-user isolation** by userId

## Upgrade to Database

See `DATABASE_SETUP.md` for instructions on upgrading to:
- Vercel KV (Redis) - Recommended
- Supabase (PostgreSQL) - Free tier
- MongoDB Atlas - Free tier

## Deployment Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add database-backed demo mode"
   git push
   ```

2. **Deploy to Vercel:**
   - Connect GitHub repo to Vercel
   - Set root directory to `frontend/` (or configure in vercel.json)
   - Deploy

3. **Configure API routes:**
   - Vercel automatically detects `/api` folder
   - Functions are serverless and scale automatically

## Environment Variables (Optional)

For database upgrades, add to Vercel:
- `KV_REST_API_URL` (for Vercel KV)
- `SUPABASE_URL` (for Supabase)
- `MONGODB_URI` (for MongoDB)

## Testing

1. Create demo account
2. Check browser console for API calls
3. Verify data persists across page refreshes
4. Test trading functionality

## Benefits

✅ **Works on Vercel** - Serverless functions  
✅ **Per-user data** - Isolated by userId  
✅ **Fallback support** - localStorage if API fails  
✅ **Upgradeable** - Easy to add database  
✅ **Scalable** - Serverless auto-scales  


