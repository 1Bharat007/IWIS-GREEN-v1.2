import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('IWIS Accessibility Audit (axe-core)', () => {
  const routes = [
    { name: 'Landing Page', path: '/' },
    { name: 'Login Page', path: '/login' },
    { name: 'Signup Page', path: '/signup' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Scan Page', path: '/scan' },
    { name: 'Marketplace', path: '/marketplace' },
  ];

  for (const route of routes) {
    test(`${route.name} (${route.path}) should have zero serious or critical accessibility violations`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('domcontentloaded');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const seriousOrCritical = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );

      if (seriousOrCritical.length > 0) {
        console.error(`Accessibility violations found on ${route.name}:`, JSON.stringify(seriousOrCritical, null, 2));
      }

      expect(seriousOrCritical.length).toBe(0);
    });
  }
});
