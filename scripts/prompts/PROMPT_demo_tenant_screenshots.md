# PROMPT: Crear Tenant Demo + Captura de Screenshots y Videos para Guías de Usuario

## CONTEXTO

Facturo (facturosv.com) es una plataforma de facturación electrónica SaaS multi-tenant para El Salvador. Necesitamos:

1. **Crear un tenant de demostración** con datos realistas poblados
2. **Navegar cada módulo** capturando screenshots de cada paso clave
3. **Grabar video** de cada flujo completo para contenido de redes sociales

La URL de producción es: `https://app.facturosv.com`

## FASE 1: CREAR TENANT DEMO CON DATOS POBLADOS

### 1.1 Crear el tenant

Usar el API o la base de datos directamente para crear un nuevo tenant con estos datos:

```
Nombre empresa: Demo Empresa S.A. de C.V.
NRC: 123456-7
NIT: 0614-010100-101-0
Actividad económica: Venta al por mayor de otros productos
Dirección: Boulevard Los Héroes, San Salvador
Teléfono: 2222-3333
Correo: demo@facturosv.com
Nombre comercial: Demo Empresa
Plan: PROFESIONAL
```

### 1.2 Crear usuario admin del tenant

```
Email: admin@demo-facturo.com
Password: Demo2026!Secure
Nombre: Carlos Administrador
Rol: ADMIN
```

### 1.3 Poblar datos de clientes (mínimo 15 clientes variados)

Crear clientes realistas salvadoreños. Mezcla de personas naturales y jurídicas:

```
1.  Distribuidora ABC S.A. de C.V. — Gran contribuyente — NIT: 0614-050590-001-2
2.  Tech Solutions S.A. — Mediano contribuyente — NIT: 0614-120395-002-3
3.  Comercial López y Asociados — Pequeño contribuyente — NIT: 0614-080888-003-4
4.  Importadora XYZ Ltda. — Gran contribuyente — NIT: 0614-150192-004-5
5.  Farmacia Central — Pequeño contribuyente — NIT: 0614-220790-005-6
6.  Restaurante El Buen Sabor — Micro empresa — NIT: 0614-030585-006-7
7.  Constructora Moderna S.A. — Gran contribuyente — NIT: 0614-110293-007-8
8.  Clínica San Rafael — Mediano contribuyente — NIT: 0614-250696-008-9
9.  María Elena García — Persona natural — DUI: 01234567-8
10. Roberto Martínez Flores — Persona natural — DUI: 02345678-9
11. Librería El Conocimiento — Pequeño contribuyente — NIT: 0614-180494-011-2
12. Panadería Don Juan — Micro empresa — NIT: 0614-070391-012-3
13. Servicios Digitales SV S.A. — Mediano contribuyente — NIT: 0614-290197-013-4
14. Hotel Vista Real — Gran contribuyente — NIT: 0614-040898-014-5
15. Taller Mecánico Express — Pequeño contribuyente — NIT: 0614-160795-015-6
```

Cada cliente debe tener: nombre, NIT/DUI, NRC (si aplica), dirección, teléfono, correo, tipo contribuyente, actividad económica.

### 1.4 Poblar catálogo de productos/servicios (mínimo 20 items)

```
Productos:
1.  Licencia Facturo Plan Básico — $29.99/mes
2.  Licencia Facturo Plan Profesional — $49.99/mes
3.  Licencia Facturo Plan Enterprise — $99.99/mes
4.  Módulo de Contabilidad — $19.99/mes
5.  Módulo Portal B2B — $24.99/mes
6.  Capacitación presencial (por hora) — $75.00
7.  Capacitación virtual (por hora) — $45.00
8.  Soporte técnico premium mensual — $35.00
9.  Implementación inicial — $150.00
10. Migración de datos — $200.00
11. Certificado de firma electrónica — $50.00
12. Consultoría tributaria (por hora) — $60.00
13. Personalización de plantillas DTE — $100.00
14. Integración API personalizada — $300.00
15. Backup y recuperación de datos — $25.00/mes
16. Hosting dedicado — $80.00/mes
17. Dominio personalizado — $15.00/año
18. SSL empresarial — $40.00/año
19. Auditoría de cumplimiento DTE — $250.00
20. Pack PYME (Básico + Contabilidad) — $44.99/mes
```

### 1.5 Crear facturas históricas (mínimo 30 facturas de los últimos 3 meses)

Distribuir facturas entre los clientes de forma realista:
- Variedad de montos ($50 a $5,000)
- Mix de tipos: Factura, CCF, Nota de Crédito
- Estados: mayormente procesadas/aceptadas por Hacienda, algunas recientes pendientes
- Repartidas en enero, febrero y marzo 2026
- Incluir líneas de detalle variadas (1-5 productos por factura)

### 1.6 Crear cotizaciones B2B (mínimo 8)

