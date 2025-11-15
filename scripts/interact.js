const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // Load deployment info
  const network = hre.network.name;
  const deploymentPath = `deployments/${network}.json`;
  
  if (!fs.existsSync(deploymentPath)) {
    console.error(`Deployment file not found: ${deploymentPath}`);
    console.error("Please deploy contracts first using: npx hardhat run scripts/deploy.js --network", network);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  const user1 = signers[1] || deployer; // Use deployer if only one signer
  const user2 = signers[2] || deployer; // Use deployer if only one signer

  console.log("Interacting with contracts on", network);
  console.log("Deployer:", deployer.address);
  console.log("User1:", user1.address);
  if (signers.length > 1) {
    console.log("User2:", user2.address);
  } else {
    console.log("Note: Using deployer for all operations (only one signer available)");
  }

  // Get contract instances
  // Check if it's MockUSDC or real USDC
  const usdcAddress = deployment.contracts.USDC || deployment.contracts.MockUSDC;
  let usdc;
  
  if (deployment.isRealUSDC) {
    // Use IERC20 interface for real USDC
    const IERC20 = await hre.ethers.getContractFactory("IERC20");
    usdc = IERC20.attach(usdcAddress);
  } else {
    // Use MockUSDC contract
    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    usdc = MockUSDC.attach(usdcAddress);
  }

  const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
  const predictionMarket = PredictionMarket.attach(deployment.contracts.PredictionMarket);

  const MarketFactory = await hre.ethers.getContractFactory("MarketFactory");
  const marketFactory = MarketFactory.attach(deployment.contracts.MarketFactory);

  const Oracle = await hre.ethers.getContractFactory("Oracle");
  const oracle = Oracle.attach(deployment.contracts.Oracle);

  // Get some USDC for users
  console.log("\n=== Getting USDC for users ===");
  const USDC_DECIMALS = 6;
  const THOUSAND_USDC = hre.ethers.parseUnits("1000", USDC_DECIMALS);

  // Get USDC for users
  if (!deployment.isRealUSDC) {
    // For MockUSDC, use faucet
    const user1Balance = await usdc.balanceOf(user1.address);
    console.log("User1 current balance:", hre.ethers.formatUnits(user1Balance, USDC_DECIMALS), "USDC");
    
    if (user1Balance < THOUSAND_USDC) {
      console.log("Getting USDC from faucet...");
      const faucetTx = await usdc.faucet();
      await faucetTx.wait();
      const deployerBalance = await usdc.balanceOf(deployer.address);
      console.log("Deployer balance after faucet:", hre.ethers.formatUnits(deployerBalance, USDC_DECIMALS), "USDC");
      
      if (deployerBalance >= THOUSAND_USDC) {
        const transferTx = await usdc.transfer(user1.address, THOUSAND_USDC);
        await transferTx.wait();
        console.log("Transferred 1000 USDC to user1");
      }
    }

    if (signers.length > 1) {
      const user2Balance = await usdc.balanceOf(user2.address);
      if (user2Balance < THOUSAND_USDC) {
        const transferTx = await usdc.transfer(user2.address, THOUSAND_USDC);
        await transferTx.wait();
        console.log("Transferred 1000 USDC to user2");
      }
    }
  } else {
    console.log("Using existing USDC balances (real USDC)");
  }
  
  // Verify balances
  const finalUser1Balance = await usdc.balanceOf(user1.address);
  const finalUser2Balance = await usdc.balanceOf(user2.address);
  console.log("User1 final balance:", hre.ethers.formatUnits(finalUser1Balance, USDC_DECIMALS), "USDC");
  if (signers.length > 1) {
    console.log("User2 final balance:", hre.ethers.formatUnits(finalUser2Balance, USDC_DECIMALS), "USDC");
  }

  // Approve USDC
  await usdc.connect(user1).approve(await predictionMarket.getAddress(), hre.ethers.MaxUint256);
  await usdc.connect(user2).approve(await predictionMarket.getAddress(), hre.ethers.MaxUint256);
  console.log("Approved USDC spending");

  // Create a market
  console.log("\n=== Creating Market ===");
  const question = "Will Bitcoin reach $100k by end of 2024?";
  const outcomes = ["Yes", "No"];
  const duration = 7 * 24 * 60 * 60; // 7 days

  const tx = await marketFactory.connect(user1).createMarket(question, outcomes, duration);
  const receipt = await tx.wait();
  const event = receipt.logs.find(log => {
    try {
      const parsed = marketFactory.interface.parseLog(log);
      return parsed && parsed.name === "MarketCreatedViaFactory";
    } catch {
      return false;
    }
  });

  let marketId;
  if (event) {
    const parsed = marketFactory.interface.parseLog(event);
    marketId = parsed.args.marketId;
    console.log("Market created with ID:", marketId.toString());
  } else {
    // Fallback: get latest market
    const count = await predictionMarket.getMarketCount();
    marketId = count;
    console.log("Market created with ID:", marketId.toString());
  }

  // Get market info
  const marketInfo = await predictionMarket.getMarket(marketId);
  console.log("Market Question:", marketInfo.question);
  console.log("Market Creator:", marketInfo.creator);
  console.log("Market Status:", marketInfo.status);

  // Take positions
  console.log("\n=== Taking Positions ===");
  const HUNDRED_USDC = hre.ethers.parseUnits("100", USDC_DECIMALS);

  await predictionMarket.connect(user1).takePosition(marketId, 0, HUNDRED_USDC);
  console.log("User1 bet 100 USDC on outcome 0 (Yes)");

  await predictionMarket.connect(user2).takePosition(marketId, 1, HUNDRED_USDC);
  console.log("User2 bet 100 USDC on outcome 1 (No)");

  // Get positions
  const [user1Shares, user1Stake] = await predictionMarket.getUserPosition(marketId, user1.address, 0);
  const [user2Shares, user2Stake] = await predictionMarket.getUserPosition(marketId, user2.address, 1);

  console.log("\nUser1 position - Shares:", user1Shares.toString(), "Stake:", user1Stake.toString());
  console.log("User2 position - Shares:", user2Shares.toString(), "Stake:", user2Stake.toString());

  // Get outcome shares
  const outcome0Shares = await predictionMarket.getOutcomeShares(marketId, 0);
  const outcome1Shares = await predictionMarket.getOutcomeShares(marketId, 1);
  console.log("\nOutcome 0 (Yes) total shares:", outcome0Shares.toString());
  console.log("Outcome 1 (No) total shares:", outcome1Shares.toString());

  console.log("\n=== Market Interaction Complete ===");
  console.log("To resolve the market, wait until end time and call:");
  console.log("1. oracle.resolveMarket(" + marketId + ", <winningOutcome>)");
  console.log("2. predictionMarket.resolveMarket(" + marketId + ", <winningOutcome>)");
  console.log("3. predictionMarket.connect(winner).claimPayout(" + marketId + ")");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

