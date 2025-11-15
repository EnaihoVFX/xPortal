const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy Mock USDC (for testnet, you might want to use actual USDC address)
  console.log("\nDeploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // Deploy Oracle
  console.log("\nDeploying Oracle...");
  const Oracle = await hre.ethers.getContractFactory("Oracle");
  const oracle = await Oracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("Oracle deployed to:", oracleAddress);

  // Deploy PredictionMarket
  console.log("\nDeploying PredictionMarket...");
  const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.deploy(usdcAddress, oracleAddress);
  await predictionMarket.waitForDeployment();
  const predictionMarketAddress = await predictionMarket.getAddress();
  console.log("PredictionMarket deployed to:", predictionMarketAddress);

  // Deploy MarketFactory
  console.log("\nDeploying MarketFactory...");
  const MarketFactory = await hre.ethers.getContractFactory("MarketFactory");
  const marketFactory = await MarketFactory.deploy(predictionMarketAddress);
  await marketFactory.waitForDeployment();
  const marketFactoryAddress = await marketFactory.getAddress();
  console.log("MarketFactory deployed to:", marketFactoryAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("MockUSDC:", usdcAddress);
  console.log("Oracle:", oracleAddress);
  console.log("PredictionMarket:", predictionMarketAddress);
  console.log("MarketFactory:", marketFactoryAddress);
  console.log("\n=== Next Steps ===");
  console.log("1. Verify contracts on block explorer (if on testnet)");
  console.log("2. Update frontend with contract addresses");
  console.log("3. For production, replace MockUSDC with actual Circle Arc USDC address");

  // Save deployment addresses
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    contracts: {
      MockUSDC: usdcAddress,
      Oracle: oracleAddress,
      PredictionMarket: predictionMarketAddress,
      MarketFactory: marketFactoryAddress,
    },
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    `deployments/${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployments/" + hre.network.name + ".json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

