# Setting Up Your Private Key

## ⚠️ SECURITY WARNING

**NEVER share your private key with anyone!**
- Never commit it to Git
- Never share it in chat/email
- Never use your main wallet's private key for testing

## Option 1: Use a Test Wallet (Recommended)

Create a dedicated wallet for testing:

### Generate a New Test Wallet

```bash
node -e "const { ethers } = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('Address:', wallet.address); console.log('Private Key:', wallet.privateKey);"
```

### Steps:

1. **Generate the wallet** (command above)
2. **Save the address and private key securely**
3. **Fund the wallet** with testnet USDC:
   - Go to [Circle Faucet](https://faucet.circle.com/)
   - Select "Arc Testnet"
   - Enter your wallet address
   - Request testnet USDC (you'll need this for gas fees)
4. **Add to .env file**:
   ```bash
   PRIVATE_KEY=0x...your_private_key_here...
   ```

## Option 2: Use Existing Wallet (MetaMask)

If you want to use an existing MetaMask wallet:

1. **Open MetaMask**
2. **Click the account menu** (three dots)
3. **Select "Account Details"**
4. **Click "Export Private Key"**
5. **Enter your password**
6. **Copy the private key**
7. **Add to .env file**:
   ```bash
   PRIVATE_KEY=0x...your_private_key_here...
   ```

⚠️ **Warning**: Only use a wallet that you're okay with using for testing. Never use your main production wallet!

## Setting Up .env File

Create a `.env` file in the project root:

```bash
# Your wallet's private key (without 0x prefix is fine, but 0x prefix works too)
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Arc Testnet RPC URL
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network

# Optional: ArcScan API key for contract verification
ARCSCAN_API_KEY=your_key_here
```

## Verify Your Setup

Check that your wallet has testnet USDC:

```bash
# Check balance (replace with your address)
npx hardhat run --network arcTestnet -c "console.log((await ethers.provider.getBalance('YOUR_ADDRESS')).toString())"
```

Or use the ArcScan explorer: https://testnet.arcscan.app

## Best Practices

1. ✅ Use a separate wallet for testing
2. ✅ Never commit `.env` to Git (it's in `.gitignore`)
3. ✅ Keep your private key secure
4. ✅ Only fund with testnet tokens
5. ✅ Use a password manager or secure note for storage

## Troubleshooting

**"Insufficient funds" error:**
- Make sure you've funded your wallet with testnet USDC from the faucet
- Arc Testnet uses USDC for gas, not ETH

**"Invalid private key" error:**
- Make sure the private key starts with `0x`
- Check for any extra spaces or newlines
- The private key should be 66 characters (including 0x)

