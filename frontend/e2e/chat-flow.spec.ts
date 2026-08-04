import { test, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

test.describe("IWIS EcoBot Chat AI End-to-End User Flow", () => {

  test("1. Send a sustainability question to EcoBot and receive an assistant response", async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/chat");
    await expect(page).toHaveURL(/\/chat/);

    // Locate message input
    const input = page.locator('input[placeholder*="Ask EcoBot"], input[type="text"]').first();
    await expect(input).toBeVisible();

    // Type and send a question
    await input.fill("How do I recycle electronic waste in India?");
    const sendButton = page.locator('button:has-text("Send"), button[aria-label*="send"], button:has(svg)').last();
    await sendButton.click();

    // Verify assistant reply appears
    const assistantReply = page.locator("text=/electronic|waste|recycling|IWIS|e-waste/i").first();
    await expect(assistantReply).toBeVisible({ timeout: 15000 });
  });

});
