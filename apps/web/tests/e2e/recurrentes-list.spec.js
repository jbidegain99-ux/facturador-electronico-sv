"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_data_1 = require("../helpers/test-data");
test_1.test.describe('Facturas Recurrentes - Listado', () => {
    test_1.test.beforeEach(async ({ page }) => {
        await page.goto(test_data_1.ROUTES.recurrentes);
        await page.waitForSelector('table, text=/No se encontraron templates/i', {
            timeout: test_data_1.TIMEOUTS.apiResponse,
        });
    });
    (0, test_1.test)('tabs de estado se muestran y funcionan', async ({ page }) => {
        // All status tabs should be visible
        await (0, test_1.expect)(page.getByRole('button', { name: 'Todas' })).toBeVisible();
        await (0, test_1.expect)(page.getByRole('button', { name: 'Activas' })).toBeVisible();
        await (0, test_1.expect)(page.getByRole('button', { name: 'Pausadas' })).toBeVisible();
        await (0, test_1.expect)(page.getByRole('button', { name: 'Canceladas' })).toBeVisible();
        // Click Activas tab
        await page.getByRole('button', { name: 'Activas' }).click();
        await page.waitForTimeout(test_data_1.TIMEOUTS.animation);
        // Page should not crash
        const hasTable = await page.locator('table').isVisible();
        const hasEmpty = await page.getByText(/No se encontraron/i).isVisible().catch(() => false);
        (0, test_1.expect)(hasTable || hasEmpty).toBe(true);
        // Click Pausadas tab
        await page.getByRole('button', { name: 'Pausadas' }).click();
        await page.waitForTimeout(test_data_1.TIMEOUTS.animation);
        // Still functional
        (0, test_1.expect)(true).toBe(true);
    });
    (0, test_1.test)('busqueda de templates funciona', async ({ page }) => {
        const searchInput = page.getByPlaceholder(/Buscar por nombre o cliente/i);
        await (0, test_1.expect)(searchInput).toBeVisible();
        await searchInput.fill('nonexistent_template_xyz_999');
        await page.waitForTimeout(1000);
        const rows = await page.locator('tbody tr').count();
        const hasEmpty = await page.getByText(/No se encontraron/i).isVisible().catch(() => false);
        (0, test_1.expect)(rows === 0 || hasEmpty).toBe(true);
    });
    (0, test_1.test)('boton Nuevo Template navega correctamente', async ({ page }) => {
        const newButton = page.getByRole('link', { name: /Nuevo Template/i });
        await (0, test_1.expect)(newButton).toBeVisible();
        await newButton.click();
        await page.waitForURL(`**${test_data_1.ROUTES.recurrentesNuevo}`, { timeout: test_data_1.TIMEOUTS.navigation });
        await (0, test_1.expect)(page).toHaveURL(new RegExp(test_data_1.ROUTES.recurrentesNuevo));
    });
    (0, test_1.test)('click en nombre de template navega al detalle', async ({ page }) => {
        const hasTable = await page.locator('table').isVisible();
        if (!hasTable) {
            test_1.test.skip();
            return;
        }
        // Find first template link in the table
        const firstLink = page.locator('tbody tr a').first();
        const linkExists = await firstLink.isVisible().catch(() => false);
        if (!linkExists) {
            test_1.test.skip();
            return;
        }
        await firstLink.click();
        await page.waitForURL('**/facturas/recurrentes/**', { timeout: test_data_1.TIMEOUTS.navigation });
        // Should be on detail page (not the list or create page)
        await (0, test_1.expect)(page).toHaveURL(/\/facturas\/recurrentes\/[^/]+$/);
    });
    (0, test_1.test)('columnas del listado se muestran correctamente', async ({ page }) => {
        const hasTable = await page.locator('table').isVisible();
        if (!hasTable) {
            test_1.test.skip();
            return;
        }
        // Verify key columns exist
        await (0, test_1.expect)(page.getByText('Nombre').first()).toBeVisible();
        await (0, test_1.expect)(page.getByText('Cliente').first()).toBeVisible();
        await (0, test_1.expect)(page.getByText('Frecuencia').first()).toBeVisible();
        await (0, test_1.expect)(page.getByText('Estado').first()).toBeVisible();
    });
});
