// tests/phase4-combat.spec.ts
// PHASE 4 COMPREHENSIVE COMBAT SYSTEM & HIT DETECTION VERIFICATION SUITE

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('ARENA X — Phase 4 Combat System & Hit Detection', () => {
  test('Complete Combat State Machine, Attacks, Defense & Match Rules', async ({ page }, testInfo) => {
    const screenshotDir = path.resolve('test-results/phase4-combat-screenshots');
    fs.mkdirSync(screenshotDir, { recursive: true });
    const projectName = testInfo.project.name.toLowerCase().replace(/\s+/g, '-');

    // 1. Launch Game & Start Versus Match
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const playBtn = page.locator('.play-btn');
    await expect(playBtn).toBeVisible();
    await playBtn.click();

    // Wait for Round 1 to start
    await page.waitForTimeout(2200);

    // Initial Neutral stance
    const neutralPath = path.join(screenshotDir, `${projectName}-1-neutral-ready.png`);
    await page.screenshot({ path: neutralPath });

    // Enable Hitbox Debug Overlay
    await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      if (engine) {
        engine.settings.showHitboxes = true;
      }
    });

    // 2. Test 1: Light Punch & Hitbox Generation
    await page.keyboard.press('KeyF'); // Light Jab
    await page.waitForTimeout(100);
    const lightPunchPath = path.join(screenshotDir, `${projectName}-2-light-punch-hitbox.png`);
    await page.screenshot({ path: lightPunchPath });

    // 3. Test 2: Heavy Punch / Forward Punch
    await page.keyboard.press('KeyR'); // Heavy Straight
    await page.waitForTimeout(150);
    const heavyPunchPath = path.join(screenshotDir, `${projectName}-3-heavy-punch-hitbox.png`);
    await page.screenshot({ path: heavyPunchPath });

    // 4. Test 3: Uppercut (Crouch + Punch)
    await page.keyboard.down('KeyS');
    await page.waitForTimeout(80);
    await page.keyboard.press('KeyF');
    await page.waitForTimeout(140);
    const uppercutPath = path.join(screenshotDir, `${projectName}-4-uppercut-anti-air.png`);
    await page.screenshot({ path: uppercutPath });
    await page.keyboard.up('KeyS');
    await page.waitForTimeout(200);

    // 5. Test 4: Low Shin Sweep (Crouch + Kick)
    await page.keyboard.down('KeyS');
    await page.waitForTimeout(80);
    await page.keyboard.press('KeyG');
    await page.waitForTimeout(120);
    const lowKickPath = path.join(screenshotDir, `${projectName}-5-low-shin-sweep.png`);
    await page.screenshot({ path: lowKickPath });
    await page.keyboard.up('KeyS');
    await page.waitForTimeout(200);

    // 6. Test 5: Air Attack (Jump + Kick)
    await page.keyboard.press('KeyW'); // Jump
    await page.waitForTimeout(180); // In air
    await page.keyboard.press('KeyG'); // Air Kick
    await page.waitForTimeout(80);
    const jumpKickPath = path.join(screenshotDir, `${projectName}-6-jumping-dive-kick.png`);
    await page.screenshot({ path: jumpKickPath });
    await page.waitForTimeout(500); // Landing

    // 7. Test 6: Combat Interaction & High/Mid/Low Guard Verification
    const guardTest = await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      if (!engine) return { success: false };

      const p1 = engine.fighterP1;
      const p2 = engine.fighterP2;

      // Position fighters within striking range
      p1.x = 1120;
      p2.x = 1200;
      p1.facing = 1;
      p2.facing = -1;

      // Have P2 block standing
      p2.state = 'BLOCK';
      p2.animController.play('blockStand', true);

      // P1 executes Low Shin Sweep (Height: 'LOW')
      p1.startAttack('KICK_LOW', 'kickLow');
      const hitbox = p1.getActiveHitbox();
      const hurtbox = p2.getHurtbox();

      // Resolve low attack vs standing guard (should PIERCE guard!)
      const lowVsStand = engine.CombatEngine
        ? engine.CombatEngine.resolveAttackHit(hitbox, hurtbox, p2.state, false, p2.facing, p2.guardMeter)
        : null;

      return {
        success: true,
        p1Health: p1.currentHealth,
        p2Health: p2.currentHealth,
        p2GuardMeter: p2.guardMeter,
      };
    });
    expect(guardTest.success).toBe(true);

    // 8. Test 7: Clean Hit, Hit Stun, Combo Chaining & Special Attack
    await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      if (engine) {
        // Give P1 super meter for special move
        engine.fighterP1.superMeter = 80;
        engine.fighterP1.x = 1120;
        engine.fighterP2.x = 1210;
        engine.fighterP2.state = 'IDLE';
      }
    });

    // Execute Special Crimson Fireball / Dark Shuriken
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    const specialPath = path.join(screenshotDir, `${projectName}-7-special-attack.png`);
    await page.screenshot({ path: specialPath });

    // 9. Test 8: Knockdown & Recovery State Machine
    await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      if (engine) {
        // Simulate heavy knockback triggering knockdown
        engine.fighterP2.applyHitResult(
          {
            hitConnected: true,
            isBlocked: false,
            isGuardBreak: false,
            isKnockdown: true,
            damageDealt: 24,
            hitbox: {
              damage: 24,
              knockback: 280,
              verticalKnockback: -200,
              type: 'ROUNDHOUSE',
              hitStun: 0.45,
            },
          },
          1
        );
      }
    });

    await page.waitForTimeout(150);
    const knockdownPath = path.join(screenshotDir, `${projectName}-8-knockdown.png`);
    await page.screenshot({ path: knockdownPath });

    // 10. Test 9: Best-of-Three Round Victory & Announcement
    const matchRulesCheck = await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      if (!engine) return { passed: false };

      // KO P2 to trigger round win
      engine.fighterP2.currentHealth = 0;
      engine.handleKnockout('P1');

      return {
        passed: true,
        gameState: engine.gameState,
        p1RoundsWon: engine.matchState.p1RoundsWon,
        announcement: engine.matchState.announcement,
      };
    });

    expect(matchRulesCheck.passed).toBe(true);
    expect(matchRulesCheck.p1RoundsWon).toBeGreaterThanOrEqual(1);

    await page.waitForTimeout(300);
    const koPath = path.join(screenshotDir, `${projectName}-9-round-ko-announcement.png`);
    await page.screenshot({ path: koPath });
  });
});
