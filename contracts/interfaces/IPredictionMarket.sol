// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPredictionMarket
 * @dev Interface for Prediction Market operations
 */
interface IPredictionMarket {
    struct Market {
        uint256 marketId;
        address creator;
        string question;
        string[] outcomes;
        uint256 endTime;
        uint256 resolutionTime;
        MarketStatus status;
        uint256 totalLiquidity;
        uint256 totalFees;
        mapping(uint256 => uint256) outcomeShares; // outcome index => total shares
        mapping(address => mapping(uint256 => uint256)) userShares; // user => outcome => shares
        mapping(address => uint256) userStakes; // user => total stake
    }
    
    enum MarketStatus {
        Active,
        Resolved,
        Cancelled,
        Expired
    }
    
    event MarketCreated(
        uint256 indexed marketId,
        address indexed creator,
        string question,
        uint256 endTime
    );
    
    event PositionTaken(
        uint256 indexed marketId,
        address indexed user,
        uint256 outcome,
        uint256 amount,
        uint256 shares
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
}