```
- 3 cotizaciones aprobadas
- 2 cotizaciones pendientes de aprobación
- 2 cotizaciones enviadas
- 1 cotización rechazada
```

Variedad de clientes y montos.

### 1.7 Crear facturas recurrentes (mínimo 5)

```
- Licencia Plan Básico → Farmacia Central — mensual — $29.99
- Licencia Plan Profesional → Distribuidora ABC — mensual — $49.99
- Soporte Premium → Tech Solutions — mensual — $35.00
- Pack PYME → Restaurante El Buen Sabor — mensual — $44.99
- Hosting + SSL → Hotel Vista Real — mensual — $120.00
```

### 1.8 Verificar que la contabilidad tenga partidas

Las facturas creadas deben haber generado partidas contables automáticas. Verificar que el módulo de contabilidad muestre datos.

---

## FASE 2: CAPTURA DE SCREENSHOTS Y VIDEO

### Requisitos técnicos

```bash
# Instalar dependencias
npm install playwright
npx playwright install chromium
```

### Script base de Playwright

```javascript
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://app.facturosv.com';
const CREDENTIALS = { email: 'admin@demo-facturo.com', password: 'Demo2026!Secure' };

// Directorios de salida
const SCREENSHOT_DIR = path.join(__dirname, 'captures/screenshots');
const VIDEO_DIR = path.join(__dirname, 'captures/videos');

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(VIDEO_DIR, { recursive: true });

async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', CREDENTIALS.email);
  await page.fill('input[type="password"]', CREDENTIALS.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // esperar que carguen los datos
}

async function screenshot(page, name, folder = '') {
  const dir = folder ? path.join(SCREENSHOT_DIR, folder) : SCREENSHOT_DIR;
  fs.mkdirSync(dir, { recursive: true });
  await page.waitForTimeout(500);
  await page.screenshot({ 
    path: path.join(dir, `${name}.png`), 
    fullPage: false,
    type: 'png'
  });
  console.log(`📸 ${folder}/${name}.png`);
}
```

### 2.1 Flujo: Dashboard (overview general)

```
Capturas necesarias:
1. dashboard_full — Vista completa del dashboard después de login
2. dashboard_stats — Zoom en las 4 tarjetas de stats (facturas, ingresos, clientes, catálogo)
3. dashboard_chart — Zoom en el gráfico de ingresos mensuales
4. dashboard_top_clients — Zoom en la tabla de clientes top
5. dashboard_recent — Zoom en facturas recientes

Video: Grabar login → dashboard cargando → scroll por las secciones (15-20 segundos)
```

### 2.2 Flujo: Crear Factura (paso a paso)

```
Capturas necesarias:
1. facturas_list — Lista de facturas existentes
2. factura_nueva_btn — Botón "Nueva Factura" visible
3. factura_form_empty — Formulario vacío de nueva factura
4. factura_cliente_select — Seleccionando un cliente del dropdown
5. factura_items_added — Formulario con 2-3 líneas de productos agregados
6. factura_totals — Sección de totales (subtotal, IVA, total)
7. factura_preview — Preview/vista previa de la factura antes de enviar
8. factura_success — Confirmación de factura creada/transmitida
9. factura_detail — Vista de detalle de la factura generada
10. factura_pdf — Representación gráfica/PDF del DTE

Video: Flujo completo de crear una factura desde cero (30-45 segundos)
```

### 2.3 Flujo: Crear CCF

```
Capturas similares al flujo de factura pero seleccionando tipo CCF.
Mostrar las diferencias con factura normal.

1. ccf_tipo_select — Seleccionando tipo "Comprobante de Crédito Fiscal"
2. ccf_form_filled — Formulario completado (notar campos diferentes)
3. ccf_success — CCF generado exitosamente
4. ccf_detail — Vista de detalle del CCF

Video: Flujo completo (20-30 segundos)
```

### 2.4 Flujo: Cotizaciones B2B (crear + aprobar)

```
Capturas necesarias:
1. quotes_list — Lista de cotizaciones con diferentes estados
2. quote_new_form — Formulario de nueva cotización
3. quote_items — Cotización con productos agregados
4. quote_send — Enviando cotización al cliente
5. quote_sent_status — Cotización en estado "Enviada"
6. quote_approval_portal — Portal B2B desde perspectiva del cliente (si es accesible)
7. quote_approved — Cotización aprobada
8. quote_to_invoice — Convirtiendo cotización aprobada a factura

Video: Crear cotización → enviar → ver estado → aprobar → convertir a factura (30-45 segundos)
```

### 2.5 Flujo: Contabilidad (ver partidas)

```
Capturas necesarias:
1. accounting_dashboard — Vista principal de contabilidad
2. accounting_journal — Libro diario con partidas
3. accounting_entry_detail — Detalle de una partida contable (generada desde DTE)
4. accounting_ledger — Libro mayor
5. accounting_accounts — Catálogo de cuentas

Video: Navegar contabilidad → ver partidas → detalle de una partida (15-20 segundos)
```

