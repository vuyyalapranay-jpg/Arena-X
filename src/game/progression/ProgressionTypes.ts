// src/game/progression/ProgressionTypes.ts
// ARENA X — PHASE 9: PLAYER PROGRESSION, REWARDS & FIGHTER UNLOCK SYSTEM

import { FighterId } from '../characters/RosterConfig';

export type RankTier =
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'DIAMOND'
  | 'MASTER'
  | 'GRANDMASTER';

export interface RankInfo {
  tier: RankTier;
  division: number; // 1 to 4
  currentRp: number;
  minRp: number;
  maxRp: number;
  badgeColor: string;
  badgeGlow: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'COMBAT' | 'PROGRESSION' | 'ONLINE' | 'MASTERY';
  targetValue: number;
  currentValue: number;
  isUnlocked: boolean;
  unlockedAt: number | null;
  rewardXp: number;
  rewardCoins: number;
  isClaimed: boolean;
}

export interface MatchRecord {
  id: string;
  date: number; // Unix timestamp ms
  gameMode: 'VERSUS' | 'ONLINE' | 'TRAINING';
  playerFighter: FighterId;
  opponentFighter: FighterId;
  opponentName: string;
  stageId: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  playerScore: number;
  opponentScore: number;
  durationSeconds: number;
  xpEarned: number;
  coinsEarned: number;
  rpChange: number;
}

export interface FighterUnlockRequirement {
  fighterId: FighterId;
  isStarter: boolean;
  requiredLevel?: number;
  requiredWins?: number;
  requiredRank?: RankTier;
  coinCost: number;
  description: string;
}

export interface PlayerCosmetics {
  selectedTitle: string;
  selectedBanner: string;
  selectedFrame: string;
  unlockedTitles: string[];
  unlockedBanners: string[];
  unlockedFrames: string[];
  fighterPalettes: Record<FighterId, string>;
}

export interface PlayerProfile {
  version: string; // e.g. "1.0.0"
  username: string;
  playerId: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  coins: number; // AX Coins
  rankTier: RankTier;
  rankPoints: number; // RP
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number; // 0 to 100 percentage
  currentWinStreak: number;
  highestWinStreak: number;
  favoriteFighter: FighterId;
  unlockedFighters: FighterId[];
  achievements: Record<string, Achievement>;
  matchHistory: MatchRecord[];
  cosmetics: PlayerCosmetics;
}

export interface MatchRewards {
  xpEarned: number;
  coinsEarned: number;
  rpChange: number;
  didLevelUp: boolean;
  oldLevel: number;
  newLevel: number;
  rankChanged: boolean;
  newRank: RankTier;
  unlockedAchievements: Achievement[];
}
