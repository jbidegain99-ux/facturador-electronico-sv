/**
 * Playwright script to capture screenshots and videos of all Facturo flows.
 *
 * Usage: npx playwright test scripts/capture-demo.ts --project=chromium
 *   or:  npx ts-node scripts/capture-demo.ts   (standalone runner below)
 *
 * Outputs:
 *   captures/screenshots/01_dashboard/  ... 07_recurrentes/
 *   captures/videos/flow_01_dashboard.webm  ... flow_07_recurrentes.webm
 *   captures/inventory.json
 */

import { chromium, type Page, type Browser, type BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// ─── Config ─────────────────────────────────────────────────────────────────

const BASE_URL = 'https://app.facturosv.com';
const CREDENTIALS = { email: 'admin@demo-facturo.com', password: 'Demo2026!Secure' };
const ROOT = path.resolve(__dirname, '..', 'captures');
const SCREENSHOT_DIR = path.join(ROOT, 'screenshots');
const VIDEO_DIR = path.join(ROOT, 'videos');
const VIEWPORT = { width: 1920, height: 1080 };
const PAUSE = 1500; // ms between actions for video clarity
const SHORT_PAUSE = 800;

// Inventory of all captured files
interface InventoryEntry {
  file: string;
  flow: string;
  type: 'screenshot' | 'video';
  description: string;
  width?: number;
  height?: number;
}
const inventory: InventoryEntry[] = [];

// ─── Helpers ────────────────────────────────────────────────────────────────

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

async function screenshot(page: Page, name: string, folder: string, description: string) {
  const dir = path.join(SCREENSHOT_DIR, folder);
  ensureDir(dir);
  await page.waitForTimeout(SHORT_PAUSE);
  const filePath = path.join(dir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false, type: 'png' });
  const rel = path.relative(ROOT, filePath);
  inventory.push({ file: rel, flow: folder, type: 'screenshot', description, width: VIEWPORT.width, height: VIEWPORT.height });
  console.log(`  📸 ${rel}`);
}

async function screenshotElement(page: Page, selector: string, name: string, folder: string, description: string) {
  const dir = path.join(SCREENSHOT_DIR, folder);
  ensureDir(dir);
  await page.waitForTimeout(SHORT_PAUSE);
  try {
    const el = page.locator(selector).first();
    await el.waitFor({ state: 'visible', timeout: 5000 });
    const filePath = path.join(dir, `${name}.png`);
    await el.screenshot({ path: filePath, type: 'png' });
    const rel = path.relative(ROOT, filePath);
    inventory.push({ file: rel, flow: folder, type: 'screenshot', description });
    console.log(`  📸 ${rel}`);
  } catch {
    console.log(`  ⚠️  Could not capture element "${selector}" for ${name}`);
    // Fallback to full page
    await screenshot(page, name, folder, description + ' (fallback full page)');
  }
}

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"], input[name="email"]', CREDENTIALS.email);
  await page.waitForTimeout(500);
  await page.fill('input[type="password"], input[name="password"]', CREDENTIALS.password);
  await page.waitForTimeout(500);
  await page.click('button[type="submit"]');
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => {
    // Some apps redirect differently
    console.log('  ℹ️  Dashboard URL not matched, waiting for navigation...');
  });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // Let data load
}

async function safeNavigate(page: Page, url: string, waitMs = 3000) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {
    console.log(`  ⚠️  Navigation to ${url} timed out, continuing...`);
  });
  await page.waitForTimeout(waitMs);
}

async function createVideoContext(browser: Browser, flowName: string): Promise<BrowserContext> {
  ensureDir(VIDEO_DIR);
  const context = await browser.newContext({
    recordVideo: {
      dir: VIDEO_DIR,
      size: VIEWPORT,
    },
    viewport: VIEWPORT,
  });
  return context;
}

