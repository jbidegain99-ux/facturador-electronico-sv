"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expect = exports.AUTH_FILE = void 0;
const test_1 = require("@playwright/test");
Object.defineProperty(exports, "expect", { enumerable: true, get: function () { return test_1.expect; } });
const path_1 = __importDefault(require("path"));
exports.AUTH_FILE = path_1.default.join(__dirname, '..', '.auth', 'user.json');
/**
 * Authentication setup - runs before all test suites.
 * Logs in via the login page and saves cookies/localStorage.
 * Requires TEST_USER_EMAIL and TEST_USER_PASSWORD env vars.
 */
(0, test_1.test)('authenticate', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    if (!email || !password) {
        test_1.test.skip();
        return;
    }
    await page.goto('/login');
    await page.locator('input#email').fill(email);
    await page.locator('input#password').fill(password);
    await page.getByRole('button', { name: /Iniciar Sesión/ }).click();
    // Wait for successful redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    // Verify we're authenticated
    await (0, test_1.expect)(page).not.toHaveURL(/\/login/);
    // Save authentication state
    await page.context().storageState({ path: exports.AUTH_FILE });
});
