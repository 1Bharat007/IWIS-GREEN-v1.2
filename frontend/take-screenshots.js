const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'assets', 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  
  // Helper for taking screenshots
  const takeScreenshot = async (name) => {
    await new Promise(r => setTimeout(r, 1500)); // wait for animations
    const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath });
    console.log(`📸 Saved ${name}.png`);
  };

  try {
    // 1. Landing Page
    console.log("Navigating to Landing...");
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    await takeScreenshot('01-landing');

    // 2. Login
    console.log("Navigating to Login...");
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    await takeScreenshot('02-login');

    // Login as Citizen
    console.log("Logging in as Citizen...");
    await page.type('#identifier', 'citizen@demo.com');
    await page.type('#password', 'demo123');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    // 3. Dashboard
    console.log("Capturing Dashboard...");
    await takeScreenshot('03-dashboard');

    // 4. Scanner
    console.log("Capturing Scanner...");
    await page.goto('http://localhost:3000/scan', { waitUntil: 'networkidle0' });
    await takeScreenshot('04-scanner');

    // 5. Sell Waste
    console.log("Capturing Sell Waste...");
    await page.goto('http://localhost:3000/sell', { waitUntil: 'networkidle0' });
    await takeScreenshot('05-sell-waste');

    // 6. Earnings
    console.log("Capturing Earnings...");
    await page.goto('http://localhost:3000/earnings', { waitUntil: 'networkidle0' });
    await takeScreenshot('06-earnings');

    // 7. Profile
    console.log("Capturing Profile...");
    await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle0' });
    await takeScreenshot('07-profile');

    // 8. Settings
    console.log("Capturing Settings...");
    await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle0' });
    await takeScreenshot('08-settings');

    // 9. EcoBot
    console.log("Capturing EcoBot...");
    await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle0' });
    await takeScreenshot('09-ecobot');

    // 10. Mobile View (Dashboard)
    console.log("Capturing Mobile View...");
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true });
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
    await takeScreenshot('10-mobile-dashboard');

    // Reset viewport and logout
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
    
    // Clear localStorage to log out
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // 11. Recycler Login
    console.log("Logging in as Recycler...");
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    await page.type('#identifier', 'recycler@demo.com');
    await page.type('#password', 'demo123');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);

    // 12. Recycler Feed
    console.log("Capturing Recycler Feed...");
    await page.goto('http://localhost:3000/recycler', { waitUntil: 'networkidle0' });
    await takeScreenshot('11-recycler-feed');

    // 13. Pickup Workflow (mock by clicking the first listing if it exists)
    console.log("Capturing Pickup Workflow...");
    try {
      // Try clicking a listing card or Details button
      await page.click('.card, button:contains("Details"), button:contains("View")');
      await takeScreenshot('12-pickup-workflow');
    } catch (e) {
      console.log("Could not find a listing to click for Pickup Workflow. Capturing default state.");
      await takeScreenshot('12-pickup-workflow');
    }

  } catch (err) {
    console.error("Error during screenshot capture:", err);
  } finally {
    await browser.close();
    console.log("✅ Done capturing screenshots.");
  }
}

run();