async function saveVideo(context: BrowserContext, page: Page, flowName: string) {
  await page.close();
  await context.close();
  // Rename the video file
  const files = fs.readdirSync(VIDEO_DIR).filter(f => f.endsWith('.webm'));
  // The most recently created file is our video
  if (files.length > 0) {
    const sorted = files
      .map(f => ({ name: f, time: fs.statSync(path.join(VIDEO_DIR, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time);
    const latest = sorted[0];
    const targetName = `${flowName}.webm`;
    const targetPath = path.join(VIDEO_DIR, targetName);
    // Don't overwrite existing
    if (!fs.existsSync(targetPath)) {
      fs.renameSync(path.join(VIDEO_DIR, latest.name), targetPath);
    }
    const rel = path.relative(ROOT, targetPath);
    inventory.push({ file: rel, flow: flowName, type: 'video', description: `Video del flujo ${flowName}` });
    console.log(`  🎬 ${rel}`);
  }
}

// ─── Flow Captures ──────────────────────────────────────────────────────────

async function flow01Dashboard(browser: Browser) {
  console.log('\n🔷 Flow 01: Dashboard');
  const folder = '01_dashboard';

  // Video context
  const ctx = await createVideoContext(browser, 'flow_01_dashboard');
  const page = await ctx.newPage();

  await login(page);
  await screenshot(page, 'dashboard_full', folder, 'Vista completa del dashboard después de login');

  // Try to capture specific sections
  await screenshotElement(page, '[class*="grid"] >> nth=0', 'dashboard_stats', folder, 'Tarjetas de estadísticas del dashboard');
  await screenshotElement(page, 'canvas, [class*="chart"], [class*="recharts"]', 'dashboard_chart', folder, 'Gráfico de ingresos mensuales');

  // Scroll down for more content
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(PAUSE);
  await screenshot(page, 'dashboard_middle', folder, 'Sección media del dashboard');

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(PAUSE);
  await screenshot(page, 'dashboard_bottom', folder, 'Sección inferior del dashboard');

  // Scroll back up for video
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(PAUSE);

  await saveVideo(ctx, page, 'flow_01_dashboard');
}

async function flow02Factura(browser: Browser) {
  console.log('\n🔷 Flow 02: Crear Factura');
  const folder = '02_factura';

  const ctx = await createVideoContext(browser, 'flow_02_crear_factura');
  const page = await ctx.newPage();

  await login(page);

  // Navigate to invoices list
  await safeNavigate(page, `${BASE_URL}/facturas`);
  await screenshot(page, 'facturas_list', folder, 'Lista de facturas existentes');

  // Click new invoice button
  await safeNavigate(page, `${BASE_URL}/facturas/nueva`);
  await page.waitForTimeout(PAUSE);
  await screenshot(page, 'factura_form_empty', folder, 'Formulario vacío de nueva factura');

  // Try to select invoice type (Factura)
  try {
    // Look for tipo DTE selector
    const tipoSelect = page.locator('select, [role="combobox"], [class*="select"]').first();
    if (await tipoSelect.isVisible()) {
      await page.waitForTimeout(SHORT_PAUSE);
    }
  } catch { /* continue */ }

  // Try to select a client
  try {
    const clientInput = page.locator('[class*="client"], [class*="cliente"], [placeholder*="client"], [placeholder*="Cliente"], input[name*="client"]').first();
    if (await clientInput.isVisible({ timeout: 3000 })) {
      await clientInput.click();
      await page.waitForTimeout(PAUSE);
      await screenshot(page, 'factura_cliente_select', folder, 'Seleccionando un cliente del dropdown');

      // Try to pick first option
      const option = page.locator('[role="option"], [class*="option"], li[class*="item"]').first();
      if (await option.isVisible({ timeout: 3000 })) {
        await option.click();
        await page.waitForTimeout(PAUSE);
      }
    }
  } catch {
    console.log('  ⚠️  Could not interact with client selector');
  }

  await screenshot(page, 'factura_form_progress', folder, 'Formulario con datos parciales');

  // Scroll to see totals
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(PAUSE);
  await screenshot(page, 'factura_form_bottom', folder, 'Parte inferior del formulario de factura');

  await saveVideo(ctx, page, 'flow_02_crear_factura');

  // Extra: capture an existing invoice detail
  const ctx2 = await createVideoContext(browser, 'flow_02b_factura_detalle');
  const page2 = await ctx2.newPage();
  await login(page2);
  await safeNavigate(page2, `${BASE_URL}/facturas`);
  await page2.waitForTimeout(2000);

  // Click on first invoice in the list
  try {
    const firstRow = page2.locator('table tbody tr, [class*="invoice-row"], a[href*="/facturas/"]').first();
    if (await firstRow.isVisible({ timeout: 5000 })) {
      await firstRow.click();
      await page2.waitForTimeout(3000);
      await screenshot(page2, 'factura_detail', folder, 'Vista de detalle de una factura existente');
    }
  } catch {
    console.log('  ⚠️  Could not click on invoice row');
  }

  await saveVideo(ctx2, page2, 'flow_02b_factura_detalle');
}

async function flow03CCF(browser: Browser) {
  console.log('\n🔷 Flow 03: Crear CCF');
  const folder = '03_ccf';

  const ctx = await createVideoContext(browser, 'flow_03_crear_ccf');
  const page = await ctx.newPage();

  await login(page);

  // Navigate to new invoice
  await safeNavigate(page, `${BASE_URL}/facturas/nueva`);
  await page.waitForTimeout(PAUSE);

  // Try to select CCF type
  try {
    // Look for tipo DTE selector and change to CCF (03)
    const selects = page.locator('select, [role="combobox"]');
    const count = await selects.count();
    for (let i = 0; i < count; i++) {
      const text = await selects.nth(i).textContent().catch(() => '');
      if (text && (text.includes('Factura') || text.includes('DTE') || text.includes('tipo'))) {
        await selects.nth(i).click();
        await page.waitForTimeout(SHORT_PAUSE);
        break;
      }
    }
    await screenshot(page, 'ccf_tipo_select', folder, 'Seleccionando tipo CCF');
  } catch {
    await screenshot(page, 'ccf_form', folder, 'Formulario de nuevo CCF');
  }

  await screenshot(page, 'ccf_form_empty', folder, 'Formulario vacío para CCF');

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(PAUSE);
  await screenshot(page, 'ccf_form_bottom', folder, 'Parte inferior del formulario CCF');

  await saveVideo(ctx, page, 'flow_03_crear_ccf');
}

async function flow04Cotizaciones(browser: Browser) {
  console.log('\n🔷 Flow 04: Cotizaciones');
  const folder = '04_cotizaciones';

  const ctx = await createVideoContext(browser, 'flow_04_cotizaciones');
  const page = await ctx.newPage();

  await login(page);

  // Quotes list
  await safeNavigate(page, `${BASE_URL}/cotizaciones`);
  await screenshot(page, 'quotes_list', folder, 'Lista de cotizaciones con diferentes estados');

  // Scroll to see all quotes
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(PAUSE);
  await screenshot(page, 'quotes_list_scroll', folder, 'Lista de cotizaciones (continuación)');

  // Navigate to new quote
  await safeNavigate(page, `${BASE_URL}/cotizaciones/nueva`);
  await screenshot(page, 'quote_new_form', folder, 'Formulario de nueva cotización');

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(PAUSE);
  await screenshot(page, 'quote_new_form_bottom', folder, 'Parte inferior del formulario de cotización');

  // Go back and click on an existing quote
  await safeNavigate(page, `${BASE_URL}/cotizaciones`);
  await page.waitForTimeout(2000);
  try {
    const firstQuote = page.locator('table tbody tr, a[href*="/cotizaciones/"]').first();
    if (await firstQuote.isVisible({ timeout: 5000 })) {
      await firstQuote.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'quote_detail', folder, 'Detalle de una cotización');

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(PAUSE);
      await screenshot(page, 'quote_detail_bottom', folder, 'Detalle de cotización (parte inferior)');
    }
  } catch {
    console.log('  ⚠️  Could not click on quote row');
  }

  await saveVideo(ctx, page, 'flow_04_cotizaciones');
}

async function flow05Contabilidad(browser: Browser) {
  console.log('\n🔷 Flow 05: Contabilidad');
  const folder = '05_contabilidad';

  const ctx = await createVideoContext(browser, 'flow_05_contabilidad');
  const page = await ctx.newPage();

  await login(page);

  // Accounting dashboard
  await safeNavigate(page, `${BASE_URL}/contabilidad`);
  await screenshot(page, 'accounting_dashboard', folder, 'Vista principal de contabilidad');

  // Journal entries (libro diario)
  await safeNavigate(page, `${BASE_URL}/contabilidad/libro-diario`);
  await screenshot(page, 'accounting_journal', folder, 'Libro diario con partidas');

  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(PAUSE);
  await screenshot(page, 'accounting_journal_scroll', folder, 'Libro diario (continuación)');

  // Try to click on a journal entry
  try {
    const firstEntry = page.locator('table tbody tr, [class*="entry-row"]').first();
    if (await firstEntry.isVisible({ timeout: 5000 })) {
      await firstEntry.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'accounting_entry_detail', folder, 'Detalle de una partida contable');
    }
  } catch {
    console.log('  ⚠️  Could not click on journal entry');
  }

  // Libro mayor
  await safeNavigate(page, `${BASE_URL}/contabilidad/libro-mayor`);
  await screenshot(page, 'accounting_ledger', folder, 'Libro mayor');

  // Cuentas
  await safeNavigate(page, `${BASE_URL}/contabilidad/cuentas`);
  await screenshot(page, 'accounting_accounts', folder, 'Catálogo de cuentas');

  // Balance
  await safeNavigate(page, `${BASE_URL}/contabilidad/balance`);
  await screenshot(page, 'accounting_balance', folder, 'Balance general');

  // Resultados
  await safeNavigate(page, `${BASE_URL}/contabilidad/resultados`);
  await screenshot(page, 'accounting_results', folder, 'Estado de resultados');

  await saveVideo(ctx, page, 'flow_05_contabilidad');
}

async function flow06Clientes(browser: Browser) {
  console.log('\n🔷 Flow 06: Clientes');
  const folder = '06_clientes';

  const ctx = await createVideoContext(browser, 'flow_06_clientes');
  const page = await ctx.newPage();

  await login(page);

  // Clients list
  await safeNavigate(page, `${BASE_URL}/clientes`);
  await screenshot(page, 'clients_list', folder, 'Lista de clientes');

  // Scroll to see more clients
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(PAUSE);
  await screenshot(page, 'clients_list_scroll', folder, 'Lista de clientes (continuación)');

  // Try search
  try {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="buscar"]').first();
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('Distribuidora');
      await page.waitForTimeout(PAUSE);
      await screenshot(page, 'clients_search', folder, 'Búsqueda de clientes');
      await searchInput.clear();
      await page.waitForTimeout(SHORT_PAUSE);
    }
  } catch {
    console.log('  ⚠️  Search input not found');
  }

  // Try to click on a client to see details
  try {
    const firstClient = page.locator('table tbody tr, a[href*="/clientes/"]').first();
    if (await firstClient.isVisible({ timeout: 5000 })) {
      await firstClient.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'client_detail', folder, 'Detalle de un cliente');
    }
  } catch {
    console.log('  ⚠️  Could not click on client row');
  }

  await saveVideo(ctx, page, 'flow_06_clientes');
}

