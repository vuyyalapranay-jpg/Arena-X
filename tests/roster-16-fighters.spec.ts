import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('ARENA X — Full 16-Fighter Roster & Character Selection', () => {
  const screenshotDir = path.join(process.cwd(), 'test-results', 'roster-screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test('Open Character Select Modal, inspect 16 unique fighters, lock in fighters and fight', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name.toLowerCase().replace(/\s+/g, '-');
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('.main-menu-root', { timeout: 10000 });

    // 1. Open Character Selection
    const charSelectBtn = page.locator('.char-select-btn');
    await expect(charSelectBtn).toBeVisible();
    await charSelectBtn.click();

    // 2. Verify Character Select Modal is open
    const modal = page.locator('.character-select-container');
    await expect(modal).toBeVisible();

    // 3. Verify all 16 fighter cards exist in the grid
    const cards = page.locator('.roster-card');
    await expect(cards).toHaveCount(16);

    const menuScreenshot = path.join(screenshotDir, `${projectName}-1-character-selection-grid.png`);
    await page.screenshot({ path: menuScreenshot });

    // 4. Inspect specific fighters (e.g. BLAZE and FROST)
    const blazeCard = cards.filter({ hasText: 'Blaze' }).first();
    await expect(blazeCard).toBeVisible();
    await blazeCard.hover();
    await page.waitForTimeout(200);

    const detailName = page.locator('.detail-name');
    await expect(detailName).toHaveText('Blaze');

    // 5. Select BLAZE for Player 1
    await blazeCard.click();
    await page.waitForTimeout(100);

    // 6. Select FROST for Player 2
    const frostCard = cards.filter({ hasText: 'Frost' }).first();
    await expect(frostCard).toBeVisible();
    await frostCard.click();
    await page.waitForTimeout(100);

    const selectedScreenshot = path.join(screenshotDir, `${projectName}-2-fighters-selected.png`);
    await page.screenshot({ path: selectedScreenshot });

    // 7. Lock in Fighters
    const lockInBtn = page.locator('.btn-confirm-selection');
    await lockInBtn.click();
    await expect(modal).toBeHidden();

    // 8. Start Versus Match with selected fighters
    const playBtn = page.locator('.play-btn');
    await playBtn.click();

    // 9. Verify Match in Arena with Blaze vs Frost
    await page.waitForSelector('.arena-canvas-2d', { timeout: 10000 });
    await page.waitForTimeout(1200);

    const fightCheck = await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      return {
        p1Name: engine ? engine.fighterP1.name : '',
        p2Name: engine ? engine.fighterP2.name : '',
        p1Health: engine ? engine.fighterP1.maxHealth : 0,
        p2Health: engine ? engine.fighterP2.maxHealth : 0,
      };
    });

    console.log('Fight active with fighters:', fightCheck);
    expect(fightCheck.p1Name).toBe('BLAZE');
    expect(fightCheck.p2Name).toBe('FROST');
    expect(fightCheck.p1Health).toBe(1020);
    expect(fightCheck.p2Health).toBe(920);

    const arenaScreenshot = path.join(screenshotDir, `${projectName}-3-blaze-vs-frost-match.png`);
    await page.screenshot({ path: arenaScreenshot });
  });
});
