# 🧪 Plan de Testing Automatizado - Facturador Electrónico SV
## Sprints 1 (Paginación) + Sprint 2 (Facturación Recurrente)

---

## 📋 Resumen Ejecutivo

**Objetivo**: Implementar suite completa de pruebas automatizadas con cobertura estratégica:
- Integration tests (backend) → 70% cobertura
- E2E tests (frontend crítico) → 30% cobertura
- Ejecutadas en WSL desde CI/CD

**Stack de Testing**:
- **Backend**: Jest + Supertest (viene con NestJS)
- **Frontend**: Playwright (E2E)
- **Database**: SQLite in-memory para tests rápidos
- **CI/CD**: GitHub Actions

**Filosofía**: 
> "Tests rápidos y confiables > Tests exhaustivos pero frágiles"

---

## 🎯 Estrategia de Testing por Sprint

### Sprint 1: Paginación

#### Backend Integration Tests (ALTA prioridad)
```
✅ GET /clientes?page=1&limit=10
✅ GET /clientes?search=juan
✅ GET /clientes?sortBy=nombre&sortOrder=desc
✅ GET /dte?page=2&limit=20&sortBy=fecha
✅ Validar estructura PaginatedResponse<T>
✅ Validar skip/take/count correcto
✅ Validar sortBy whitelist (rechazar campos no permitidos)
```

#### Frontend E2E Tests (MEDIA prioridad)
```
✅ Navegación entre páginas (First/Prev/Next/Last)
✅ Cambiar tamaño de página (10/20/50/100)
✅ Búsqueda en tiempo real
✅ Click en columnas para ordenar
✅ Persistencia de filtros al paginar
```

---

### Sprint 2: Facturación Recurrente

#### Backend Integration Tests (ALTA prioridad)
```
✅ CRUD completo de RecurringInvoiceTemplate
✅ Pause/Resume/Cancel de templates
✅ calculateNextRunDate() con diferentes intervals
✅ getDueTemplates() retorna solo activos vencidos
✅ recordSuccess/recordFailure actualiza consecutiveFailures
✅ Auto-pausa después de 3 fallos consecutivos
✅ Processor genera DTE correctamente
✅ Scheduler encola templates a las 01:00 UTC
```

#### Frontend E2E Tests (CRÍTICO)
```
✅ Crear template completo desde wizard
✅ Editar template existente (inline)
✅ Pausar/reanudar/cancelar desde UI
✅ Ver historial de ejecuciones
✅ Filtrar por estado (tabs)
✅ Validar cálculo de "Próxima factura" correcto
```

---

## 📁 Estructura de Carpetas de Testing

```bash
facturador-electronico-sv/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   ├── test/                           # ← Tests de integración
│   │   │   ├── setup.ts                    # Config global
│   │   │   ├── helpers/
│   │   │   │   ├── test-database.helper.ts # SQLite in-memory
│   │   │   │   └── auth.helper.ts          # Obtener tokens JWT
│   │   │   ├── sprint1/
│   │   │   │   ├── clientes-pagination.spec.ts
│   │   │   │   └── dte-pagination.spec.ts
│   │   │   └── sprint2/
│   │   │       ├── recurring-crud.spec.ts
│   │   │       ├── recurring-logic.spec.ts
│   │   │       ├── processor.spec.ts
│   │   │       └── scheduler.spec.ts
│   │   ├── jest.config.js
│   │   ├── jest-integration.config.js      # Config específica
│   │   └── package.json
│   │
│   └── web/
│       ├── tests/
│       │   ├── e2e/                        # ← Tests E2E con Playwright
│       │   │   ├── fixtures/               # Page Objects
│       │   │   │   ├── auth.fixture.ts
│       │   │   │   ├── clientes.fixture.ts
│       │   │   │   └── recurring.fixture.ts
│       │   │   ├── sprint1/
│       │   │   │   ├── clientes-pagination.spec.ts
│       │   │   │   └── dte-pagination.spec.ts
│       │   │   └── sprint2/
│       │   │       ├── recurring-create.spec.ts
│       │   │       ├── recurring-edit.spec.ts
│       │   │       └── recurring-history.spec.ts
│       │   └── playwright.config.ts
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── api-tests.yml                   # CI para backend
│       └── e2e-tests.yml                   # CI para E2E
│
└── scripts/
    ├── test-all.sh                         # Runner maestro
    ├── test-backend.sh                     # Solo integration
    └── test-e2e.sh                         # Solo E2E
```

