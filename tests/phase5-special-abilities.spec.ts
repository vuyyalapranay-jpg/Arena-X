// tests/phase5-special-abilities.spec.ts
// PHASE 5: SPECIAL ABILITIES, ULTIMATE ATTACKS, POWER-UPS & CINEMATIC EFFECTS

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('ARENA X — Phase 5 Special Abilities, Ultimates & Cinematic 2D Effects', () => {
  test('Complete Special Moves, Super Meter Charging, Surge Power-Up & Cinematic 2D Ultimates', async ({ page }, testInfo) => {
    const screenshotDir = path.resolve('test-results/phase5-screenshots');
    fs.mkdirSync(screenshotDir, { recursive: true });
    const projectName = testInfo.project.name.toLowerCase().replace(/\s+/g, '-');

    // 1. Launch Game and Start Match
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const playBtn = page.locator('.play-btn');
    await expect(playBtn).toBeVisible();
    await playBtn.click();

    // Wait for Round 1 to start
    await page.waitForTimeout(2200);

    // Initial neutral state screenshot
    const initialScreenshot = path.join(screenshotDir, `${projectName}-1-neutral-stance.png`);
    await page.screenshot({ path: initialScreenshot });

    // 2. Test Energy Charging Pose (Holding 'C')
    await page.keyboard.down('KeyC');
    await page.waitForTimeout(800); // Charge energy for 0.8s
    const chargingScreenshot = path.join(screenshotDir, `${projectName}-2-energy-charging-aura.png`);
    await page.screenshot({ path: chargingScreenshot });
    await page.keyboard.up('KeyC');
    await page.waitForTimeout(200);

    const chargeState = await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      return {
        p1Meter: engine ? engine.fighterP1.superMeter : 0,
        hasAuraParticles: engine ? engine.vfx.auraParticles.length > 0 : false,
      };
    });
    console.log('Charge state:', chargeState);
    expect(chargeState.p1Meter).toBeGreaterThan(15);

    // 3. Test Kai's Blue Wave Projectile
    const fired = await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      if (engine) {
        engine.fighterP1.superMeter = 50;
        engine.fighterP1.fireSpecialProjectile('BLUE_WAVE');
        return {
          hasPending: !!engine.fighterP1.pendingProjectile,
          type: engine.fighterP1.pendingProjectile ? engine.fighterP1.pendingProjectile.type : null,
        };
      }
      return { hasPending: false, type: null };
    });
    expect(fired.hasPending).toBe(true);
    expect(fired.type).toBe('BLUE_WAVE');

    await page.waitForTimeout(100);
    const blueWaveScreenshot = path.join(screenshotDir, `${projectName}-3-blue-wave-projectile.png`);
    await page.screenshot({ path: blueWaveScreenshot });

    // 4. Test Kai's Flash Dash with After-Images
    await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      if (engine) {
        engine.fighterP1.superMeter = 40;
        engine.fighterP1.startAttack('FLASH_DASH', 'punchForward');
        engine.fighterP1.x += engine.fighterP1.facing * 140;
        engine.vfx.spawnAfterImage(engine.fighterP1.x - 70, engine.fighterP1.y, engine.fighterP1.facing, '#00e5ff');
      }
    });
    const dashCheck = await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      return {
        afterImages: engine ? engine.vfx.afterImages.length : 0,
      };
    });
    expect(dashCheck.afterImages).toBeGreaterThan(0);

    await page.waitForTimeout(100);
    const flashDashScreenshot = path.join(screenshotDir, `${projectName}-4-flash-dash-afterimage.png`);
    await page.screenshot({ path: flashDashScreenshot });

    // 5. Test Shadow's Dark Orb Projectile
    await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      if (engine) {
        engine.fighterP2.superMeter = 50;
        engine.fighterP2.fireSpecialProjectile('DARK_ORB');
      }
    });
    await page.waitForTimeout(180);
    const darkOrbScreenshot = path.join(screenshotDir, `${projectName}-5-dark-orb-void-sphere.png`);
    await page.screenshot({ path: darkOrbScreenshot });

    // 6. Test Shadow's Void Impact Shockwave
    await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      if (engine) {
        engine.fighterP2.superMeter = 40;
        engine.fighterP2.startAttack('VOID_IMPACT', 'kickLow');
        engine.vfx.spawnShockwave(engine.fighterP2.x, engine.fighterP2.floorY, '#ba68c8', 200);
      }
    });
    await page.waitForTimeout(150);
    const voidImpactScreenshot = path.join(screenshotDir, `${projectName}-6-void-impact-shockwave.png`);
    await page.screenshot({ path: voidImpactScreenshot });

    // 7. Test Power-Up Surge Mode
    await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      if (engine) {
        engine.fighterP1.isSurging = true;
        engine.fighterP1.surgeTimer = 8.0;
        engine.vfx.spawnEnergyExplosion(engine.fighterP1.x, engine.fighterP1.y - 80, '#00e5ff', 24);
      }
    });
    await page.waitForTimeout(200);
    const surgeScreenshot = path.join(screenshotDir, `${projectName}-7-power-up-surge-mode.png`);
    await page.screenshot({ path: surgeScreenshot });

    const surgeCheck = await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      return {
        isSurging: engine ? engine.fighterP1.isSurging : false,
      };
    });
    expect(surgeCheck.isSurging).toBe(true);

    // 8. Test Kai's Cinematic Ultimate: Celestial Burst
    await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      if (engine) {
        engine.fighterP1.superMeter = 100;
        engine.fighterP1.startAttack('ULTIMATE_CELESTIAL_BURST', 'special');
      }
    });
    // Wait for dramatic camera zoom-in and vignette
    await page.waitForTimeout(200);

    const cinematicCheck = await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      return {
        isCinematic: engine ? engine.fighterP1.isCinematic : false,
        cameraZoom: engine ? engine.camera.zoom : 1.0,
        vignetteAlpha: engine ? engine.vfx.cinematicVignetteAlpha : 0,
      };
    });
    console.log('Cinematic check:', cinematicCheck);
    expect(cinematicCheck.isCinematic).toBe(true);
    expect(cinematicCheck.cameraZoom).toBeGreaterThan(1.10); // Verifies dramatic 2D zoom-in!
    expect(cinematicCheck.vignetteAlpha).toBeGreaterThan(0.4); // Verifies dark cinematic vignette!

    const ultimateScreenshot = path.join(screenshotDir, `${projectName}-8-celestial-burst-ultimate-cinematic.png`);
    await page.screenshot({ path: ultimateScreenshot });

    // 9. Verify Smooth Camera Restoration After Ultimate
    await page.waitForTimeout(2200); // Allow ultimate to complete and camera to restore
    const restoredScreenshot = path.join(screenshotDir, `${projectName}-9-camera-restored-framing.png`);
    await page.screenshot({ path: restoredScreenshot });

    const restoredCheck = await page.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      return {
        isCinematic: engine ? engine.fighterP1.isCinematic : false,
        cameraZoom: engine ? engine.camera.zoom : 1.0,
      };
    });
    console.log('Restored check:', restoredCheck);
    expect(restoredCheck.isCinematic).toBe(false);
    expect(restoredCheck.cameraZoom).toBeLessThan(1.15); // Returned to normal match zoom!
  });
});
