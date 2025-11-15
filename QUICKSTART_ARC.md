# Quick Start: Deploy to Arc Testnet

## 1. Set Up Environment

Create a `.env` file in the project root:

```bash
PRIVATE_KEY=your_private_key_here
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
```

## 2. Get Testnet USDC

Visit [Circle Faucet](https://faucet.circle.com/) and request testnet USDC for your wallet address.

## 3. Deploy Contracts

```bash
# Deploy with MockUSDC (for testing)
npm run deploy:arc

# OR deploy with real Arc USDC
npm run deploy:arc:real-usdc
```

## 4. Verify Deployment

Check `deployments/arcTestnet.json` for contract addresses, or view them on [ArcScan](https://testnet.arcscan.app).

## 5. Test the Contracts

```bash
npx hardhat run scripts/interact.js --network arcTestnet
```

That's it! Your prediction market is now live on Arc Testnet.

For more details, see [ARC_DEPLOYMENT.md](./ARC_DEPLOYMENT.md)

