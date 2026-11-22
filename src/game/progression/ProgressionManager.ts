// src/game/progression/ProgressionManager.ts
// ARENA X — PHASE 9: Centralized Player Progression & Reward Engine

import { FighterId } from '../characters/RosterConfig';
import {
  calculateNextLevelXp,
  FIGHTER_UNLOCK_CONFIG,
  getRankInfo,
  INITIAL_ACHIEVEMENTS,
} from './ProgressionConfig';
import {
  Achievement,
  MatchRecord,
  MatchRewards,
  PlayerProfile,
} from './ProgressionTypes';

const STORAGE_KEY = 'arena_x_player_progression';
const CURRENT_VERSION = '1.0.0';

export class ProgressionManager {
  private profile: PlayerProfile;
  private listeners: Array<(profile: PlayerProfile) => void> = [];

  constructor() {
    this.profile = this.loadProfile();
  }

  // --- PERSISTENCE & MIGRATION ---

  private getInitialProfile(): PlayerProfile {
    // Generate clean unique ID: AX-XXXXX
    const randId = Math.floor(10000 + Math.random() * 90000);
    return {
      version: CURRENT_VERSION,
      username: 'KAI_PROTAGONIST',
      playerId: `AX-${randId}`,
      level: 1,
      currentXp: 0,
      nextLevelXp: calculateNextLevelXp(1),
      coins: 500, // Starting bonus
      rankTier: 'BRONZE',
      rankPoints: 100, // Starting Bronze RP
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      currentWinStreak: 0,
      highestWinStreak: 0,
      favoriteFighter: 'KAI',
      unlockedFighters: ['KAI', 'SHADOW', 'BLAZE', 'FROST'], // 4 Starter fighters
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      matchHistory: [],
      cosmetics: {
        selectedTitle: 'Crimson Striker',
        selectedBanner: 'NEON_CITY_NIGHT',
        selectedFrame: 'CYBER_STEEL',
        unlockedTitles: ['Crimson Striker', 'Novice Challenger', 'Dojo Trainee'],
        unlockedBanners: ['NEON_CITY_NIGHT', 'TEMPLE_DAWN'],
        unlockedFrames: ['CYBER_STEEL', 'BASIC_CARBON'],
        fighterPalettes: {
          KAI: 'DEFAULT',
          SHADOW: 'DEFAULT',
          BLAZE: 'DEFAULT',
          FROST: 'DEFAULT',
          VOLT: 'DEFAULT',
          TERRA: 'DEFAULT',
          PHANTOM: 'DEFAULT',
          RONIN: 'DEFAULT',
          VIPER: 'DEFAULT',
          TITAN: 'DEFAULT',
          NOVA: 'DEFAULT',
          REAPER: 'DEFAULT',
          AETHER: 'DEFAULT',
          RYUZEN: 'DEFAULT',
          ECLIPSE: 'DEFAULT',
          ZENITH: 'DEFAULT',
        },
      },
    };
  }

  private loadProfile(): PlayerProfile {
    if (typeof window === 'undefined' || !window.localStorage) {
      return this.getInitialProfile();
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.getInitialProfile();

      const parsed = JSON.parse(raw) as Partial<PlayerProfile>;

      // Version Migration check
      if (parsed.version !== CURRENT_VERSION) {
        return this.migrateProfile(parsed);
      }

      // Merge with fresh initial config to ensure new achievements/fighters are never missing
      const base = this.getInitialProfile();
      const mergedAchievements: Record<string, Achievement> = { ...base.achievements };

      if (parsed.achievements) {
        for (const [key, ach] of Object.entries(parsed.achievements)) {
          if (mergedAchievements[key]) {
            mergedAchievements[key] = {
              ...mergedAchievements[key],
              currentValue: ach.currentValue ?? 0,
              isUnlocked: ach.isUnlocked ?? false,
              unlockedAt: ach.unlockedAt ?? null,
              isClaimed: ach.isClaimed ?? false,
            };
          }
        }
      }

      const mergedUnlocked = Array.from(
        new Set([...base.unlockedFighters, ...(parsed.unlockedFighters || [])])
      );

      return {
        ...base,
        ...parsed,
        version: CURRENT_VERSION,
        achievements: mergedAchievements,
        unlockedFighters: mergedUnlocked,
        cosmetics: {
          ...base.cosmetics,
          ...(parsed.cosmetics || {}),
        },
      };
    } catch (e) {
      console.warn('[ProgressionManager] Failed to load profile:', e);
      return this.getInitialProfile();
    }
  }

