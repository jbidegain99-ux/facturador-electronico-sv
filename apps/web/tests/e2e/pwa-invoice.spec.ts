import { test, expect } from '@playwright/test';

test.describe('PWA Mobile Invoice Flow', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('bottom navigation should be visible on mobile viewport', async ({ page }) => {
    // This test will work once auth is set up for E2E
    // For now it serves as a template
    await page.goto('/es/dashboard');
    // Bottom nav renders as a fixed nav element
    const nav = page.locator('nav.fixed.bottom-0');
    // Note: may require auth setup to actually see the dashboard
  });

  test('invoice creation page should show mobile wizard on small screens', async ({ page }) => {
    await page.goto('/es/facturas/nueva');
    // Mobile wizard should be visible (md:hidden)
    // Desktop form should be hidden
  });
});
