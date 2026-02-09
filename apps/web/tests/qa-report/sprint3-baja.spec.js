"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
test_1.test.describe('SPRINT 3 - Issues BAJA Prioridad', () => {
    (0, test_1.test)('Issue #1: Link "Ya tienes cuenta" visible', async ({ page }) => {
        await page.goto('/register');
        const loginLink = page.locator('a:has-text("ya tienes cuenta"), a:has-text("Iniciar Sesion")');
        await (0, test_1.expect)(loginLink.first()).toBeVisible();
        const linkColor = await loginLink.first().evaluate((el) => {
            return window.getComputedStyle(el).color;
        });
        (0, test_1.expect)(linkColor).not.toBe('rgba(0, 0, 0, 0)');
        console.log(`  Color del link: ${linkColor}`);
        console.log('✅ Issue #1: Link "Ya tienes cuenta" visible - PASS');
    });
    (0, test_1.test)('Issue #2: Placeholder NIT correcto', async ({ page }) => {
        await page.goto('/register');
        const nitInput = page.locator('input[name="nit"]');
        const placeholder = await nitInput.getAttribute('placeholder');
        (0, test_1.expect)(placeholder).toMatch(/\d{4}-\d{6}-\d{3}-\d/);
        console.log(`  Placeholder NIT: "${placeholder}"`);
        console.log('✅ Issue #2: Placeholder NIT correcto - PASS');
    });
});
