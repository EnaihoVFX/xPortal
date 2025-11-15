const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const ARC_TESTNET_USDC = "0x3600000000000000000000000000000000000000"; // Real Arc USDC address

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  
  console.log("Deploying MarketPlace to network:", network.name);
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

  if (network.chainId !== BigInt(5042002)) {
    console.warn("Warning: Not on Arc Testnet (Chain ID 5042002). Current chain ID:", network.chainId.toString());
  }

  let usdcAddress;
  let useRealUSDC = process.env.USE_REAL_USDC === "true";

  if (useRealUSDC && network.chainId === BigInt(5042002)) {
    console.log("\n=== Using Real Arc USDC ===");
    usdcAddress = ARC_TESTNET_USDC;
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
    console.log("\n=== Deploying MockUSDC ===");
    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    usdcAddress = await usdc.getAddress();
    console.log("MockUSDC deployed to:", usdcAddress);
  }

  console.log("\n=== Deploying Oracle ===");
  const Oracle = await hre.ethers.getContractFactory("Oracle");
  const oracle = await Oracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("Oracle deployed to:", oracleAddress);

  console.log("\n=== Deploying MarketPlace ===");
  const MarketPlace = await hre.ethers.getContractFactory("MarketPlace");
  const marketplace = await MarketPlace.deploy(usdcAddress, oracleAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("MarketPlace deployed to:", marketplaceAddress);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    contracts: {
      usdc: usdcAddress,
      oracle: oracleAddress,
      marketplace: marketplaceAddress,
    },
    isRealUSDC: useRealUSDC,
    timestamp: new Date().toISOString(),
  };

  const deploymentPath = path.join(__dirname, "..", "deployments", `marketplace-${network.name}.json`);
  const deploymentDir = path.dirname(deploymentPath);
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("\nDeployment info saved to:", deploymentPath);

  // Verify contracts on ArcScan if on Arc Testnet
  if (network.chainId === BigInt(5042002)) {
    console.log("\n=== Waiting for block confirmations before verification ===");
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

    try {
      if (!useRealUSDC) {
        console.log("Verifying MockUSDC...");
        await hre.run("verify:verify", {
          address: usdcAddress,
          constructorArguments: [],
        });
      }

      console.log("Verifying Oracle...");
      await hre.run("verify:verify", {
        address: oracleAddress,
        constructorArguments: [],
      });

      console.log("Verifying MarketPlace...");
      await hre.run("verify:verify", {
        address: marketplaceAddress,
        constructorArguments: [usdcAddress, oracleAddress],
      });
    } catch (error) {
      console.error("Verification error:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

