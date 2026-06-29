const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const screenshotsDir = path.join(__dirname, '../assets/screenshots');
  const assetsDir = path.join(__dirname, '../assets');

  // Ensure directories exist
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  console.log('Starting Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();
  
  console.log('Capturing Landing Page...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000); // Wait for animations
  await page.screenshot({ path: path.join(screenshotsDir, '01-landing.png') });

  console.log('Capturing Login Page...');
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, '02-login.png') });

  console.log('Logging in as Citizen...');
  await page.click('text=Continue with Email');
  await page.fill('input[type="email"]', 'demo@iwis.app');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotsDir, 'DEBUG_login_error.png') });
  
  await page.waitForURL('**/dashboard');
  await page.waitForTimeout(2000); // Wait for data to load
  console.log('Capturing Dashboard...');
  await page.screenshot({ path: path.join(screenshotsDir, '03-dashboard.png') });

  console.log('Capturing Scanner...');
  await page.goto('http://localhost:3000/scan');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotsDir, '04-scanner.png') });

  console.log('Capturing Sell Waste...');
  await page.goto('http://localhost:3000/sell');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotsDir, '05-sell-waste.png') });

  console.log('Capturing Earnings...');
  await page.goto('http://localhost:3000/earnings');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotsDir, '06-earnings.png') });

  console.log('Capturing Profile...');
  await page.goto('http://localhost:3000/profile');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotsDir, '07-profile.png') });

  console.log('Capturing Settings...');
  await page.goto('http://localhost:3000/settings');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, '08-settings.png') });

  console.log('Capturing EcoBot...');
  await page.goto('http://localhost:3000/chat');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotsDir, '09-ecobot.png') });

  await context.close();

  // Mobile Context
  console.log('Capturing Mobile Dashboard...');
  const mobileContext = await browser.newContext({
    ...devices['iPhone 13']
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/login');
  await mobilePage.click('text=Continue with Email');
  await mobilePage.fill('input[type="email"]', 'demo@iwis.app');
  await mobilePage.fill('input[type="password"]', 'password123');
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForURL('**/dashboard');
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({ path: path.join(screenshotsDir, '10-mobile-dashboard.png') });
  await mobileContext.close();

  // Recycler Context
  console.log('Logging in as Recycler...');
  const recyclerContext = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const recyclerPage = await recyclerContext.newPage();
  await recyclerPage.goto('http://localhost:3000/login');
  await recyclerPage.click('text=Continue with Email');
  await recyclerPage.fill('input[type="email"]', 'recycler@iwis.app');
  await recyclerPage.fill('input[type="password"]', 'password123');
  await recyclerPage.click('button[type="submit"]');
  await recyclerPage.waitForURL('**/recycler/feed');
  await recyclerPage.waitForTimeout(2000);
  
  console.log('Capturing Recycler Feed...');
  await recyclerPage.screenshot({ path: path.join(screenshotsDir, '11-recycler-feed.png') });

  console.log('Capturing Pickup Workflow...');
  // Find a pickup button or navigate to one
  const pickupButtons = await recyclerPage.$$('text=Accept Pickup');
  if (pickupButtons.length > 0) {
    await pickupButtons[0].click();
    await recyclerPage.waitForTimeout(1500);
  } else {
    // If no direct button, just view the first listing
    const viewButtons = await recyclerPage.$$('text=View Details');
    if (viewButtons.length > 0) {
      await viewButtons[0].click();
      await recyclerPage.waitForTimeout(1500);
    }
  }
  await recyclerPage.screenshot({ path: path.join(screenshotsDir, '12-pickup-workflow.png') });
  await recyclerContext.close();

  // Recording Demo Video
  console.log('Recording Walkthrough Video...');
  const videoContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir: assetsDir,
      size: { width: 1280, height: 800 }
    }
  });
  const videoPage = await videoContext.newPage();
  await videoPage.goto('http://localhost:3000');
  await videoPage.waitForTimeout(1500);
  await videoPage.goto('http://localhost:3000/login');
  await videoPage.waitForTimeout(1000);
  await videoPage.click('text=Continue with Email');
  await videoPage.fill('input[type="email"]', 'demo@iwis.app');
  await videoPage.fill('input[type="password"]', 'password123');
  await videoPage.click('button[type="submit"]');
  await videoPage.waitForURL('**/dashboard');
  await videoPage.waitForTimeout(2000);
  
  // Quick interaction for demo
  await videoPage.goto('http://localhost:3000/scan');
  await videoPage.waitForTimeout(2000);
  await videoPage.goto('http://localhost:3000/sell');
  await videoPage.waitForTimeout(2000);
  
  await videoContext.close();
  
  // Find the generated webm and rename it to demo.webm
  const files = fs.readdirSync(assetsDir);
  const webmFile = files.find(f => f.endsWith('.webm') && f !== 'demo.webm');
  if (webmFile) {
    if (fs.existsSync(path.join(assetsDir, 'demo.webm'))) {
      fs.unlinkSync(path.join(assetsDir, 'demo.webm'));
    }
    fs.renameSync(path.join(assetsDir, webmFile), path.join(assetsDir, 'demo.webm'));
  }

  // Remove placeholder demo.webp if it exists
  if (fs.existsSync(path.join(assetsDir, 'demo.webp'))) {
    fs.unlinkSync(path.join(assetsDir, 'demo.webp'));
  }

  await browser.close();
  console.log('✅ Screenshots and Demo generation complete!');
}

run().catch(console.error);
