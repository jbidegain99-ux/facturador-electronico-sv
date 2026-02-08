import { test, expect } from '@playwright/test';

test.describe('SPRINT 2 - Issues MEDIA Prioridad', () => {
  
  test('Issue #8: Botones de acción con diseño consistente', async ({ page }) => {
    await page.goto('/register');
    
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    
    const buttonClasses = await submitButton.getAttribute('class');
    expect(buttonClasses).toBeTruthy();
    expect(buttonClasses?.length).toBeGreaterThan(10);
    
    const cursor = await submitButton.evaluate((el) => 
      window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('pointer');
    
    const styles = await submitButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        padding: computed.padding,
        background: computed.backgroundColor,
      };
    });
    
    expect(styles.padding).not.toBe('0px');
    expect(styles.background).not.toBe('rgba(0, 0, 0, 0)');
    
    console.log('✅ Issue #8: Botones con diseño consistente - PASS');
  });

  test('Issue #11: Texto del botón de registro', async ({ page }) => {
    await page.goto('/register');
    
    const submitButton = page.locator('button[type="submit"]');
    const buttonText = await submitButton.textContent();
    
    expect(buttonText?.toLowerCase()).toContain('registrar');
    expect(buttonText?.toLowerCase()).toContain('empresa');
    
    console.log(`  Texto del botón: "${buttonText}"`);
    console.log('✅ Issue #11: Texto del botón correcto - PASS');
  });
});
