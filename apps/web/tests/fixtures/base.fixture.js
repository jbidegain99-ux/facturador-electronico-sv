"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expect = exports.test = void 0;
exports.waitForTableLoad = waitForTableLoad;
exports.getTableRowCount = getTableRowCount;
exports.clickSortHeader = clickSortHeader;
const test_1 = require("@playwright/test");
Object.defineProperty(exports, "test", { enumerable: true, get: function () { return test_1.test; } });
Object.defineProperty(exports, "expect", { enumerable: true, get: function () { return test_1.expect; } });
/**
 * Helper utilities for E2E tests.
 */
/** Wait for table to finish loading (skeleton gone, table or empty state visible) */
async function waitForTableLoad(page, timeout = 15000) {
    try {
        await page.waitForSelector('table, [class*="empty"], text=/No hay|No se encontraron/i', {
            timeout,
        });
        // Wait for skeleton to disappear
        const skeleton = page.locator('.animate-pulse');
        if (await skeleton.isVisible().catch(() => false)) {
            await skeleton.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => { });
        }
        return await page.locator('table').isVisible();
    }
    catch {
        return false;
    }
}
/** Get the count of table rows (excluding header) */
async function getTableRowCount(page) {
    return page.locator('tbody tr').count();
}
/** Click a sortable column header */
async function clickSortHeader(page, headerText) {
    const header = page.getByText(headerText, { exact: true }).first();
    await header.click();
    await page.waitForTimeout(500);
}
