# Prediction Market Frontend

React frontend with full Web3 integration for the Prediction Market application.

## Features

- 🔗 **Wallet Connection**: Connect MetaMask or other Web3 wallets
- 📊 **Dashboard**: View all markets, positions, and statistics
- 🎯 **Create Markets**: Create new prediction markets
- 💰 **Place Bets**: Take positions on market outcomes
- 💵 **Claim Payouts**: Claim rewards from resolved markets
- 📱 **Responsive Design**: Works on desktop and mobile

## Setup

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Routes

- `/` - Homepage
- `/dashboard` - **Full Web3 Dashboard** (main interface)
- `/signup` - Sign Up
- `/profile` - Profile

## Web3 Integration

The dashboard is fully integrated with:

- **Ethers.js v6**: For blockchain interactions
- **MetaMask**: Wallet connection
- **Arc Testnet**: Deployed contract addresses
- **Smart Contracts**: 
  - PredictionMarket
  - MarketFactory
  - Oracle
  - MockUSDC

## Contract Addresses

Contracts are configured in `src/config/contracts.js`:
- USDC: `0x9F3f628A2dfeAEEd9647e0D3d4cfDe440ba8c2E1`
- Oracle: `0xDbA196f9797586E661bbd0a63346c07d752e0082`
- PredictionMarket: `0x3BbB5245262a55cD8D72E0989feD76Fb727b1FcA`
- MarketFactory: `0xFFc8c73ba5EF7292717bE15A80ddAB880529ee7B`

## Usage

1. **Connect Wallet**: Click "Connect Wallet" and approve in MetaMask
2. **View Markets**: See all active markets on the dashboard
3. **Create Market**: Click "Create New Market" to create a prediction market
4. **Place Bets**: Select an outcome and amount, then click "Bet"
5. **Claim Payouts**: For resolved markets, click "Claim Payout" if you won

## Network Configuration

The app automatically:
- Detects if you're on Arc Testnet
- Prompts to switch networks if needed
- Adds Arc Testnet to MetaMask if not present

## Build

```bash
npm run build
```

## Requirements

- MetaMask or compatible Web3 wallet
- Arc Testnet network configured
- Testnet USDC for gas fees
