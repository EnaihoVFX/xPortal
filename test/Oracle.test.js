const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Oracle", function () {
  let oracle;
  let owner;
  let resolver;
  let user;

  beforeEach(async function () {
    [owner, resolver, user] = await ethers.getSigners();

    const Oracle = await ethers.getContractFactory("Oracle");
    oracle = await Oracle.deploy();
  });

  describe("Authorization", function () {
    it("Should allow owner to authorize resolvers", async function () {
      await expect(
        oracle.authorizeResolver(resolver.address)
      ).to.emit(oracle, "ResolverAuthorized");

      expect(await oracle.authorizedResolvers(resolver.address)).to.be.true;
    });

    it("Should allow owner to revoke resolvers", async function () {
      await oracle.authorizeResolver(resolver.address);
      await oracle.revokeResolver(resolver.address);

      expect(await oracle.authorizedResolvers(resolver.address)).to.be.false;
    });

    it("Should reject unauthorized resolution", async function () {
      await expect(
        oracle.connect(user).resolveMarket(1, 0)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Market Resolution", function () {
    it("Should resolve market", async function () {
      const marketId = 1;
      const outcome = 0;

      await expect(
        oracle.resolveMarket(marketId, outcome)
      ).to.emit(oracle, "MarketResolved");

      const [resolved, resolvedOutcome] = await oracle.getResolution(marketId);
      expect(resolved).to.be.true;
      expect(resolvedOutcome).to.equal(outcome);
    });

    it("Should reject double resolution", async function () {
      const marketId = 1;
      const outcome = 0;

      await oracle.resolveMarket(marketId, outcome);

      await expect(
        oracle.resolveMarket(marketId, outcome)
      ).to.be.revertedWith("Market already resolved");
    });

    it("Should allow authorized resolver to resolve", async function () {
      await oracle.authorizeResolver(resolver.address);

      const marketId = 1;
      const outcome = 1;

      await expect(
        oracle.connect(resolver).resolveMarket(marketId, outcome)
      ).to.emit(oracle, "MarketResolved");
    });
  });
});


