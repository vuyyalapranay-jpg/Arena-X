// src/game/progression/ProgressionConfig.ts
// Configuration for Fighter Unlocks, Achievements, XP curve, and Ranking Tiers

import { FighterId } from '../characters/RosterConfig';
import {
  Achievement,
  FighterUnlockRequirement,
  RankInfo,
  RankTier,
} from './ProgressionTypes';

export const FIGHTER_UNLOCK_CONFIG: Record<FighterId, FighterUnlockRequirement> = {
  KAI: {
    fighterId: 'KAI',
    isStarter: true,
    coinCost: 0,
    description: 'Starter fighter. Master of celestial martial arts.',
  },
  SHADOW: {
    fighterId: 'SHADOW',
    isStarter: true,
    coinCost: 0,
    description: 'Starter fighter. Master of dark void ninjutsu.',
  },
  BLAZE: {
    fighterId: 'BLAZE',
    isStarter: true,
    coinCost: 0,
    description: 'Starter fighter. Explosive pyro striker.',
  },
  FROST: {
    fighterId: 'FROST',
    isStarter: true,
    coinCost: 0,
    description: 'Starter fighter. Crystalline ice zoner.',
  },
  VOLT: {
    fighterId: 'VOLT',
    isStarter: false,
    requiredLevel: 3,
    coinCost: 1000,
    description: 'Reach Player Level 3 or unlock with 1,000 AX Coins.',
  },
  TERRA: {
    fighterId: 'TERRA',
    isStarter: false,
    requiredWins: 5,
    coinCost: 1200,
    description: 'Win 5 Matches or unlock with 1,200 AX Coins.',
  },
  PHANTOM: {
    fighterId: 'PHANTOM',
    isStarter: false,
    requiredLevel: 5,
    coinCost: 1500,
    description: 'Reach Player Level 5 or unlock with 1,500 AX Coins.',
  },
  RONIN: {
    fighterId: 'RONIN',
    isStarter: false,
    requiredWins: 10,
    coinCost: 1500,
    description: 'Win 10 Matches or unlock with 1,500 AX Coins.',
  },
  VIPER: {
    fighterId: 'VIPER',
    isStarter: false,
    requiredLevel: 8,
    coinCost: 1800,
    description: 'Reach Player Level 8 or unlock with 1,800 AX Coins.',
  },
  TITAN: {
    fighterId: 'TITAN',
    isStarter: false,
    requiredWins: 15,
    coinCost: 2000,
    description: 'Win 15 Matches or unlock with 2,000 AX Coins.',
  },
  NOVA: {
    fighterId: 'NOVA',
    isStarter: false,
    requiredLevel: 10,
    coinCost: 2200,
    description: 'Reach Player Level 10 or unlock with 2,200 AX Coins.',
  },
  REAPER: {
    fighterId: 'REAPER',
    isStarter: false,
    requiredWins: 20,
    coinCost: 2500,
    description: 'Win 20 Matches or unlock with 2,500 AX Coins.',
  },
  AETHER: {
    fighterId: 'AETHER',
    isStarter: false,
    requiredRank: 'GOLD',
    coinCost: 3000,
    description: 'Reach Gold Rank or unlock with 3,000 AX Coins.',
  },
  RYUZEN: {
    fighterId: 'RYUZEN',
    isStarter: false,
    requiredWins: 25,
    coinCost: 3500,
    description: 'Win 25 Matches or unlock with 3,500 AX Coins.',
  },
  ECLIPSE: {
    fighterId: 'ECLIPSE',
    isStarter: false,
    requiredLevel: 20,
    coinCost: 4000,
    description: 'Reach Player Level 20 or unlock with 4,000 AX Coins.',
  },
  ZENITH: {
    fighterId: 'ZENITH',
    isStarter: false,
    requiredRank: 'PLATINUM',
    coinCost: 5000,
    description: 'Reach Platinum Rank or unlock with 5,000 AX Coins.',
  },
};

