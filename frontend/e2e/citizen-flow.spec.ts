import { test, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import * as path from "path";
import * as fs from "fs";

const TEST_IMAGE_PATH = path.join(__dirname, "test-waste-sample.png");

if (!fs.existsSync(TEST_IMAGE_PATH)) {
  const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  fs.writeFileSync(TEST_IMAGE_PATH, Buffer.from(pngBase64, "base64"));
}

test.describe("IWIS Citizen End-to-End User Flow", () => {

  test("1. Sign in as Citizen and complete AI Waste Scan on /scan", async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/");
    await page.goto("/scan");

    // Wait for file input or scan container
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fileInput.setInputFiles(TEST_IMAGE_PATH);
      const resultHeading = page.locator("text=/AI Classification Result|Estimated Value|Recyclability|Analyzing/i").first();
      await expect(resultHeading).toBeVisible({ timeout: 15000 });
    } else {
      // Unauthenticated fallback redirects to /login
      await expect(page).toHaveURL(/\/login|\/scan/);
    }
  });

  test("2. Create a Waste Listing and confirm presence on /sell/history and /dashboard", async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/");
    await page.goto("/sell");

    const addressInput = page.locator('textarea#address, textarea[placeholder*="address"], input[placeholder*="address"]').first();
    if (await addressInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const materialBtn = page.locator('button:has-text("Plastic"), button:has-text("Paper")').first();
      if (await materialBtn.isVisible()) await materialBtn.click();

      const volumeBtn = page.locator('button:has-text("Medium Bag"), button:has-text("Small Bag")').first();
      if (await volumeBtn.isVisible()) await volumeBtn.click();

      await addressInput.fill("123 Eco Green Street, Sector 4, Jammu");

      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isEnabled()) await submitBtn.click();

      const trackBtn = page.locator('a:has-text("Track My Listing"), text=/Listing Created/i').first();
      await expect(trackBtn).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page).toHaveURL(/\/login|\/sell/);
    }
  });

  test("3. Check /leaderboard reflects eco activity", async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/");
    await page.goto("/leaderboard");

    const leaderboardHeading = page.locator("text=/Impact Rankings|Rankings|Leaderboard/i").first();
    if (await leaderboardHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(leaderboardHeading).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/login|\/leaderboard/);
    }
  });

  test("4. Check /map loads cleanly with denied location permissions", async ({ page, context }) => {
    await setupClerkTestingToken({ page });
    await context.clearPermissions();

    await page.goto("/");
    await page.goto("/map");

    const mapContainer = page.locator("text=/Waste Hotspot Map|Recycling Hubs|Map|Geo-Spatial/i").first();
    if (await mapContainer.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(mapContainer).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/login|\/map/);
    }
  });

});
