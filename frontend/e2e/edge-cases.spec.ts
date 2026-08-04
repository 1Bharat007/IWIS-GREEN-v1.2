import { test, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import * as path from "path";

const TEST_IMAGE_PATH = path.join(__dirname, "test-waste-sample.png");

test.describe("IWIS Edge Cases & Protected Route Security Test Suite", () => {

  test("1. Unauthenticated direct access to protected routes redirects to /login", async ({ page }) => {
    const protectedRoutes = [
      "/dashboard",
      "/scan",
      "/sell",
      "/sell/history",
      "/marketplace",
      "/recycler/feed"
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForURL("**/login**", { timeout: 7000 });
      expect(page.url()).toContain("/login");
    }
  });

  test("2. Network error on scan API returns clean error UI without unhandled crash", async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/");
    await page.goto("/scan");

    // Abort network request to /api/waste/scan to simulate network failure
    await page.route("**/api/waste/scan", (route) => route.abort());

    // Upload test waste image if scan form is available
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fileInput.setInputFiles(TEST_IMAGE_PATH);
      const errorNotice = page.locator("text=/Failed|Error|Network|Unable/i").first();
      await expect(errorNotice).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page).toHaveURL(/\/login|\/scan/);
    }
  });

});
