-- migrations/0001_initial_schema.sql
-- ARENA X Cloudflare D1 Database Schema
-- Optimized for Cloudflare Free Tier (5M read units, 100k write units/month)

-- 1. Players Table
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  rank_tier TEXT NOT NULL DEFAULT 'BRONZE',
  elo_rating INTEGER NOT NULL DEFAULT 1000,
  ax_coins INTEGER NOT NULL DEFAULT 500,
  matches_played INTEGER NOT NULL DEFAULT 0,
  matches_won INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_active INTEGER NOT NULL
);

-- Index for fast leaderboard sorting by Elo rating
CREATE INDEX IF NOT EXISTS idx_players_elo ON players(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);

-- 2. Fighter Unlocks Table
CREATE TABLE IF NOT EXISTS fighter_unlocks (
  player_id TEXT NOT NULL,
  fighter_id TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL,
  PRIMARY KEY (player_id, fighter_id),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- 3. Match History Table
CREATE TABLE IF NOT EXISTS match_history (
  match_id TEXT PRIMARY KEY,
  p1_id TEXT NOT NULL,
  p2_id TEXT NOT NULL,
  p1_fighter TEXT NOT NULL,
  p2_fighter TEXT NOT NULL,
  winner_id TEXT NOT NULL,
  p1_score INTEGER NOT NULL DEFAULT 0,
  p2_score INTEGER NOT NULL DEFAULT 0,
  stage_id TEXT NOT NULL,
  played_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_history_p1 ON match_history(p1_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_history_p2 ON match_history(p2_id, played_at DESC);

-- 4. Initial Seed Data (Foundational Roster & Top AI Contenders)
INSERT OR IGNORE INTO players (id, username, display_name, level, xp, rank_tier, elo_rating, ax_coins, matches_played, matches_won, created_at, last_active)
VALUES 
  ('player_kai_demo', 'kai_master', 'Kai Protagonist', 10, 4800, 'GOLD', 1420, 1500, 32, 24, 1700000000000, 1700000000000),
  ('player_shadow_demo', 'shadow_striker', 'Shadow Assassin', 12, 6200, 'PLATINUM', 1580, 2200, 48, 36, 1700000000000, 1700000000000),
  ('player_ronin_demo', 'blade_ronin', 'Master Ronin', 15, 9500, 'DIAMOND', 1740, 3400, 65, 52, 1700000000000, 1700000000000),
  ('player_frost_demo', 'cryo_queen', 'Frost Vanguard', 9, 3900, 'SILVER', 1310, 950, 22, 14, 1700000000000, 1700000000000),
  ('player_titan_demo', 'iron_titan', 'Titan Colossus', 14, 8800, 'DIAMOND', 1690, 2800, 58, 44, 1700000000000, 1700000000000);