export const INITIAL_ACHIEVEMENTS: Record<string, Achievement> = {
  FIRST_VICTORY: {
    id: 'FIRST_VICTORY',
    title: 'First Blood',
    description: 'Win your first battle in any game mode.',
    icon: 'Swords',
    category: 'COMBAT',
    targetValue: 1,
    currentValue: 0,
    isUnlocked: false,
    unlockedAt: null,
    rewardXp: 250,
    rewardCoins: 200,
    isClaimed: false,
  },
  FIRST_ONLINE: {
    id: 'FIRST_ONLINE',
    title: 'Netplay Warrior',
    description: 'Complete your first online multiplayer match.',
    icon: 'Globe',
    category: 'ONLINE',
    targetValue: 1,
    currentValue: 0,
    isUnlocked: false,
    unlockedAt: null,
    rewardXp: 300,
    rewardCoins: 250,
    isClaimed: false,
  },
  TEN_VICTORIES: {
    id: 'TEN_VICTORIES',
    title: 'Veteran Striker',
    description: 'Achieve 10 total victories.',
    icon: 'Trophy',
    category: 'COMBAT',
    targetValue: 10,
    currentValue: 0,
    isUnlocked: false,
    unlockedAt: null,
    rewardXp: 600,
    rewardCoins: 500,
    isClaimed: false,
  },
  PERFECT_ROUND: {
    id: 'PERFECT_ROUND',
    title: 'Flawless Execution',
    description: 'Win a round with a 100% full health bar (PERFECT).',
    icon: 'Shield',
    category: 'COMBAT',
    targetValue: 1,
    currentValue: 0,
    isUnlocked: false,
    unlockedAt: null,
    rewardXp: 500,
    rewardCoins: 400,
    isClaimed: false,
  },
  COMBO_MASTER: {
    id: 'COMBO_MASTER',
    title: 'Combo Virtuoso',
    description: 'Execute a combo chain of 5 or more continuous hits.',
    icon: 'Zap',
    category: 'COMBAT',
    targetValue: 5,
    currentValue: 0,
    isUnlocked: false,
    unlockedAt: null,
    rewardXp: 400,
    rewardCoins: 300,
    isClaimed: false,
  },
  SPECIAL_EXPERT: {
    id: 'SPECIAL_EXPERT',
    title: 'Elemental Adept',
    description: 'Connect with 20 special abilities or projectiles.',
    icon: 'Flame',
    category: 'MASTERY',
    targetValue: 20,
    currentValue: 0,
    isUnlocked: false,
    unlockedAt: null,
    rewardXp: 450,
    rewardCoins: 350,
    isClaimed: false,
  },
  ULTIMATE_FINISHER: {
    id: 'ULTIMATE_FINISHER',
    title: 'Celestial Decimation',
    description: 'Deliver the final knockout blow using an Ultimate Attack.',
    icon: 'Sparkles',
    category: 'COMBAT',
    targetValue: 1,
    currentValue: 0,
    isUnlocked: false,
    unlockedAt: null,
    rewardXp: 600,
    rewardCoins: 500,
    isClaimed: false,
  },
  TRAINING_GRADUATE: {
    id: 'TRAINING_GRADUATE',
    title: 'Dojo Disciple',
    description: 'Complete a practice session in the Training Dojo.',
    icon: 'BookOpen',
    category: 'PROGRESSION',
    targetValue: 1,
    currentValue: 0,
    isUnlocked: false,
    unlockedAt: null,
    rewardXp: 200,
    rewardCoins: 150,
    isClaimed: false,
  },
  ARENA_CHAMPION: {
    id: 'ARENA_CHAMPION',
    title: 'Apex Brawler',
    description: 'Secure a victory across all six 2.5D fighting arenas.',
    icon: 'MapPin',
    category: 'PROGRESSION',
    targetValue: 6,
    currentValue: 0,
    isUnlocked: false,
    unlockedAt: null,
    rewardXp: 800,
    rewardCoins: 750,
    isClaimed: false,
  },
  UNSTOPPABLE: {
    id: 'UNSTOPPABLE',
    title: 'Untouchable Streak',
    description: 'Achieve a winning streak of 5 consecutive matches.',
    icon: 'Crown',
    category: 'MASTERY',
    targetValue: 5,
    currentValue: 0,
    isUnlocked: false,
    unlockedAt: null,
    rewardXp: 1000,
    rewardCoins: 1000,
    isClaimed: false,
  },
};

export const RANK_TIERS_CONFIG: Record<
  RankTier,
  { minRp: number; maxRp: number; badgeColor: string; badgeGlow: string }
> = {
  BRONZE: { minRp: 0, maxRp: 999, badgeColor: '#cd7f32', badgeGlow: 'rgba(205, 127, 50, 0.4)' },
  SILVER: { minRp: 1000, maxRp: 1999, badgeColor: '#c0c0c0', badgeGlow: 'rgba(192, 192, 192, 0.4)' },
  GOLD: { minRp: 2000, maxRp: 2999, badgeColor: '#ffd700', badgeGlow: 'rgba(255, 215, 0, 0.5)' },
  PLATINUM: { minRp: 3000, maxRp: 3999, badgeColor: '#00e5ff', badgeGlow: 'rgba(0, 229, 255, 0.5)' },
  DIAMOND: { minRp: 4000, maxRp: 4999, badgeColor: '#b388ff', badgeGlow: 'rgba(179, 136, 255, 0.6)' },
  MASTER: { minRp: 5000, maxRp: 5999, badgeColor: '#ff1744', badgeGlow: 'rgba(255, 23, 68, 0.6)' },
  GRANDMASTER: { minRp: 6000, maxRp: 99999, badgeColor: '#ffea00', badgeGlow: 'rgba(255, 234, 0, 0.8)' },
};

export function getRankInfo(rp: number): RankInfo {
  const safeRp = Math.max(0, rp);
  let currentTier: RankTier = 'BRONZE';

  if (safeRp >= 6000) currentTier = 'GRANDMASTER';
  else if (safeRp >= 5000) currentTier = 'MASTER';
  else if (safeRp >= 4000) currentTier = 'DIAMOND';
  else if (safeRp >= 3000) currentTier = 'PLATINUM';
  else if (safeRp >= 2000) currentTier = 'GOLD';
  else if (safeRp >= 1000) currentTier = 'SILVER';
  else currentTier = 'BRONZE';

  const cfg = RANK_TIERS_CONFIG[currentTier];
  const tierRange = Math.max(1, cfg.maxRp - cfg.minRp);
  const rpInTier = safeRp - cfg.minRp;
  const division = Math.min(4, Math.max(1, 4 - Math.floor((rpInTier / tierRange) * 4)));

  return {
    tier: currentTier,
    division,
    currentRp: safeRp,
    minRp: cfg.minRp,
    maxRp: cfg.maxRp,
    badgeColor: cfg.badgeColor,
    badgeGlow: cfg.badgeGlow,
  };
}

export function calculateNextLevelXp(level: number): number {
  return Math.round(500 * Math.pow(Math.max(1, level), 1.4));
}
