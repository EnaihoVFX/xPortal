// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IPredictionMarket.sol";
import "./Oracle.sol";

/**
 * @title PredictionMarket
 * @dev Core prediction market contract with robust features
 * Supports multiple outcomes, dynamic pricing, fees, and oracle-based resolution
 */
contract PredictionMarket is IPredictionMarket, Ownable, ReentrancyGuard {
    using Math for uint256;
    
    IERC20 public immutable usdcToken;
    Oracle public immutable oracle;
    
    uint256 public constant FEE_BASIS_POINTS = 300; // 3% fee
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_MARKET_DURATION = 1 hours;
    uint256 public constant MAX_MARKET_DURATION = 365 days;
    
    uint256 private _marketCounter;
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    mapping(uint256 => bool) public marketExists;
    
    uint256 public totalFeesCollected;
    
    constructor(address _usdcToken, address _oracle) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_oracle != address(0), "Invalid Oracle address");
        usdcToken = IERC20(_usdcToken);
        oracle = Oracle(_oracle);
    }
    
    /**
     * @dev Create a new prediction market
     * @param question The market question
     * @param outcomes Array of possible outcomes
     * @param duration Duration in seconds until market closes
     * @return marketId The created market ID
     */
    function createMarket(
        string memory question,
        string[] memory outcomes,
        uint256 duration
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
        market.outcomes = outcomes;
        market.endTime = endTime;
        market.resolutionTime = endTime + 7 days; // 7 days grace period for resolution
        market.status = MarketStatus.Active;
        
        marketExists[marketId] = true;
        
        emit MarketCreated(marketId, msg.sender, question, endTime);
        
        return marketId;
    }
    
    /**
     * @dev Take a position in a market
     * @param marketId The market ID
     * @param outcome The outcome index to bet on
     * @param amount The amount of USDC to bet
     */
    function takePosition(
        uint256 marketId,
        uint256 outcome,
        uint256 amount
    ) external nonReentrant {
        require(marketExists[marketId], "Market does not exist");
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp < market.endTime, "Market closed");
        require(outcome < market.outcomes.length, "Invalid outcome");
        require(amount > 0, "Amount must be > 0");
        
        // Transfer USDC from user
        require(
            usdcToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        // Calculate shares based on current market state
        uint256 shares = calculateShares(marketId, outcome, amount);
        
        // Update market state
        market.totalLiquidity += amount;
        market.outcomeShares[outcome] += shares;
        market.userShares[msg.sender][outcome] += shares;
        market.userStakes[msg.sender] += amount;
        
        emit PositionTaken(marketId, msg.sender, outcome, amount, shares);
    }
    
    /**
     * @dev Calculate shares for a given bet amount
     * Uses constant product formula for dynamic pricing
     */
    function calculateShares(
        uint256 marketId,
        uint256 outcome,
        uint256 amount
    ) public view returns (uint256) {
        Market storage market = markets[marketId];
        
        uint256 totalShares = 0;
        for (uint256 i = 0; i < market.outcomes.length; i++) {
            totalShares += market.outcomeShares[i];
        }
        
        // If no liquidity, 1:1 ratio
        if (totalShares == 0) {
            return amount;
        }
        
        // Constant product market maker formula
        uint256 outcomeLiquidity = market.outcomeShares[outcome];
        uint256 otherLiquidity = totalShares - outcomeLiquidity;
        
        if (otherLiquidity == 0) {
            // All liquidity on this outcome, linear pricing with small premium
            return (amount * 95) / 100; // 5% premium
        }
        
        if (outcomeLiquidity == 0) {
            // No liquidity on this outcome, favorable pricing
            return (amount * otherLiquidity) / (otherLiquidity + amount);
        }
        
        // x * y = k formula: calculate shares received
        // k = x * y, new_x = x + amount, new_y = k / new_x
        // shares = y - new_y
        uint256 k = outcomeLiquidity * otherLiquidity;
        uint256 newOutcomeLiquidity = outcomeLiquidity + amount;
        
        // Prevent division issues
        if (newOutcomeLiquidity == 0) {
            return amount;
        }
        
        uint256 newOtherLiquidity = k / newOutcomeLiquidity;
        
        // Ensure we don't underflow
        if (newOtherLiquidity >= otherLiquidity) {
            return 0;
        }
        
        uint256 shares = otherLiquidity - newOtherLiquidity;
        
        // Ensure minimum shares
        if (shares == 0) {
            shares = amount / 100; // Minimum 1% of amount
        }
        
        return shares;
    }
    
    /**
     * @dev Resolve a market (called by oracle)
     * @param marketId The market ID to resolve
     * @param winningOutcome The winning outcome index
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
        
        // Verify resolution from oracle
        (bool resolved, uint256 oracleOutcome) = oracle.getResolution(marketId);
        require(resolved, "Oracle not resolved");
        require(oracleOutcome == winningOutcome, "Outcome mismatch");
        
        market.status = MarketStatus.Resolved;
        
        // Calculate and collect fees
        uint256 fees = (market.totalLiquidity * FEE_BASIS_POINTS) / BASIS_POINTS;
        market.totalFees = fees;
        totalFeesCollected += fees;
        
        emit MarketResolved(marketId, winningOutcome, market.totalLiquidity - fees);
    }
    
    /**
     * @dev Claim payout for a winning position
     * @param marketId The market ID
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
        
        // Calculate payout proportional to shares
        uint256 totalWinningShares = market.outcomeShares[winningOutcome];
        uint256 payoutPool = market.totalLiquidity - market.totalFees;
        uint256 payout = (payoutPool * userShares) / totalWinningShares;
        
        require(payout > 0, "No payout");
        
        hasClaimed[marketId][msg.sender] = true;
        
        require(usdcToken.transfer(msg.sender, payout), "Transfer failed");
        
        emit PayoutClaimed(marketId, msg.sender, payout);
    }
    
    /**
     * @dev Cancel a market (only owner, before end time)
     * @param marketId The market ID to cancel
     */
    function cancelMarket(uint256 marketId) external onlyOwner {
        require(marketExists[marketId], "Market does not exist");
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp < market.endTime, "Market already ended");
        
        market.status = MarketStatus.Cancelled;
        
        emit MarketCancelled(marketId);
    }
    
    /**
     * @dev Refund users if market is cancelled
     * @param marketId The market ID
     */
    function refund(uint256 marketId) external nonReentrant {
        require(marketExists[marketId], "Market does not exist");
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Cancelled, "Market not cancelled");
        require(!hasClaimed[marketId][msg.sender], "Already refunded");
        
        uint256 userStake = market.userStakes[msg.sender];
        require(userStake > 0, "No stake to refund");
        
        hasClaimed[marketId][msg.sender] = true;
        
        require(usdcToken.transfer(msg.sender, userStake), "Transfer failed");
    }
    
    /**
     * @dev Expire a market that wasn't resolved in time
     * @param marketId The market ID
     */
    function expireMarket(uint256 marketId) external {
        require(marketExists[marketId], "Market does not exist");
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp >= market.resolutionTime, "Resolution time not passed");
        
        (bool resolved, ) = oracle.getResolution(marketId);
        require(!resolved, "Market already resolved");
        
        market.status = MarketStatus.Expired;
    }
    
    /**
     * @dev Get market details
     * @param marketId The market ID
     */
    function getMarket(uint256 marketId) external view returns (
        address creator,
        string memory question,
        string[] memory outcomes,
        uint256 endTime,
        uint256 resolutionTime,
        MarketStatus status,
        uint256 totalLiquidity,
        uint256 totalFees
    ) {
        require(marketExists[marketId], "Market does not exist");
        Market storage market = markets[marketId];
        return (
            market.creator,
            market.question,
            market.outcomes,
            market.endTime,
            market.resolutionTime,
            market.status,
            market.totalLiquidity,
            market.totalFees
        );
    }
    
    /**
     * @dev Get user position in a market
     * @param marketId The market ID
     * @param user The user address
     * @param outcome The outcome index
     */
    function getUserPosition(
        uint256 marketId,
        address user,
        uint256 outcome
    ) external view returns (uint256 shares, uint256 totalStake) {
        require(marketExists[marketId], "Market does not exist");
        Market storage market = markets[marketId];
        return (market.userShares[user][outcome], market.userStakes[user]);
    }
    
    /**
     * @dev Get outcome shares for a market
     * @param marketId The market ID
     * @param outcome The outcome index
     */
    function getOutcomeShares(uint256 marketId, uint256 outcome) external view returns (uint256) {
        require(marketExists[marketId], "Market does not exist");
        return markets[marketId].outcomeShares[outcome];
    }
    
    /**
     * @dev Withdraw collected fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        require(usdcToken.transfer(owner(), amount), "Transfer failed");
    }
    
    /**
     * @dev Get total number of markets
     */
    function getMarketCount() external view returns (uint256) {
        return _marketCounter;
    }
}

