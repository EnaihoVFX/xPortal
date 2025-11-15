# MarketPlace

A full-featured prediction market platform with share-based trading, built on Circle Arc Testnet with USDC.

## Features

### Core Functionality
- **Share-Based Trading**: Buy and sell shares of market outcomes
- **Probability Display**: Real-time probability calculations based on liquidity
- **Market Categories**: Organize markets by category (Politics, Sports, Crypto, etc.)
- **Market Discovery**: Search and filter markets by category
- **Portfolio Management**: View all your positions across markets
- **Market Creation**: Create custom prediction markets with multiple outcomes

### Smart Contract Features
- **MarketPlace Contract**: Main contract with share trading mechanics
- **LMSR Pricing**: Logarithmic Market Scoring Rule for probability calculation
- **Liquidity Pools**: Dynamic pricing based on market liquidity
- **Fee System**: 2% trading fee
- **Oracle Resolution**: Decentralized market resolution

## Deployment

### 1. Deploy Contracts

```bash
# Deploy MarketPlace to Arc Testnet
npx hardhat run scripts/deploy-marketplace.js --network arcTestnet
```

This will deploy:
- MockUSDC (or use real Arc USDC if `USE_REAL_USDC=true`)
- Oracle
- MarketPlace

### 2. Update Frontend Config

After deployment, update `frontend/src/config/contracts.js` with the deployed addresses:

```javascript
export const CONTRACT_ADDRESSES = {
  arcTestnet: {
    USDC: "0x...",
    Oracle: "0x...",
    MarketPlace: "0x..."  // Add this
  }
}
```

## Usage

### Creating a Market

1. Navigate to `/create-market`
2. Enter market question and description
3. Add outcomes (minimum 2, maximum 10)
4. Select category and duration
5. Submit to create the market

### Trading Shares

1. Browse markets at `/markets`
2. Click "Trade" on any outcome
3. Choose Buy or Sell
4. Enter amount (USDC for buying, shares for selling)
5. Confirm transaction

### Viewing Portfolio

Your positions are automatically displayed on each market card showing:
- Outcome
- Number of shares held
- Current probability

## Contract Functions

### Market Creation
```solidity
createMarket(
    string question,
    string description,
    string[] outcomes,
    uint256 duration,
    MarketCategory category
) returns (uint256 marketId)
```

### Trading
```solidity
buyShares(uint256 marketId, uint256 outcome, uint256 amount) returns (uint256 shares)
sellShares(uint256 marketId, uint256 outcome, uint256 shares) returns (uint256 proceeds)
```

### View Functions
```solidity
getMarket(uint256 marketId) returns (Market info)
getOutcomeProbability(uint256 marketId, uint256 outcome) returns (uint256)
getAllProbabilities(uint256 marketId) returns (uint256[])
getUserShares(uint256 marketId, address user, uint256 outcome) returns (uint256)
getUserPortfolio(address user) returns (marketIds, outcomes, shares)
getMarketsByCategory(MarketCategory category) returns (uint256[])
```

## Market Categories

- Politics (0)
- Sports (1)
- Crypto (2)
- Economics (3)
- Technology (4)
- Entertainment (5)
- Weather (6)
- Other (7)

## Pricing Model

The contract uses a simplified LMSR (Logarithmic Market Scoring Rule) model:
- Probability = (Outcome Liquidity / Total Liquidity) * 100%
- Shares received depend on current market state
- Dynamic pricing adjusts as liquidity changes

## Frontend Routes

- `/markets` - Browse all markets
- `/create-market` - Create a new market
- `/dashboard` - User dashboard
- `/profile` - User profile

## Testing

```bash
# Run tests
npx hardhat test

# Test on local network
npx hardhat node
npx hardhat run scripts/deploy-marketplace.js --network localhost
```

## Notes

- Markets require at least 2 outcomes
- Maximum 10 outcomes per market
- Market duration: 1 hour to 365 days
- Trading fee: 2% (200 basis points)
- Markets resolve 7 days after end time

