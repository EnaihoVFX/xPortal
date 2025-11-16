# Xportal 🚀

> A USDC-native prediction market on Circle Arc powered by personal AI traders

[![Live Demo](https://img.shields.io/badge/Live%20Demo-xportalp.vercel.app-blue?style=for-the-badge)](https://xportalp.vercel.app/)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

[![Circle Arc](https://img.shields.io/badge/Circle%20Arc-Powered-green?style=for-the-badge)](https://www.circle.com/)

## 🌟 Overview

Xportal revolutionizes prediction markets by introducing autonomous AI micro-agents that continuously scan markets, evaluate opportunities, assess risk, and execute trades in USDC outcome shares. Built on Circle Arc, Xportal provides a seamless, intelligent trading experience where you stay in control while your AI analysts handle the heavy lifting.

### 🎯 Key Features

- **🤖 Autonomous AI Traders** - Deploy personal micro-agents that work 24/7 to optimize your trading strategy
- **💰 USDC-Native** - All trading happens in USDC on Circle Arc for stable, predictable transactions
- **📊 Real-Time Analytics** - Comprehensive dashboard with portfolio tracking, agent performance metrics, and market insights
- **🔄 Continuous Liquidity** - AI agents provide 24/7 liquidity, ensuring markets stay active and accessible
- **🎯 Smart Pricing** - Data-driven agents evaluate opportunities rationally, leading to more accurate market prices
- **👥 Full Control** - Monitor and manage your agents while they handle trading behind the scenes

## 🏗️ How It Works

Your personal AI traders work autonomously behind the scenes through a sophisticated four-step process:

1. **Scan** - Micro-agents continuously scan markets for opportunities
2. **Score** - Evaluate and score each opportunity based on comprehensive data analysis
3. **Evaluate** - Assess risk and changing market conditions in real-time
4. **Trade** - Execute USDC outcome share trades rationally and autonomously

### Agent Network Architecture

Xportal employs specialized AI agents that continuously scan data sources and market signals:

- **Agent Alpha** - Technical Analysis
- **Agent Beta** - Sentiment Analysis
- **Agent Gamma** - Risk Management
- **Aggregator** - Data Hub for market aggregation

Each agent focuses on different aspects of market analysis including volume, price action, sentiment, market data, news, trends, risk, and liquidity.

## 🚀 Live Demo

**Experience Xportal now:** [https://xportalp.vercel.app/](https://xportalp.vercel.app/)

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js 15](https://nextjs.org/) with App Router
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI Components:** [Shadcn/ui](https://ui.shadcn.com/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Tabler Icons](https://tabler.io/icons) & [Lucide React](https://lucide.dev/)
- **Charts:** [Recharts](https://recharts.org/)
- **Forms:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

### State Management & Utilities
- **State:** [Zustand](https://zustand-demo.pmnd.rs/)
- **URL State:** [Nuqs](https://nuqs.47ng.com/)
- **Tables:** [TanStack Table](https://tanstack.com/table)
- **Drag & Drop:** [dnd-kit](https://dndkit.com/)

### Infrastructure
- **Deployment:** [Vercel](https://vercel.com/)
- **Blockchain:** [Circle Arc](https://www.circle.com/)
- **Currency:** USDC (USD Coin)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/          # Dashboard routes
│   │   ├── agents/         # AI agent management
│   │   ├── markets/        # Prediction markets
│   │   ├── overview/       # Dashboard overview
│   │   └── settings/       # User settings
│   └── api/                # API routes
├── components/             # React components
│   ├── ui/                 # Shadcn UI components
│   ├── layout/             # Layout components
│   └── ...
├── features/               # Feature-based modules
│   └── xportal/            # Xportal-specific features
│       └── components/     # Feature components
├── lib/                    # Utilities and helpers
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm/yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Xportal-dashboard
   ```
2. **Install dependencies**
   ```bash
   pnpm install
   ```
3. **Set up environment variables**
   ```bash
   cp env.example.txt .env.local
   ```
   Add your environment variables to `.env.local`:
   - Clerk authentication keys (if using auth)
   - Circle Arc API keys
   - Other required configuration
4. **Run the development server**
   ```bash
   pnpm dev
   ```
5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
pnpm build
pnpm start
```

## 📊 Features

### Dashboard Overview
- Real-time portfolio value tracking
- PnL (Profit & Loss) analytics
- Agent performance metrics
- Market activity snapshots
- Quick action shortcuts

### Agent Fleet Management
- Create and deploy new AI trading agents
- Monitor agent performance and statistics
- Configure trading strategies and parameters
- View agent ROI, win rates, and trade history
- Live agent console for real-time monitoring

### Markets Integration
- Browse live prediction markets from Polymarket
- View market details, odds, and liquidity
- Real-time market data and price movements
- Agent-automated trading on selected markets

### Portfolio Management
- Track positions across all markets
- Monitor PnL breakdown by agent and market
- Analyze trading history and performance
- USDC balance and allocation tracking

## 🎨 Design

Xportal features a modern, clean interface built with:
- Responsive design for all devices
- Dark/light theme support
- Smooth animations and transitions
- Intuitive navigation and user experience

## 👥 Creators

Built with ❤️ by:
- **Sami**
- **Enaiho**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on [Circle Arc](https://www.circle.com/) for USDC-native infrastructure
- Market data integration with [Polymarket](https://polymarket.com/)
- UI components from [Shadcn/ui](https://ui.shadcn.com/)
- Built with [Next.js](https://nextjs.org/) and the amazing open-source community

## 🔗 Links

- **Live Demo:** [https://xportalp.vercel.app/](https://xportalp.vercel.app/)
- **Documentation:** Coming soon
- **GitHub:** [Repository Link]

---

**Ready to deploy your AI traders?** [Get Started →](https://xportalp.vercel.app/)
