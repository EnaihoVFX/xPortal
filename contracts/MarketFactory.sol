// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PredictionMarket.sol";

/**
 * @title MarketFactory
 * @dev Factory contract for creating and managing prediction markets
 * Provides a centralized way to create markets and track them
 */
contract MarketFactory is Ownable {
    PredictionMarket public immutable predictionMarket;
    
    struct MarketInfo {
        uint256 marketId;
        address creator;
        string question;
        uint256 createdAt;
    }
    
    MarketInfo[] public markets;
    mapping(uint256 => uint256) public marketIndex; // marketId => index in markets array
    mapping(address => uint256[]) public userMarkets; // user => array of market IDs
    
    event MarketCreatedViaFactory(
        uint256 indexed marketId,
        address indexed creator,
        string question
    );
    
    constructor(address _predictionMarket) Ownable(msg.sender) {
        require(_predictionMarket != address(0), "Invalid prediction market address");
        predictionMarket = PredictionMarket(_predictionMarket);
    }
    
    /**
     * @dev Create a new market via factory
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
        uint256 marketId = predictionMarket.createMarket(question, outcomes, duration);
        
        MarketInfo memory info = MarketInfo({
            marketId: marketId,
            creator: msg.sender,
            question: question,
            createdAt: block.timestamp
        });
        
        markets.push(info);
        marketIndex[marketId] = markets.length - 1;
        userMarkets[msg.sender].push(marketId);
        
        emit MarketCreatedViaFactory(marketId, msg.sender, question);
        
        return marketId;
    }
    
    /**
     * @dev Get total number of markets
     */
    function getMarketCount() external view returns (uint256) {
        return markets.length;
    }
    
    /**
     * @dev Get market info by index
     * @param index The index in the markets array
     */
    function getMarketByIndex(uint256 index) external view returns (MarketInfo memory) {
        require(index < markets.length, "Index out of bounds");
        return markets[index];
    }
    
    /**
     * @dev Get all markets created by a user
     * @param user The user address
     */
    function getUserMarkets(address user) external view returns (uint256[] memory) {
        return userMarkets[user];
    }
    
    /**
     * @dev Get recent markets
     * @param count Number of recent markets to return
     */
    function getRecentMarkets(uint256 count) external view returns (MarketInfo[] memory) {
        uint256 length = markets.length;
        if (count > length) {
            count = length;
        }
        
        MarketInfo[] memory recent = new MarketInfo[](count);
        uint256 start = length - count;
        
        for (uint256 i = 0; i < count; i++) {
            recent[i] = markets[start + i];
        }
        
        return recent;
    }
}


