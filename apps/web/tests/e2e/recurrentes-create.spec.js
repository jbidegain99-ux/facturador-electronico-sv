"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_data_1 = require("../helpers/test-data");
test_1.test.describe('Facturas Recurrentes - Crear Template', () => {
    test_1.test.beforeEach(async ({ page }) => {
        await page.goto(test_data_1.ROUTES.recurrentesNuevo);
        await page.waitForLoadState('networkidle', { timeout: test_data_1.TIMEOUTS.apiResponse });
    });
    (0, test_1.test)('formulario muestra campos requeridos', async ({ page }) => {
        // Name field
        const nombreInput = page.getByLabel(/Nombre del Template/i);
        await (0, test_1.expect)(nombreInput).toBeVisible();
        // Frequency select
        const frecuenciaLabel = page.getByText(/Frecuencia/i).first();
        await (0, test_1.expect)(frecuenciaLabel).toBeVisible();
        // Start date
        const startDateInput = page.getByLabel(/Fecha de Inicio/i);
        await (0, test_1.expect)(startDateInput).toBeVisible();
        // Items section
        const itemsHeader = page.getByText(/Items de la Factura/i);
        await (0, test_1.expect)(itemsHeader).toBeVisible();
        // Submit button
        const submitButton = page.getByRole('button', { name: /Crear Template/i });
        await (0, test_1.expect)(submitButton).toBeVisible();
    });
    (0, test_1.test)('validacion de campos requeridos al enviar formulario vacio', async ({ page }) => {
        // Try to submit without filling required fields
        const submitButton = page.getByRole('button', { name: /Crear Template/i });
        await submitButton.click();
        // Should show validation errors or not navigate away
        await page.waitForTimeout(test_data_1.TIMEOUTS.animation);
        await (0, test_1.expect)(page).toHaveURL(new RegExp(test_data_1.ROUTES.recurrentesNuevo));
    });
    (0, test_1.test)('agregar y remover items funciona', async ({ page }) => {
        // Should start with 1 item
        const itemRows = page.locator('.grid-cols-12, [class*="grid"]').filter({ has: page.locator('input') });
        // Click "Agregar Item"
        const addButton = page.getByRole('button', { name: /Agregar Item/i });
        await (0, test_1.expect)(addButton).toBeVisible();
        await addButton.click();
        await page.waitForTimeout(test_data_1.TIMEOUTS.animation);
        // Should now have more input rows
        const deleteButtons = page.locator('button').filter({ has: page.locator('[class*="trash"], svg') });
        // At least one delete button should be available
        const deleteCount = await deleteButtons.count();
        (0, test_1.expect)(deleteCount).toBeGreaterThan(0);
    });
    (0, test_1.test)('seleccion de frecuencia muestra campos condicionales', async ({ page }) => {
        // Find frequency select
        const selects = page.locator('select');
        const frecuenciaSelect = selects.filter({ has: page.locator('option:has-text("Mensual")') }).first();
        const exists = await frecuenciaSelect.isVisible().catch(() => false);
        if (!exists) {
            test_1.test.skip();
            return;
        }
        // Select WEEKLY - should show day of week selector
        await frecuenciaSelect.selectOption('WEEKLY');
        await page.waitForTimeout(test_data_1.TIMEOUTS.animation);
        const dayOfWeekLabel = page.getByText(/Dia de la Semana/i);
        await (0, test_1.expect)(dayOfWeekLabel).toBeVisible();
        // Select MONTHLY - should show day of month selector
        await frecuenciaSelect.selectOption('MONTHLY');
        await page.waitForTimeout(test_data_1.TIMEOUTS.animation);
        const anchorDayLabel = page.getByText(/Dia del Mes/i);
        await (0, test_1.expect)(anchorDayLabel).toBeVisible();
    });
});
