# Deploying to Circle Arc Testnet

This guide will help you deploy the prediction market to Circle Arc Testnet.

## Arc Testnet Details

- **Network Name**: Arc Testnet
- **RPC URL**: `https://rpc.testnet.arc.network`
- **Chain ID**: `5042002`
- **Block Explorer**: `https://testnet.arcscan.app`
- **Native Token**: USDC (used for gas)
- **USDC Contract**: `0x3600000000000000000000000000000000000000`

## Prerequisites

1. **Get Testnet USDC**
   - Visit [Circle Faucet](https://faucet.circle.com/)
   - Select "Arc Testnet"
   - Enter your wallet address
   - Request testnet USDC (you'll need this for gas fees)

2. **Set Up Environment**
   ```bash
   # Create .env file
   cat > .env << EOF
   PRIVATE_KEY=your_private_key_here
   ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
   ARCSCAN_API_KEY=your_arcscan_key_if_available
   EOF
   ```

3. **Add Arc Testnet to MetaMask** (Optional)
   - Network Name: Arc Testnet
   - RPC URL: `https://rpc.testnet.arc.network`
   - Chain ID: `5042002`
   - Currency Symbol: USDC
   - Block Explorer: `https://testnet.arcscan.app`

## Deployment Options

### Option 1: Deploy with MockUSDC (Recommended for Testing)

This deploys a mock USDC token for testing purposes:

```bash
npm run deploy:arc
```

### Option 2: Deploy with Real Arc USDC

This uses the actual Circle Arc USDC contract on testnet:

```bash
npm run deploy:arc:real-usdc
```

Or set the environment variable manually:

```bash
USE_REAL_USDC=true npx hardhat run scripts/deploy-arc.js --network arcTestnet
```

## Deployment Steps

1. **Compile Contracts**
   ```bash
   npm run compile
   ```

2. **Deploy to Arc Testnet**
   ```bash
   npm run deploy:arc
   ```

3. **Verify Deployment**
   - Check the deployment output for contract addresses
   - View contracts on [ArcScan](https://testnet.arcscan.app)
   - Deployment info is saved to `deployments/arcTestnet.json`

## Interacting with Deployed Contracts

After deployment, you can interact with the contracts:

```bash
npx hardhat run scripts/interact.js --network arcTestnet
```

## Example: Create a Market

```javascript
const { ethers } = require("hardhat");

async function createMarket() {
  const [signer] = await ethers.getSigners();
  
  // Load deployment info
  const deployment = require("./deployments/arcTestnet.json");
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const factory = MarketFactory.attach(deployment.contracts.MarketFactory);
  
  // Create market
  const tx = await factory.createMarket(
    "Will Bitcoin reach $100k by end of 2024?",
    ["Yes", "No"],
    7 * 24 * 60 * 60 // 7 days
  );
  
  const receipt = await tx.wait();
  console.log("Market created! TX:", receipt.hash);
}
```

## Using Real Arc USDC

When using real Arc USDC (`0x3600000000000000000000000000000000000000`):

1. Users need to get testnet USDC from the faucet
2. Approve the PredictionMarket contract to spend USDC
3. Take positions using the real USDC token

## Troubleshooting

### "Insufficient funds for gas"
- Get more testnet USDC from [Circle Faucet](https://faucet.circle.com/)

### "Network not found"
- Verify your `.env` file has `ARC_TESTNET_RPC_URL` set
- Check that you're using the correct network name: `arcTestnet`

### "Contract deployment failed"
- Ensure you have enough USDC for gas
- Check the Arc testnet status
- Verify your private key is correct

## Contract Verification (Optional)

To verify contracts on ArcScan:

```bash
npx hardhat verify --network arcTestnet \
  <CONTRACT_ADDRESS> \
  <CONSTRUCTOR_ARG1> <CONSTRUCTOR_ARG2>
```

Example:
```bash
npx hardhat verify --network arcTestnet \
  0x...PredictionMarketAddress \
  0x3600000000000000000000000000000000000000 \
  0x...OracleAddress
```

## Next Steps

1. Test all contract functions on Arc testnet
2. Build a frontend to interact with the contracts
3. Integrate with real oracle services
4. Prepare for mainnet deployment

## Resources

- [Arc Documentation](https://docs.arc.network/)
- [Circle USDC Contract Addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses)
- [Arc Testnet Explorer](https://testnet.arcscan.app)
- [Circle Faucet](https://faucet.circle.com/)


