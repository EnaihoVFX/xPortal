// Contract addresses for Arc Testnet
export const CONTRACT_ADDRESSES = {
  arcTestnet: {
    USDC: "0x79d5dD2437c1483b22F98E5769B2Cfdf9eC5166a", // MockUSDC from latest marketplace deployment
    Oracle: "0x24A61a5563d5196B8fDa3a8b497A993aFA2BD1A7", // Oracle from latest marketplace deployment
    PredictionMarket: "0x3BbB5245262a55cD8D72E0989feD76Fb727b1FcA",
    MarketFactory: "0xFFc8c73ba5EF7292717bE15A80ddAB880529ee7B",
    MarketPlace: "0xf94fEc451cEB81bFe8F4d9A567469F227820EC26" // MarketPlace latest deployed address
  }
}

export const NETWORK_CONFIG = {
  chainId: "0x4D1A0A", // 5042002 in hex
  chainName: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6
  },
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"]
}

// ABI snippets for contract interactions
export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
]

export const MOCK_USDC_ABI = [
  ...ERC20_ABI,
  "function faucet()",
  "function mint(address to, uint256 amount)"
]

export const PREDICTION_MARKET_ABI = [
  "function getMarketCount() view returns (uint256)",
  "function getMarket(uint256 marketId) view returns (address creator, string memory question, string[] memory outcomes, uint256 endTime, uint256 resolutionTime, uint8 status, uint256 totalLiquidity, uint256 totalFees)",
  "function getUserPosition(uint256 marketId, address user, uint256 outcome) view returns (uint256 shares, uint256 totalStake)",
  "function getOutcomeShares(uint256 marketId, uint256 outcome) view returns (uint256)",
  "function takePosition(uint256 marketId, uint256 outcome, uint256 amount)",
  "function claimPayout(uint256 marketId)",
  "event MarketCreated(uint256 indexed marketId, address indexed creator, string question, uint256 endTime)",
  "event PositionTaken(uint256 indexed marketId, address indexed user, uint256 outcome, uint256 amount, uint256 shares)",
  "event MarketResolved(uint256 indexed marketId, uint256 winningOutcome, uint256 totalPayout)",
  "event PayoutClaimed(uint256 indexed marketId, address indexed user, uint256 amount)"
]

export const MARKET_FACTORY_ABI = [
  "function createMarket(string memory question, string[] memory outcomes, uint256 duration) returns (uint256)",
  "function getMarketCount() view returns (uint256)",
  "function getUserMarkets(address user) view returns (uint256[])",
  "event MarketCreatedViaFactory(uint256 indexed marketId, address indexed creator, string question)"
]

export const ORACLE_ABI = [
  "function resolveMarket(uint256 marketId, uint256 outcome)",
  "function getResolution(uint256 marketId) view returns (bool resolved, uint256 outcome)",
  "function authorizedResolvers(address) view returns (bool)"
]

export const MARKETPLACE_ABI = [
  "function getMarketCount() view returns (uint256)",
  "function getMarket(uint256 marketId) view returns (address creator, string memory question, string memory description, string[] memory outcomes, uint256 endTime, uint8 status, uint8 category, uint256 totalLiquidity, uint256 totalVolume)",
  "function buyShares(uint256 marketId, uint256 outcome, uint256 amount) returns (uint256)",
  "function sellShares(uint256 marketId, uint256 outcome, uint256 shares) returns (uint256)",
  "function getOutcomeProbability(uint256 marketId, uint256 outcome) view returns (uint256)",
  "function getAllProbabilities(uint256 marketId) view returns (uint256[])",
  "function getUserShares(uint256 marketId, address user, uint256 outcome) view returns (uint256)",
  "function getUserPortfolio(address user) view returns (uint256[] memory marketIds, uint256[] memory outcomes, uint256[] memory shares)",
  "function getMarketsByCategory(uint8 category) view returns (uint256[])",
  "function getUserMarkets(address user) view returns (uint256[])",
  "function createMarket(string memory question, string memory description, string[] memory outcomes, uint256 duration, uint8 category) returns (uint256)",
  "function claimPayout(uint256 marketId)",
  "event MarketCreated(uint256 indexed marketId, address indexed creator, string question, uint8 category, uint256 endTime)",
  "event SharesBought(uint256 indexed marketId, address indexed buyer, uint256 outcome, uint256 shares, uint256 cost, uint256 probability)",
  "event SharesSold(uint256 indexed marketId, address indexed seller, uint256 outcome, uint256 shares, uint256 proceeds, uint256 probability)",
  "event MarketResolved(uint256 indexed marketId, uint256 winningOutcome, uint256 totalPayout)",
  "event PayoutClaimed(uint256 indexed marketId, address indexed user, uint256 amount)"
]

