const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1500);

  // Take screenshot of main menu to show layout is completely clean
  await page.screenshot({ path: 'test-results/screenshots/menu-clean-verify.png' });
  console.log('Saved menu-clean-verify.png');

  // Open Character Select
  const charSelectBtn = page.locator('.char-select-btn');
  if (await charSelectBtn.isVisible()) {
    await charSelectBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'test-results/screenshots/char-select-modal.png' });
    console.log('Saved char-select-modal.png');

    // Click Ronin card
    const roninCard = page.locator('.roster-card:has-text("Ronin")').first();
    if (await roninCard.isVisible()) {
      await roninCard.click();
      await page.waitForTimeout(400);
    }

    // Lock in fighters
    const confirmBtn = page.locator('.btn-confirm-selection');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // Click Play Versus Battle
  const playBtn = page.locator('.play-btn');
  if (await playBtn.isVisible()) {
    await playBtn.click();
    await page.waitForTimeout(2500);

    // Capture initial combat stance
    await page.screenshot({ path: 'test-results/screenshots/combat-in-match-idle.png' });
    console.log('Saved combat-in-match-idle.png');

    // Simulate punch input [F]
    await page.keyboard.press('KeyF');
    await page.waitForTimeout(120);
    await page.screenshot({ path: 'test-results/screenshots/combat-punch-action.png' });
    console.log('Saved combat-punch-action.png');

    // Simulate kick input [G]
    await page.keyboard.press('KeyG');
    await page.waitForTimeout(160);
    await page.screenshot({ path: 'test-results/screenshots/combat-kick-action.png' });
    console.log('Saved combat-kick-action.png');

    // Simulate jump [W] and attack
    await page.keyboard.press('KeyW');
    await page.waitForTimeout(200);
    await page.keyboard.press('KeyF');
    await page.waitForTimeout(150);
    await page.screenshot({ path: 'test-results/screenshots/combat-aerial-action.png' });
    console.log('Saved combat-aerial-action.png');
  }

  // Copy key screenshots to artifacts directory
  const filesToCopy = [
    'menu-clean-verify.png',
    'char-select-modal.png',
    'combat-in-match-idle.png',
    'combat-punch-action.png',
    'combat-kick-action.png',
    'combat-aerial-action.png'
  ];

  for (const f of filesToCopy) {
    const srcPath = `test-results/screenshots/${f}`;
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, `C:/Users/vuyya/.gemini/antigravity/brain/84a7bae4-c74d-47e8-9e95-c62ba2fd7677/${f}`);
      console.log(`Copied ${f} to artifacts`);
    }
  }

  await browser.close();
  console.log('All combat verification captures completed successfully.');
})();
