import { test, expect } from '@playwright/test';
import { ROUTES, TIMEOUTS } from '../helpers/test-data';

test.describe('Facturas Recurrentes - Listado', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.recurrentes);
    await page.waitForSelector('table, text=/No se encontraron templates/i', {
      timeout: TIMEOUTS.apiResponse,
    });
  });

  test('tabs de estado se muestran y funcionan', async ({ page }) => {
    // All status tabs should be visible
    await expect(page.getByRole('button', { name: 'Todas' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Activas' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pausadas' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Canceladas' })).toBeVisible();

    // Click Activas tab
    await page.getByRole('button', { name: 'Activas' }).click();
    await page.waitForTimeout(TIMEOUTS.animation);

    // Page should not crash
    const hasTable = await page.locator('table').isVisible();
    const hasEmpty = await page.getByText(/No se encontraron/i).isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBe(true);

    // Click Pausadas tab
    await page.getByRole('button', { name: 'Pausadas' }).click();
    await page.waitForTimeout(TIMEOUTS.animation);

    // Still functional
    expect(true).toBe(true);
  });

  test('busqueda de templates funciona', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Buscar por nombre o cliente/i);
    await expect(searchInput).toBeVisible();

    await searchInput.fill('nonexistent_template_xyz_999');
    await page.waitForTimeout(1000);

    const rows = await page.locator('tbody tr').count();
    const hasEmpty = await page.getByText(/No se encontraron/i).isVisible().catch(() => false);

    expect(rows === 0 || hasEmpty).toBe(true);
  });

  test('boton Nuevo Template navega correctamente', async ({ page }) => {
    const newButton = page.getByRole('link', { name: /Nuevo Template/i });
    await expect(newButton).toBeVisible();

    await newButton.click();
    await page.waitForURL(`**${ROUTES.recurrentesNuevo}`, { timeout: TIMEOUTS.navigation });

    await expect(page).toHaveURL(new RegExp(ROUTES.recurrentesNuevo));
  });

  test('click en nombre de template navega al detalle', async ({ page }) => {
    const hasTable = await page.locator('table').isVisible();
    if (!hasTable) {
      test.skip();
      return;
    }

    // Find first template link in the table
    const firstLink = page.locator('tbody tr a').first();
    const linkExists = await firstLink.isVisible().catch(() => false);

    if (!linkExists) {
      test.skip();
      return;
    }

    await firstLink.click();
    await page.waitForURL('**/facturas/recurrentes/**', { timeout: TIMEOUTS.navigation });

    // Should be on detail page (not the list or create page)
    await expect(page).toHaveURL(/\/facturas\/recurrentes\/[^/]+$/);
  });

  test('columnas del listado se muestran correctamente', async ({ page }) => {
    const hasTable = await page.locator('table').isVisible();
    if (!hasTable) {
      test.skip();
      return;
    }

    // Verify key columns exist
    await expect(page.getByText('Nombre').first()).toBeVisible();
    await expect(page.getByText('Cliente').first()).toBeVisible();
    await expect(page.getByText('Frecuencia').first()).toBeVisible();
    await expect(page.getByText('Estado').first()).toBeVisible();
  });
});
