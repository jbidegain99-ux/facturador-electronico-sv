import { test, expect } from '@playwright/test';
import { ROUTES, TIMEOUTS } from '../helpers/test-data';

test.describe('Facturas Recurrentes - Detalle', () => {
  /**
   * Navigate to the first available template's detail page.
   * Skips the test if no templates exist.
   */
  async function navigateToFirstTemplate(page: ReturnType<typeof test['_directives']> extends never ? never : Parameters<Parameters<typeof test>[1]>[0]['page']): Promise<boolean> {
    await page.goto(ROUTES.recurrentes);
    await page.waitForSelector('table, text=/No se encontraron/i', {
      timeout: TIMEOUTS.apiResponse,
    });

    const firstLink = page.locator('tbody tr a').first();
    const exists = await firstLink.isVisible().catch(() => false);
    if (!exists) return false;

    await firstLink.click();
    await page.waitForURL('**/facturas/recurrentes/**', { timeout: TIMEOUTS.navigation });
    return true;
  }

  test('pagina de detalle muestra informacion del template', async ({ page }) => {
    await page.goto(ROUTES.recurrentes);
    await page.waitForSelector('table, text=/No se encontraron/i', {
      timeout: TIMEOUTS.apiResponse,
    });

    const firstLink = page.locator('tbody tr a').first();
    const exists = await firstLink.isVisible().catch(() => false);
    if (!exists) {
      test.skip();
      return;
    }

    await firstLink.click();
    await page.waitForURL('**/facturas/recurrentes/**', { timeout: TIMEOUTS.navigation });

    // Should show configuration card
    const configCard = page.getByText(/Configuracion/i).first();
    await expect(configCard).toBeVisible();

    // Should show key fields
    const clienteLabel = page.getByText(/Cliente/i).first();
    await expect(clienteLabel).toBeVisible();

    const frecuenciaLabel = page.getByText(/Frecuencia/i).first();
    await expect(frecuenciaLabel).toBeVisible();
  });

  test('historial reciente se muestra en detalle', async ({ page }) => {
    await page.goto(ROUTES.recurrentes);
    await page.waitForSelector('table, text=/No se encontraron/i', {
      timeout: TIMEOUTS.apiResponse,
    });

    const firstLink = page.locator('tbody tr a').first();
    const exists = await firstLink.isVisible().catch(() => false);
    if (!exists) {
      test.skip();
      return;
    }

    await firstLink.click();
    await page.waitForURL('**/facturas/recurrentes/**', { timeout: TIMEOUTS.navigation });

    // Historial section should be visible
    const historialSection = page.getByText(/Historial Reciente/i);
    await expect(historialSection).toBeVisible();
  });

  test('boton Editar activa modo de edicion', async ({ page }) => {
    await page.goto(ROUTES.recurrentes);
    await page.waitForSelector('table, text=/No se encontraron/i', {
      timeout: TIMEOUTS.apiResponse,
    });

    const firstLink = page.locator('tbody tr a').first();
    const exists = await firstLink.isVisible().catch(() => false);
    if (!exists) {
      test.skip();
      return;
    }

    await firstLink.click();
    await page.waitForURL('**/facturas/recurrentes/**', { timeout: TIMEOUTS.navigation });

    // Find edit button
    const editButton = page.getByRole('button', { name: /Editar/i });
    const editExists = await editButton.isVisible().catch(() => false);

    if (!editExists) {
      // Template might be cancelled, edit button not available
      test.skip();
      return;
    }

    await editButton.click();
    await page.waitForTimeout(TIMEOUTS.animation);

    // Should show save/cancel buttons in edit mode
    const saveButton = page.getByRole('button', { name: /Guardar/i });
    await expect(saveButton).toBeVisible();

    const cancelButton = page.getByRole('button', { name: /Cancelar/i });
    await expect(cancelButton).toBeVisible();
  });

  test('botones de accion se muestran segun estado', async ({ page }) => {
    await page.goto(ROUTES.recurrentes);
    await page.waitForSelector('table, text=/No se encontraron/i', {
      timeout: TIMEOUTS.apiResponse,
    });

    const firstLink = page.locator('tbody tr a').first();
    const exists = await firstLink.isVisible().catch(() => false);
    if (!exists) {
      test.skip();
      return;
    }

    await firstLink.click();
    await page.waitForURL('**/facturas/recurrentes/**', { timeout: TIMEOUTS.navigation });

    // At least one action button should be visible
    const pauseButton = page.getByRole('button', { name: /Pausar/i });
    const resumeButton = page.getByRole('button', { name: /Reanudar/i });
    const cancelButton = page.getByRole('button', { name: /Cancelar/i }).last();

    const hasPause = await pauseButton.isVisible().catch(() => false);
    const hasResume = await resumeButton.isVisible().catch(() => false);
    const hasCancel = await cancelButton.isVisible().catch(() => false);

    // At least one state-related button should be visible (unless template is cancelled)
    expect(hasPause || hasResume || hasCancel).toBe(true);
  });
});
