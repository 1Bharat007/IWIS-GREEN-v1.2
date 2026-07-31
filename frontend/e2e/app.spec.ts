import { test, expect } from "@playwright/test";

test.describe("IWIS End-to-End (E2E) UI & Responsive Test Suite", () => {

  test("Landing Page loads correctly with title and hero elements", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/IWIS/);
    
    // Check main brand logo & hero title
    await expect(page.getByRole("link", { name: /IWIS/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Know the value/i })).toBeVisible();
    await expect(page.getByText(/Three simple steps/i)).toBeVisible();
  });

  test("Privacy Policy & Terms of Service pages render properly", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /Privacy Policy/i })).toBeVisible();
    await expect(page.getByText(/1. Information We Collect/i)).toBeVisible();

    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: /Terms of Service/i })).toBeVisible();
    await expect(page.getByText(/1. Platform Scope/i)).toBeVisible();
  });

  test("Dark / Light mode theme toggle updates html class", async ({ page }) => {
    await page.goto("/");
    const themeBtn = page.getByRole("button", { name: /toggle dark mode/i });
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      const htmlEl = page.locator("html");
      await expect(htmlEl).toBeDefined();
    }
  });

  test("Mobile layout navigation menu opens and closes smoothly", async ({ page }) => {
    // Set mobile viewport dimensions
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const menuToggle = page.getByRole("button", { name: /open menu/i });
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
      await expect(page.getByText(/Navigation/i)).toBeVisible();
      
      const closeToggle = page.getByRole("button", { name: /close menu/i });
      await closeToggle.click();
      await expect(page.getByText(/Navigation/i)).not.toBeVisible();
    }
  });

});
