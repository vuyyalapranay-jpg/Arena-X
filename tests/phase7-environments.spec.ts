// tests/phase7-environments.spec.ts
// COMPREHENSIVE PHASE 7 TEST SUITE: ADVANCED ARENAS, ENVIRONMENTS & 2.5D EFFECTS

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('ARENA X — Phase 7: Advanced Arenas, Environments & 2.5D Visual Effects', () => {
  const screenshotDir = path.resolve('test-results/phase7-screenshots');

  test.beforeAll(() => {
    fs.mkdirSync(screenshotDir, { recursive: true });
  });

  test('Stage Selection Screen & All Six 2.5D Arenas Render Correctly with Parallax & Atmosphere', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name.toLowerCase().replace(/\s+/g, '-');

    // Collect any unexpected console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('ERR_CONNECTION_CLOSED')) {
          consoleErrors.push(text);
        }
      }
    });

    // 1. Load Main Menu
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // 2. Open Stage Selection Modal via Dedicated Stage Select Button
    const stageBtn = page.locator('.stage-select-btn');
    await expect(stageBtn).toBeVisible();
    await stageBtn.click();
    await page.waitForTimeout(400);

    // Verify Stage Select Modal is open
    const stageModal = page.locator('.stage-select-modal');
    await expect(stageModal).toBeVisible();

    // Capture screenshot of Stage Selection UI
    const stageSelectScreenshot = path.join(screenshotDir, `${projectName}-0-stage-selection-menu.png`);
    await page.screenshot({ path: stageSelectScreenshot });
    console.log(`Saved screenshot: ${stageSelectScreenshot}`);

    // Verify all 6 stage cards are present in carousel
    const stageCards = page.locator('.stage-thumb-card');
    await expect(stageCards).toHaveCount(6);

    // 3. Confirm selection to set Ancient Temple, then Launch Fight via Play Button
    const confirmBtn = page.locator('.stage-confirm-btn');
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();
    await page.waitForTimeout(400);

    // Launch Versus Fight
    const playBtn = page.locator('.play-btn');
    await expect(playBtn).toBeVisible();
    await playBtn.click();

    // Wait for Round Intro to complete and fighting to begin
    await page.waitForTimeout(2200);

    // List of all 6 arenas to test sequentially
    const stagesToTest = [
      { id: 'ANCIENT_TEMPLE', name: 'Ancient Temple' },
      { id: 'NEON_CITY', name: 'Neon City' },
      { id: 'VOLCANIC_BATTLEFIELD', name: 'Volcanic Battlefield' },
      { id: 'FROZEN_WASTELAND', name: 'Frozen Wasteland' },
      { id: 'CYBERPUNK_ROOFTOP', name: 'Cyberpunk Rooftop' },
      { id: 'MYSTIC_FOREST', name: 'Mystic Forest' },
    ];

    for (let i = 0; i < stagesToTest.length; i++) {
      const stg = stagesToTest[i];

      // Switch stage in engine dynamically
      const stageSwitched = await page.evaluate((targetId) => {
        // @ts-ignore
        const engine = window.__ARENA_X_ENGINE__;
        if (!engine) return false;
        engine.setStage(targetId);
        return true;
      }, stg.id);

      expect(stageSwitched).toBe(true);

      // Trigger combat impact reaction to test stage-specific particles & dust
      await page.evaluate(() => {
        // @ts-ignore
        const engine = window.__ARENA_X_ENGINE__;
        if (engine) {
          engine.arena.triggerImpactReaction(1200, 560, true);
        }
      });

      // Allow 400ms for particles & parallax to simulate
      await page.waitForTimeout(400);

      // Verify engine stage state & fighter ground alignment
      const engineState = await page.evaluate(() => {
        // @ts-ignore
        const engine = window.__ARENA_X_ENGINE__;
        if (!engine) return null;
        return {
          currentStageId: engine.arena.currentStageId,
          p1Y: engine.fighterP1.y,
          p2Y: engine.fighterP2.y,
          p1Grounded: engine.fighterP1.isGrounded,
          p2Grounded: engine.fighterP2.isGrounded,
          floorY: engine.arena.floorY,
          particleCount: engine.arena.particleSystem['particles'].length,
        };
      });

      expect(engineState).not.toBeNull();
      expect(engineState?.currentStageId).toBe(stg.id);
      expect(engineState?.p1Y).toBe(560);
      expect(engineState?.p2Y).toBe(560);
      expect(engineState?.p1Grounded).toBe(true);
      expect(engineState?.p2Grounded).toBe(true);
      expect(engineState?.particleCount).toBeGreaterThan(0);

      // Capture screenshot of the active fighting arena
      const arenaScreenshot = path.join(screenshotDir, `${projectName}-${i + 1}-${stg.id.toLowerCase()}.png`);
      await page.screenshot({ path: arenaScreenshot });
      console.log(`Saved screenshot: ${arenaScreenshot}`);
    }

    // 4. Test Parallax Scrolling by moving Kai
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(1000);
    await page.keyboard.up('KeyD');
    await page.waitForTimeout(300);

    const parallaxScreenshot = path.join(screenshotDir, `${projectName}-7-parallax-movement.png`);
    await page.screenshot({ path: parallaxScreenshot });
    console.log(`Saved screenshot: ${parallaxScreenshot}`);

    expect(consoleErrors).toHaveLength(0);
  });
});
