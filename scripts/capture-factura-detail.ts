import { chromium } from 'playwright';
import * as path from 'path';

const BASE_URL = 'https://app.facturosv.com';
const OUT_DIR = path.resolve(__dirname, '..', 'captures', 'screenshots', '02_factura');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // Login
  console.log('🔐 Logging in...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin@demo-facturo.com');
  await page.fill('input[type="password"]', 'Demo2026!Secure');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Navigate to Facturas
  console.log('📄 Navigating to Facturas...');
  await page.goto(`${BASE_URL}/facturas`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Debug: screenshot the list to see what we're working with
  await page.screenshot({ path: path.join(OUT_DIR, '_debug_facturas_list.png') });

  // Find a "Procesado" row and click its view (eye) icon
  console.log('🔍 Looking for Procesado invoice...');

  // First, let's inspect the action buttons in the first Procesado row
  const procesadoRow = page.locator('tr:has-text("Procesado")').first();
  await procesadoRow.waitFor({ state: 'visible', timeout: 10000 });

  // Try multiple strategies to find the view/eye button
  let clicked = false;

  // Strategy 1: Look for an eye icon link/button inside the row
  const eyeSelectors = [
    'a[href*="/facturas/"]',         // link to detail page
    'button:has(svg)',               // button with SVG icon
    'a:has(svg)',                    // link with SVG icon
    '[title*="Ver"], [title*="ver"], [aria-label*="Ver"], [aria-label*="ver"]',
    'svg',                           // any SVG (icon)
  ];

  for (const sel of eyeSelectors) {
    const el = procesadoRow.locator(sel).first();
    if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
      const tagName = await el.evaluate(e => e.tagName.toLowerCase());
      const href = await el.getAttribute('href').catch(() => null);
      console.log(`  Found: <${tagName}> href=${href} — clicking...`);
      await el.click();
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    // Strategy 2: just click the row itself
    console.log('  Fallback: clicking the row directly...');
    await procesadoRow.click();
  }

  // Wait for detail page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Verify we navigated away from the list
  const currentUrl = page.url();
  console.log(`📍 Current URL: ${currentUrl}`);

  // If we're still on the list, try clicking a direct link
  if (currentUrl.endsWith('/facturas') || currentUrl.endsWith('/facturas/')) {
    console.log('  Still on list. Trying to find a direct link...');
    const directLink = page.locator('a[href*="/facturas/c"]').first();
    if (await directLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await directLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      console.log(`📍 Now at: ${page.url()}`);
    }
  }

  // Capture the detail view
  console.log('📸 Capturing detail view...');
  await page.screenshot({
    path: path.join(OUT_DIR, 'factura_detail_view.png'),
    fullPage: false,
    type: 'png',
  });
  console.log(`  ✅ factura_detail_view.png`);

  // Scroll down and capture bottom
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const viewportHeight = 1080;

  if (scrollHeight > viewportHeight + 100) {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(OUT_DIR, 'factura_detail_view_bottom.png'),
      fullPage: false,
      type: 'png',
    });
    console.log(`  ✅ factura_detail_view_bottom.png`);
  } else {
    console.log('  ℹ️  No additional scroll needed');
  }

  // Cleanup debug file
  const fs = await import('fs');
  fs.unlinkSync(path.join(OUT_DIR, '_debug_facturas_list.png'));

  await browser.close();
  console.log('\n✅ Done!');
})();