---

## 🛠️ Setup Técnico

### 1. Backend - Jest + Supertest

**Configuración SQLite In-Memory**:
```typescript
// apps/api/test/helpers/test-database.helper.ts
import { PrismaClient } from '@prisma/client';

export async function getTestDatabase() {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: 'file:./test.db' } // SQLite temporal
    }
  });
  
  await prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
  
  // Ejecutar migraciones
  await execSync('npx prisma migrate deploy', { 
    env: { DATABASE_URL: 'file:./test.db' }
  });
  
  return prisma;
}

export async function cleanDatabase(prisma: PrismaClient) {
  const tables = await prisma.$queryRaw`
    SELECT name FROM sqlite_master WHERE type='table'
  `;
  
  for (const { name } of tables) {
    if (name !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(`DELETE FROM ${name}`);
    }
  }
}
```

**Helper de Autenticación**:
```typescript
// apps/api/test/helpers/auth.helper.ts
import request from 'supertest';

export async function getAuthToken(app: any) {
  const response = await request(app)
    .post('/auth/login')
    .send({
      email: 'test@example.com',
      password: 'Test123!'
    });
  
  return response.body.accessToken;
}

export async function createTestTenant(prisma: PrismaClient) {
  return prisma.tenant.create({
    data: {
      nit: '0614-TEST-001-0',
      razonSocial: 'Empresa Test SRL',
      // ... otros campos
    }
  });
}
```

---

### 2. Frontend - Playwright

**Page Object Pattern**:
```typescript
// apps/web/tests/e2e/fixtures/recurring.fixture.ts
import { Page, expect } from '@playwright/test';

export class RecurringInvoicePage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/facturas/recurrentes');
    await expect(this.page.locator('h1')).toContainText('Facturas Recurrentes');
  }
  
  async clickNewTemplate() {
    await this.page.getByRole('button', { name: 'Nueva Plantilla' }).click();
    await expect(this.page).toHaveURL(/\/facturas\/recurrentes\/nuevo/);
  }
  
  async fillTemplateForm(data: {
    cliente: string;
    tipoRecurrencia: 'daily' | 'weekly' | 'monthly';
    producto: string;
    cantidad: number;
  }) {
    // Seleccionar cliente
    await this.page.getByLabel('Cliente').click();
    await this.page.getByRole('option', { name: data.cliente }).click();
    
    // Seleccionar tipo de recurrencia
    await this.page.getByLabel('Frecuencia').selectOption(data.tipoRecurrencia);
    
    // Agregar item
    await this.page.getByRole('button', { name: 'Agregar Item' }).click();
    await this.page.getByLabel('Producto').fill(data.producto);
    await this.page.getByLabel('Cantidad').fill(data.cantidad.toString());
  }
  
  async submitTemplate() {
    await this.page.getByRole('button', { name: 'Crear Plantilla' }).click();
    
    // Esperar toast de éxito
    await expect(this.page.getByText(/Plantilla creada exitosamente/)).toBeVisible();
  }
}
```

---

## 📝 Casos de Prueba Detallados

### Sprint 1: Backend Integration Tests

