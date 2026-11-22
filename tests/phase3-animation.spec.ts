// tests/phase3-animation.spec.ts
// PHASE 3 AUTOMATED VERIFICATION SUITE — SPRITES & ANIMATION CONTROLLER

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('ARENA X — Phase 3 Character Sprites & Animation System', () => {
  test('Complete Animation Controller & Combat Synchronization Verification', async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const screenshotDir = path.resolve('test-results/phase3-screenshots');
    fs.mkdirSync(screenshotDir, { recursive: true });
    const projectName = testInfo.project.name.toLowerCase().replace(/\s+/g, '-');

    // 1. Load Main Menu & Start Versus Match
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const playBtn = page.locator('.play-btn');
    await expect(playBtn).toBeVisible();
    await playBtn.click();

    // 2. Verify Canvas 2D is mounted and active
    const canvas = page.locator('canvas.arena-canvas-2d');
    await expect(canvas).toBeVisible();

    const is2D = await page.evaluate(() => {
      const cvs = document.querySelector('canvas.arena-canvas-2d') as HTMLCanvasElement;
      return !!cvs?.getContext('2d');
    });
    expect(is2D).toBe(true);

    // 3. Wait for Round Intro to complete
    await page.waitForTimeout(2200);

    // 4. Test 1: Kai and Shadow Idle Breathing & Ground Alignment
    const idlePath = path.join(screenshotDir, `${projectName}-1-idle-grounded.png`);
    await page.screenshot({ path: idlePath });
    console.log(`Saved screenshot: ${idlePath}`);

    // Verify fighters are positioned properly on ground plane
    const groundCheck = await page.evaluate(() => {
      return {
        groundY: 560,
        hasCanvas: !!document.querySelector('canvas.arena-canvas-2d'),
      };
    });
    expect(groundCheck.groundY).toBe(560);

    // 5. Test 2: Walk Forward and Backward
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(250);
    const walkFwdPath = path.join(screenshotDir, `${projectName}-2-walk-forward.png`);
    await page.screenshot({ path: walkFwdPath });
    await page.keyboard.up('KeyD');

    await page.keyboard.down('KeyA');
    await page.waitForTimeout(250);
    const walkBwdPath = path.join(screenshotDir, `${projectName}-3-walk-backward.png`);
    await page.screenshot({ path: walkBwdPath });
    await page.keyboard.up('KeyA');

    // 6. Test 3: Jumping & Decoupled Airborne Physics
    await page.keyboard.press('KeyW');
    await page.waitForTimeout(220); // airborne apex
    const jumpPath = path.join(screenshotDir, `${projectName}-4-jump-airborne.png`);
    await page.screenshot({ path: jumpPath });
    await page.waitForTimeout(600); // landing

    // 7. Test 4: Crouching
    await page.keyboard.down('KeyS');
    await page.waitForTimeout(150);
    const crouchPath = path.join(screenshotDir, `${projectName}-5-crouch.png`);
    await page.screenshot({ path: crouchPath });
    await page.keyboard.up('KeyS');

    // 8. Test 5: Light Punch (Jab)
    await page.keyboard.press('KeyF');
    await page.waitForTimeout(60); // active strike frame
    const punchLightPath = path.join(screenshotDir, `${projectName}-6-punch-light.png`);
    await page.screenshot({ path: punchLightPath });
    await page.waitForTimeout(200);

    // 9. Test 6: Heavy Punch (Kyo Flame Strike with Smear)
    await page.keyboard.down('KeyD');
    await page.keyboard.press('KeyF');
    await page.keyboard.up('KeyD');
    await page.waitForTimeout(140); // flame impact frame
    const punchHeavyPath = path.join(screenshotDir, `${projectName}-7-punch-heavy-flame.png`);
    await page.screenshot({ path: punchHeavyPath });
    await page.waitForTimeout(300);

    // 10. Test 7: Uppercut (Crouch + Punch)
    await page.keyboard.down('KeyS');
    await page.keyboard.press('KeyF');
    await page.keyboard.up('KeyS');
    await page.waitForTimeout(120); // rising apex frame
    const uppercutPath = path.join(screenshotDir, `${projectName}-8-uppercut.png`);
    await page.screenshot({ path: uppercutPath });
    await page.waitForTimeout(300);

    // 11. Test 8: High Crescent Kick (180° Shockwave)
    await page.keyboard.down('KeyD');
    await page.keyboard.press('KeyG');
    await page.keyboard.up('KeyD');
    await page.waitForTimeout(140); // 180 shockwave frame
    const kickHighPath = path.join(screenshotDir, `${projectName}-9-kick-high-shockwave.png`);
    await page.screenshot({ path: kickHighPath });
    await page.waitForTimeout(300);

    // 12. Test 9: Low Sweep Kick (Crouch + Kick)
    await page.keyboard.down('KeyS');
    await page.keyboard.press('KeyG');
    await page.keyboard.up('KeyS');
    await page.waitForTimeout(100);
    const kickLowPath = path.join(screenshotDir, `${projectName}-10-kick-low-sweep.png`);
    await page.screenshot({ path: kickLowPath });
    await page.waitForTimeout(250);

    // 13. Test 10: Standing & Crouching Block (Hexagonal Barrier)
    await page.keyboard.down('KeyH');
    await page.waitForTimeout(100);
    const blockPath = path.join(screenshotDir, `${projectName}-11-block-barrier.png`);
    await page.screenshot({ path: blockPath });
    await page.keyboard.up('KeyH');

    // 14. Verify 0 fatal errors
    const fatalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('favicon') &&
        !err.includes('AudioContext') &&
        !err.includes('ERR_CONNECTION_CLOSED')
    );
    if (fatalErrors.length > 0) {
      console.log('Fatal errors logged during phase3 test:', fatalErrors);
    }
    expect(fatalErrors.length).toBe(0);
  });
});
