const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MarketFactory", function () {
  let predictionMarket;
  let marketFactory;
  let oracle;
  let usdc;
  let owner;
  let user1;
  let user2;

  const USDC_DECIMALS = 6;
  const THOUSAND_USDC = ethers.parseUnits("1000", USDC_DECIMALS);

  this.timeout(120000); // Increase timeout to 120 seconds

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    const Oracle = await ethers.getContractFactory("Oracle");
    oracle = await Oracle.deploy();

    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    predictionMarket = await PredictionMarket.deploy(
      await usdc.getAddress(),
      await oracle.getAddress()
    );

    const MarketFactory = await ethers.getContractFactory("MarketFactory");
    marketFactory = await MarketFactory.deploy(await predictionMarket.getAddress());

    await usdc.transfer(user1.address, THOUSAND_USDC);
    await usdc.transfer(user2.address, THOUSAND_USDC);
  });

  describe("Market Creation", function () {
    it("Should create market via factory", async function () {
      const question = "Test question";
      const outcomes = ["Yes", "No"];
      const duration = 7 * 24 * 60 * 60;

      const tx = await marketFactory.connect(user1).createMarket(question, outcomes, duration);
      await expect(tx).to.emit(marketFactory, "MarketCreatedViaFactory");

      expect(await marketFactory.getMarketCount()).to.equal(1);
    });

    it("Should track user markets", async function () {
      const question1 = "Question 1";
      const question2 = "Question 2";
      const outcomes = ["Yes", "No"];
      const duration = 7 * 24 * 60 * 60;

      await marketFactory.connect(user1).createMarket(question1, outcomes, duration);
      await marketFactory.connect(user1).createMarket(question2, outcomes, duration);

      const userMarkets = await marketFactory.getUserMarkets(user1.address);
      expect(userMarkets.length).to.equal(2);
    });

    it("Should get recent markets", async function () {
      const outcomes = ["Yes", "No"];
      const duration = 7 * 24 * 60 * 60;

      await marketFactory.connect(user1).createMarket("Question 1", outcomes, duration);
      await marketFactory.connect(user2).createMarket("Question 2", outcomes, duration);
      await marketFactory.connect(user1).createMarket("Question 3", outcomes, duration);

      const recent = await marketFactory.getRecentMarkets(2);
      expect(recent.length).to.equal(2);
      expect(recent[1].question).to.equal("Question 3");
    });
  });
});

