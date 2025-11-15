// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./interfaces/IERC20.sol";
import "./Oracle.sol";

/**
 * @title PredictionMarketV2
 * @dev Enhanced prediction market with advanced features:
 * - Pausable for emergency stops
 * - Multiple pricing models (CPMM, LMSR, Linear)
 * - Partial position exits
 * - Market categories and templates
 * - Staking and liquidity incentives
 * - Dispute resolution
 * - Governance features
 */
contract PredictionMarketV2 is Ownable, ReentrancyGuard, Pausable {
    using Math for uint256;
    
    IERC20 public immutable usdcToken;
    Oracle public immutable oracle;
    
    // Fee configuration
    uint256 public feeBasisPoints = 300; // 3% default
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_FEE_BASIS_POINTS = 1000; // 10% max
    
    // Market configuration
    uint256 public constant MIN_MARKET_DURATION = 1 hours;
    uint256 public constant MAX_MARKET_DURATION = 365 days;
    uint256 public constant MIN_RESOLUTION_DELAY = 1 hours;
    uint256 public constant MAX_RESOLUTION_DELAY = 30 days;
    
    // Pricing models
    enum PricingModel {
        CPMM,      // Constant Product Market Maker
        LMSR,      // Logarithmic Market Scoring Rule
        Linear     // Linear pricing
    }
    
    // Market categories
    enum MarketCategory {
        Sports,
        Politics,
        Crypto,
        Economics,
        Technology,
        Entertainment,
        Other
    }
    
    struct Market {
        uint256 marketId;
        address creator;
        string question;
        string[] outcomes;
        uint256 endTime;
        uint256 resolutionTime;
        MarketStatus status;
        PricingModel pricingModel;
        MarketCategory category;
        uint256 totalLiquidity;
        uint256 totalFees;
        uint256 creationFee;
        uint256 minPositionSize;
        uint256 maxPositionSize;
        bool allowPartialExit;
        mapping(uint256 => uint256) outcomeShares;
        mapping(address => mapping(uint256 => uint256)) userShares;
        mapping(address => uint256) userStakes;
        mapping(address => uint256) userLiquidityProvided;
        uint256 totalLiquidityProvided;
    }
    
    enum MarketStatus {
        Active,
        Resolved,
        Cancelled,
        Expired,
        Disputed
    }
    
    // Staking and rewards
    struct StakingInfo {
        uint256 totalStaked;
        uint256 rewardRate; // Basis points
        uint256 lastUpdateTime;
        mapping(address => uint256) userStakes;
        mapping(address => uint256) userRewards;
    }
    
    // Dispute resolution
    struct Dispute {
        uint256 marketId;
        address disputer;
        uint256 proposedOutcome;
        string reason;
        uint256 timestamp;
        bool resolved;
    }
    
    uint256 private _marketCounter;
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    mapping(uint256 => bool) public marketExists;
    mapping(uint256 => Dispute) public disputes;
    mapping(address => uint256) public creatorReputation;
    
    StakingInfo public stakingInfo;
    uint256 public totalFeesCollected;
    uint256 public totalRewardsDistributed;
    
    // Events
    event MarketCreated(
        uint256 indexed marketId,
        address indexed creator,
        string question,
        MarketCategory category,
        PricingModel pricingModel,
        uint256 endTime
    );
    
    event PositionTaken(
        uint256 indexed marketId,
        address indexed user,
        uint256 outcome,
        uint256 amount,
        uint256 shares
    );
    
    event PositionExited(
        uint256 indexed marketId,
        address indexed user,
        uint256 outcome,
        uint256 shares,
        uint256 amount
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
    
    event MarketCancelled(uint256 indexed marketId);
    
    event DisputeCreated(
        uint256 indexed marketId,
        address indexed disputer,
        uint256 proposedOutcome
    );
    
    event DisputeResolved(
        uint256 indexed marketId,
        uint256 finalOutcome
    );
    
    event LiquidityProvided(
        uint256 indexed marketId,
        address indexed provider,
        uint256 amount
    );
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    
    constructor(address _usdcToken, address _oracle) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_oracle != address(0), "Invalid Oracle address");
        usdcToken = IERC20(_usdcToken);
        oracle = Oracle(_oracle);
        stakingInfo.rewardRate = 500; // 5% default reward rate
    }
    
    /**
     * @dev Create a new prediction market with advanced options
     */
    function createMarket(
        string memory question,
        string[] memory outcomes,
        uint256 duration,
        PricingModel pricingModel,
        MarketCategory category,
        uint256 minPositionSize,
        uint256 maxPositionSize,
        bool allowPartialExit
    ) external whenNotPaused returns (uint256) {
        require(bytes(question).length > 0, "Question required");
        require(outcomes.length >= 2, "At least 2 outcomes required");
        require(outcomes.length <= 10, "Too many outcomes");
        require(duration >= MIN_MARKET_DURATION, "Duration too short");
        require(duration <= MAX_MARKET_DURATION, "Duration too long");
        require(minPositionSize <= maxPositionSize, "Invalid position sizes");
        
        uint256 marketId = ++_marketCounter;
        uint256 endTime = block.timestamp + duration;
        
        Market storage market = markets[marketId];
        market.marketId = marketId;
        market.creator = msg.sender;
        market.question = question;
        market.outcomes = outcomes;
        market.endTime = endTime;
        market.resolutionTime = endTime + 7 days;
        market.status = MarketStatus.Active;
        market.pricingModel = pricingModel;
        market.category = category;
        market.minPositionSize = minPositionSize;
        market.maxPositionSize = maxPositionSize > 0 ? maxPositionSize : type(uint256).max;
        market.allowPartialExit = allowPartialExit;
        
        // Creation fee (optional, can be 0)
        if (feeBasisPoints > 0) {
            market.creationFee = (100 * 10**6 * feeBasisPoints) / BASIS_POINTS; // 100 USDC base * fee
            if (market.creationFee > 0) {
                require(
                    usdcToken.transferFrom(msg.sender, address(this), market.creationFee),
                    "Creation fee transfer failed"
                );
            }
        }
        
        marketExists[marketId] = true;
        creatorReputation[msg.sender]++;
        
        emit MarketCreated(marketId, msg.sender, question, category, pricingModel, endTime);
        
        return marketId;
    }
    
    /**
     * @dev Take a position with validation
     */
    function takePosition(
        uint256 marketId,
        uint256 outcome,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(marketExists[marketId], "Market does not exist");
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp < market.endTime, "Market closed");
        require(outcome < market.outcomes.length, "Invalid outcome");
        require(amount >= market.minPositionSize, "Amount below minimum");
        require(amount <= market.maxPositionSize, "Amount above maximum");
        
        require(
            usdcToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        uint256 shares = calculateShares(marketId, outcome, amount, market.pricingModel);
        require(shares > 0, "Invalid shares calculated");
        
        market.totalLiquidity += amount;
        market.outcomeShares[outcome] += shares;
        market.userShares[msg.sender][outcome] += shares;
        market.userStakes[msg.sender] += amount;
        
        emit PositionTaken(marketId, msg.sender, outcome, amount, shares);
    }
    
    /**
     * @dev Exit a partial or full position
     */
    function exitPosition(
        uint256 marketId,
        uint256 outcome,
        uint256 shares
    ) external nonReentrant whenNotPaused {
        require(marketExists[marketId], "Market does not exist");
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(market.allowPartialExit, "Partial exit not allowed");
        require(block.timestamp < market.endTime, "Market closed");
        
        uint256 userShares = market.userShares[msg.sender][outcome];
        require(userShares >= shares, "Insufficient shares");
        require(shares > 0, "Shares must be > 0");
        
        uint256 amount = calculateExitAmount(marketId, outcome, shares, market.pricingModel);
        require(amount > 0, "Invalid exit amount");
        
        // Update state
        market.userShares[msg.sender][outcome] -= shares;
        market.outcomeShares[outcome] -= shares;
        market.userStakes[msg.sender] -= amount;
        market.totalLiquidity -= amount;
        
        // Apply exit fee (smaller than entry fee)
        uint256 exitFee = (amount * feeBasisPoints) / (BASIS_POINTS * 2); // Half of entry fee
        uint256 payout = amount - exitFee;
        market.totalFees += exitFee;
        totalFeesCollected += exitFee;
        
        require(usdcToken.transfer(msg.sender, payout), "Transfer failed");
        
        emit PositionExited(marketId, msg.sender, outcome, shares, payout);
    }
    
    /**
     * @dev Calculate shares based on pricing model
     */
    function calculateShares(
        uint256 marketId,
        uint256 outcome,
        uint256 amount,
        PricingModel model
    ) public view returns (uint256) {
        if (model == PricingModel.CPMM) {
            return calculateSharesCPMM(marketId, outcome, amount);
        } else if (model == PricingModel.LMSR) {
            return calculateSharesLMSR(marketId, outcome, amount);
        } else {
            return calculateSharesLinear(marketId, outcome, amount);
        }
    }
    
    /**
     * @dev Constant Product Market Maker
     */
    function calculateSharesCPMM(
        uint256 marketId,
        uint256 outcome,
        uint256 amount
    ) internal view returns (uint256) {
        Market storage market = markets[marketId];
        uint256 totalShares = 0;
        for (uint256 i = 0; i < market.outcomes.length; i++) {
            totalShares += market.outcomeShares[i];
        }
        
        if (totalShares == 0) return amount;
        
        uint256 outcomeLiquidity = market.outcomeShares[outcome];
        uint256 otherLiquidity = totalShares - outcomeLiquidity;
        
        if (otherLiquidity == 0) {
            return (amount * 95) / 100;
        }
        
        if (outcomeLiquidity == 0) {
            return (amount * otherLiquidity) / (otherLiquidity + amount);
        }
        
        uint256 k = outcomeLiquidity * otherLiquidity;
        uint256 newOutcomeLiquidity = outcomeLiquidity + amount;
        if (newOutcomeLiquidity == 0) return amount;
        
        uint256 newOtherLiquidity = k / newOutcomeLiquidity;
        if (newOtherLiquidity >= otherLiquidity) return 0;
        
        uint256 shares = otherLiquidity - newOtherLiquidity;
        return shares > 0 ? shares : amount / 100;
    }
    
    /**
     * @dev Logarithmic Market Scoring Rule (simplified)
     */
    function calculateSharesLMSR(
        uint256 marketId,
        uint256 outcome,
        uint256 amount
    ) internal view returns (uint256) {
        Market storage market = markets[marketId];
        uint256 totalShares = 0;
        for (uint256 i = 0; i < market.outcomes.length; i++) {
            totalShares += market.outcomeShares[i];
        }
        
        if (totalShares == 0) return amount;
        
        uint256 outcomeShares = market.outcomeShares[outcome];
        uint256 currentProbability = (outcomeShares * BASIS_POINTS) / totalShares;
        uint256 shares = (amount * (BASIS_POINTS - currentProbability)) / BASIS_POINTS;
        
        return shares > 0 ? shares : amount / 100;
    }
    
    /**
     * @dev Linear pricing
     */
    function calculateSharesLinear(
        uint256 marketId,
        uint256 outcome,
        uint256 amount
    ) internal view returns (uint256) {
        Market storage market = markets[marketId];
        uint256 totalShares = 0;
        for (uint256 i = 0; i < market.outcomes.length; i++) {
            totalShares += market.outcomeShares[i];
        }
        
        if (totalShares == 0) return amount;
        
        uint256 outcomeShares = market.outcomeShares[outcome];
        if (outcomeShares == 0) return amount;
        
        uint256 probability = (outcomeShares * BASIS_POINTS) / totalShares;
        uint256 shares = (amount * BASIS_POINTS) / probability;
        
        return shares;
    }
    
    /**
     * @dev Calculate exit amount
     */
    function calculateExitAmount(
        uint256 marketId,
        uint256 outcome,
        uint256 shares,
        PricingModel model
    ) public view returns (uint256) {
        Market storage market = markets[marketId];
        uint256 totalShares = market.outcomeShares[outcome];
        
        if (totalShares == 0 || shares == 0) return 0;
        
        // Proportional exit based on current market state
        uint256 totalLiquidity = market.totalLiquidity;
        uint256 outcomeLiquidity = market.outcomeShares[outcome];
        
        if (outcomeLiquidity == 0) return 0;
        
        // Simple proportional calculation
        return (totalLiquidity * shares) / totalShares;
    }
    
    /**
     * @dev Provide liquidity to a market (earn fees)
     */
    function provideLiquidity(
        uint256 marketId,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(marketExists[marketId], "Market does not exist");
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(amount > 0, "Amount must be > 0");
        
        require(
            usdcToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        market.userLiquidityProvided[msg.sender] += amount;
        market.totalLiquidityProvided += amount;
        market.totalLiquidity += amount;
        
        emit LiquidityProvided(marketId, msg.sender, amount);
    }
    
    /**
     * @dev Stake tokens to earn rewards
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        
        updateRewards(msg.sender);
        
        require(
            usdcToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        stakingInfo.userStakes[msg.sender] += amount;
        stakingInfo.totalStaked += amount;
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @dev Unstake tokens
     */
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(stakingInfo.userStakes[msg.sender] >= amount, "Insufficient stake");
        
        updateRewards(msg.sender);
        
        stakingInfo.userStakes[msg.sender] -= amount;
        stakingInfo.totalStaked -= amount;
        
        require(usdcToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit Unstaked(msg.sender, amount);
    }
    
    /**
     * @dev Claim staking rewards
     */
    function claimRewards() external nonReentrant {
        updateRewards(msg.sender);
        
        uint256 rewards = stakingInfo.userRewards[msg.sender];
        require(rewards > 0, "No rewards to claim");
        
        stakingInfo.userRewards[msg.sender] = 0;
        totalRewardsDistributed += rewards;
        
        require(usdcToken.transfer(msg.sender, rewards), "Transfer failed");
        
        emit RewardsClaimed(msg.sender, rewards);
    }
    
    /**
     * @dev Update rewards for a user
     */
    function updateRewards(address user) internal {
        if (stakingInfo.totalStaked == 0) return;
        
        uint256 timeElapsed = block.timestamp - stakingInfo.lastUpdateTime;
        if (timeElapsed == 0) return;
        
        uint256 totalRewards = (stakingInfo.totalStaked * stakingInfo.rewardRate * timeElapsed) / (BASIS_POINTS * 365 days);
        uint256 userReward = (totalRewards * stakingInfo.userStakes[user]) / stakingInfo.totalStaked;
        
        stakingInfo.userRewards[user] += userReward;
        stakingInfo.lastUpdateTime = block.timestamp;
    }
    
    /**
     * @dev Create a dispute for market resolution
     */
    function createDispute(
        uint256 marketId,
        uint256 proposedOutcome,
        string memory reason
    ) external {
        require(marketExists[marketId], "Market does not exist");
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Resolved, "Market not resolved");
        require(proposedOutcome < market.outcomes.length, "Invalid outcome");
        require(disputes[marketId].resolved == false, "Dispute already exists");
        
        // Must have a position in the market
        uint256 userStake = market.userStakes[msg.sender];
        require(userStake > 0, "Must have position to dispute");
        
        disputes[marketId] = Dispute({
            marketId: marketId,
            disputer: msg.sender,
            proposedOutcome: proposedOutcome,
            reason: reason,
            timestamp: block.timestamp,
            resolved: false
        });
        
        market.status = MarketStatus.Disputed;
        
        emit DisputeCreated(marketId, msg.sender, proposedOutcome);
    }
    
    /**
     * @dev Resolve a dispute (owner/oracle only)
     */
    function resolveDispute(
        uint256 marketId,
        uint256 finalOutcome
    ) external {
        require(marketExists[marketId], "Market does not exist");
        Dispute storage dispute = disputes[marketId];
        require(!dispute.resolved, "Dispute already resolved");
        require(msg.sender == owner() || msg.sender == address(oracle), "Not authorized");
        
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Disputed, "Market not disputed");
        require(finalOutcome < market.outcomes.length, "Invalid outcome");
        
        dispute.resolved = true;
        market.status = MarketStatus.Resolved;
        
        emit DisputeResolved(marketId, finalOutcome);
    }
    
    /**
     * @dev Resolve a market
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
        
        uint256 fees = (market.totalLiquidity * feeBasisPoints) / BASIS_POINTS;
        market.totalFees = fees;
        totalFeesCollected += fees;
        
        emit MarketResolved(marketId, winningOutcome, market.totalLiquidity - fees);
    }
    
    /**
     * @dev Claim payout
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
    
    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function setFeeBasisPoints(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE_BASIS_POINTS, "Fee too high");
        feeBasisPoints = newFee;
    }
    
    function setRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 5000, "Rate too high"); // Max 50%
        stakingInfo.rewardRate = newRate;
    }
    
    function withdrawFees() external onlyOwner {
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        require(usdcToken.transfer(owner(), amount), "Transfer failed");
    }
    
    // View functions
    function getMarket(uint256 marketId) external view returns (
        address creator,
        string memory question,
        string[] memory outcomes,
        uint256 endTime,
        MarketStatus status,
        PricingModel pricingModel,
        MarketCategory category,
        uint256 totalLiquidity
    ) {
        require(marketExists[marketId], "Market does not exist");
        Market storage market = markets[marketId];
        return (
            market.creator,
            market.question,
            market.outcomes,
            market.endTime,
            market.status,
            market.pricingModel,
            market.category,
            market.totalLiquidity
        );
    }
    
    function getMarketCount() external view returns (uint256) {
        return _marketCounter;
    }
}