#### `apps/api/test/sprint1/clientes-pagination.spec.ts`
```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getTestDatabase, cleanDatabase } from '../helpers/test-database.helper';
import { getAuthToken, createTestTenant } from '../helpers/auth.helper';

describe('Clientes Pagination (Sprint 1)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let authToken: string;
  let tenantId: string;
  
  beforeAll(async () => {
    prisma = await getTestDatabase();
    
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    
    app = moduleRef.createNestApplication();
    await app.init();
    
    // Setup: Crear tenant y usuario de prueba
    const tenant = await createTestTenant(prisma);
    tenantId = tenant.id;
    authToken = await getAuthToken(app);
  });
  
  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
    await app.close();
  });
  
  beforeEach(async () => {
    // Limpiar solo la tabla clientes
    await prisma.cliente.deleteMany({ where: { tenantId } });
  });
  
  describe('GET /clientes - Paginación básica', () => {
    it('debe retornar 10 clientes por defecto', async () => {
      // Arrange: Crear 25 clientes
      await Promise.all(
        Array.from({ length: 25 }, (_, i) => 
          prisma.cliente.create({
            data: {
              tenantId,
              nombre: `Cliente ${i + 1}`,
              nit: `0614-${String(i + 1).padStart(6, '0')}-001-0`,
              correo: `cliente${i + 1}@test.com`,
            }
          })
        )
      );
      
      // Act
      const response = await request(app.getHttpServer())
        .get('/clientes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Assert
      expect(response.body).toMatchObject({
        data: expect.arrayContaining([]),
        meta: {
          total: 25,
          page: 1,
          limit: 10,
          totalPages: 3
        }
      });
      expect(response.body.data).toHaveLength(10);
    });
    
    it('debe respetar el parámetro limit', async () => {
      await Promise.all(
        Array.from({ length: 15 }, (_, i) => 
          prisma.cliente.create({
            data: {
              tenantId,
              nombre: `Cliente ${i + 1}`,
              nit: `0614-${String(i + 1).padStart(6, '0')}-001-0`,
              correo: `cliente${i + 1}@test.com`,
            }
          })
        )
      );
      
      const response = await request(app.getHttpServer())
        .get('/clientes?limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.data).toHaveLength(5);
      expect(response.body.meta.limit).toBe(5);
    });
    
    it('debe navegar a la página 2 correctamente', async () => {
      // Crear clientes con nombres únicos para verificar
      const clientes = await Promise.all(
        Array.from({ length: 15 }, (_, i) => 
          prisma.cliente.create({
            data: {
              tenantId,
              nombre: `Cliente ${String(i + 1).padStart(2, '0')}`,
              nit: `0614-${String(i + 1).padStart(6, '0')}-001-0`,
              correo: `cliente${i + 1}@test.com`,
            }
          })
        )
      );
      
      const page1 = await request(app.getHttpServer())
        .get('/clientes?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const page2 = await request(app.getHttpServer())
        .get('/clientes?page=2&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(page1.body.data).toHaveLength(10);
      expect(page2.body.data).toHaveLength(5);
      
      // Los IDs no deben repetirse
      const page1Ids = page1.body.data.map(c => c.id);
      const page2Ids = page2.body.data.map(c => c.id);
      expect(page1Ids).not.toEqual(expect.arrayContaining(page2Ids));
    });
  });
  
  describe('GET /clientes - Búsqueda', () => {
    beforeEach(async () => {
      await Promise.all([
        prisma.cliente.create({
          data: {
            tenantId,
            nombre: 'Juan Pérez',
            nit: '0614-000001-001-0',
            correo: 'juan@test.com',
          }
        }),
        prisma.cliente.create({
          data: {
            tenantId,
            nombre: 'María García',
            nit: '0614-000002-001-0',
            correo: 'maria@test.com',
          }
        }),
        prisma.cliente.create({
          data: {
            tenantId,
            nombre: 'Pedro Martínez',
            nit: '0614-000003-001-0',
            correo: 'pedro@test.com',
          }
        }),
      ]);
    });
    
    it('debe buscar por nombre (case-insensitive)', async () => {
      const response = await request(app.getHttpServer())
        .get('/clientes?search=juan')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].nombre).toBe('Juan Pérez');
    });
    
    it('debe buscar por fragmento de nombre', async () => {
      const response = await request(app.getHttpServer())
        .get('/clientes?search=mar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map(c => c.nombre)).toEqual(
        expect.arrayContaining(['María García', 'Pedro Martínez'])
      );
    });
    
    it('debe buscar por NIT', async () => {
      const response = await request(app.getHttpServer())
        .get('/clientes?search=0614-000002')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].nombre).toBe('María García');
    });
  });
  
  describe('GET /clientes - Ordenamiento', () => {
    beforeEach(async () => {
      await Promise.all([
        prisma.cliente.create({
          data: {
            tenantId,
            nombre: 'Carlos',
            nit: '0614-000003-001-0',
            correo: 'c@test.com',
          }
        }),
        prisma.cliente.create({
          data: {
            tenantId,
            nombre: 'Ana',
            nit: '0614-000001-001-0',
            correo: 'a@test.com',
          }
        }),
        prisma.cliente.create({
          data: {
            tenantId,
            nombre: 'Beatriz',
            nit: '0614-000002-001-0',
            correo: 'b@test.com',
          }
        }),
      ]);
    });
    
    it('debe ordenar por nombre ASC', async () => {
      const response = await request(app.getHttpServer())
        .get('/clientes?sortBy=nombre&sortOrder=asc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.data.map(c => c.nombre)).toEqual([
        'Ana',
        'Beatriz',
        'Carlos'
      ]);
    });
    
    it('debe ordenar por nombre DESC', async () => {
      const response = await request(app.getHttpServer())
        .get('/clientes?sortBy=nombre&sortOrder=desc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.data.map(c => c.nombre)).toEqual([
        'Carlos',
        'Beatriz',
        'Ana'
      ]);
    });
    
    it('debe rechazar campos no permitidos en sortBy', async () => {
      await request(app.getHttpServer())
        .get('/clientes?sortBy=password&sortOrder=asc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });
  
  describe('GET /clientes - Combinaciones', () => {
    beforeEach(async () => {
      await Promise.all(
        Array.from({ length: 30 }, (_, i) => 
          prisma.cliente.create({
            data: {
              tenantId,
              nombre: i < 10 ? `Ana ${i}` : `Beatriz ${i}`,
              nit: `0614-${String(i + 1).padStart(6, '0')}-001-0`,
              correo: `cliente${i + 1}@test.com`,
            }
          })
        )
      );
    });
    
    it('debe combinar búsqueda + ordenamiento + paginación', async () => {
      const response = await request(app.getHttpServer())
        .get('/clientes?search=beatriz&sortBy=nombre&sortOrder=desc&page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.data).toHaveLength(5);
      expect(response.body.meta.total).toBe(20); // 20 Beatriz
      expect(response.body.data[0].nombre).toMatch(/^Beatriz/);
      
      // Verificar que está ordenado DESC
      const nombres = response.body.data.map(c => c.nombre);
      const nombresOrdenados = [...nombres].sort().reverse();
      expect(nombres).toEqual(nombresOrdenados);
    });
  });
});
```

