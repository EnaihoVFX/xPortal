// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./interfaces/IERC20.sol";
import "./Oracle.sol";

/**
 * @title MarketPlace
 * @dev Prediction market with share-based trading
 * Features:
 * - Buy/Sell shares of outcomes
 * - Probability-based pricing
 * - Liquidity pools
 * - Market discovery
 * - Portfolio management
 */
contract MarketPlace is Ownable, ReentrancyGuard {
    using Math for uint256;
    
    IERC20 public immutable usdcToken;
    Oracle public immutable oracle;
    
    uint256 public constant FEE_BASIS_POINTS = 200; // 2% fee
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_MARKET_DURATION = 1 hours;
    uint256 public constant MAX_MARKET_DURATION = 365 days;
    
    struct Market {
        uint256 marketId;
        address creator;
        string question;
        string description;
        string[] outcomes;
        uint256 endTime;
        uint256 resolutionTime;
        MarketStatus status;
        MarketCategory category;
        uint256 totalLiquidity;
        uint256 totalVolume;
        uint256 totalFees;
        uint256 creationTime;
        mapping(uint256 => uint256) outcomeLiquidity; // outcome => liquidity
        mapping(uint256 => uint256) outcomeShares; // outcome => total shares
        mapping(address => mapping(uint256 => uint256)) userShares; // user => outcome => shares
        mapping(address => uint256) userVolume; // user => total volume traded
    }
    
    enum MarketStatus {
        Active,
        Resolved,
        Cancelled,
        Expired
    }
    
    enum MarketCategory {
        Politics,
        Sports,
        Crypto,
        Economics,
        Technology,
        Entertainment,
        Weather,
        Other
    }
    
    uint256 private _marketCounter;
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    mapping(uint256 => bool) public marketExists;
    mapping(address => uint256[]) public userMarkets; // user => market IDs
    mapping(MarketCategory => uint256[]) public categoryMarkets; // category => market IDs
    
    uint256 public totalFeesCollected;
    uint256 public totalVolume;
    
    event MarketCreated(
        uint256 indexed marketId,
        address indexed creator,
        string question,
        MarketCategory category,
        uint256 endTime
    );
    
    event SharesBought(
        uint256 indexed marketId,
        address indexed buyer,
        uint256 outcome,
        uint256 shares,
        uint256 cost,
        uint256 probability
    );
    
    event SharesSold(
        uint256 indexed marketId,
        address indexed seller,
        uint256 outcome,
        uint256 shares,
        uint256 proceeds,
        uint256 probability
    );
    
    event MarketResolved(
        uint256 indexed marketId,
        uint256 winningOutcome,
        uint256 totalPayout
    );
    
    event PayoutClaimed(
        uint256 indexed marketId,
        address indexed user,
        uint256 amount
    );
    
    constructor(address _usdcToken, address _oracle) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_oracle != address(0), "Invalid Oracle address");
        usdcToken = IERC20(_usdcToken);
        oracle = Oracle(_oracle);
    }
    
    /**
     * @dev Create a new market
     */
    function createMarket(
        string memory question,
        string memory description,
        string[] memory outcomes,
        uint256 duration,
        MarketCategory category
    ) external returns (uint256) {
        require(bytes(question).length > 0, "Question required");
        require(outcomes.length >= 2, "At least 2 outcomes required");
        require(outcomes.length <= 10, "Too many outcomes");
        require(duration >= MIN_MARKET_DURATION, "Duration too short");
        require(duration <= MAX_MARKET_DURATION, "Duration too long");
        
        uint256 marketId = ++_marketCounter;
        uint256 endTime = block.timestamp + duration;
        
        Market storage market = markets[marketId];
        market.marketId = marketId;
        market.creator = msg.sender;
        market.question = question;
        market.description = description;
        market.outcomes = outcomes;
        market.endTime = endTime;
        market.resolutionTime = endTime + 7 days;
        market.status = MarketStatus.Active;
        market.category = category;
        market.creationTime = block.timestamp;
        
        marketExists[marketId] = true;
        userMarkets[msg.sender].push(marketId);
        categoryMarkets[category].push(marketId);
        
        emit MarketCreated(marketId, msg.sender, question, category, endTime);
        
        return marketId;
    }
    
    /**
     * @dev Buy shares of an outcome
     * @param marketId The market ID
     * @param outcome The outcome index
     * @param amount The amount of USDC to spend
     * @return shares The number of shares received
     */
    function buyShares(
        uint256 marketId,
        uint256 outcome,
        uint256 amount
    ) external nonReentrant returns (uint256) {
        require(marketExists[marketId], "Market does not exist");
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp < market.endTime, "Market closed");
        require(outcome < market.outcomes.length, "Invalid outcome");
        require(amount > 0, "Amount must be > 0");
        
        require(
            usdcToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        uint256 shares = calculateSharesToBuy(marketId, outcome, amount);
        require(shares > 0, "Invalid shares");
        
        // Calculate fee
        uint256 fee = (amount * FEE_BASIS_POINTS) / BASIS_POINTS;
        uint256 netAmount = amount - fee;
        
        // Update market state
        market.totalLiquidity += netAmount;
        market.totalVolume += amount;
        market.outcomeLiquidity[outcome] += netAmount;
        market.outcomeShares[outcome] += shares;
        market.userShares[msg.sender][outcome] += shares;
        market.userVolume[msg.sender] += amount;
        totalVolume += amount;
        totalFeesCollected += fee;
        market.totalFees += fee;
        
        uint256 probability = getOutcomeProbability(marketId, outcome);
        
        emit SharesBought(marketId, msg.sender, outcome, shares, amount, probability);
        
        return shares;
    }
    
    /**
     * @dev Sell shares of an outcome
     * @param marketId The market ID
     * @param outcome The outcome index
     * @param shares The number of shares to sell
     * @return proceeds The USDC received
     */
    function sellShares(
        uint256 marketId,
        uint256 outcome,
        uint256 shares
    ) external nonReentrant returns (uint256) {
        require(marketExists[marketId], "Market does not exist");
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp < market.endTime, "Market closed");
        require(outcome < market.outcomes.length, "Invalid outcome");
        
        uint256 userShares = market.userShares[msg.sender][outcome];
        require(userShares >= shares, "Insufficient shares");
        require(shares > 0, "Shares must be > 0");
        
        uint256 proceeds = calculateSharesToSell(marketId, outcome, shares);
        require(proceeds > 0, "Invalid proceeds");
        
        // Calculate fee
        uint256 fee = (proceeds * FEE_BASIS_POINTS) / BASIS_POINTS;
        uint256 netProceeds = proceeds - fee;
        
        // Update market state
        market.totalLiquidity -= proceeds;
        market.totalVolume += proceeds;
        market.outcomeLiquidity[outcome] -= proceeds;
        market.outcomeShares[outcome] -= shares;
        market.userShares[msg.sender][outcome] -= shares;
        market.userVolume[msg.sender] += proceeds;
        totalVolume += proceeds;
        totalFeesCollected += fee;
        market.totalFees += fee;
        
        require(usdcToken.transfer(msg.sender, netProceeds), "Transfer failed");
        
        uint256 probability = getOutcomeProbability(marketId, outcome);
        
        emit SharesSold(marketId, msg.sender, outcome, shares, netProceeds, probability);
        
        return netProceeds;
    }
    
    /**
     * @dev Calculate shares received for buying
     * Uses LMSR (Logarithmic Market Scoring Rule)
     */
    function calculateSharesToBuy(
        uint256 marketId,
        uint256 outcome,
        uint256 amount
    ) public view returns (uint256) {
        Market storage market = markets[marketId];
        
        uint256 totalLiquidity = market.totalLiquidity;
        uint256 outcomeLiquidity = market.outcomeLiquidity[outcome];
        
        if (totalLiquidity == 0) {
            // First trade: 1:1 ratio
            return amount;
        }
        
        // Calculate probability before trade
        uint256 probBefore = (outcomeLiquidity * BASIS_POINTS) / totalLiquidity;
        if (probBefore == 0) probBefore = 1; // Minimum 0.01%
        
        // Calculate new liquidity
        uint256 newOutcomeLiquidity = outcomeLiquidity + amount;
        uint256 newTotalLiquidity = totalLiquidity + amount;
        
        // Calculate probability after trade
        uint256 probAfter = (newOutcomeLiquidity * BASIS_POINTS) / newTotalLiquidity;
        
        // Shares = amount * (1 - average probability)
        uint256 avgProb = (probBefore + probAfter) / 2;
        uint256 shares = (amount * (BASIS_POINTS - avgProb)) / BASIS_POINTS;
        
        // Ensure minimum shares
        return shares > 0 ? shares : amount / 100;
    }
    
    /**
     * @dev Calculate proceeds from selling shares
     */
    function calculateSharesToSell(
        uint256 marketId,
        uint256 outcome,
        uint256 shares
    ) public view returns (uint256) {
        Market storage market = markets[marketId];
        
        uint256 totalShares = market.outcomeShares[outcome];
        if (totalShares == 0) return 0;
        
        uint256 totalLiquidity = market.totalLiquidity;
        uint256 outcomeLiquidity = market.outcomeLiquidity[outcome];
        
        // Proportional to current liquidity
        uint256 proceeds = (outcomeLiquidity * shares) / totalShares;
        
        return proceeds;
    }
    
    /**
     * @dev Get probability of an outcome (0-100%)
     */
    function getOutcomeProbability(
        uint256 marketId,
        uint256 outcome
    ) public view returns (uint256) {
        Market storage market = markets[marketId];
        uint256 totalLiquidity = market.totalLiquidity;
        
        if (totalLiquidity == 0) {
            // Equal probability if no liquidity
            return BASIS_POINTS / market.outcomes.length;
        }
        
        uint256 outcomeLiquidity = market.outcomeLiquidity[outcome];
        return (outcomeLiquidity * BASIS_POINTS) / totalLiquidity;
    }
    
    /**
     * @dev Get all outcome probabilities
     */
    function getAllProbabilities(uint256 marketId) external view returns (uint256[] memory) {
        Market storage market = markets[marketId];
        uint256[] memory probabilities = new uint256[](market.outcomes.length);
        
        for (uint256 i = 0; i < market.outcomes.length; i++) {
            probabilities[i] = getOutcomeProbability(marketId, i);
        }
        
        return probabilities;
    }
    
    /**
     * @dev Resolve market
     */
    function resolveMarket(
        uint256 marketId,
        uint256 winningOutcome
    ) external {
        require(marketExists[marketId], "Market does not exist");
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp >= market.endTime, "Market still active");
        require(winningOutcome < market.outcomes.length, "Invalid outcome");
        
        (bool resolved, uint256 oracleOutcome) = oracle.getResolution(marketId);
        require(resolved, "Oracle not resolved");
        require(oracleOutcome == winningOutcome, "Outcome mismatch");
        
        market.status = MarketStatus.Resolved;
        
        emit MarketResolved(marketId, winningOutcome, market.totalLiquidity);
    }
    
    /**
     * @dev Claim payout for winning shares
     */
    function claimPayout(uint256 marketId) external nonReentrant {
        require(marketExists[marketId], "Market does not exist");
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Resolved, "Market not resolved");
        require(!hasClaimed[marketId][msg.sender], "Already claimed");
        
        (bool resolved, uint256 winningOutcome) = oracle.getResolution(marketId);
        require(resolved, "Market not resolved");
        
        uint256 userShares = market.userShares[msg.sender][winningOutcome];
        require(userShares > 0, "No winning shares");
        
        uint256 totalWinningShares = market.outcomeShares[winningOutcome];
        uint256 payoutPool = market.totalLiquidity - market.totalFees;
        uint256 payout = (payoutPool * userShares) / totalWinningShares;
        
        require(payout > 0, "No payout");
        
        hasClaimed[marketId][msg.sender] = true;
        
        require(usdcToken.transfer(msg.sender, payout), "Transfer failed");
        
        emit PayoutClaimed(marketId, msg.sender, payout);
    }
    
    /**
     * @dev Get market info
     */
    function getMarket(uint256 marketId) external view returns (
        address creator,
        string memory question,
        string memory description,
        string[] memory outcomes,
        uint256 endTime,
        MarketStatus status,
        MarketCategory category,
        uint256 totalLiquidity,
        uint256 totalVolume
    ) {
        require(marketExists[marketId], "Market does not exist");
        Market storage market = markets[marketId];
        return (
            market.creator,
            market.question,
            market.description,
            market.outcomes,
            market.endTime,
            market.status,
            market.category,
            market.totalLiquidity,
            market.totalVolume
        );
    }
    
    /**
     * @dev Get user shares for a specific market and outcome
     */
    function getUserShares(
        uint256 marketId,
        address user,
        uint256 outcome
    ) external view returns (uint256) {
        require(marketExists[marketId], "Market does not exist");
        Market storage market = markets[marketId];
        require(outcome < market.outcomes.length, "Invalid outcome");
        return market.userShares[user][outcome];
    }
    
    /**
     * @dev Get user portfolio (all positions)
     */
    function getUserPortfolio(address user) external view returns (
        uint256[] memory marketIds,
        uint256[] memory outcomes,
        uint256[] memory shares
    ) {
        uint256[] memory userMarketIds = userMarkets[user];
        uint256 count = 0;
        
        // Count positions
        for (uint256 i = 0; i < userMarketIds.length; i++) {
            Market storage market = markets[userMarketIds[i]];
            for (uint256 j = 0; j < market.outcomes.length; j++) {
                if (market.userShares[user][j] > 0) {
                    count++;
                }
            }
        }
        
        marketIds = new uint256[](count);
        outcomes = new uint256[](count);
        shares = new uint256[](count);
        
        uint256 index = 0;
        for (uint256 i = 0; i < userMarketIds.length; i++) {
            Market storage market = markets[userMarketIds[i]];
            for (uint256 j = 0; j < market.outcomes.length; j++) {
                if (market.userShares[user][j] > 0) {
                    marketIds[index] = userMarketIds[i];
                    outcomes[index] = j;
                    shares[index] = market.userShares[user][j];
                    index++;
                }
            }
        }
    }
    
    /**
     * @dev Get markets by category
     */
    function getMarketsByCategory(MarketCategory category) external view returns (uint256[] memory) {
        return categoryMarkets[category];
    }
    
    /**
     * @dev Get user markets
     */
    function getUserMarkets(address user) external view returns (uint256[] memory) {
        return userMarkets[user];
    }
    
    function getMarketCount() external view returns (uint256) {
        return _marketCounter;
    }
    
    function withdrawFees() external onlyOwner {
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        require(usdcToken.transfer(owner(), amount), "Transfer failed");
    }
}

