const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');

async function main() {
  const artifactDir = path.resolve('C:/Users/vuyya/.gemini/antigravity/brain/84a7bae4-c74d-47e8-9e95-c62ba2fd7677');
  const port = 4255;

  console.log(`Starting Vite preview on port ${port}...`);
  const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--host', '127.0.0.1'], {
    shell: true,
    stdio: 'pipe',
  });

  server.stdout.on('data', (d) => console.log('SERVER:', d.toString().trim()));
  server.stderr.on('data', (d) => console.error('SERVER ERR:', d.toString().trim()));

  await new Promise((resolve) => {
    let resolved = false;
    server.stdout.on('data', (d) => {
      if (d.toString().includes('Local:') && !resolved) {
        resolved = true;
        setTimeout(resolve, 1200);
      }
    });
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    }, 6000);
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  try {
    console.log('Navigating to game...');
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    console.log('Clicking Versus Fight to enter arena...');
    await page.waitForSelector('.menu-btn.play-btn', { timeout: 10000 });
    await page.click('.menu-btn.play-btn');
    console.log('Clicked .menu-btn.play-btn!');

    // Wait 3.5 seconds for match to load and round to begin
    await page.waitForTimeout(3500);

    // Take screenshot of the sunset silhouette arena and authentic HUD
    const screenshotPath = path.join(artifactDir, 'shadowfight-sunset-arena-verified.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Captured screenshot: ${screenshotPath}`);
  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