---

### Sprint 2: Backend Integration Tests

#### `apps/api/test/sprint2/recurring-crud.spec.ts`
```typescript
describe('RecurringInvoiceTemplates CRUD (Sprint 2)', () => {
  // ... setup similar al anterior
  
  describe('POST /recurring-invoices - Crear template', () => {
    it('debe crear template mensual correctamente', async () => {
      const cliente = await prisma.cliente.create({
        data: {
          tenantId,
          nombre: 'Cliente Recurrente',
          nit: '0614-000001-001-0',
          correo: 'cliente@test.com',
        }
      });
      
      const templateData = {
        clienteId: cliente.id,
        interval: 'monthly',
        anchorDay: 15,
        mode: 'generate_only',
        items: [
          {
            descripcion: 'Servicio Mensual',
            cantidad: 1,
            precioUnitario: 100.00
          }
        ]
      };
      
      const response = await request(app.getHttpServer())
        .post('/recurring-invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData)
        .expect(201);
      
      expect(response.body).toMatchObject({
        id: expect.any(String),
        clienteId: cliente.id,
        interval: 'monthly',
        anchorDay: 15,
        status: 'active',
        nextRunDate: expect.any(String),
      });
      
      // Verificar que nextRunDate es día 15 del próximo mes
      const nextRun = new Date(response.body.nextRunDate);
      expect(nextRun.getDate()).toBe(15);
    });
    
    it('debe rechazar anchorDay inválido para mensual', async () => {
      await request(app.getHttpServer())
        .post('/recurring-invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clienteId: 'some-id',
          interval: 'monthly',
          anchorDay: 32, // ❌ Inválido
          items: []
        })
        .expect(400);
    });
  });
  
  describe('PATCH /recurring-invoices/:id/pause - Pausar template', () => {
    it('debe pausar template activo', async () => {
      const template = await createTestTemplate(prisma, tenantId);
      
      const response = await request(app.getHttpServer())
        .patch(`/recurring-invoices/${template.id}/pause`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.status).toBe('paused');
      
      // Verificar en DB
      const updated = await prisma.recurringInvoiceTemplate.findUnique({
        where: { id: template.id }
      });
      expect(updated.status).toBe('paused');
    });
  });
  
  // ... más tests de resume, cancel, etc.
});
```

---

