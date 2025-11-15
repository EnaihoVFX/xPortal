# Testnet Deployment Guide

This guide will help you deploy and test the prediction market on a testnet.

## Prerequisites

1. **Get Testnet Tokens**
   - For Sepolia: Get ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
   - For Base Sepolia: Get ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)

2. **Set Up Environment**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your `.env` file:
   ```env
   PRIVATE_KEY=your_private_key_here
   TESTNET_RPC_URL=https://sepolia.infura.io/v3/your_key
   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   ETHERSCAN_API_KEY=your_etherscan_key
   BASESCAN_API_KEY=your_basescan_key
   ```

## Deployment Steps

### 1. Deploy to Sepolia Testnet

```bash
npx hardhat run scripts/deploy.js --network testnet
```

This will:
- Deploy MockUSDC (for testing - replace with real USDC in production)
- Deploy Oracle contract
- Deploy PredictionMarket contract
- Deploy MarketFactory contract
- Save deployment addresses to `deployments/testnet.json`

### 2. Verify Contracts (Optional)

If you want to verify on Etherscan:

```bash
npx hardhat verify --network testnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### 3. Interact with Contracts

```bash
npx hardhat run scripts/interact.js --network testnet
```

This script will:
- Create a test market
- Take positions on the market
- Show market state

## Testing the Full Flow

### Step 1: Create a Market

```javascript
const marketFactory = await ethers.getContractAt("MarketFactory", MARKET_FACTORY_ADDRESS);
const tx = await marketFactory.createMarket(
  "Will Bitcoin reach $100k by end of 2024?",
  ["Yes", "No"],
  7 * 24 * 60 * 60 // 7 days
);
const receipt = await tx.wait();
// Get marketId from event
```

### Step 2: Take Positions

```javascript
const predictionMarket = await ethers.getContractAt("PredictionMarket", PREDICTION_MARKET_ADDRESS);
const usdc = await ethers.getContractAt("MockUSDC", USDC_ADDRESS);

// Approve USDC
await usdc.approve(PREDICTION_MARKET_ADDRESS, ethers.parseUnits("100", 6));

// Take position
await predictionMarket.takePosition(marketId, 0, ethers.parseUnits("100", 6));
```

### Step 3: Resolve Market (After End Time)

```javascript
const oracle = await ethers.getContractAt("Oracle", ORACLE_ADDRESS);

// Wait for market to end, then resolve
await oracle.resolveMarket(marketId, 0); // 0 = winning outcome
await predictionMarket.resolveMarket(marketId, 0);
```

### Step 4: Claim Payouts

```javascript
// Winners claim their payouts
await predictionMarket.claimPayout(marketId);
```

## Using Real USDC on Testnet

For production-like testing, you can use testnet USDC:

1. **Sepolia USDC**: Deploy or use existing testnet USDC
2. Update the deployment script to use the real USDC address
3. Users need to get testnet USDC from faucets or bridges

## Monitoring

- Check contract addresses on Etherscan/BaseScan
- Monitor events using:
  ```javascript
  predictionMarket.on("MarketCreated", (marketId, creator, question) => {
    console.log("New market:", marketId, question);
  });
  ```

## Troubleshooting

1. **Out of Gas**: Increase gas limit in hardhat.config.js
2. **Transaction Failed**: Check you have enough ETH for gas
3. **Contract Not Found**: Verify deployment addresses in `deployments/testnet.json`

## Next Steps

1. Build a frontend to interact with the contracts
2. Integrate with real oracle services (Chainlink, etc.)
3. Add more sophisticated market mechanisms
4. Conduct security audit before mainnet

