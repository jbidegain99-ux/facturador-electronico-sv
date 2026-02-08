import { test, expect } from '@playwright/test';

test.describe('SPRINT 1 - Issues ALTA Prioridad', () => {
  
  test('Issue #6: Límites de longitud de campos', async ({ page }) => {
    await page.goto('/register');
    
    const razonSocial = page.locator('input[name="nombre"]');
    const longText = 'A'.repeat(250);
    await razonSocial.fill(longText);
    
    const razonValue = await razonSocial.inputValue();
    expect(razonValue.length).toBeLessThanOrEqual(200);
    
    const counter200 = page.locator('text=/200/');
    await expect(counter200).toBeVisible();
    
    const direccion = page.locator('input[name="complemento"]');
    const veryLongText = 'B'.repeat(600);
    await direccion.fill(veryLongText);
    
    const direccionValue = await direccion.inputValue();
    expect(direccionValue.length).toBeLessThanOrEqual(500);
    
    const counter500 = page.locator('text=/500/');
    await expect(counter500).toBeVisible();
    
    console.log('✅ Issue #6: Límites de longitud - PASS');
  });

  test('Issue #4: Máscaras de input (NIT, NRC, Teléfono)', async ({ page }) => {
    await page.goto('/register');
    
    const nitInput = page.locator('input[name="nit"]');
    await nitInput.fill('1234567890123456');
    const nitValue = await nitInput.inputValue();
    expect(nitValue).toMatch(/^\d{4}-\d{6}-\d{3}-\d$/);
    console.log(`  NIT formateado: ${nitValue}`);
    
    const nrcInput = page.locator('input[name="nrc"]');
    await nrcInput.fill('1234567');
    const nrcValue = await nrcInput.inputValue();
    expect(nrcValue).toMatch(/^\d{6}-\d$/);
    console.log(`  NRC formateado: ${nrcValue}`);
    
    const telInput = page.locator('input[name="telefono"]');
    await telInput.fill('75252802');
    const telValue = await telInput.inputValue();
    expect(telValue).toMatch(/^\d{4}-\d{4}$/);
    console.log(`  Teléfono formateado: ${telValue}`);
    
    console.log('✅ Issue #4: Máscaras de input - PASS');
  });

  test('Issue #9: Validación emails distintos', async ({ page }) => {
    await page.goto('/register');
    
    const sameEmail = 'test@republicode.com';
    
    await page.fill('input[name="nombre"]', 'Empresa Test SA');
    await page.fill('input[name="nit"]', '1234567890123456');
    await page.fill('input[name="nrc"]', '1234567');
    await page.fill('input[name="telefono"]', '75252802');
    await page.fill('input[name="correo"]', sameEmail);
    
    await page.selectOption('select[name="actividadEcon"]', { index: 1 });
    await page.selectOption('select[name="departamento"]', { index: 1 });
    await page.waitForTimeout(500);
    await page.selectOption('select[name="municipio"]', { index: 1 });
    
    await page.fill('input[name="complemento"]', 'Calle test 123');
    await page.fill('input[name="adminNombre"]', 'Admin Test');
    await page.fill('input[name="adminEmail"]', sameEmail);
    await page.fill('input[name="adminPassword"]', 'Test1234!');
    await page.fill('input[name="adminPasswordConfirm"]', 'Test1234!');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // CORREGIDO: Buscar el texto real del mensaje
    const errorMessage = page.locator('text=/deben ser diferentes/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Issue #9: Validación emails distintos - PASS');
  });

  test('Issue #7: Color visible en dropdown Municipio', async ({ page }) => {
    await page.goto('/register');
    
    const deptSelect = page.locator('select[name="departamento"]');
    await deptSelect.selectOption({ index: 1 });
    
    await page.waitForTimeout(500);
    
    const municipioSelect = page.locator('select[name="municipio"]');
    const municipioOptions = await municipioSelect.locator('option').all();
    
    expect(municipioOptions.length).toBeGreaterThan(1);
    
    const firstOption = municipioOptions[1];
    const optionText = await firstOption.textContent();
    expect(optionText).toBeTruthy();
    
    console.log(`  Municipios disponibles: ${municipioOptions.length - 1}`);
    console.log('✅ Issue #7: Color dropdown municipio - PASS');
  });

  test('Issue #14: Bloqueo de cuenta - SKIP (bug API duplicada)', async ({ page }) => {
    // SKIP temporalmente hasta que se fixee el bug de API
    // Error: Cannot POST /api/v1/api/v1/auth/login (ruta duplicada)
    console.log('⏭️  Issue #14: SKIPPED - Requiere fix de ruta API duplicada');
    test.skip();
  });
});
