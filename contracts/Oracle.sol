// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Oracle
 * @dev Oracle contract for resolving prediction markets
 * In production, this could integrate with Chainlink or other oracle services
 */
contract Oracle is Ownable {
    struct Resolution {
        uint256 marketId;
        uint256 outcome;
        bool resolved;
        uint256 timestamp;
    }
    
    mapping(uint256 => Resolution) public resolutions;
    mapping(address => bool) public authorizedResolvers;
    
    event MarketResolved(uint256 indexed marketId, uint256 outcome, address indexed resolver);
    event ResolverAuthorized(address indexed resolver);
    event ResolverRevoked(address indexed resolver);
    
    constructor() Ownable(msg.sender) {
        authorizedResolvers[msg.sender] = true;
    }
    
    modifier onlyAuthorized() {
        require(authorizedResolvers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    /**
     * @dev Resolve a market with a specific outcome
     * @param marketId The ID of the market to resolve
     * @param outcome The winning outcome index
     */
    function resolveMarket(uint256 marketId, uint256 outcome) external onlyAuthorized {
        require(!resolutions[marketId].resolved, "Market already resolved");
        
        resolutions[marketId] = Resolution({
            marketId: marketId,
            outcome: outcome,
            resolved: true,
            timestamp: block.timestamp
        });
        
        emit MarketResolved(marketId, outcome, msg.sender);
    }
    
    /**
     * @dev Check if a market is resolved
     * @param marketId The market ID to check
     * @return resolved Whether the market is resolved
     * @return outcome The resolved outcome if resolved
     */
    function getResolution(uint256 marketId) external view returns (bool resolved, uint256 outcome) {
        Resolution memory resolution = resolutions[marketId];
        return (resolution.resolved, resolution.outcome);
    }
    
    /**
     * @dev Authorize a resolver address
     * @param resolver The address to authorize
     */
    function authorizeResolver(address resolver) external onlyOwner {
        authorizedResolvers[resolver] = true;
        emit ResolverAuthorized(resolver);
    }
    
    /**
     * @dev Revoke resolver authorization
     * @param resolver The address to revoke
     */
    function revokeResolver(address resolver) external onlyOwner {
        authorizedResolvers[resolver] = false;
        emit ResolverRevoked(resolver);
    }
}


