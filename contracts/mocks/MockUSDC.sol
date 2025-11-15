// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token for testing purposes
 * In production, this would be replaced with actual Circle Arc USDC
 */
contract MockUSDC is ERC20 {
    uint8 private constant _decimals = 6; // USDC uses 6 decimals
    
    constructor() ERC20("Mock USD Coin", "USDC") {
        // Mint initial supply for testing
        _mint(msg.sender, 1000000 * 10**_decimals); // 1M USDC
    }
    
    function decimals() public pure override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
    function faucet() external {
        _mint(msg.sender, 10000 * 10**_decimals); // 10k USDC for testing
    }
}


