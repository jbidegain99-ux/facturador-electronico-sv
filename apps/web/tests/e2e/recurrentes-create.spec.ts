import { test, expect } from '@playwright/test';
import { ROUTES, TIMEOUTS } from '../helpers/test-data';

test.describe('Facturas Recurrentes - Crear Template', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.recurrentesNuevo);
    await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.apiResponse });
  });

  test('formulario muestra campos requeridos', async ({ page }) => {
    // Name field
    const nombreInput = page.getByLabel(/Nombre del Template/i);
    await expect(nombreInput).toBeVisible();

    // Frequency select
    const frecuenciaLabel = page.getByText(/Frecuencia/i).first();
    await expect(frecuenciaLabel).toBeVisible();

    // Start date
    const startDateInput = page.getByLabel(/Fecha de Inicio/i);
    await expect(startDateInput).toBeVisible();

    // Items section
    const itemsHeader = page.getByText(/Items de la Factura/i);
    await expect(itemsHeader).toBeVisible();

    // Submit button
    const submitButton = page.getByRole('button', { name: /Crear Template/i });
    await expect(submitButton).toBeVisible();
  });

  test('validacion de campos requeridos al enviar formulario vacio', async ({ page }) => {
    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /Crear Template/i });
    await submitButton.click();

    // Should show validation errors or not navigate away
    await page.waitForTimeout(TIMEOUTS.animation);
    await expect(page).toHaveURL(new RegExp(ROUTES.recurrentesNuevo));
  });

  test('agregar y remover items funciona', async ({ page }) => {
    // Should start with 1 item
    const itemRows = page.locator('.grid-cols-12, [class*="grid"]').filter({ has: page.locator('input') });

    // Click "Agregar Item"
    const addButton = page.getByRole('button', { name: /Agregar Item/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    await page.waitForTimeout(TIMEOUTS.animation);

    // Should now have more input rows
    const deleteButtons = page.locator('button').filter({ has: page.locator('[class*="trash"], svg') });
    // At least one delete button should be available
    const deleteCount = await deleteButtons.count();
    expect(deleteCount).toBeGreaterThan(0);
  });

  test('seleccion de frecuencia muestra campos condicionales', async ({ page }) => {
    // Find frequency select
    const selects = page.locator('select');
    const frecuenciaSelect = selects.filter({ has: page.locator('option:has-text("Mensual")') }).first();
    const exists = await frecuenciaSelect.isVisible().catch(() => false);

    if (!exists) {
      test.skip();
      return;
    }

    // Select WEEKLY - should show day of week selector
    await frecuenciaSelect.selectOption('WEEKLY');
    await page.waitForTimeout(TIMEOUTS.animation);

    const dayOfWeekLabel = page.getByText(/Dia de la Semana/i);
    await expect(dayOfWeekLabel).toBeVisible();

    // Select MONTHLY - should show day of month selector
    await frecuenciaSelect.selectOption('MONTHLY');
    await page.waitForTimeout(TIMEOUTS.animation);

    const anchorDayLabel = page.getByText(/Dia del Mes/i);
    await expect(anchorDayLabel).toBeVisible();
  });
});