async function flow07Recurrentes(browser: Browser) {
  console.log('\n🔷 Flow 07: Facturas Recurrentes');
  const folder = '07_recurrentes';

  const ctx = await createVideoContext(browser, 'flow_07_recurrentes');
  const page = await ctx.newPage();

  await login(page);

  // Recurring invoices list
  await safeNavigate(page, `${BASE_URL}/facturas/recurrentes`);
  await screenshot(page, 'recurring_list', folder, 'Lista de facturas recurrentes activas');

  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(PAUSE);
  await screenshot(page, 'recurring_list_scroll', folder, 'Lista de recurrentes (continuación)');

  // Try to click on a recurring template
  try {
    const firstTemplate = page.locator('table tbody tr, [class*="template"], [class*="recurring"]').first();
    if (await firstTemplate.isVisible({ timeout: 5000 })) {
      await firstTemplate.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'recurring_detail', folder, 'Detalle de factura recurrente');
    }
  } catch {
    console.log('  ⚠️  Could not click on recurring template');
  }

  await saveVideo(ctx, page, 'flow_07_recurrentes');
}

// ─── Extra flows ────────────────────────────────────────────────────────────

async function flowExtraCatalogo(browser: Browser) {
  console.log('\n🔷 Flow Extra: Catálogo');
  const folder = '08_catalogo';

  const ctx = await createVideoContext(browser, 'flow_08_catalogo');
  const page = await ctx.newPage();

  await login(page);

  await safeNavigate(page, `${BASE_URL}/catalogo`);
  await screenshot(page, 'catalogo_list', folder, 'Catálogo de productos y servicios');

  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(PAUSE);
  await screenshot(page, 'catalogo_list_scroll', folder, 'Catálogo (continuación)');

  await saveVideo(ctx, page, 'flow_08_catalogo');
}