#### `apps/api/test/sprint2/recurring-logic.spec.ts`
```typescript
describe('RecurringInvoices Business Logic (Sprint 2)', () => {
  describe('calculateNextRunDate()', () => {
    it('debe calcular próxima fecha para DAILY', () => {
      const service = new RecurringInvoicesService(prisma);
      
      const today = new Date('2024-01-15T10:00:00Z');
      const nextRun = service.calculateNextRunDate({
        interval: 'daily',
        lastRunDate: today
      });
      
      expect(nextRun).toEqual(new Date('2024-01-16T01:00:00Z'));
    });
    
    it('debe calcular próxima fecha para MONTHLY con anchorDay', () => {
      const service = new RecurringInvoicesService(prisma);
      
      const lastRun = new Date('2024-01-15T10:00:00Z');
      const nextRun = service.calculateNextRunDate({
        interval: 'monthly',
        anchorDay: 20,
        lastRunDate: lastRun
      });
      
      // Próximo día 20
      expect(nextRun.getDate()).toBe(20);
      expect(nextRun.getMonth()).toBe(0); // Enero (mismo mes)
      
      // Pero si ya pasó el día 20, debe ser mes siguiente
      const lastRunAfter20 = new Date('2024-01-25T10:00:00Z');
      const nextRunNextMonth = service.calculateNextRunDate({
        interval: 'monthly',
        anchorDay: 20,
        lastRunDate: lastRunAfter20
      });
      
      expect(nextRunNextMonth.getDate()).toBe(20);
      expect(nextRunNextMonth.getMonth()).toBe(1); // Febrero
    });
    
    it('debe manejar WEEKLY con dayOfWeek', () => {
      const service = new RecurringInvoicesService(prisma);
      
      // Última ejecución fue un lunes
      const lastRun = new Date('2024-01-15T10:00:00Z'); // Lunes
      
      const nextRun = service.calculateNextRunDate({
        interval: 'weekly',
        dayOfWeek: 1, // Próximo lunes
        lastRunDate: lastRun
      });
      
      expect(nextRun.getDay()).toBe(1); // Lunes
      expect(nextRun.getDate()).toBe(22); // 7 días después
    });
  });
  
  describe('getDueTemplates()', () => {
    it('debe retornar solo templates activos vencidos', async () => {
      const service = new RecurringInvoicesService(prisma);
      
      // Crear 3 templates:
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await Promise.all([
        // 1. Activo y vencido ✅
        prisma.recurringInvoiceTemplate.create({
          data: {
            tenantId,
            clienteId: 'client-1',
            interval: 'monthly',
            status: 'active',
            nextRunDate: yesterday,
            items: []
          }
        }),
        // 2. Activo pero no vencido ❌
        prisma.recurringInvoiceTemplate.create({
          data: {
            tenantId,
            clienteId: 'client-2',
            interval: 'monthly',
            status: 'active',
            nextRunDate: tomorrow,
            items: []
          }
        }),
        // 3. Pausado ❌
        prisma.recurringInvoiceTemplate.create({
          data: {
            tenantId,
            clienteId: 'client-3',
            interval: 'monthly',
            status: 'paused',
            nextRunDate: yesterday,
            items: []
          }
        }),
      ]);
      
      const due = await service.getDueTemplates();
      
      expect(due).toHaveLength(1);
      expect(due[0].status).toBe('active');
      expect(due[0].nextRunDate).toBeLessThan(new Date());
    });
  });
  
  describe('recordFailure() - Auto-pause', () => {
    it('debe pausar template después de 3 fallos consecutivos', async () => {
      const template = await createTestTemplate(prisma, tenantId);
      const service = new RecurringInvoicesService(prisma);
      
      // Primer fallo
      await service.recordFailure(template.id, 'Error de prueba 1');
      let updated = await prisma.recurringInvoiceTemplate.findUnique({
        where: { id: template.id }
      });
      expect(updated.consecutiveFailures).toBe(1);
      expect(updated.status).toBe('active'); // Sigue activo
      
      // Segundo fallo
      await service.recordFailure(template.id, 'Error de prueba 2');
      updated = await prisma.recurringInvoiceTemplate.findUnique({
        where: { id: template.id }
      });
      expect(updated.consecutiveFailures).toBe(2);
      expect(updated.status).toBe('active'); // Sigue activo
      
      // Tercer fallo → auto-pause
      await service.recordFailure(template.id, 'Error de prueba 3');
      updated = await prisma.recurringInvoiceTemplate.findUnique({
        where: { id: template.id }
      });
      expect(updated.consecutiveFailures).toBe(3);
      expect(updated.status).toBe('paused'); // ✅ Auto-pausado
    });
    
    it('debe resetear consecutiveFailures al tener éxito', async () => {
      const template = await createTestTemplate(prisma, tenantId);
      const service = new RecurringInvoicesService(prisma);
      
      // 2 fallos
      await service.recordFailure(template.id, 'Fallo 1');
      await service.recordFailure(template.id, 'Fallo 2');
      
      // Éxito
      await service.recordSuccess(template.id, 'dte-id-123');
      
      const updated = await prisma.recurringInvoiceTemplate.findUnique({
        where: { id: template.id }
      });
      expect(updated.consecutiveFailures).toBe(0); // ✅ Reseteado
      expect(updated.status).toBe('active');
    });
  });
});
```

