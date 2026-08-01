import { test, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

test.describe("IWIS Authenticated Session & Protected Route E2E Test Suite", () => {

  test("Authenticated user session loads /dashboard cleanly with user-specific data", async ({ page }) => {
    // 1. Setup real testing token (fails loudly if auth setup fails)
    await setupClerkTestingToken({ page });
    
    // 2. Navigate directly to protected dashboard
    await page.goto("/dashboard");
    
    // 3. Strict assertion: URL MUST stay on /dashboard (no login redirect allowed)
    await expect(page).toHaveURL(/\/dashboard/);
    
    // 4. Strict assertion: User-specific dashboard content MUST be visible
    const userContent = page.locator("text=/Total Earned|Waste Recycled|Scans|Earnings|Green Points/i").first();
    await expect(userContent).toBeVisible();
  });

});
