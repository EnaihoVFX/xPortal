# Demo Mode Implementation

## Overview
Demo mode provides a fully functional betting experience without requiring blockchain transactions, gas fees, or RPC calls. All state is stored in the browser's localStorage, making it perfect for demos and testing.

## How It Works

### Detection
Demo mode is automatically enabled when a user's email contains "demo" or "@demo.com". This happens automatically for all accounts created via `/demo` or `/public` routes.

### Features
- ✅ **No Blockchain Calls**: All operations use local state
- ✅ **Persistent Storage**: State saved to localStorage (survives page refreshes)
- ✅ **Full Functionality**: All betting, market creation, and trading features work
- ✅ **Vercel Ready**: Works completely client-side, no backend needed

## Functions Available in Demo Mode

All functions from `useContracts` are available:
- `takePosition(marketId, outcome, amount)` - Place a bet
- `buyShares(marketId, outcome, amount)` - Buy shares
- `sellShares(marketId, outcome, shares)` - Sell shares
- `createMarket(question, outcomes, duration)` - Create new market
- `getMarket(marketId)` - Get market details
- `getUserPosition(marketId, userAddress, outcome)` - Get user's position
- `getUserPortfolio(userAddress)` - Get user's portfolio
- `claimPayout(marketId)` - Claim winnings
- `getUSDCFromFaucet()` - Get demo USDC (always returns 10,000)

## State Persistence

The following data is persisted in localStorage:
- `demo_usdc_balance` - User's USDC balance
- `demo_user_shares` - User's shares in each market
- `demo_markets` - All markets (including user-created)
- `demo_market_count` - Total market count

## Default Data

### Starting Balance
- **10,000 USDC** (automatically loaded)

### Sample Markets
10 pre-loaded markets covering:
- Crypto (Bitcoin, Ethereum, Solana)
- Economics (Recession, S&P 500, Tesla stock)
- Sports (Super Bowl)
- Technology (GPT-6, Apple products)
- Entertainment (Marvel movies)

## Usage

### For Users
1. Visit `/demo` or `/public`
2. Account is automatically created with `@demo.com` email
3. Demo mode activates automatically
4. Start betting immediately with 10,000 USDC

### For Developers
Demo mode is transparent - the same components work for both real and demo accounts:
```javascript
const isDemoAccount = user?.email?.includes('demo')
const hook = isDemoAccount ? useMarketsDemo(signer) : useContracts(signer)
```

## Vercel Deployment

Demo mode works perfectly on Vercel because:
- ✅ No backend required
- ✅ All state in browser localStorage
- ✅ No external API calls
- ✅ No environment variables needed
- ✅ Works offline (after initial load)

## Testing

To test demo mode:
1. Create a demo account via `/demo`
2. Check console for "🎮 Demo mode enabled"
3. Verify balance shows 10,000 USDC
4. Place a bet - balance should decrease
5. Refresh page - state should persist
6. Create a market - should appear immediately

## Troubleshooting

### State Not Persisting
- Check browser localStorage is enabled
- Check for localStorage quota errors in console
- Try clearing localStorage and refreshing

### Functions Not Working
- Verify `isDemoAccount` is true
- Check console for demo mode activation message
- Ensure `useMarketsDemo` hook is being used

### Markets Not Showing
- Check `demoMarkets.markets` is populated
- Verify localStorage has `demo_markets` key
- Try clearing localStorage to reset to defaults