---

### Sprint 2: E2E Tests con Playwright

#### `apps/web/tests/e2e/sprint2/recurring-create.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { RecurringInvoicePage } from '../fixtures/recurring.fixture';
import { AuthFixture } from '../fixtures/auth.fixture';

test.describe('Crear Template de Factura Recurrente', () => {
  let recurringPage: RecurringInvoicePage;
  let authFixture: AuthFixture;
  
  test.beforeEach(async ({ page }) => {
    authFixture = new AuthFixture(page);
    recurringPage = new RecurringInvoicePage(page);
    
    // Login
    await authFixture.login('admin@test.com', 'Admin123!');
    
    // Ir a página de recurrentes
    await recurringPage.goto();
  });
  
  test('debe crear template mensual completo', async ({ page }) => {
    // Click en "Nueva Plantilla"
    await recurringPage.clickNewTemplate();
    
    // Llenar formulario
    await recurringPage.fillTemplateForm({
      cliente: 'ACME Corporation',
      tipoRecurrencia: 'monthly',
      diaAnclaje: 15,
      modo: 'generate_only',
      producto: 'Servicio de Hosting',
      cantidad: 1,
      precio: 99.99
    });
    
    // Submit
    await recurringPage.submitTemplate();
    
    // Verificar redirección a lista
    await expect(page).toHaveURL(/\/facturas\/recurrentes$/);
    
    // Verificar que aparece en la tabla
    await expect(page.getByText('ACME Corporation')).toBeVisible();
    await expect(page.getByText('Mensual')).toBeVisible();
    await expect(page.getByText('Solo Generar')).toBeVisible();
  });
  
  test('debe calcular "Próxima factura" correctamente', async ({ page }) => {
    await recurringPage.clickNewTemplate();
    
    await recurringPage.fillTemplateForm({
      cliente: 'Test Client',
      tipoRecurrencia: 'monthly',
      diaAnclaje: 20,
      producto: 'Test Product',
      cantidad: 1,
      precio: 50.00
    });
    
    // Verificar que muestra la fecha calculada
    const today = new Date();
    const nextRun = new Date(today.getFullYear(), today.getMonth(), 20);
    if (nextRun <= today) {
      nextRun.setMonth(nextRun.getMonth() + 1);
    }
    
    const expectedDate = nextRun.toLocaleDateString('es-SV', {
      day: 'numeric',
      month: 'long'
    });
    
    await expect(page.getByText(new RegExp(expectedDate))).toBeVisible();
  });
  
  test('debe validar campos requeridos', async ({ page }) => {
    await recurringPage.clickNewTemplate();
    
    // Intentar submit sin llenar
    await page.getByRole('button', { name: 'Crear Plantilla' }).click();
    
    // Verificar errores de validación
    await expect(page.getByText(/Cliente es requerido/)).toBeVisible();
    await expect(page.getByText(/Debe agregar al menos un item/)).toBeVisible();
  });
  
  test('debe permitir múltiples items en la factura', async ({ page }) => {
    await recurringPage.clickNewTemplate();
    
    // Seleccionar cliente
    await page.getByLabel('Cliente').click();
    await page.getByRole('option', { name: 'Test Client' }).click();
    
    // Agregar primer item
    await page.getByRole('button', { name: 'Agregar Item' }).click();
    await page.locator('[name="items.0.descripcion"]').fill('Producto 1');
    await page.locator('[name="items.0.cantidad"]').fill('2');
    await page.locator('[name="items.0.precioUnitario"]').fill('50.00');
    
    // Agregar segundo item
    await page.getByRole('button', { name: 'Agregar Item' }).click();
    await page.locator('[name="items.1.descripcion"]').fill('Producto 2');
    await page.locator('[name="items.1.cantidad"]').fill('1');
    await page.locator('[name="items.1.precioUnitario"]').fill('30.00');
    
    // Verificar total calculado
    await expect(page.getByText('Total: $130.00')).toBeVisible();
  });
});
```

---

## 🚀 Scripts de Ejecución

### `scripts/test-all.sh`
```bash
#!/bin/bash
set -e

