const hre = require("hardhat");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Sample markets inspired by popular prediction markets
const SAMPLE_MARKETS = [
  {
    question: "Will Bitcoin reach $100,000 by end of 2025?",
    description: "Bitcoin price prediction for 2025",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 2 // Crypto
  },
  {
    question: "Will the US have a recession in 2025?",
    description: "Economic recession prediction for 2025",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 3 // Economics
  },
  {
    question: "Who will win the 2025 Super Bowl?",
    description: "NFL Super Bowl LIX winner",
    outcomes: ["Kansas City Chiefs", "San Francisco 49ers", "Buffalo Bills", "Other"],
    duration: 60 * 24 * 60 * 60, // 60 days
    category: 1 // Sports
  },
  {
    question: "Will AI pass the Turing test by 2026?",
    description: "Artificial intelligence capability milestone",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year (max allowed)
    category: 4 // Technology
  },
  {
    question: "Will there be a major earthquake (7.0+) in California in 2025?",
    description: "Seismic activity prediction for California",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 6 // Weather/Other
  },
  {
    question: "Will the next US President be a Democrat or Republican?",
    description: "2024 US Presidential election outcome",
    outcomes: ["Democrat", "Republican"],
    duration: 180 * 24 * 60 * 60, // 6 months
    category: 0 // Politics
  },
  {
    question: "Will Ethereum reach $5,000 by end of 2025?",
    description: "Ethereum price prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 2 // Crypto
  },
  {
    question: "Will a movie gross over $2 billion worldwide in 2025?",
    description: "Box office performance prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 5 // Entertainment
  },
  {
    question: "Will global average temperature increase by 0.5°C by 2026?",
    description: "Climate change temperature prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year (max allowed)
    category: 6 // Weather
  },
  {
    question: "Will Apple release a foldable iPhone by 2026?",
    description: "Apple product release prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year (max allowed)
    category: 4 // Technology
  },
  {
    question: "Will Tesla stock reach $300 by end of 2025?",
    description: "Tesla stock price prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 3 // Economics
  },
  {
    question: "Will the US Federal Reserve cut interest rates in Q1 2025?",
    description: "Federal Reserve monetary policy prediction",
    outcomes: ["Yes", "No"],
    duration: 90 * 24 * 60 * 60, // 3 months
    category: 3 // Economics
  },
  {
    question: "Will the Los Angeles Lakers win the 2025 NBA Championship?",
    description: "NBA championship prediction",
    outcomes: ["Yes", "No"],
    duration: 180 * 24 * 60 * 60, // 6 months
    category: 1 // Sports
  },
  {
    question: "Will there be a major breakthrough in quantum computing in 2025?",
    description: "Quantum computing advancement prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 4 // Technology
  },
  {
    question: "Will the S&P 500 close above 6,000 in 2025?",
    description: "Stock market index prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 3 // Economics
  },
  {
    question: "Will SpaceX successfully land humans on Mars by 2030?",
    description: "Space exploration milestone prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year (max allowed)
    category: 4 // Technology
  },
  {
    question: "Will the next Marvel movie gross over $1 billion worldwide?",
    description: "Box office performance prediction for Marvel films",
    outcomes: ["Yes", "No"],
    duration: 180 * 24 * 60 * 60, // 6 months
    category: 5 // Entertainment
  },
  {
    question: "Will there be a major volcanic eruption (VEI 6+) in 2025?",
    description: "Geological event prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 6 // Weather
  },
  {
    question: "Will the US unemployment rate drop below 3% in 2025?",
    description: "Labor market economic indicator prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 3 // Economics
  },
  {
    question: "Will OpenAI release GPT-6 in 2025?",
    description: "AI model release prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 4 // Technology
  },
  {
    question: "Will the New York Yankees win the 2025 World Series?",
    description: "MLB championship prediction",
    outcomes: ["Yes", "No"],
    duration: 240 * 24 * 60 * 60, // 8 months
    category: 1 // Sports
  },
  {
    question: "Will the Euro reach parity with the US Dollar in 2025?",
    description: "Currency exchange rate prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 3 // Economics
  },
  {
    question: "Will a new streaming service reach 100 million subscribers in 2025?",
    description: "Entertainment industry growth prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 5 // Entertainment
  },
  {
    question: "Will there be a Category 5 hurricane in the Atlantic in 2025?",
    description: "Weather event prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 6 // Weather
  },
  {
    question: "Will Google release a new Pixel phone with foldable screen in 2025?",
    description: "Consumer electronics product release prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 4 // Technology
  },
  {
    question: "Will the next US election have voter turnout above 70%?",
    description: "Political participation prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year (max allowed)
    category: 0 // Politics
  },
  {
    question: "Will the price of gold exceed $2,500 per ounce in 2025?",
    description: "Precious metal price prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 3 // Economics
  },
  {
    question: "Will the next FIFA World Cup be won by a European team?",
    description: "International soccer championship prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year (max allowed)
    category: 1 // Sports
  },
  {
    question: "Will Netflix release a show that gets 1 billion hours watched in first month?",
    description: "Streaming content performance prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 5 // Entertainment
  },
  {
    question: "Will there be a major breakthrough in fusion energy in 2025?",
    description: "Energy technology advancement prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 4 // Technology
  },
  {
    question: "Will the US national debt exceed $35 trillion in 2025?",
    description: "Government fiscal policy prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 0 // Politics
  },
  {
    question: "Will the next iPhone have USB-C charging port?",
    description: "Apple product specification prediction",
    outcomes: ["Yes", "No"],
    duration: 180 * 24 * 60 * 60, // 6 months
    category: 4 // Technology
  },
  {
    question: "Will the average global temperature in 2025 be the highest on record?",
    description: "Climate change temperature record prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 6 // Weather
  },
  {
    question: "Will Solana's market cap exceed $200 billion in 2025?",
    description: "Cryptocurrency market capitalization prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 2 // Crypto
  },
  {
    question: "Will the next James Bond movie be released in 2025?",
    description: "Film release date prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 5 // Entertainment
  },
  {
    question: "Will there be a major data breach affecting over 100 million users in 2025?",
    description: "Cybersecurity incident prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 4 // Technology
  },
  {
    question: "Will the Chicago Bears win the 2025 Super Bowl?",
    description: "NFL championship prediction",
    outcomes: ["Yes", "No"],
    duration: 180 * 24 * 60 * 60, // 6 months
    category: 1 // Sports
  },
  {
    question: "Will the US Congress pass major AI regulation in 2025?",
    description: "Legislative action prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 0 // Politics
  },
  {
    question: "Will the price of oil exceed $100 per barrel in 2025?",
    description: "Commodity price prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 3 // Economics
  },
  {
    question: "Will a new social media platform reach 50 million users in 2025?",
    description: "Social media industry growth prediction",
    outcomes: ["Yes", "No"],
    duration: 365 * 24 * 60 * 60, // 1 year
    category: 4 // Technology
  }
];

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  
  console.log("Seeding markets on network:", network.name);
  console.log("Deployer address:", deployer.address);
  
  // Load contract addresses - try to load from deployment file first
  let addresses;
  try {
    const deploymentPath = path.join(__dirname, "..", "deployments", "marketplace-arcTestnet.json");
    if (fs.existsSync(deploymentPath)) {
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
      addresses = {
        USDC: deployment.contracts.usdc,
        MarketPlace: deployment.contracts.marketplace
      };
      console.log("Loaded addresses from deployment file");
    } else {
      throw new Error("Deployment file not found");
    }
  } catch (error) {
    // Fallback to hardcoded addresses
    addresses = {
      USDC: "0xAc60e9896E6149c00A98b717210d5B2FE14A0A55",
      MarketPlace: "0x31fdDCeB50B5CEA8c87Ad92078063700413918d0"
    };
    console.log("Using hardcoded addresses");
  }

  // Check if MarketPlace contract exists
  const marketplaceAddress = addresses.MarketPlace;
  const usdcAddress = addresses.USDC;
  
  // Try to load MarketPlace contract
  const MarketPlace = await hre.ethers.getContractFactory("MarketPlace");
  let marketplace;
  
  try {
    marketplace = MarketPlace.attach(marketplaceAddress);
    // Verify contract is deployed
    await marketplace.getMarketCount();
    console.log("Using MarketPlace at:", marketplaceAddress);
  } catch (error) {
    console.error("Error connecting to MarketPlace:", error.message);
    console.log("\nPlease deploy MarketPlace first using:");
    console.log("  npx hardhat run scripts/deploy-marketplace.js --network arcTestnet");
    console.log("\nThen update the MarketPlace address in this script and contracts.js");
    process.exit(1);
  }

  // Check if we need to approve USDC spending
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = MockUSDC.attach(usdcAddress);
  
  // Get some USDC from faucet if needed
  try {
    const balance = await usdc.balanceOf(deployer.address);
    if (balance === 0n && usdc.faucet) {
      console.log("Getting USDC from faucet...");
      const faucetTx = await usdc.faucet();
      await faucetTx.wait();
      console.log("Received USDC from faucet");
    }
  } catch (error) {
    console.log("Could not use faucet (might not be MockUSDC):", error.message);
  }

  // Approve MarketPlace to spend USDC
  try {
    const allowance = await usdc.allowance(deployer.address, marketplaceAddress);
    if (allowance === 0n) {
      console.log("Approving MarketPlace to spend USDC...");
      const approveTx = await usdc.approve(marketplaceAddress, ethers.MaxUint256);
      await approveTx.wait();
      console.log("Approved USDC spending");
    }
  } catch (error) {
    console.error("Error approving USDC:", error.message);
  }

  // Get current market count
  const currentCount = await marketplace.getMarketCount();
  console.log(`\nCurrent market count: ${currentCount}`);
  console.log(`Creating ${SAMPLE_MARKETS.length} sample markets...\n`);

  // Create markets
  for (let i = 0; i < SAMPLE_MARKETS.length; i++) {
    const market = SAMPLE_MARKETS[i];
    try {
      console.log(`Creating market ${i + 1}/${SAMPLE_MARKETS.length}: "${market.question}"`);
      const tx = await marketplace.createMarket(
        market.question,
        market.description,
        market.outcomes,
        market.duration,
        market.category
      );
      const receipt = await tx.wait();
      console.log(`  ✓ Created! TX: ${receipt.hash}`);
      
      // Wait a bit between transactions to avoid rate limiting
      if (i < SAMPLE_MARKETS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`  ✗ Error creating market: ${error.message}`);
    }
  }

  // Get final market count
  const finalCount = await marketplace.getMarketCount();
  console.log(`\n✓ Seeding complete! Total markets: ${finalCount}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

