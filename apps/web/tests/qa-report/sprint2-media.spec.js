"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
test_1.test.describe('SPRINT 2 - Issues MEDIA Prioridad', () => {
    (0, test_1.test)('Issue #8: Botones de acción con diseño consistente', async ({ page }) => {
        await page.goto('/register');
        const submitButton = page.locator('button[type="submit"]');
        await (0, test_1.expect)(submitButton).toBeVisible();
        const buttonClasses = await submitButton.getAttribute('class');
        (0, test_1.expect)(buttonClasses).toBeTruthy();
        (0, test_1.expect)(buttonClasses?.length).toBeGreaterThan(10);
        const cursor = await submitButton.evaluate((el) => window.getComputedStyle(el).cursor);
        (0, test_1.expect)(cursor).toBe('pointer');
        const styles = await submitButton.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
                padding: computed.padding,
                background: computed.backgroundColor,
            };
        });
        (0, test_1.expect)(styles.padding).not.toBe('0px');
        (0, test_1.expect)(styles.background).not.toBe('rgba(0, 0, 0, 0)');
        console.log('✅ Issue #8: Botones con diseño consistente - PASS');
    });
    (0, test_1.test)('Issue #11: Texto del botón de registro', async ({ page }) => {
        await page.goto('/register');
        const submitButton = page.locator('button[type="submit"]');
        const buttonText = await submitButton.textContent();
        (0, test_1.expect)(buttonText?.toLowerCase()).toContain('registrar');
        (0, test_1.expect)(buttonText?.toLowerCase()).toContain('empresa');
        console.log(`  Texto del botón: "${buttonText}"`);
        console.log('✅ Issue #11: Texto del botón correcto - PASS');
    });
});
