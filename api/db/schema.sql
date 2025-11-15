-- Vercel Postgres Database Schema for Prediction Markets
-- Run this in your Vercel Postgres database

-- Markets table - stores all market information
CREATE TABLE IF NOT EXISTS markets (
  id SERIAL PRIMARY KEY,
  market_id INTEGER NOT NULL UNIQUE,
  creator TEXT NOT NULL,
  question TEXT NOT NULL,
  description TEXT,
  outcomes TEXT[] NOT NULL,
  end_time BIGINT NOT NULL,
  resolution_time BIGINT,
  status INTEGER NOT NULL DEFAULT 0, -- 0: Active, 1: Resolved, 2: Cancelled
  category INTEGER NOT NULL DEFAULT 7, -- 0-7: Categories
  total_liquidity TEXT NOT NULL DEFAULT '0',
  total_volume TEXT NOT NULL DEFAULT '0',
  total_fees TEXT NOT NULL DEFAULT '0',
  creation_time BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Market history table - stores price and volume history
CREATE TABLE IF NOT EXISTS market_history (
  id SERIAL PRIMARY KEY,
  market_id INTEGER NOT NULL REFERENCES markets(market_id) ON DELETE CASCADE,
  timestamp BIGINT NOT NULL,
  yes_price TEXT,
  no_price TEXT,
  probabilities TEXT[], -- Array of probabilities for each outcome
  total_volume TEXT,
  total_liquidity TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trades table - stores all buy/sell transactions
CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  market_id INTEGER NOT NULL REFERENCES markets(market_id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  trade_type TEXT NOT NULL, -- 'BUY' or 'SELL'
  outcome INTEGER NOT NULL,
  amount TEXT NOT NULL, -- Amount in USDC
  shares TEXT NOT NULL, -- Shares bought/sold
  price TEXT, -- Price per share at time of trade
  transaction_hash TEXT,
  block_number BIGINT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User positions table - tracks user holdings per market
CREATE TABLE IF NOT EXISTS user_positions (
  id SERIAL PRIMARY KEY,
  market_id INTEGER NOT NULL REFERENCES markets(market_id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  outcome INTEGER NOT NULL,
  shares TEXT NOT NULL DEFAULT '0',
  total_invested TEXT NOT NULL DEFAULT '0',
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(market_id, user_address, outcome)
);

-- Market events table - stores important market events
CREATE TABLE IF NOT EXISTS market_events (
  id SERIAL PRIMARY KEY,
  market_id INTEGER NOT NULL REFERENCES markets(market_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'CREATED', 'TRADE', 'RESOLVED', 'CANCELLED'
  event_data JSONB, -- Flexible JSON data for event-specific information
  user_address TEXT,
  transaction_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_category ON markets(category);
CREATE INDEX IF NOT EXISTS idx_markets_creator ON markets(creator);
CREATE INDEX IF NOT EXISTS idx_market_history_market_id ON market_history(market_id);
CREATE INDEX IF NOT EXISTS idx_market_history_timestamp ON market_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_trades_market_id ON trades(market_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_address ON trades(user_address);
CREATE INDEX IF NOT EXISTS idx_user_positions_market_id ON user_positions(market_id);
CREATE INDEX IF NOT EXISTS idx_user_positions_user_address ON user_positions(user_address);
CREATE INDEX IF NOT EXISTS idx_market_events_market_id ON market_events(market_id);

