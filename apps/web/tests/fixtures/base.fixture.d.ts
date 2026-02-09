import { test, expect, Page } from '@playwright/test';
/**
 * Helper utilities for E2E tests.
 */
/** Wait for table to finish loading (skeleton gone, table or empty state visible) */
export declare function waitForTableLoad(page: Page, timeout?: number): Promise<boolean>;
/** Get the count of table rows (excluding header) */
export declare function getTableRowCount(page: Page): Promise<number>;
/** Click a sortable column header */
export declare function clickSortHeader(page: Page, headerText: string): Promise<void>;
export { test, expect };
//# sourceMappingURL=base.fixture.d.ts.map