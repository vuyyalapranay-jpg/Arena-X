// tests/phase8-audio-system.spec.ts
// Automated Verification for Phase 8: Professional Audio & Cinematic Sound System
import { test, expect } from '@playwright/test';

test.describe('Phase 8: Professional Audio & Cinematic Sound System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local Vite dev server
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Audio 1: Multi-bus audio architecture, gain channels & volume controls', async ({ page }) => {
    // Simulate user interaction to unlock Web Audio API
    await page.mouse.click(100, 100);

    const audioStatus = await page.evaluate(async () => {
      // Import singleton soundManager
      const mod = await import('/src/game/core/SoundManager.ts');
      const sm = mod.soundManager;
      const ctx = sm.initAudio();

      if (!ctx) return { success: false, reason: 'No AudioContext' };

      // Test volume adjustments
      sm.setMasterVolume(0.75);
      sm.setMusicVolume(0.60);
      sm.setSfxVolume(0.80);
      sm.setVoiceVolume(0.85);
      sm.setAmbienceVolume(0.45);

      const settings = sm.getSettings();

      // Test Mute toggle
      const wasMuted = sm.toggleMute();
      const isMutedNow = sm.getSettings().isMuted;
      sm.toggleMute(); // unmute

      return {
        success: true,
        ctxState: ctx.state,
        sampleRate: ctx.sampleRate,
        settings,
        wasMuted,
        isMutedNow,
      };
    });

    expect(audioStatus.success).toBe(true);
    expect(audioStatus.settings.masterVolume).toBe(0.75);
    expect(audioStatus.settings.musicVolume).toBe(0.60);
    expect(audioStatus.settings.sfxVolume).toBe(0.80);
    expect(audioStatus.settings.voiceVolume).toBe(0.85);
    expect(audioStatus.settings.ambienceVolume).toBe(0.45);
    expect(audioStatus.wasMuted).toBe(true);
    expect(audioStatus.isMutedNow).toBe(true);
  });

  test('Audio 2: BGM dynamic synthesizer & stage theme transitions', async ({ page }) => {
    await page.mouse.click(100, 100);

    const bgmResults = await page.evaluate(async () => {
      const mod = await import('/src/game/core/SoundManager.ts');
      const sm = mod.soundManager;
      sm.initAudio();

      const stages = [
        'NEON_CITY',
        'ANCIENT_TEMPLE',
        'VOLCANIC_BATTLEFIELD',
        'FROZEN_WASTELAND',
        'CYBERPUNK_ROOFTOP',
        'MYSTIC_FOREST',
      ];

      const playedStages: string[] = [];
      for (const st of stages) {
        sm.playStageMusic(st);
        sm.playStageAmbience(st);
        playedStages.push(st);
      }

      // Test victory and defeat stingers
      sm.playVictoryMusic();
      sm.playDefeatMusic();
      sm.stopBGM(0.1);
      sm.stopStageAmbience();

      return {
        success: true,
        playedStages,
      };
    });

    expect(bgmResults.success).toBe(true);
    expect(bgmResults.playedStages.length).toBe(6);
  });

  test('Audio 3: Comprehensive Combat SFX execution without errors', async ({ page }) => {
    await page.mouse.click(100, 100);

    const sfxResult = await page.evaluate(async () => {
      const mod = await import('/src/game/core/SoundManager.ts');
      const sm = mod.soundManager;
      sm.initAudio();

      // Trigger all combat SFX
      sm.playPunchWhoosh(false);
      sm.playPunchWhoosh(true);
      sm.playKickWhoosh(false);
      sm.playKickWhoosh(true);
      sm.playLightHit();
      sm.playHeavyHit();
      sm.playKickHit();
      sm.playCounterHit();
      sm.playBlockClang();
      sm.playGuardBreak();
      sm.playKnockdownImpact();
      sm.playWakeupRecovery();
      sm.playJump();
      sm.playLanding();
      sm.playDashWhoosh();
      sm.playSpecialAttack();
      sm.playEnergyCharge();
      sm.playProjectileLaunch(true);
      sm.playProjectileLaunch(false);
      sm.playSurgeActivate();
      sm.playSubBassDrop();
      sm.playCinematicImpact();
      sm.playUltimateActivation();
      sm.playEnergyExplosion();
      sm.playRoundStartGong();
      sm.playKOGong();

      return { success: true };
    });

    expect(sfxResult.success).toBe(true);
  });

  test('Audio 4: Character Voice System for all 16 fighters', async ({ page }) => {
    await page.mouse.click(100, 100);

    const voiceResult = await page.evaluate(async () => {
      const smMod = await import('/src/game/core/SoundManager.ts');
      const rosterMod = await import('/src/game/characters/RosterConfig.ts');
      const sm = smMod.soundManager;
      sm.initAudio();

      const fighterIds = Object.keys(rosterMod.ROSTER_FIGHTERS) as (keyof typeof rosterMod.ROSTER_FIGHTERS)[];
      const tested: string[] = [];

      for (const id of fighterIds) {
        sm.playVoiceLine(id, 'SELECT');
        sm.playVoiceLine(id, 'ATTACK_LIGHT');
        sm.playVoiceLine(id, 'ATTACK_HEAVY');
        sm.playVoiceLine(id, 'HURT_HEAVY');
        sm.playVoiceLine(id, 'SPECIAL');
        sm.playVoiceLine(id, 'ULTIMATE');
        sm.playVoiceLine(id, 'VICTORY');
        sm.playVoiceLine(id, 'DEFEAT');
        tested.push(id);
      }

      return {
        success: true,
        count: tested.length,
        tested,
      };
    });

    expect(voiceResult.success).toBe(true);
    expect(voiceResult.count).toBe(16);
  });

  test('Audio 5: Settings UI Volume Sliders & Mute Interaction in Main Menu', async ({ page }) => {
    await page.waitForSelector('.main-menu-root');

    // Click on SETTINGS modal button
    const settingsBtn = page.locator('button:has-text("SETTINGS")');
    await settingsBtn.scrollIntoViewIfNeeded();
    await settingsBtn.click();

    // Verify Settings modal opened
    const modal = page.locator('.settings-modal-card');
    await expect(modal).toBeVisible();

    // Verify all 5 audio sliders exist
    await expect(page.locator('text=Master Volume')).toBeVisible();
    await expect(page.locator('text=Music / BGM')).toBeVisible();
    await expect(page.locator('text=Combat SFX')).toBeVisible();
    await expect(page.locator('text=Character Voices')).toBeVisible();
    await expect(page.locator('text=Stage Ambience')).toBeVisible();
    await expect(page.locator('text=Mute All Audio')).toBeVisible();

    // Test mute toggle button (first toggle button in modal)
    const muteBtn = page.locator('.settings-modal-card .setting-row button.toggle-btn').first();
    await muteBtn.scrollIntoViewIfNeeded();
    await expect(muteBtn).toBeVisible();
    await muteBtn.click();
    await expect(page.locator('.settings-modal-card button.toggle-btn:has-text("MUTED")')).toBeVisible();

    // Unmute
    await muteBtn.click();
    await expect(page.locator('.settings-modal-card button.toggle-btn:has-text("UNMUTED")')).toBeVisible();

    // Take screenshot of audio settings modal
    await page.screenshot({
      path: 'C:/Users/vuyya/.gemini/antigravity/brain/84a7bae4-c74d-47e8-9e95-c62ba2fd7677/phase-8-audio-settings-modal.png',
      fullPage: true,
    });

    // Close settings modal
    const closeBtn = page.locator('.settings-modal-card button:has-text("SAVE & CLOSE")');
    await closeBtn.scrollIntoViewIfNeeded();
    await closeBtn.click({ force: true });
    await expect(modal).not.toBeVisible();
  });
});
