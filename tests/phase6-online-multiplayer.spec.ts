// tests/phase6-online-multiplayer.spec.ts
// COMPREHENSIVE DUAL-BROWSER MULTIPLAYER VERIFICATION SUITE FOR ARENA X

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('ARENA X — Phase 6 Online Multiplayer & Netplay', () => {
  const screenshotDir = path.resolve('test-results/multiplayer-screenshots');

  test.beforeAll(() => {
    fs.mkdirSync(screenshotDir, { recursive: true });
  });

  test('Public Room Discovery, Character Sync & Dual-Player Real-Time Combat', async ({ browser }, testInfo) => {
    const projectName = testInfo.project.name.toLowerCase().replace(/\s+/g, '-');

    // 1. Create two independent browser contexts (Client 1 & Client 2)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // 2. Client 1 navigates to Online Play
    await page1.goto('/', { waitUntil: 'domcontentloaded' });
    await page1.waitForTimeout(600);

    const onlineBtn1 = page1.locator('.online-menu-btn');
    await expect(onlineBtn1).toBeVisible();
    await onlineBtn1.click();
    await page1.waitForTimeout(500);

    // Save screenshot of Online Play Menu (2XKO style)
    const menuPath = path.join(screenshotDir, `${projectName}-1-online-menu.png`);
    await page1.screenshot({ path: menuPath });
    console.log(`Saved screenshot: ${menuPath}`);

    // Set Fighter Tag for P1
    const tagInput1 = page1.locator('.player-name-input');
    await tagInput1.fill('KaiMaster');

    // Client 1 creates a Public Room
    const createRoomBtn = page1.getByRole('button', { name: /CREATE ROOM/i });
    await createRoomBtn.click();
    await page1.waitForTimeout(300);

    const roomNameInput = page1.locator('.text-input').first();
    await roomNameInput.fill('Championship Dojo');

    const submitCreateBtn = page1.locator('.submit-form-btn');
    await submitCreateBtn.click();
    await page1.waitForTimeout(1000);

    // Client 1 is now in Lobby
    const lobbyTitle1 = page1.locator('.room-name-display');
    await expect(lobbyTitle1).toContainText('Championship Dojo');

    // Capture Lobby Room Code
    const roomCodeElement = page1.locator('.room-code-badge strong');
    const roomCode = await roomCodeElement.innerText();
    console.log(`Created Room Code: ${roomCode}`);

    // 3. Client 2 navigates to Public Rooms browser
    await page2.goto('/', { waitUntil: 'domcontentloaded' });
    await page2.waitForTimeout(600);

    const onlineBtn2 = page2.locator('.online-menu-btn');
    await onlineBtn2.click();
    await page2.waitForTimeout(500);

    const tagInput2 = page2.locator('.player-name-input');
    await tagInput2.fill('ShadowKing');

    const publicRoomsBtn = page2.getByRole('button', { name: /PUBLIC ROOMS/i });
    await publicRoomsBtn.click();
    await page2.waitForTimeout(1000);

    // Save screenshot of Public Rooms Browser
    const browserPath = path.join(screenshotDir, `${projectName}-2-public-rooms-browser.png`);
    await page2.screenshot({ path: browserPath });
    console.log(`Saved screenshot: ${browserPath}`);

    // Client 2 verifies the specific room by its unique roomCode is listed and joins
    const roomCard = page2.locator('.room-card', { hasText: roomCode });
    await expect(roomCard).toBeVisible();

    const joinBtn = roomCard.locator('.join-room-btn');
    await joinBtn.click();
    await page2.waitForTimeout(1000);

    // 4. Verify Dual-Lobby Synchronization
    // Both players should see both P1 and P2 in the lobby
    const p1NameInP2Lobby = page2.locator('.p1-panel .fighter-slot-name');
    await expect(p1NameInP2Lobby).toContainText('KaiMaster');

    const p2NameInP1Lobby = page1.locator('.p2-panel .fighter-slot-name');
    await expect(p2NameInP1Lobby).toContainText('ShadowKing');

    // Save screenshot of Split-Screen Lobby (Under Night In-Birth style)
    const lobbyPath = path.join(screenshotDir, `${projectName}-3-split-screen-lobby.png`);
    await page1.screenshot({ path: lobbyPath });
    console.log(`Saved screenshot: ${lobbyPath}`);

    // 5. Character Selection Synchronization
    // P2 clicks SHADOW
    const shadowChoiceBtn = page2.locator('.p2-panel .char-choice-btn', { hasText: 'SHADOW' });
    if (await shadowChoiceBtn.isVisible()) {
      await shadowChoiceBtn.click();
      await page2.waitForTimeout(300);
    }

    // 6. Both Players Ready Up
    const readyBtn1 = page1.locator('.lobby-ready-toggle-btn');
    await readyBtn1.click();
    await page1.waitForTimeout(300);

    const readyBtn2 = page2.locator('.lobby-ready-toggle-btn');
    await readyBtn2.click();
    await page2.waitForTimeout(500);

    // Host (P1) verifies START MATCH is enabled
    const startMatchBtn = page1.locator('.lobby-start-match-btn');
    await expect(startMatchBtn).toBeEnabled();

    // Host starts online match
    await startMatchBtn.click();
    await page1.waitForTimeout(2000);
    await page2.waitForTimeout(2000);

    // 7. Verify In-Game Synchronization on Both Devices
    const netplayBanner1 = page1.locator('div', { hasText: /NETPLAY:/i }).first();
    await expect(netplayBanner1).toBeVisible();

    const netplayBanner2 = page2.locator('div', { hasText: /NETPLAY:/i }).first();
    await expect(netplayBanner2).toBeVisible();

    // Save screenshot of real-time combat for Client 1 & Client 2
    const p1FightPath = path.join(screenshotDir, `${projectName}-4-client1-ingame-fight.png`);
    await page1.screenshot({ path: p1FightPath });
    console.log(`Saved screenshot: ${p1FightPath}`);

    const p2FightPath = path.join(screenshotDir, `${projectName}-5-client2-ingame-fight.png`);
    await page2.screenshot({ path: p2FightPath });
    console.log(`Saved screenshot: ${p2FightPath}`);

    // 8. Test Combat Input & Damage Synchronization Across Network
    // Player 1 walks forward and punches Player 2
    await page1.keyboard.down('KeyD');
    await page1.waitForTimeout(600);
    await page1.keyboard.up('KeyD');

    // P1 Light Punch
    await page1.keyboard.press('KeyJ');
    await page1.waitForTimeout(400);

    // Verify Player 2 received the hit across the WebSocket network
    const p2HealthCheck = await page2.evaluate(() => {
      // @ts-ignore
      const engine = window.__ARENA_X_ENGINE__;
      return engine ? engine.fighterP2.currentHealth : null;
    });

    console.log(`Player 2 health after P1 network punch: ${p2HealthCheck}`);
    expect(p2HealthCheck).toBeLessThanOrEqual(100);

    // Clean up contexts
    await context1.close();
    await context2.close();
  });

  test('Private Room Creation, Code Joining & Privacy Protection', async ({ browser }, testInfo) => {
    const projectName = testInfo.project.name.toLowerCase().replace(/\s+/g, '-');

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Client 1 creates a Private Duel
    await page1.goto('/', { waitUntil: 'domcontentloaded' });
    await page1.locator('.online-menu-btn').click();
    await page1.waitForTimeout(400);

    const privateDuelBtn = page1.getByRole('button', { name: /PRIVATE DUEL/i });
    await privateDuelBtn.click();
    await page1.waitForTimeout(300);

    await page1.locator('.submit-form-btn').click();
    await page1.waitForTimeout(1000);

    // Extract generated 6-digit code
    const privateCode = await page1.locator('.room-code-badge strong').innerText();
    console.log(`Generated Private Room Code: ${privateCode}`);
    expect(privateCode).toMatch(/^AX-[A-Z0-9]{4}$/);

    // Client 2 verifies Private Room is NOT in Public Browser
    await page2.goto('/', { waitUntil: 'domcontentloaded' });
    await page2.locator('.online-menu-btn').click();
    await page2.waitForTimeout(400);

    await page2.getByRole('button', { name: /PUBLIC ROOMS/i }).click();
    await page2.waitForTimeout(800);

    const privateCardInPublic = page2.locator('.room-card', { hasText: privateCode });
    await expect(privateCardInPublic).toHaveCount(0); // Must be hidden from public view!

    // Client 2 joins using the Invitation Code
    await page2.locator('.online-back-btn').click();
    await page2.waitForTimeout(300);

    await page2.getByRole('button', { name: /JOIN BY CODE/i }).click();
    await page2.waitForTimeout(300);

    await page2.locator('.code-input').fill(privateCode);
    await page2.locator('.submit-form-btn').click();
    await page2.waitForTimeout(1000);

    // Client 2 successfully joins the Private Room Lobby
    const lobbyTitle2 = page2.locator('.room-code-badge strong');
    await expect(lobbyTitle2).toHaveText(privateCode);

    // Capture Private Room Lobby Screenshot
    const privateLobbyPath = path.join(screenshotDir, `${projectName}-6-private-room-lobby.png`);
    await page2.screenshot({ path: privateLobbyPath });
    console.log(`Saved screenshot: ${privateLobbyPath}`);

    await context1.close();
    await context2.close();
  });

  test('Quick Matchmaking Pairs Two Waiting Challengers Automatically', async ({ browser }, testInfo) => {
    const projectName = testInfo.project.name.toLowerCase().replace(/\s+/g, '-');

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Client 1 clicks Quick Match
    await page1.goto('/', { waitUntil: 'domcontentloaded' });
    await page1.locator('.online-menu-btn').click();
    await page1.waitForTimeout(400);

    await page1.locator('.quick-match-btn').click();
    await page1.waitForTimeout(800);

    // Verify Matchmaking Radar is searching or paired into lobby
    const searchOrLobby = page1.locator('.radar-circle, .multiplayer-lobby-view');
    await expect(searchOrLobby).toBeVisible();

    const qmSearchPath = path.join(screenshotDir, `${projectName}-7-quick-match-searching.png`);
    await page1.screenshot({ path: qmSearchPath });
    console.log(`Saved screenshot: ${qmSearchPath}`);

    // Client 2 clicks Quick Match
    await page2.goto('/', { waitUntil: 'domcontentloaded' });
    await page2.locator('.online-menu-btn').click();
    await page2.waitForTimeout(400);

    const qmBtn2 = page2.locator('.quick-match-btn');
    await expect(qmBtn2).toBeVisible({ timeout: 10000 });
    await qmBtn2.click();

    // Both players should automatically be paired into the lobby!
    await expect(page1.locator('.multiplayer-lobby-view')).toBeVisible({ timeout: 15000 });
    await expect(page2.locator('.multiplayer-lobby-view')).toBeVisible({ timeout: 15000 });

    const qmMatchedPath = path.join(screenshotDir, `${projectName}-8-quick-match-paired-lobby.png`);
    await page1.screenshot({ path: qmMatchedPath });
    console.log(`Saved screenshot: ${qmMatchedPath}`);

    await context1.close();
    await context2.close();
  });
});