### 2.6 Flujo: Clientes (crear + gestionar)

```
Capturas necesarias:
1. clients_list — Lista de clientes con búsqueda
2. client_new_form — Formulario de nuevo cliente
3. client_form_filled — Formulario completado
4. client_created — Cliente creado exitosamente
5. client_detail — Perfil/detalle de un cliente con su historial

Video: Navegar a clientes → crear nuevo → llenar datos → guardar → ver detalle (20-30 segundos)
```

### 2.7 Flujo: Facturas Recurrentes

```
Capturas necesarias:
1. recurring_list — Lista de facturas recurrentes activas
2. recurring_new_form — Formulario de nueva factura recurrente
3. recurring_config — Configuración de frecuencia (mensual, semanal, etc.)
4. recurring_created — Factura recurrente creada
5. recurring_detail — Detalle mostrando próxima ejecución

Video: Ver lista → crear nueva → configurar frecuencia → guardar (20-30 segundos)
```

---

## CONFIGURACIÓN DE VIDEO

Para cada flujo, grabar video usando Playwright:

```javascript
const context = await browser.newContext({
  recordVideo: {
    dir: VIDEO_DIR,
    size: { width: 1920, height: 1080 }
  },
  viewport: { width: 1920, height: 1080 }
});
```

### Importante para los videos:
- Viewport: 1920x1080 (Full HD)
- Agregar `waitForTimeout(1500)` entre cada acción para que el viewer pueda seguir
- Movimientos graduales: no hacer todo instantáneo
- Esperar a que las animaciones/transiciones terminen antes de la siguiente acción
- Cada video debe tener un nombre descriptivo: `flow_dashboard.webm`, `flow_crear_factura.webm`, etc.

---

## ESTRUCTURA DE ARCHIVOS DE SALIDA

```
~/facturador-electronico-sv/captures/
├── screenshots/
│   ├── 01_dashboard/
│   │   ├── dashboard_full.png
│   │   ├── dashboard_stats.png
│   │   ├── dashboard_chart.png
│   │   ├── dashboard_top_clients.png
│   │   └── dashboard_recent.png
│   ├── 02_factura/
│   │   ├── facturas_list.png
│   │   ├── factura_nueva_btn.png
│   │   ├── factura_form_empty.png
│   │   ├── ... (10 screenshots)
│   ├── 03_ccf/
│   │   ├── ccf_tipo_select.png
│   │   ├── ... (4 screenshots)
│   ├── 04_cotizaciones/
│   │   ├── quotes_list.png
│   │   ├── ... (8 screenshots)
│   ├── 05_contabilidad/
│   │   ├── accounting_dashboard.png
│   │   ├── ... (5 screenshots)
│   ├── 06_clientes/
│   │   ├── clients_list.png
│   │   ├── ... (5 screenshots)
│   └── 07_recurrentes/
│       ├── recurring_list.png
│       └── ... (5 screenshots)
├── videos/
│   ├── flow_01_dashboard.webm
│   ├── flow_02_crear_factura.webm
│   ├── flow_03_crear_ccf.webm
│   ├── flow_04_cotizaciones.webm
│   ├── flow_05_contabilidad.webm
│   ├── flow_06_clientes.webm
│   └── flow_07_recurrentes.webm
└── inventory.json  ← índice de todos los archivos generados con metadata
```

---

## NOTAS IMPORTANTES

1. **No cambiar ningún ícono** del sistema — capturar tal como está
2. **Usar datos realistas** — nombres salvadoreños, NITs con formato correcto, montos en USD
3. **Viewport para screenshots**: 1920x1080 para capturas full, pero también hacer crops de zonas específicas a 1080x1080 para redes sociales
4. **Si algún módulo no está accesible o da error**, capturar screenshot del error y seguir con el siguiente flujo
5. **El tenant demo no debe interferir** con tenants reales — verificar aislamiento
6. **Generar un inventory.json** al final con la lista de todos los archivos generados, su flujo, descripción y dimensiones

---

## SELF-REVIEW CHECKLIST

Antes de considerar la tarea completa, verificar:

- [ ] Tenant demo creado con todos los datos (15+ clientes, 20+ productos, 30+ facturas, 8+ cotizaciones, 5+ recurrentes)
- [ ] Screenshots de los 7 flujos capturados (mínimo 42 screenshots)
- [ ] Videos de los 7 flujos grabados (7 archivos .webm)
- [ ] Todos los archivos organizados en la estructura de carpetas definida
- [ ] inventory.json generado con metadata de cada archivo
- [ ] No se modificó ningún ícono existente en el sistema
- [ ] Los datos del tenant demo son realistas y en español
- [ ] Las facturas tienen partidas contables generadas automáticamente
