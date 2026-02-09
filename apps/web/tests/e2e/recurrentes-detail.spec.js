"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_data_1 = require("../helpers/test-data");
test_1.test.describe('Facturas Recurrentes - Detalle', () => {
    /**
     * Navigate to the first available template's detail page.
     * Skips the test if no templates exist.
     */
    async function navigateToFirstTemplate(page) {
        await page.goto(test_data_1.ROUTES.recurrentes);
        await page.waitForSelector('table, text=/No se encontraron/i', {
            timeout: test_data_1.TIMEOUTS.apiResponse,
        });
        const firstLink = page.locator('tbody tr a').first();
        const exists = await firstLink.isVisible().catch(() => false);
        if (!exists)
            return false;
        await firstLink.click();
        await page.waitForURL('**/facturas/recurrentes/**', { timeout: test_data_1.TIMEOUTS.navigation });
        return true;
    }
    (0, test_1.test)('pagina de detalle muestra informacion del template', async ({ page }) => {
        await page.goto(test_data_1.ROUTES.recurrentes);
        await page.waitForSelector('table, text=/No se encontraron/i', {
            timeout: test_data_1.TIMEOUTS.apiResponse,
        });
        const firstLink = page.locator('tbody tr a').first();
        const exists = await firstLink.isVisible().catch(() => false);
        if (!exists) {
            test_1.test.skip();
            return;
        }
        await firstLink.click();
        await page.waitForURL('**/facturas/recurrentes/**', { timeout: test_data_1.TIMEOUTS.navigation });
        // Should show configuration card
        const configCard = page.getByText(/Configuracion/i).first();
        await (0, test_1.expect)(configCard).toBeVisible();
        // Should show key fields
        const clienteLabel = page.getByText(/Cliente/i).first();
        await (0, test_1.expect)(clienteLabel).toBeVisible();
        const frecuenciaLabel = page.getByText(/Frecuencia/i).first();
        await (0, test_1.expect)(frecuenciaLabel).toBeVisible();
    });
    (0, test_1.test)('historial reciente se muestra en detalle', async ({ page }) => {
        await page.goto(test_data_1.ROUTES.recurrentes);
        await page.waitForSelector('table, text=/No se encontraron/i', {
            timeout: test_data_1.TIMEOUTS.apiResponse,
        });
        const firstLink = page.locator('tbody tr a').first();
        const exists = await firstLink.isVisible().catch(() => false);
        if (!exists) {
            test_1.test.skip();
            return;
        }
        await firstLink.click();
        await page.waitForURL('**/facturas/recurrentes/**', { timeout: test_data_1.TIMEOUTS.navigation });
        // Historial section should be visible
        const historialSection = page.getByText(/Historial Reciente/i);
        await (0, test_1.expect)(historialSection).toBeVisible();
    });
    (0, test_1.test)('boton Editar activa modo de edicion', async ({ page }) => {
        await page.goto(test_data_1.ROUTES.recurrentes);
        await page.waitForSelector('table, text=/No se encontraron/i', {
            timeout: test_data_1.TIMEOUTS.apiResponse,
        });
        const firstLink = page.locator('tbody tr a').first();
        const exists = await firstLink.isVisible().catch(() => false);
        if (!exists) {
            test_1.test.skip();
            return;
        }
        await firstLink.click();
        await page.waitForURL('**/facturas/recurrentes/**', { timeout: test_data_1.TIMEOUTS.navigation });
        // Find edit button
        const editButton = page.getByRole('button', { name: /Editar/i });
        const editExists = await editButton.isVisible().catch(() => false);
        if (!editExists) {
            // Template might be cancelled, edit button not available
            test_1.test.skip();
            return;
        }
        await editButton.click();
        await page.waitForTimeout(test_data_1.TIMEOUTS.animation);
        // Should show save/cancel buttons in edit mode
        const saveButton = page.getByRole('button', { name: /Guardar/i });
        await (0, test_1.expect)(saveButton).toBeVisible();
        const cancelButton = page.getByRole('button', { name: /Cancelar/i });
        await (0, test_1.expect)(cancelButton).toBeVisible();
    });
    (0, test_1.test)('botones de accion se muestran segun estado', async ({ page }) => {
        await page.goto(test_data_1.ROUTES.recurrentes);
        await page.waitForSelector('table, text=/No se encontraron/i', {
            timeout: test_data_1.TIMEOUTS.apiResponse,
        });
        const firstLink = page.locator('tbody tr a').first();
        const exists = await firstLink.isVisible().catch(() => false);
        if (!exists) {
            test_1.test.skip();
            return;
        }
        await firstLink.click();
        await page.waitForURL('**/facturas/recurrentes/**', { timeout: test_data_1.TIMEOUTS.navigation });
        // At least one action button should be visible
        const pauseButton = page.getByRole('button', { name: /Pausar/i });
        const resumeButton = page.getByRole('button', { name: /Reanudar/i });
        const cancelButton = page.getByRole('button', { name: /Cancelar/i }).last();
        const hasPause = await pauseButton.isVisible().catch(() => false);
        const hasResume = await resumeButton.isVisible().catch(() => false);
        const hasCancel = await cancelButton.isVisible().catch(() => false);
        // At least one state-related button should be visible (unless template is cancelled)
        (0, test_1.expect)(hasPause || hasResume || hasCancel).toBe(true);
    });
});
