const hre = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("=== Checking Wallet Configuration for Arc Testnet ===\n");

  // Check if private key is set
  if (!process.env.PRIVATE_KEY) {
    console.error("❌ ERROR: PRIVATE_KEY not found in .env file");
    console.log("Please add PRIVATE_KEY=0x... to your .env file");
    process.exit(1);
  }

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  const address = signer.address;
  
  console.log("✅ Private key loaded");
  console.log("Wallet Address:", address);
  console.log("");

  // Check network connection
  try {
    const network = await hre.ethers.provider.getNetwork();
    console.log("Network Information:");
    console.log("  Chain ID:", network.chainId.toString());
    console.log("  Expected: 5042002 (Arc Testnet)");
    
    if (network.chainId === BigInt(5042002)) {
      console.log("  ✅ Connected to Arc Testnet!");
    } else {
      console.log("  ⚠️  WARNING: Not connected to Arc Testnet");
      console.log("  Make sure you're using --network arcTestnet");
    }
    console.log("");

    // Check balance
    const balance = await hre.ethers.provider.getBalance(address);
    const balanceFormatted = hre.ethers.formatEther(balance);
    
    console.log("Wallet Balance:");
    console.log("  Raw:", balance.toString());
    console.log("  Formatted:", balanceFormatted, "USDC");
    
    if (balance === 0n) {
      console.log("\n⚠️  WARNING: Wallet has 0 USDC!");
      console.log("You need testnet USDC for gas fees.");
      console.log("\nTo get testnet USDC:");
      console.log("1. Go to https://faucet.circle.com/");
      console.log("2. Select 'Arc Testnet'");
      console.log("3. Enter your address:", address);
      console.log("4. Request testnet USDC");
    } else {
      console.log("  ✅ Wallet has USDC for gas fees");
    }
    console.log("");

    // Try to get block number to verify connection
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    console.log("Connection Status:");
    console.log("  ✅ Successfully connected to Arc Testnet");
    console.log("  Current Block:", blockNumber);
    console.log("");

    // Check if we can estimate gas (further verification)
    try {
      const gasPrice = await hre.ethers.provider.getFeeData();
      console.log("Gas Information:");
      console.log("  Gas Price:", gasPrice.gasPrice?.toString() || "N/A");
      console.log("  ✅ Network is responsive");
    } catch (error) {
      console.log("  ⚠️  Could not fetch gas info:", error.message);
    }

    console.log("\n=== Summary ===");
    if (network.chainId === BigInt(5042002) && balance > 0n) {
      console.log("✅ Wallet is ready for Arc Testnet deployment!");
      console.log("You can now run: npm run deploy:arc");
    } else if (network.chainId === BigInt(5042002) && balance === 0n) {
      console.log("⚠️  Wallet connected but needs USDC for gas");
      console.log("Get testnet USDC from: https://faucet.circle.com/");
    } else {
      console.log("⚠️  Please check your network configuration");
    }

  } catch (error) {
    console.error("\n❌ ERROR connecting to network:");
    console.error(error.message);
    console.log("\nPossible issues:");
    console.log("1. Check ARC_TESTNET_RPC_URL in .env");
    console.log("2. Check your internet connection");
    console.log("3. Verify Arc Testnet is operational");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