async function flowExtraConfig(browser: Browser) {
  console.log('\n🔷 Flow Extra: Configuración');
  const folder = '09_configuracion';

  const ctx = await createVideoContext(browser, 'flow_09_configuracion');
  const page = await ctx.newPage();

  await login(page);

  await safeNavigate(page, `${BASE_URL}/configuracion`);
  await screenshot(page, 'config_main', folder, 'Página principal de configuración');

  await safeNavigate(page, `${BASE_URL}/configuracion/hacienda`);
  await screenshot(page, 'config_hacienda', folder, 'Configuración de Hacienda');

  await safeNavigate(page, `${BASE_URL}/configuracion/plan`);
  await screenshot(page, 'config_plan', folder, 'Configuración del plan');

  await safeNavigate(page, `${BASE_URL}/perfil`);
  await screenshot(page, 'perfil', folder, 'Perfil del usuario');

  await saveVideo(ctx, page, 'flow_09_configuracion');
}

// ─── Main Runner ────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting Facturo Demo Capture');
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Output: ${ROOT}\n`);

  ensureDir(ROOT);
  ensureDir(SCREENSHOT_DIR);
  ensureDir(VIDEO_DIR);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    await flow01Dashboard(browser);
    await flow02Factura(browser);
    await flow03CCF(browser);
    await flow04Cotizaciones(browser);
    await flow05Contabilidad(browser);
    await flow06Clientes(browser);
    await flow07Recurrentes(browser);
    await flowExtraCatalogo(browser);
    await flowExtraConfig(browser);
  } catch (err) {
    console.error('\n❌ Error during capture:', err);
  } finally {
    await browser.close();
  }

  // Write inventory
  const inventoryPath = path.join(ROOT, 'inventory.json');
  fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
  console.log(`\n📦 Inventory written: ${inventoryPath}`);

  // Summary
  const screenshots = inventory.filter(i => i.type === 'screenshot').length;
  const videos = inventory.filter(i => i.type === 'video').length;
  console.log(`\n═══════════════════════════════════════════`);
  console.log(`✅ Capture completed!`);
  console.log(`   📸 Screenshots: ${screenshots}`);
  console.log(`   🎬 Videos: ${videos}`);
  console.log(`   📁 Output: ${ROOT}`);
  console.log(`═══════════════════════════════════════════\n`);
}

main().catch(console.error);