echo "🧪 Ejecutando Suite Completa de Tests..."
echo ""

# 1. Backend Integration Tests
echo "📦 [1/2] Tests de Integración Backend..."
cd apps/api
npm run test:integration
echo "✅ Backend tests completados"
echo ""

# 2. Frontend E2E Tests
echo "🌐 [2/2] Tests E2E Frontend..."
cd ../web
npx playwright test
echo "✅ E2E tests completados"
echo ""

echo "🎉 ¡Todos los tests pasaron!"
```

### `scripts/test-backend.sh`
```bash
#!/bin/bash
set -e

cd apps/api

echo "🔧 Preparando ambiente de tests..."

# Crear base de datos temporal
export DATABASE_URL="file:./test.db"

# Ejecutar migraciones
npx prisma migrate deploy --preview-feature

# Ejecutar tests
npm run test:integration -- --coverage

# Limpiar
rm -f test.db test.db-journal

echo "✅ Tests completados"
```

### `scripts/test-e2e.sh`
```bash
#!/bin/bash
set -e

cd apps/web

echo "🌐 Ejecutando tests E2E..."

# Instalar browsers si es necesario
npx playwright install chromium

# Ejecutar con reporte HTML
npx playwright test --reporter=html

# Mostrar reporte
echo ""
echo "📊 Reporte disponible en: apps/web/playwright-report/index.html"
echo "   Ejecuta: npx playwright show-report"
```

---

## 📊 Configuración de Jest para Backend

### `apps/api/jest-integration.config.js`
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 30000,
};
```

### `apps/api/test/setup.ts`
```typescript
import { PrismaClient } from '@prisma/client';

// Setup global antes de todos los tests
beforeAll(async () => {
  console.log('🔧 Configurando ambiente de tests...');
  
  // Verificar que estamos usando SQLite
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl?.includes('file:')) {
    throw new Error('❌ Tests deben usar SQLite! DATABASE_URL debe ser file:./test.db');
  }
});

// Cleanup después de todos los tests
afterAll(async () => {
  console.log('🧹 Limpiando ambiente de tests...');
});

// Aumentar timeout global
jest.setTimeout(30000);
```

---

## 🎨 Configuración de Playwright para E2E

### `apps/web/playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

---

## ⚙️ GitHub Actions CI/CD

### `.github/workflows/api-tests.yml`
```yaml
name: API Integration Tests

on:
  push:
    branches: [main, develop]
    paths:
      - 'apps/api/**'
  pull_request:
    branches: [main, develop]
    paths:
      - 'apps/api/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Prisma generate
        run: npx prisma generate
        working-directory: apps/api
      
      - name: Run integration tests
        run: npm run test:integration -- --coverage
        working-directory: apps/api
        env:
          DATABASE_URL: file:./test.db
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: apps/api/coverage/lcov.info
          flags: backend
```

### `.github/workflows/e2e-tests.yml`
```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
    paths:
      - 'apps/web/**'
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      
      - name: Run E2E tests
        run: npx playwright test
        working-directory: apps/web
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: apps/web/playwright-report/
          retention-days: 30
```

---

## 📈 Métricas de Éxito

### Cobertura de Tests Objetivo

| Métrica | Objetivo | Sprint 1 | Sprint 2 |
|---------|----------|----------|----------|
| Backend LOC | 70% | 80% | 75% |
| Endpoints API | 100% | 100% | 100% |
| Business Logic | 85% | 90% | 85% |
| E2E Crítico | 30% | 60% | 80% |

### Criterios de Calidad

✅ **Todos los tests deben:**
- Ejecutarse en < 5 minutos (total)
- Ser deterministas (0% flakiness)
- Tener nombres descriptivos
- Incluir arrange/act/assert claros
- Limpiar recursos después de ejecutar

✅ **Coverage mínimo requerido:**
- Services: 80%
- Controllers: 70%
- DTOs: No requerido (validación manual)

