// tests/camera-tracking.spec.ts
// CAMERA TRACKING & SCREEN EDGE FRAMING VERIFICATION SUITE

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('ARENA X — Camera Tracking & Viewport Framing', () => {
  test('Camera dynamically frames fighters and prevents off-screen clipping', async ({ page }, testInfo) => {
    const screenshotDir = path.resolve('test-results/camera-tracking-screenshots');
    fs.mkdirSync(screenshotDir, { recursive: true });
    const projectName = testInfo.project.name.toLowerCase().replace(/\s+/g, '-');

    // 1. Load Main Menu & Start Versus Match
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const playBtn = page.locator('.play-btn');
    await expect(playBtn).toBeVisible();
    await playBtn.click();

    // 2. Wait for Round Intro to complete
    await page.waitForTimeout(2200);

    // Initial stance screenshot
    const initialPath = path.join(screenshotDir, `${projectName}-1-initial-framing.png`);
    await page.screenshot({ path: initialPath });
    console.log(`Saved screenshot: ${initialPath}`);

    // 3. Move Kai (P1) left towards the stage/screen corner
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(1400); // Walk left
    await page.keyboard.up('KeyA');
    await page.waitForTimeout(300);

    const p1WalkLeftScreenshot = path.join(screenshotDir, `${projectName}-2-p1-walk-left-framing.png`);
    await page.screenshot({ path: p1WalkLeftScreenshot });

    // 4. Move Kai (P1) right towards Shadow to test close clinch zoom
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(1600);
    await page.keyboard.up('KeyD');
    await page.waitForTimeout(300);

    const clinchScreenshot = path.join(screenshotDir, `${projectName}-3-clinch-framing.png`);
    await page.screenshot({ path: clinchScreenshot });

    // 5. Test Maximum Separation: Separate fighters widely across the stage
    await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      if (engine) {
        engine.fighterP1.x = 550;
        engine.fighterP2.x = 1850;
      }
    });
    // Allow camera to smoothly zoom out to accommodate large separation
    await page.waitForTimeout(800);

    const wideSeparationScreenshot = path.join(screenshotDir, `${projectName}-4-wide-separation-framing.png`);
    await page.screenshot({ path: wideSeparationScreenshot });

    // 6. Check in-engine coordinates and camera state
    const trackingState = await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      if (!engine) {
        return { hasEngine: false };
      }
      const cvs = engine.canvas;
      const w = cvs.width / Math.min(window.devicePixelRatio || 1, 2);
      const h = cvs.height / Math.min(window.devicePixelRatio || 1, 2);
      const bounds = engine.camera.getVisibleWorldBounds(w, h);
      return {
        hasEngine: true,
        p1X: engine.fighterP1.x,
        p2X: engine.fighterP2.x,
        camX: engine.camera.x,
        camY: engine.camera.y,
        camZoom: engine.camera.zoom,
        visibleMinX: bounds.minX,
        visibleMaxX: bounds.maxX,
        p1MarginFromLeft: engine.fighterP1.x - bounds.minX,
        p2MarginFromRight: bounds.maxX - engine.fighterP2.x,
      };
    });

    console.log('Wide Separation Tracking State:', trackingState);
    expect(trackingState.p1MarginFromLeft).toBeGreaterThan(60);
    expect(trackingState.p2MarginFromRight).toBeGreaterThan(60);
  });
});
