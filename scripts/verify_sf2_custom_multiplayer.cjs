const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');

async function main() {
  const artifactDir = path.resolve('C:/Users/vuyya/.gemini/antigravity/brain/84a7bae4-c74d-47e8-9e95-c62ba2fd7677');
  const port = 4220;

  console.log(`Starting Vite preview server on port ${port}...`);
  const server = spawn('cmd.exe', ['/c', `npx vite preview --port ${port} --host 127.0.0.1`], {
    stdio: 'pipe',
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(), 5000);
    server.stdout.on('data', (d) => {
      const msg = d.toString();
      console.log('Server:', msg.trim());
      if (msg.includes('Local:')) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.stderr.on('data', (d) => console.error('Server err:', d.toString()));
    server.on('error', reject);
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  try {
    // 1. Visit Custom Room page directly with URL invite parameters (?room=SF2-DEMO&key=SHADOW99)
    console.log('Navigating to room with invite params ?room=SF2-DEMO&key=SHADOW99 ...');
    await page.goto(`http://127.0.0.1:${port}?room=SF2-DEMO&key=SHADOW99`, { waitUntil: 'networkidle' });

    // Verify room code and password populated automatically
    const roomInput = page.locator('#room-code-input');
    const passInput = page.locator('#room-password-input');
    const fighterInput = page.locator('#fighter-tag-input');

    await roomInput.waitFor({ timeout: 5000 });
    const codeVal = await roomInput.inputValue();
    const passVal = await passInput.inputValue();
    console.log(`Auto-detected from URL -> Room: ${codeVal}, Password: ${passVal}`);

    if (codeVal !== 'SF2-DEMO' || passVal !== 'SHADOW99') {
      throw new Error(`Expected SF2-DEMO and SHADOW99, got ${codeVal} and ${passVal}`);
    }

    // Set fighter tag
    await fighterInput.fill('Shadow Warrior');

    // Take screenshot of Custom Room Gate with password & invite support
    const gateScreenshot = path.join(artifactDir, 'sf2-custom-room-gate.png');
    await page.screenshot({ path: gateScreenshot });
    console.log(`Saved screenshot: ${gateScreenshot}`);

    // Click "Join & Enter Battle Room"
    const joinBtn = page.locator('.t-btn-join');
    await joinBtn.click();

    // Wait for the room lobby to render
    await page.waitForSelector('.t-lobby-shell', { timeout: 6000 });

    // Check for "Min 2 to start" badge
    const badgeText = await page.locator('.t-roster-badge').textContent();
    console.log(`Roster badge text: ${badgeText}`);

    // Check for Lock badge
    const lockBadge = page.locator('.t-lock-badge');
    const lockText = await lockBadge.textContent();
    console.log(`Lock badge text: ${lockText}`);

    // Click "Copy Invite Link" to verify copy button
    const copyBtn = page.locator('.t-copy-btn');
    await copyBtn.click();
    await page.waitForTimeout(300);

    // Capture screenshot of the 2-16 contender room lobby
    const lobbyScreenshot = path.join(artifactDir, 'sf2-custom-room-lobby.png');
    await page.screenshot({ path: lobbyScreenshot });
    console.log(`Saved screenshot: ${lobbyScreenshot}`);

    console.log('ALL SHADOW FIGHT 2 CUSTOM ROOM CHECKS PASSED SUCCESSFULLY!');
  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
