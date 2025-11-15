require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable IR-based compilation to handle stack too deep
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
      forking: {
        url: process.env.ETHEREUM_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/demo",
      },
    },
    testnet: {
      url: process.env.TESTNET_RPC_URL || "https://sepolia.infura.io/v3/YOUR_KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111, // Sepolia testnet
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
    },
    arcTestnet: {
      url: process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 5042002,
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      baseSepolia: process.env.BASESCAN_API_KEY || "",
      arcTestnet: process.env.ARCSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "arcTestnet",
        chainId: 5042002,
        urls: {
          apiURL: "https://testnet.arcscan.app/api",
          browserURL: "https://testnet.arcscan.app",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