  private migrateProfile(oldData: Partial<PlayerProfile>): PlayerProfile {
    console.info(`[ProgressionManager] Migrating profile from ${oldData.version || 'v0'} to ${CURRENT_VERSION}`);
    const fresh = this.getInitialProfile();
    return {
      ...fresh,
      username: oldData.username || fresh.username,
      playerId: oldData.playerId || fresh.playerId,
      level: oldData.level || 1,
      currentXp: oldData.currentXp || 0,
      nextLevelXp: calculateNextLevelXp(oldData.level || 1),
      coins: oldData.coins ?? fresh.coins,
      rankPoints: oldData.rankPoints ?? 100,
      wins: oldData.wins || 0,
      losses: oldData.losses || 0,
      totalMatches: oldData.totalMatches || 0,
      unlockedFighters: Array.from(new Set([...fresh.unlockedFighters, ...(oldData.unlockedFighters || [])])),
    };
  }

  public saveProfile(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      this.notifyListeners();
    } catch (e) {
      console.warn('[ProgressionManager] Failed to save profile:', e);
    }
  }

  public subscribe(cb: (profile: PlayerProfile) => void): () => void {
    this.listeners.push(cb);
    cb(this.profile);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => {
      try {
        cb(this.profile);
      } catch (e) {}
    });
  }

  // --- GETTERS ---

  public getProfile(): PlayerProfile {
    return { ...this.profile };
  }

  public getRank(): ReturnType<typeof getRankInfo> {
    return getRankInfo(this.profile.rankPoints);
  }

  public isFighterUnlocked(fighterId: FighterId): boolean {
    return this.profile.unlockedFighters.includes(fighterId);
  }

  public setUsername(newName: string): void {
    const trimmed = newName.trim().slice(0, 16);
    if (trimmed.length > 0) {
      this.profile.username = trimmed;
      this.saveProfile();
    }
  }

  public addCoins(amount: number): number {
    this.profile.coins += amount;
    this.saveProfile();
    return this.profile.coins;
  }

  // --- XP & MATCH RECORDING ---

  public recordMatchResult(params: {
    gameMode: 'VERSUS' | 'ONLINE' | 'TRAINING';
    playerFighter: FighterId;
    opponentFighter: FighterId;
    opponentName: string;
    stageId: string;
    playerScore: number;
    opponentScore: number;
    durationSeconds: number;
    isPerfectRound?: boolean;
    isUltimateFinisher?: boolean;
    maxCombo?: number;
    specialMovesUsed?: number;
  }): MatchRewards {
    // Discard invalid matches (e.g. disconnected in under 2 seconds)
    if (params.durationSeconds < 1.0) {
      return {
        xpEarned: 0,
        coinsEarned: 0,
        rpChange: 0,
        didLevelUp: false,
        oldLevel: this.profile.level,
        newLevel: this.profile.level,
        rankChanged: false,
        newRank: this.profile.rankTier,
        unlockedAchievements: [],
      };
    }

    const isWin = params.playerScore > params.opponentScore;
    const isDraw = params.playerScore === params.opponentScore;
    const resultText = isWin ? 'WIN' : isDraw ? 'DRAW' : 'LOSS';

    // 1. Calculate XP Earned
    let xpEarned = 100; // Base completion XP
    if (isWin) xpEarned += 150; // Win bonus
    xpEarned += params.playerScore * 25; // Round bonus
    if (params.isPerfectRound) xpEarned += 100; // Perfect round bonus
    if (params.isUltimateFinisher) xpEarned += 80;

    // 2. Calculate AX Coins Earned
    let coinsEarned = isWin ? 120 : 50;
    if (params.isPerfectRound) coinsEarned += 50;
    if (params.isUltimateFinisher) coinsEarned += 30;

    // 3. Calculate RP (Rank Points)
    let rpChange = 0;
    if (params.gameMode === 'ONLINE' || params.gameMode === 'VERSUS') {
      if (isWin) {
        // Base win + streak bonus
        const streakBonus = Math.min(15, this.profile.currentWinStreak * 3);
        rpChange = 30 + streakBonus;
      } else if (!isDraw) {
        rpChange = -15; // Loss deduction
      }
    }

    // 4. Update Profile Stats
    this.profile.totalMatches++;
    if (isWin) {
      this.profile.wins++;
      this.profile.currentWinStreak++;
      if (this.profile.currentWinStreak > this.profile.highestWinStreak) {
        this.profile.highestWinStreak = this.profile.currentWinStreak;
      }
    } else if (!isDraw) {
      this.profile.losses++;
      this.profile.currentWinStreak = 0;
    }
    this.profile.winRate = Math.round(
      (this.profile.wins / Math.max(1, this.profile.totalMatches)) * 100
    );

    // Update Favorite Fighter by counting match appearances
    this.updateFavoriteFighter(params.playerFighter);

    // Apply Coins
    this.profile.coins += coinsEarned;

    // Apply RP
    const oldTier = this.profile.rankTier;
    this.profile.rankPoints = Math.max(0, this.profile.rankPoints + rpChange);
    const updatedRankInfo = getRankInfo(this.profile.rankPoints);
    this.profile.rankTier = updatedRankInfo.tier;
    const rankChanged = oldTier !== this.profile.rankTier;

    // 5. Apply XP & Level-Up Progression
    const oldLevel = this.profile.level;
    this.profile.currentXp += xpEarned;
    let didLevelUp = false;

    while (this.profile.currentXp >= this.profile.nextLevelXp) {
      this.profile.currentXp -= this.profile.nextLevelXp;
      this.profile.level++;
      this.profile.nextLevelXp = calculateNextLevelXp(this.profile.level);
      this.profile.coins += 250; // Level up reward bonus
      didLevelUp = true;
    }
    const newLevel = this.profile.level;

    // 6. Check Automatic Fighter Unlocks (Level, Wins, or Rank milestones)
    this.checkMilestoneUnlocks();

    // 7. Update Achievement Progressions
    const newlyUnlockedAchievements = this.processAchievements({
      isWin,
      isOnline: params.gameMode === 'ONLINE',
      isPerfect: !!params.isPerfectRound,
      isUltimate: !!params.isUltimateFinisher,
      comboCount: params.maxCombo || 0,
      specialCount: params.specialMovesUsed || 0,
      stageId: params.stageId,
      isTraining: params.gameMode === 'TRAINING',
    });

    // 8. Add to Match History (capped at 50)
    const matchRecord: MatchRecord = {
      id: `match_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      date: Date.now(),
      gameMode: params.gameMode,
      playerFighter: params.playerFighter,
      opponentFighter: params.opponentFighter,
      opponentName: params.opponentName || 'CHALLENGER',
      stageId: params.stageId,
      result: resultText,
      playerScore: params.playerScore,
      opponentScore: params.opponentScore,
      durationSeconds: Math.round(params.durationSeconds),
      xpEarned,
      coinsEarned,
      rpChange,
    };

    this.profile.matchHistory.unshift(matchRecord);
    if (this.profile.matchHistory.length > 50) {
      this.profile.matchHistory.pop();
    }

    this.saveProfile();

    return {
      xpEarned,
      coinsEarned,
      rpChange,
      didLevelUp,
      oldLevel,
      newLevel,
      rankChanged,
      newRank: this.profile.rankTier,
      unlockedAchievements: newlyUnlockedAchievements,
    };
  }

  private updateFavoriteFighter(lastFighter: FighterId): void {
    const counts: Record<string, number> = {};
    this.profile.matchHistory.forEach((m) => {
      counts[m.playerFighter] = (counts[m.playerFighter] || 0) + 1;
    });
    counts[lastFighter] = (counts[lastFighter] || 0) + 1;

    let maxCount = 0;
    let fav: FighterId = lastFighter;
    for (const [fId, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        fav = fId as FighterId;
      }
    }
    this.profile.favoriteFighter = fav;
  }

  // --- MILESTONE UNLOCKS ---

  private checkMilestoneUnlocks(): void {
    const unlockedSet = new Set(this.profile.unlockedFighters);

    for (const [fighterId, req] of Object.entries(FIGHTER_UNLOCK_CONFIG) as [
      FighterId,
      typeof FIGHTER_UNLOCK_CONFIG[FighterId]
    ][]) {
      if (unlockedSet.has(fighterId)) continue;

      let meetsMilestone = false;

      if (req.requiredLevel && this.profile.level >= req.requiredLevel) {
        meetsMilestone = true;
      }
      if (req.requiredWins && this.profile.wins >= req.requiredWins) {
        meetsMilestone = true;
      }
      if (req.requiredRank) {
        const order: Record<string, number> = {
          BRONZE: 1,
          SILVER: 2,
          GOLD: 3,
          PLATINUM: 4,
          DIAMOND: 5,
          MASTER: 6,
          GRANDMASTER: 7,
        };
        if (order[this.profile.rankTier] >= order[req.requiredRank]) {
          meetsMilestone = true;
        }
      }

      if (meetsMilestone) {
        this.profile.unlockedFighters.push(fighterId);
      }
    }
  }

  // --- MANUAL FIGHTER UNLOCK WITH COINS ---

  public unlockFighterWithCoins(fighterId: FighterId): {
    success: boolean;
    message: string;
  } {
    if (this.isFighterUnlocked(fighterId)) {
      return { success: false, message: 'Fighter is already unlocked!' };
    }

    const cfg = FIGHTER_UNLOCK_CONFIG[fighterId];
    if (!cfg) {
      return { success: false, message: 'Invalid fighter configuration.' };
    }

    if (this.profile.coins < cfg.coinCost) {
      return {
        success: false,
        message: `Insufficient AX Coins! Need ${cfg.coinCost.toLocaleString()} Coins (You have ${this.profile.coins.toLocaleString()}).`,
      };
    }

    // Deduct coins & unlock
    this.profile.coins -= cfg.coinCost;
    this.profile.unlockedFighters.push(fighterId);
    this.saveProfile();

    return {
      success: true,
      message: `Successfully unlocked ${fighterId} for battle!`,
    };
  }

  // --- ACHIEVEMENTS SYSTEM ---

  private processAchievements(ctx: {
    isWin: boolean;
    isOnline: boolean;
    isPerfect: boolean;
    isUltimate: boolean;
    comboCount: number;
    specialCount: number;
    stageId: string;
    isTraining: boolean;
  }): Achievement[] {
    const newlyUnlocked: Achievement[] = [];

    const increment = (id: string, amount: number) => {
      const ach = this.profile.achievements[id];
      if (!ach || ach.isUnlocked) return;

      ach.currentValue = Math.min(ach.targetValue, ach.currentValue + amount);
      if (ach.currentValue >= ach.targetValue && !ach.isUnlocked) {
        ach.isUnlocked = true;
        ach.unlockedAt = Date.now();
        newlyUnlocked.push(ach);
      }
    };

    if (ctx.isWin) {
      increment('FIRST_VICTORY', 1);
      increment('TEN_VICTORIES', 1);
      increment('UNSTOPPABLE', this.profile.currentWinStreak >= 5 ? 5 : 0);
    }
    if (ctx.isOnline) {
      increment('FIRST_ONLINE', 1);
    }
    if (ctx.isPerfect) {
      increment('PERFECT_ROUND', 1);
    }
    if (ctx.isUltimate) {
      increment('ULTIMATE_FINISHER', 1);
    }
    if (ctx.comboCount >= 5) {
      increment('COMBO_MASTER', 5);
    }
    if (ctx.specialCount > 0) {
      increment('SPECIAL_EXPERT', ctx.specialCount);
    }
    if (ctx.isTraining) {
      increment('TRAINING_GRADUATE', 1);
    }

    // Check unique arenas won
    const stagesWon = new Set(
      this.profile.matchHistory
        .filter((m) => m.result === 'WIN')
        .map((m) => m.stageId)
    );
    if (stagesWon.size >= 6) {
      increment('ARENA_CHAMPION', 6);
    }

    return newlyUnlocked;
  }

  public claimAchievement(achievementId: string): {
    success: boolean;
    xpAwarded: number;
    coinsAwarded: number;
    message: string;
  } {
    const ach = this.profile.achievements[achievementId];
    if (!ach) {
      return { success: false, xpAwarded: 0, coinsAwarded: 0, message: 'Achievement not found' };
    }
    if (!ach.isUnlocked) {
      return { success: false, xpAwarded: 0, coinsAwarded: 0, message: 'Achievement not yet unlocked' };
    }
    if (ach.isClaimed) {
      return { success: false, xpAwarded: 0, coinsAwarded: 0, message: 'Reward already claimed!' };
    }

    // Mark claimed & award rewards
    ach.isClaimed = true;
    this.profile.currentXp += ach.rewardXp;
    this.profile.coins += ach.rewardCoins;

    // Process potential level-ups from reward XP
    while (this.profile.currentXp >= this.profile.nextLevelXp) {
      this.profile.currentXp -= this.profile.nextLevelXp;
      this.profile.level++;
      this.profile.nextLevelXp = calculateNextLevelXp(this.profile.level);
      this.profile.coins += 250;
    }

    this.saveProfile();

    return {
      success: true,
      xpAwarded: ach.rewardXp,
      coinsAwarded: ach.rewardCoins,
      message: `Claimed +${ach.rewardXp} XP and +${ach.rewardCoins} AX Coins!`,
    };
  }

  // --- COSMETICS ---

  public equipCosmetic(
    type: 'TITLE' | 'BANNER' | 'FRAME' | 'PALETTE',
    id: string,
    fighterId?: FighterId
  ): void {
    if (type === 'TITLE') {
      this.profile.cosmetics.selectedTitle = id;
    } else if (type === 'BANNER') {
      this.profile.cosmetics.selectedBanner = id;
    } else if (type === 'FRAME') {
      this.profile.cosmetics.selectedFrame = id;
    } else if (type === 'PALETTE' && fighterId) {
      this.profile.cosmetics.fighterPalettes[fighterId] = id;
    }
    this.saveProfile();
  }

  public resetProgression(): void {
    this.profile = this.getInitialProfile();
    this.saveProfile();
  }
}

export const progressionManager = new ProgressionManager();
