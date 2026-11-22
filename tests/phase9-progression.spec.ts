// tests/phase9-progression.spec.ts
// Automated Verification for Phase 9: Player Progression, Rewards & Fighter Unlock System

import { test, expect } from '@playwright/test';

test.describe('Phase 9: Player Progression, Rewards & Fighter Unlock System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Progression 1: Player Profile, XP leveling, and Rank calculations', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { progressionManager } = await import('/src/game/progression/ProgressionManager.ts');
      progressionManager.resetProgression();

      const initialProfile = progressionManager.getProfile();
      const initialLevel = initialProfile.level;

      // 1. Record a victory match with perfect round
      const rewards = progressionManager.recordMatchResult({
        gameMode: 'VERSUS',
        playerFighter: 'KAI',
        opponentFighter: 'SHADOW',
        opponentName: 'SHADOW',
        stageId: 'ANCIENT_TEMPLE',
        playerScore: 2,
        opponentScore: 0,
        durationSeconds: 45,
        isPerfectRound: true,
        isUltimateFinisher: true,
        maxCombo: 6,
        specialMovesUsed: 4,
      });

      const updatedProfile = progressionManager.getProfile();
      const rankInfo = progressionManager.getRank();

      return {
        initialProfile,
        initialLevel,
        rewards,
        updatedProfile,
        rankInfo,
      };
    });

    expect(result.initialProfile.playerId).toMatch(/^AX-\d{5}$/);
    expect(result.initialProfile.unlockedFighters).toEqual(['KAI', 'SHADOW', 'BLAZE', 'FROST']);
    expect(result.rewards.xpEarned).toBeGreaterThanOrEqual(350);
    expect(result.updatedProfile.wins).toBe(1);
    expect(result.updatedProfile.totalMatches).toBe(1);
    expect(result.updatedProfile.winRate).toBe(100);
    expect(result.updatedProfile.currentWinStreak).toBe(1);
    expect(result.rankInfo.currentRp).toBeGreaterThan(100);
  });

  test('Progression 2: Fighter Unlock with AX Coins & Locked Roster verification', async ({ page }) => {
    const unlockResult = await page.evaluate(async () => {
      const { progressionManager } = await import('/src/game/progression/ProgressionManager.ts');
      progressionManager.resetProgression();

      // Ensure player has enough coins for Volt (1000 Coins)
      progressionManager.addCoins(2000); // 500 + 2000 = 2500

      const isVoltUnlockedBefore = progressionManager.isFighterUnlocked('VOLT');
      const unlockRes = progressionManager.unlockFighterWithCoins('VOLT');
      const isVoltUnlockedAfter = progressionManager.isFighterUnlocked('VOLT');
      const remainingCoins = progressionManager.getProfile().coins;

      return {
        isVoltUnlockedBefore,
        unlockSuccess: unlockRes.success,
        isVoltUnlockedAfter,
        remainingCoins,
      };
    });

    expect(unlockResult.isVoltUnlockedBefore).toBe(false);
    expect(unlockResult.unlockSuccess).toBe(true);
    expect(unlockResult.isVoltUnlockedAfter).toBe(true);
    expect(unlockResult.remainingCoins).toBe(1500); // 2500 - 1000 = 1500
  });

  test('Progression 3: Achievement tracking, duplicate claim protection & rewards', async ({ page }) => {
    const achResult = await page.evaluate(async () => {
      const { progressionManager } = await import('/src/game/progression/ProgressionManager.ts');
      progressionManager.resetProgression();

      // Win 1 match to unlock FIRST_VICTORY
      progressionManager.recordMatchResult({
        gameMode: 'VERSUS',
        playerFighter: 'KAI',
        opponentFighter: 'SHADOW',
        opponentName: 'SHADOW',
        stageId: 'NEON_CITY',
        playerScore: 2,
        opponentScore: 1,
        durationSeconds: 35,
      });

      const firstVictoryAch = progressionManager.getProfile().achievements['FIRST_VICTORY'];
      const coinsBefore = progressionManager.getProfile().coins;

      // Claim reward first time
      const claim1 = progressionManager.claimAchievement('FIRST_VICTORY');
      const coinsAfter1 = progressionManager.getProfile().coins;

      // Attempt duplicate claim
      const claim2 = progressionManager.claimAchievement('FIRST_VICTORY');
      const coinsAfter2 = progressionManager.getProfile().coins;

      return {
        isUnlocked: firstVictoryAch.isUnlocked,
        claim1Success: claim1.success,
        claim1Xp: claim1.xpAwarded,
        claim1Coins: claim1.coinsAwarded,
        coinsDelta1: coinsAfter1 - coinsBefore,
        claim2Success: claim2.success,
        coinsDelta2: coinsAfter2 - coinsAfter1,
      };
    });

    expect(achResult.isUnlocked).toBe(true);
    expect(achResult.claim1Success).toBe(true);
    expect(achResult.claim1Coins).toBe(200);
    expect(achResult.coinsDelta1).toBe(450); // 200 achievement reward + 250 level-up bonus
    expect(achResult.claim2Success).toBe(false); // Duplicate claim blocked!
    expect(achResult.coinsDelta2).toBe(0);
  });

  test('Progression 4: Player Profile Modal UI, Tab Switching & Screenshot', async ({ page }) => {
    await page.waitForSelector('.main-menu-root');

    // Click PROFILE button in Main Menu
    const profileBtn = page.locator('button:has-text("PROFILE")');
    await profileBtn.scrollIntoViewIfNeeded();
    await profileBtn.click();

    // Verify Profile Modal is visible
    const profileModal = page.locator('.profile-container');
    await expect(profileModal).toBeVisible();

    // Verify Overview contents: Level, XP ratio, Rank badge, Fighter showcase
    await expect(page.locator('.profile-fighter-showcase')).toBeVisible();
    await expect(page.locator('.level-progression-card')).toBeVisible();
    await expect(page.locator('.stats-metric-grid')).toBeVisible();

    // Take screenshot of Overview tab (matching Image 2 Street Fighter 6 style)
    await page.screenshot({
      path: 'C:/Users/vuyya/.gemini/antigravity/brain/84a7bae4-c74d-47e8-9e95-c62ba2fd7677/phase-9-profile-overview.png',
      fullPage: true,
    });

    // Switch to FIGHTERS Tab
    const fightersTab = page.locator('.profile-tab-btn:has-text("FIGHTERS")');
    await fightersTab.click();
    await expect(page.locator('.profile-roster-grid')).toBeVisible();

    // Switch to ACHIEVEMENTS Tab
    const achTab = page.locator('.profile-tab-btn:has-text("ACHIEVEMENTS")');
    await achTab.click();
    await expect(page.locator('.profile-achievements-list')).toBeVisible();

    // Switch to HISTORY Tab
    const histTab = page.locator('.profile-tab-btn:has-text("HISTORY")');
    await histTab.click();
    await expect(page.locator('.profile-history-layout')).toBeVisible();

    // Switch to COSMETICS Tab
    const cosmTab = page.locator('.profile-tab-btn:has-text("COSMETICS")');
    await cosmTab.click();
    await expect(page.locator('.profile-cosmetics-layout')).toBeVisible();

    // Close Modal
    const closeBtn = page.locator('.profile-close-btn');
    await closeBtn.click();
    await expect(profileModal).not.toBeVisible();
  });

  test('Progression 5: Character Selection respects locked fighters & unlock banner', async ({ page }) => {
    await page.waitForSelector('.main-menu-root');

    // Open Character Select Modal
    const charSelectBtn = page.locator('button:has-text("SELECT FIGHTERS")');
    await charSelectBtn.scrollIntoViewIfNeeded();
    await charSelectBtn.click();

    // Verify modal opened
    const charModal = page.locator('.character-select-container');
    await expect(charModal).toBeVisible();

    // Hover or click locked fighter card (e.g. VOLT)
    const voltCard = page.locator('.roster-card:has-text("Volt")');
    await voltCard.click();

    // Verify Lock banner is displayed for locked fighter
    await expect(page.locator('.char-select-lock-banner')).toBeVisible();
    await expect(page.locator('text=LOCKED COMBATANT')).toBeVisible();

    // Close Character Select
    const closeBtn = page.locator('.stage-modal-close');
    await closeBtn.click();
    await expect(charModal).not.toBeVisible();
  });
});
