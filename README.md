# Smart Prediction Market

A decentralized prediction market platform built on Ethereum, powered by Circle Arc USDC. This system allows users to create markets, take positions on outcomes, and receive payouts based on market resolution.

## Features

- **Market Creation**: Create prediction markets with custom questions and multiple outcomes
- **Dynamic Pricing**: Uses constant product market maker formula for share pricing
- **Oracle Integration**: Resolve markets through an oracle system
- **Fee Collection**: 3% fee on total market liquidity
- **Multiple Outcomes**: Support for 2-10 outcomes per market
- **Time-based Markets**: Markets with configurable duration and resolution periods
- **Cancellation & Refunds**: Owner can cancel markets, users can get refunds
- **Market Factory**: Centralized factory for creating and tracking markets

## Architecture

### Smart Contracts

1. **PredictionMarket.sol**: Core prediction market contract
   - Market creation and management
   - Position taking with dynamic pricing
   - Market resolution and payouts
   - Fee collection

2. **MarketFactory.sol**: Factory contract for market creation
   - Centralized market creation
   - Market tracking and indexing
   - User market history

3. **Oracle.sol**: Oracle contract for market resolution
   - Authorized resolver system
   - Market resolution tracking

4. **MockUSDC.sol**: Mock USDC token for testing
   - 6 decimal precision (matching real USDC)
   - Faucet function for testnet

## Setup

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Hardhat

### Installation

```bash
npm install
```

### Configuration

1. Copy `.env.example` to `.env`
2. Fill in your private keys and RPC URLs:

```env
PRIVATE_KEY=your_private_key_here
TESTNET_RPC_URL=https://sepolia.infura.io/v3/your_key
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
ETHERSCAN_API_KEY=your_etherscan_key
```

## Usage

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm run test
```

### Deploy to Testnet

**Sepolia Testnet:**
```bash
npm run deploy:testnet
```

**Circle Arc Testnet (Recommended):**
```bash
npm run deploy:arc
```

For detailed Arc deployment instructions, see [ARC_DEPLOYMENT.md](./ARC_DEPLOYMENT.md)

### Interact with Contracts

```bash
npx hardhat run scripts/interact.js --network testnet
```

## Testing Locally

### Start Local Node

```bash
npm run node
```

In another terminal, deploy to local network:

```bash
npx hardhat run scripts/deploy.js --network hardhat
```

Then interact:

```bash
npx hardhat run scripts/interact.js --network hardhat
```

## Contract Flow

1. **Market Creation**
   - User creates market with question, outcomes, and duration
   - Market is set to Active status

2. **Taking Positions**
   - Users bet USDC on their preferred outcome
   - Shares are calculated using constant product formula
   - Liquidity is added to the market

3. **Market Resolution**
   - After end time, oracle resolves the market
   - PredictionMarket contract verifies oracle resolution
   - Fees are calculated and deducted

4. **Payout Claims**
   - Winners can claim their proportional share of the payout pool
   - Payout = (user shares / total winning shares) * payout pool

## Production Considerations

1. **Replace MockUSDC**: Use actual Circle Arc USDC contract address
2. **Oracle Integration**: Integrate with Chainlink or other oracle services
3. **Access Control**: Implement more sophisticated resolver authorization
4. **Gas Optimization**: Further optimize contract for gas efficiency
5. **Security Audit**: Conduct comprehensive security audit before mainnet
6. **Frontend**: Build user interface for market interaction

## Security Features

- ReentrancyGuard protection
- Access control for critical functions
- Input validation
- Safe math operations (Solidity 0.8.20)
- Oracle verification before resolution

## License

MIT

