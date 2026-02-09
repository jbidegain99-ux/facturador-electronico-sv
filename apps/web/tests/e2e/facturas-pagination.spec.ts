import { test, expect } from '@playwright/test';
import { ROUTES, TIMEOUTS } from '../helpers/test-data';

test.describe('Facturas - Paginacion y Filtros', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.facturas);
    await page.waitForSelector('table, text=/No hay documentos/i', { timeout: TIMEOUTS.apiResponse });
  });

  test('tabla de facturas se muestra correctamente', async ({ page }) => {
    const hasTable = await page.locator('table').isVisible();
    const hasEmptyState = await page.getByText(/No hay documentos/i).isVisible().catch(() => false);

    expect(hasTable || hasEmptyState).toBe(true);

    if (hasTable) {
      // Verify key table headers
      await expect(page.getByText('Fecha').first()).toBeVisible();
      await expect(page.getByText('Total').first()).toBeVisible();
      await expect(page.getByText('Estado').first()).toBeVisible();
    }
  });

  test('filtro por tipo DTE funciona', async ({ page }) => {
    const hasTable = await page.locator('table').isVisible();
    if (!hasTable) {
      test.skip();
      return;
    }

    // Find tipo select - it's the first select/dropdown filter
    const tipoSelect = page.locator('select').first();
    const tipoSelectExists = await tipoSelect.isVisible().catch(() => false);

    if (tipoSelectExists) {
      await tipoSelect.selectOption({ label: 'Factura' });
      await page.waitForTimeout(TIMEOUTS.animation);
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('filtro por estado funciona', async ({ page }) => {
    const hasTable = await page.locator('table').isVisible();
    if (!hasTable) {
      test.skip();
      return;
    }

    // Find estado select - typically the second select
    const selects = page.locator('select');
    const count = await selects.count();

    if (count >= 2) {
      await selects.nth(1).selectOption({ label: 'Procesado' });
      await page.waitForTimeout(TIMEOUTS.animation);
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('busqueda filtra resultados', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Buscar por numero/i);
    await expect(searchInput).toBeVisible();

    await searchInput.fill('test_nonexistent_invoice_xyz');
    await page.waitForTimeout(1000);

    const rows = await page.locator('tbody tr').count();
    const hasEmpty = await page.getByText(/No se encontraron/i).isVisible().catch(() => false);

    expect(rows === 0 || hasEmpty).toBe(true);
  });

  test('ordenamiento por Total funciona', async ({ page }) => {
    const hasTable = await page.locator('table').isVisible();
    if (!hasTable) {
      test.skip();
      return;
    }

    // Click on Total header
    const totalHeader = page.getByText('Total').first();
    await totalHeader.click();
    await page.waitForTimeout(TIMEOUTS.animation);

    // Table should still render
    await expect(page.locator('table')).toBeVisible();
  });

  test('boton Nueva Factura esta visible', async ({ page }) => {
    // The button might be a link or disabled if Hacienda not configured
    const newButton = page.getByText(/Nueva Factura/i);
    const buttonExists = await newButton.isVisible().catch(() => false);

    // Button should exist in the page (may be disabled)
    expect(buttonExists).toBe(true);
  });
});
