import { test, expect, Page } from '@playwright/test';

/**
 * Helper utilities for E2E tests.
 */

/** Wait for table to finish loading (skeleton gone, table or empty state visible) */
export async function waitForTableLoad(page: Page, timeout = 15000): Promise<boolean> {
  try {
    await page.waitForSelector('table, [class*="empty"], text=/No hay|No se encontraron/i', {
      timeout,
    });
    // Wait for skeleton to disappear
    const skeleton = page.locator('.animate-pulse');
    if (await skeleton.isVisible().catch(() => false)) {
      await skeleton.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
    return await page.locator('table').isVisible();
  } catch {
    return false;
  }
}

/** Get the count of table rows (excluding header) */
export async function getTableRowCount(page: Page): Promise<number> {
  return page.locator('tbody tr').count();
}

/** Click a sortable column header */
export async function clickSortHeader(page: Page, headerText: string): Promise<void> {
  const header = page.getByText(headerText, { exact: true }).first();
  await header.click();
  await page.waitForTimeout(500);
}

export { test, expect };
