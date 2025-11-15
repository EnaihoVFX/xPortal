const hre = require("hardhat");

// Arc Testnet USDC address
const ARC_TESTNET_USDC = "0x3600000000000000000000000000000000000000";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts to Arc Testnet with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "USDC");
  
  // Check if we're on Arc testnet
  const network = await hre.ethers.provider.getNetwork();
  if (network.chainId !== BigInt(5042002)) {
    console.warn("Warning: Not on Arc Testnet (Chain ID 5042002). Current chain ID:", network.chainId.toString());
  }

  let usdcAddress;
  let useRealUSDC = process.env.USE_REAL_USDC === "true";

  if (useRealUSDC && network.chainId === BigInt(5042002)) {
    // Use real Arc USDC
    console.log("\n=== Using Real Arc USDC ===");
    usdcAddress = ARC_TESTNET_USDC;
    console.log("USDC Address:", usdcAddress);
    
    // Verify USDC contract exists
    try {
      const usdc = await hre.ethers.getContractAt("IERC20", usdcAddress);
      const totalSupply = await usdc.totalSupply();
      console.log("USDC Total Supply:", hre.ethers.formatUnits(totalSupply, 6));
    } catch (error) {
      console.error("Error verifying USDC contract:", error.message);
      console.log("Falling back to MockUSDC deployment...");
      useRealUSDC = false;
    }
  }

  if (!useRealUSDC) {
    // Deploy Mock USDC for testing
    console.log("\n=== Deploying MockUSDC ===");
    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    usdcAddress = await usdc.getAddress();
    console.log("MockUSDC deployed to:", usdcAddress);
  }

  // Deploy Oracle
  console.log("\n=== Deploying Oracle ===");
  const Oracle = await hre.ethers.getContractFactory("Oracle");
  const oracle = await Oracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("Oracle deployed to:", oracleAddress);

  // Deploy PredictionMarket
  console.log("\n=== Deploying PredictionMarket ===");
  const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.deploy(usdcAddress, oracleAddress);
  await predictionMarket.waitForDeployment();
  const predictionMarketAddress = await predictionMarket.getAddress();
  console.log("PredictionMarket deployed to:", predictionMarketAddress);

  // Deploy MarketFactory
  console.log("\n=== Deploying MarketFactory ===");
  const MarketFactory = await hre.ethers.getContractFactory("MarketFactory");
  const marketFactory = await MarketFactory.deploy(predictionMarketAddress);
  await marketFactory.waitForDeployment();
  const marketFactoryAddress = await marketFactory.getAddress();
  console.log("MarketFactory deployed to:", marketFactoryAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("Network: Arc Testnet");
  console.log("Chain ID:", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("\nContract Addresses:");
  console.log("USDC:", usdcAddress, useRealUSDC ? "(Real Arc USDC)" : "(MockUSDC)");
  console.log("Oracle:", oracleAddress);
  console.log("PredictionMarket:", predictionMarketAddress);
  console.log("MarketFactory:", marketFactoryAddress);
  
  console.log("\n=== Block Explorer Links ===");
  console.log("View on ArcScan: https://testnet.arcscan.app");
  console.log("\nContract Links:");
  console.log(`USDC: https://testnet.arcscan.app/address/${usdcAddress}`);
  console.log(`Oracle: https://testnet.arcscan.app/address/${oracleAddress}`);
  console.log(`PredictionMarket: https://testnet.arcscan.app/address/${predictionMarketAddress}`);
  console.log(`MarketFactory: https://testnet.arcscan.app/address/${marketFactoryAddress}`);

  console.log("\n=== Next Steps ===");
  console.log("1. Verify contracts on ArcScan (optional)");
  console.log("2. Test the contracts using: npx hardhat run scripts/interact.js --network arcTestnet");
  console.log("3. Get testnet USDC from: https://faucet.circle.com/");

  // Save deployment addresses
  const fs = require("fs");
  const deploymentInfo = {
    network: "arcTestnet",
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    contracts: {
      USDC: usdcAddress,
      Oracle: oracleAddress,
      PredictionMarket: predictionMarketAddress,
      MarketFactory: marketFactoryAddress,
    },
    isRealUSDC: useRealUSDC,
    timestamp: new Date().toISOString(),
  };

  if (!fs.existsSync("deployments")) {
    fs.mkdirSync("deployments");
  }

  fs.writeFileSync(
    `deployments/arcTestnet.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployments/arcTestnet.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

