const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PredictionMarket", function () {
  let predictionMarket;
  let marketFactory;
  let oracle;
  let usdc;
  let owner;
  let user1;
  let user2;
  let user3;

  const USDC_DECIMALS = 6;
  const ONE_USDC = ethers.parseUnits("1", USDC_DECIMALS);
  const HUNDRED_USDC = ethers.parseUnits("100", USDC_DECIMALS);
  const THOUSAND_USDC = ethers.parseUnits("1000", USDC_DECIMALS);

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    // Deploy Oracle
    const Oracle = await ethers.getContractFactory("Oracle");
    oracle = await Oracle.deploy();

    // Deploy PredictionMarket
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    predictionMarket = await PredictionMarket.deploy(
      await usdc.getAddress(),
      await oracle.getAddress()
    );

    // Deploy MarketFactory
    const MarketFactory = await ethers.getContractFactory("MarketFactory");
    marketFactory = await MarketFactory.deploy(await predictionMarket.getAddress());

    // Distribute USDC to users
    await usdc.transfer(user1.address, THOUSAND_USDC);
    await usdc.transfer(user2.address, THOUSAND_USDC);
    await usdc.transfer(user3.address, THOUSAND_USDC);

    // Approve USDC spending
    await usdc.connect(user1).approve(await predictionMarket.getAddress(), ethers.MaxUint256);
    await usdc.connect(user2).approve(await predictionMarket.getAddress(), ethers.MaxUint256);
    await usdc.connect(user3).approve(await predictionMarket.getAddress(), ethers.MaxUint256);
  });

  describe("Market Creation", function () {
    it("Should create a market successfully", async function () {
      const question = "Will Bitcoin reach $100k by end of 2024?";
      const outcomes = ["Yes", "No"];
      const duration = 7 * 24 * 60 * 60; // 7 days

      const tx = await predictionMarket.createMarket(question, outcomes, duration);
      const receipt = await tx.wait();

      const marketCreatedEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === "MarketCreated"
      );

      expect(marketCreatedEvent).to.not.be.undefined;
      expect(await predictionMarket.getMarketCount()).to.equal(1);
    });

    it("Should create market via factory", async function () {
      const question = "Will Ethereum reach $5000?";
      const outcomes = ["Yes", "No"];
      const duration = 30 * 24 * 60 * 60; // 30 days

      await usdc.connect(user1).approve(await marketFactory.getAddress(), ethers.MaxUint256);
      
      const tx = await marketFactory.connect(user1).createMarket(question, outcomes, duration);
      const receipt = await tx.wait();

      expect(await marketFactory.getMarketCount()).to.equal(1);
      expect(await predictionMarket.getMarketCount()).to.equal(1);
    });

    it("Should reject market with less than 2 outcomes", async function () {
      const question = "Test question";
      const outcomes = ["Only one"];
      const duration = 7 * 24 * 60 * 60;

      await expect(
        predictionMarket.createMarket(question, outcomes, duration)
      ).to.be.revertedWith("At least 2 outcomes required");
    });

    it("Should reject market with too many outcomes", async function () {
      const question = "Test question";
      const outcomes = Array(11).fill("Outcome");
      const duration = 7 * 24 * 60 * 60;

      await expect(
        predictionMarket.createMarket(question, outcomes, duration)
      ).to.be.revertedWith("Too many outcomes");
    });

    it("Should reject market with duration too short", async function () {
      const question = "Test question";
      const outcomes = ["Yes", "No"];
      const duration = 30 * 60; // 30 minutes

      await expect(
        predictionMarket.createMarket(question, outcomes, duration)
      ).to.be.revertedWith("Duration too short");
    });
  });

  describe("Taking Positions", function () {
    let marketId;

    this.timeout(120000); // Increase timeout to 120 seconds

    beforeEach(async function () {
      const question = "Will it rain tomorrow?";
      const outcomes = ["Yes", "No"];
      const duration = 7 * 24 * 60 * 60;

      try {
        const tx = await predictionMarket.createMarket(question, outcomes, duration);
        const receipt = await tx.wait();
        const event = receipt.logs.find(log => {
          try {
            const parsed = predictionMarket.interface.parseLog(log);
            return parsed && parsed.name === "MarketCreated";
          } catch {
            return false;
          }
        });
        if (event) {
          const parsed = predictionMarket.interface.parseLog(event);
          marketId = parsed.args[0];
        } else {
          // Fallback: get latest market count
          const count = await predictionMarket.getMarketCount();
          marketId = count;
        }
      } catch (error) {
        console.error("Error in beforeEach:", error);
        throw error;
      }
    });

    it("Should allow users to take positions", async function () {
      const outcome = 0; // Yes
      const amount = HUNDRED_USDC;

      await expect(
        predictionMarket.connect(user1).takePosition(marketId, outcome, amount)
      ).to.emit(predictionMarket, "PositionTaken");

      const [shares, totalStake] = await predictionMarket.getUserPosition(
        marketId,
        user1.address,
        outcome
      );

      expect(shares).to.be.gt(0);
      expect(totalStake).to.equal(amount);
    });

    it("Should calculate shares correctly for first position", async function () {
      const outcome = 0;
      const amount = HUNDRED_USDC;

      await predictionMarket.connect(user1).takePosition(marketId, outcome, amount);

      const shares = await predictionMarket.getOutcomeShares(marketId, outcome);
      expect(shares).to.equal(amount);
    });

    it("Should allow multiple users to take positions", async function () {
      await predictionMarket.connect(user1).takePosition(marketId, 0, HUNDRED_USDC);
      await predictionMarket.connect(user2).takePosition(marketId, 1, HUNDRED_USDC);
      await predictionMarket.connect(user3).takePosition(marketId, 0, HUNDRED_USDC);

      const outcome0Shares = await predictionMarket.getOutcomeShares(marketId, 0);
      const outcome1Shares = await predictionMarket.getOutcomeShares(marketId, 1);

      expect(outcome0Shares).to.be.gt(0);
      expect(outcome1Shares).to.be.gt(0);
    });

    it("Should reject position after market end time", async function () {
      const duration = 1 * 60 * 60; // 1 hour
      const question = "Quick market";
      const outcomes = ["Yes", "No"];

      const tx = await predictionMarket.createMarket(question, outcomes, duration);
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment && log.fragment.name === "MarketCreated");
      const quickMarketId = event.args[0];

      // Fast forward time
      await time.increase(2 * 60 * 60);

      await expect(
        predictionMarket.connect(user1).takePosition(quickMarketId, 0, HUNDRED_USDC)
      ).to.be.revertedWith("Market closed");
    });

    it("Should reject position on invalid outcome", async function () {
      await expect(
        predictionMarket.connect(user1).takePosition(marketId, 5, HUNDRED_USDC)
      ).to.be.revertedWith("Invalid outcome");
    });
  });

  describe("Market Resolution", function () {
    let marketId;

    beforeEach(async function () {
      const question = "Will the team win?";
      const outcomes = ["Yes", "No"];
      const duration = 1 * 60 * 60; // 1 hour for testing

      const tx = await predictionMarket.createMarket(question, outcomes, duration);
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment && log.fragment.name === "MarketCreated");
      marketId = event.args[0];

      // Users take positions
      await predictionMarket.connect(user1).takePosition(marketId, 0, HUNDRED_USDC);
      await predictionMarket.connect(user2).takePosition(marketId, 1, HUNDRED_USDC);
    });

    it("Should resolve market after end time", async function () {
      // Fast forward past end time
      await time.increase(2 * 60 * 60);

      // Oracle resolves
      const winningOutcome = 0;
      await oracle.resolveMarket(marketId, winningOutcome);

      // Resolve market
      await expect(
        predictionMarket.resolveMarket(marketId, winningOutcome)
      ).to.emit(predictionMarket, "MarketResolved");
    });

    it("Should allow winners to claim payouts", async function () {
      await time.increase(2 * 60 * 60);

      const winningOutcome = 0;
      await oracle.resolveMarket(marketId, winningOutcome);
      await predictionMarket.resolveMarket(marketId, winningOutcome);

      const balanceBefore = await usdc.balanceOf(user1.address);

      await expect(
        predictionMarket.connect(user1).claimPayout(marketId)
      ).to.emit(predictionMarket, "PayoutClaimed");

      const balanceAfter = await usdc.balanceOf(user1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("Should reject payout claim for non-winners", async function () {
      await time.increase(2 * 60 * 60);

      const winningOutcome = 0; // user1 wins, user2 loses
      await oracle.resolveMarket(marketId, winningOutcome);
      await predictionMarket.resolveMarket(marketId, winningOutcome);

      await expect(
        predictionMarket.connect(user2).claimPayout(marketId)
      ).to.be.revertedWith("No winning shares");
    });

    it("Should reject double claiming", async function () {
      await time.increase(2 * 60 * 60);

      const winningOutcome = 0;
      await oracle.resolveMarket(marketId, winningOutcome);
      await predictionMarket.resolveMarket(marketId, winningOutcome);

      await predictionMarket.connect(user1).claimPayout(marketId);

      await expect(
        predictionMarket.connect(user1).claimPayout(marketId)
      ).to.be.revertedWith("Already claimed");
    });

    it("Should collect fees correctly", async function () {
      await time.increase(2 * 60 * 60);

      const winningOutcome = 0;
      await oracle.resolveMarket(marketId, winningOutcome);
      await predictionMarket.resolveMarket(marketId, winningOutcome);

      const totalFees = await predictionMarket.totalFeesCollected();
      expect(totalFees).to.be.gt(0);
    });
  });

  describe("Market Cancellation", function () {
    let marketId;

    beforeEach(async function () {
      const question = "Test market";
      const outcomes = ["Yes", "No"];
      const duration = 7 * 24 * 60 * 60;

      const tx = await predictionMarket.createMarket(question, outcomes, duration);
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment && log.fragment.name === "MarketCreated");
      marketId = event.args[0];

      await predictionMarket.connect(user1).takePosition(marketId, 0, HUNDRED_USDC);
    });

    it("Should allow owner to cancel market", async function () {
      await expect(
        predictionMarket.cancelMarket(marketId)
      ).to.emit(predictionMarket, "MarketCancelled");
    });

    it("Should allow users to refund after cancellation", async function () {
      await predictionMarket.cancelMarket(marketId);

      const balanceBefore = await usdc.balanceOf(user1.address);

      await predictionMarket.connect(user1).refund(marketId);

      const balanceAfter = await usdc.balanceOf(user1.address);
      expect(balanceAfter - balanceBefore).to.equal(HUNDRED_USDC);
    });
  });

  describe("Market Expiration", function () {
    it("Should expire market if not resolved in time", async function () {
      const question = "Test market";
      const outcomes = ["Yes", "No"];
      const duration = 1 * 60 * 60; // 1 hour

      const tx = await predictionMarket.createMarket(question, outcomes, duration);
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment && log.fragment.name === "MarketCreated");
      const marketId = event.args[0];

      // Fast forward past resolution time (endTime + 7 days)
      await time.increase(8 * 24 * 60 * 60);

      await predictionMarket.expireMarket(marketId);

      const market = await predictionMarket.markets(marketId);
      expect(market.status).to.equal(3); // Expired
    });
  });

  describe("Complex Scenarios", function () {
    it("Should handle multiple outcomes correctly", async function () {
      const question = "Who will win the election?";
      const outcomes = ["Candidate A", "Candidate B", "Candidate C"];
      const duration = 7 * 24 * 60 * 60;

      const tx = await predictionMarket.createMarket(question, outcomes, duration);
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment && log.fragment.name === "MarketCreated");
      const marketId = event.args[0];

      await predictionMarket.connect(user1).takePosition(marketId, 0, HUNDRED_USDC);
      await predictionMarket.connect(user2).takePosition(marketId, 1, HUNDRED_USDC);
      await predictionMarket.connect(user3).takePosition(marketId, 2, HUNDRED_USDC);

      await time.increase(8 * 24 * 60 * 60);

      const winningOutcome = 1;
      await oracle.resolveMarket(marketId, winningOutcome);
      await predictionMarket.resolveMarket(marketId, winningOutcome);

      await predictionMarket.connect(user2).claimPayout(marketId);

      const balance = await usdc.balanceOf(user2.address);
      expect(balance).to.be.gt(THOUSAND_USDC); // Should have profit
    });

    it("Should handle large number of positions", async function () {
      const question = "High volume market";
      const outcomes = ["Yes", "No"];
      const duration = 7 * 24 * 60 * 60;

      const tx = await predictionMarket.createMarket(question, outcomes, duration);
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment && log.fragment.name === "MarketCreated");
      const marketId = event.args[0];

      // Multiple positions
      for (let i = 0; i < 10; i++) {
        const user = i % 2 === 0 ? user1 : user2;
        const outcome = i % 2;
        await predictionMarket.connect(user).takePosition(marketId, outcome, HUNDRED_USDC);
      }

      const market = await predictionMarket.markets(marketId);
      expect(market.totalLiquidity).to.equal(HUNDRED_USDC * BigInt(10));
    });
  });
});