---

## 🔄 Flujo de Trabajo Completo

### Desarrollo Local (WSL)
```bash
# 1. Crear feature branch
git checkout -b feature/sprint2-recurring-tests

# 2. Escribir tests
cd apps/api/test/sprint2
# Editar recurring-crud.spec.ts

# 3. Ejecutar tests localmente
cd ../..
npm run test:integration -- recurring-crud.spec.ts

# 4. Ver cobertura
npm run test:integration -- --coverage
open coverage/lcov-report/index.html

# 5. Commit y push
git add .
git commit -m "test: add recurring invoice CRUD integration tests"
git push origin feature/sprint2-recurring-tests

# 6. CI ejecuta automáticamente
```

### CI/CD en GitHub
```
Push → GitHub Actions → Run Tests → Reportar Coverage → ✅/❌
```

### Pre-Deploy Checklist
```bash
# Antes de cada deploy a Azure:
./scripts/test-all.sh

# Si pasan todos:
git tag v1.2.0
./scripts/deploy-azure.sh
```

---

## 🛠️ Comandos Útiles

### Ejecutar Tests Específicos
```bash
# Solo un archivo
npm run test:integration -- clientes-pagination.spec.ts

# Solo un describe block
npm run test:integration -- -t "GET /clientes - Paginación básica"

# Con watch mode
npm run test:integration -- --watch

# Con debug
npm run test:integration -- --detectOpenHandles --forceExit
```

### Playwright Específico
```bash
# Ejecutar en modo UI (debugging)
npx playwright test --ui

# Solo un test
npx playwright test recurring-create.spec.ts

# Con trace viewer
npx playwright test --trace on
npx playwright show-trace trace.zip

# Generar código de test
npx playwright codegen http://localhost:3000
```

---

## 📝 Checklist de Implementación

### Fase 1: Setup (2 horas)
- [ ] Crear estructura de carpetas
- [ ] Instalar dependencias
  ```bash
  npm install --save-dev @playwright/test supertest @types/supertest
  ```
- [ ] Configurar `jest-integration.config.js`
- [ ] Configurar `playwright.config.ts`
- [ ] Crear helpers de testing (database, auth)

### Fase 2: Backend Tests (1 día)
- [ ] `clientes-pagination.spec.ts` (Sprint 1)
- [ ] `dte-pagination.spec.ts` (Sprint 1)
- [ ] `recurring-crud.spec.ts` (Sprint 2)
- [ ] `recurring-logic.spec.ts` (Sprint 2)
- [ ] `processor.spec.ts` (Sprint 2)
- [ ] `scheduler.spec.ts` (Sprint 2)

### Fase 3: E2E Tests (1 día)
- [ ] Fixtures (Page Objects)
- [ ] `clientes-pagination.spec.ts` (Sprint 1)
- [ ] `dte-pagination.spec.ts` (Sprint 1)
- [ ] `recurring-create.spec.ts` (Sprint 2)
- [ ] `recurring-edit.spec.ts` (Sprint 2)
- [ ] `recurring-history.spec.ts` (Sprint 2)

### Fase 4: CI/CD (4 horas)
- [ ] Crear `api-tests.yml`
- [ ] Crear `e2e-tests.yml`
- [ ] Configurar secrets en GitHub
- [ ] Probar workflows

### Fase 5: Scripts (2 horas)
- [ ] `test-all.sh`
- [ ] `test-backend.sh`
- [ ] `test-e2e.sh`
- [ ] Documentar en README.md

---

## 🎓 Definition of Done

Un test está **DONE** cuando:

✅ **Funcionalidad**:
- Cubre el caso de uso descrito
- Incluye arrange/act/assert claros
- Maneja edge cases relevantes

✅ **Calidad**:
- Pasa consistentemente (no flaky)
- Se ejecuta en < 5 segundos
- Nombre descriptivo y autodocumentado

✅ **Integración**:
- Incluido en suite de CI/CD
- Documentado en este plan
- Code review aprobado

✅ **Evidencia**:
- Screenshot de test passing (E2E)
- Coverage report > 70% (backend)
- Ejecutado localmente Y en CI

---

## 📚 Recursos de Referencia

- [Jest Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)

---

**Última actualización**: 8 de febrero de 2026  
**Autor**: Jose Bidegain / Claude  
**Versión**: 1.0
