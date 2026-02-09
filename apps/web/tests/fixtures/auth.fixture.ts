import { test as setup, expect } from '@playwright/test';
import path from 'path';

export const AUTH_FILE = path.join(__dirname, '..', '.auth', 'user.json');

/**
 * Authentication setup - runs before all test suites.
 * Logs in via the login page and saves cookies/localStorage.
 * Requires TEST_USER_EMAIL and TEST_USER_PASSWORD env vars.
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    setup.skip();
    return;
  }

  await page.goto('/login');
  await page.locator('input#email').fill(email);
  await page.locator('input#password').fill(password);
  await page.getByRole('button', { name: /Iniciar Sesión/ }).click();

  // Wait for successful redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 15000 });

  // Verify we're authenticated
  await expect(page).not.toHaveURL(/\/login/);

  // Save authentication state
  await page.context().storageState({ path: AUTH_FILE });
});

export { expect };
