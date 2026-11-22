// tests/arena-x.spec.ts
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('ARENA X — Phase 2 Engine & 2D Rendering Suite', () => {
  test('1. Game startup, Main Menu, 2D Canvas verification, and Ground Alignment', async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Ensure screenshots directory exists
    const screenshotDir = path.resolve('test-results/screenshots');
    fs.mkdirSync(screenshotDir, { recursive: true });
    const projectName = testInfo.project.name.toLowerCase().replace(/\s+/g, '-');

    // 1. Main Menu Startup
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Capture Main Menu Screenshot
    const menuPath = path.join(screenshotDir, `arena-x-${projectName}-main-menu.png`);
    await page.screenshot({ path: menuPath });
    console.log(`Saved screenshot: ${menuPath}`);

    // 2. Click Play Battle to enter Arena
    const playBtn = page.locator('.play-btn');
    await expect(playBtn).toBeVisible();
    await playBtn.click();

    // 3. Verify 2D Canvas exists
    const canvas = page.locator('canvas.arena-canvas-2d');
    await expect(canvas).toBeVisible();

    // 4. Verify strictly 2D Canvas context (NOT WebGL)
    const contextType = await page.evaluate(() => {
      const cvs = document.querySelector('canvas.arena-canvas-2d') as HTMLCanvasElement;
      if (!cvs) return 'none';
      const ctx2d = cvs.getContext('2d');
      return ctx2d ? 'canvas2d' : 'other';
    });
    expect(contextType).toBe('canvas2d');

    // 5. Verify HUD elements are visible and styled
    const hud = page.locator('.fight-hud-root');
    await expect(hud).toBeVisible();

    // Wait for round intro to complete and enter FIGHTING state
    await page.waitForTimeout(2500);

    // Capture Desktop / Mobile Idle Grounding Screenshot
    const idlePath = path.join(screenshotDir, `arena-x-${projectName}-idle.png`);
    await page.screenshot({ path: idlePath });
    console.log(`Saved screenshot: ${idlePath}`);

    // 6. Test Jump Physics & Shadow Decoupling
    await page.keyboard.press('KeyW');
    await page.waitForTimeout(250); // mid-air
    const jumpPath = path.join(screenshotDir, `arena-x-${projectName}-jump.png`);
    await page.screenshot({ path: jumpPath });
    console.log(`Saved screenshot: ${jumpPath}`);

    // Wait for landing
    await page.waitForTimeout(600);

    // 7. Test Punch (Kyo Kusanagi Style)
    await page.keyboard.press('KeyF');
    await page.waitForTimeout(100); // attack strike frame
    const punchPath = path.join(screenshotDir, `arena-x-${projectName}-punch.png`);
    await page.screenshot({ path: punchPath });
    console.log(`Saved screenshot: ${punchPath}`);

    // 8. Test Kick (Roundhouse Crescent Style)
    await page.waitForTimeout(350);
    await page.keyboard.press('KeyG');
    await page.waitForTimeout(100); // kick apex frame
    const kickPath = path.join(screenshotDir, `arena-x-${projectName}-kick.png`);
    await page.screenshot({ path: kickPath });
    console.log(`Saved screenshot: ${kickPath}`);

    // 9. Test Horizontal Movement and Camera Tracking
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(400);
    await page.keyboard.up('KeyD');

    // 10. Verify no fatal console errors
    const fatalErrors = consoleErrors.filter(
      (err) => !err.includes('favicon') && !err.includes('AudioContext')
    );
    expect(fatalErrors.length).toBe(0);
  });
});
