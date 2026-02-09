# PROMPT CLAUDE CODE - FASE 2: FACTURACIÓN RECURRENTE + CONTABILIDAD + PAGINACIÓN

## 🎯 CONTEXTO DEL PROYECTO

**Estado actual:**
- Fase 0: ✅ Completada (14 issues QA, bug API duplicada)
- Fase 1: ✅ Completada (Plan Usage, Soporte, Migración, 350 clientes)
- Versión actual: Frontend v22, Backend v4
- Branch: feature/fase-2 (ya creado)

**URLs Producción:**
- Frontend: https://facturador-web-sv-chayeth5a0h2abcf.eastus2-01.azurewebsites.net
- Backend: https://facturador-api-sv-gvavh8heb5c5gkc9.eastus2-01.azurewebsites.net/api/v1

**Stack:**
- Backend: NestJS + Prisma + Azure SQL Database
- Frontend: Next.js 14 + shadcn/ui + TailwindCSS
- Deploy: Docker en Azure App Services
- Nuevo: Redis + BullMQ (a instalar)

---

## 📋 OBJETIVO FASE 2

Implementar sistema completo de:
1. **Paginación** en vistas con muchos registros
2. **Facturación Recurrente** automatizada con BullMQ
3. **Módulo Contable Básico** con generación automática de partidas

**Duración estimada:** 5-7 días de desarrollo

---

## 🎯 FEATURES A IMPLEMENTAR

### **SPRINT 1: PAGINACIÓN (DÍA 1 - PRIORIDAD CRÍTICA)**

#### Problema Actual
- 350+ clientes se cargan en una sola página
- Performance degradada con muchos registros
- Navegación difícil en listados grandes
- Similar problema en `/facturas` y otros listados

#### Solución Requerida

**1. Backend - Paginación Universal**

Ubicación: `apps/api/src/modules/clientes/`
```typescript
// clientes.controller.ts - Actualizar endpoint GET

@Get()
async findAll(
  @Query() query: PaginationQueryDto,
  @CurrentTenant() tenant: Tenant
): Promise<PaginatedResponse<Cliente>> {
  return this.clientesService.findAllPaginated(query, tenant.id);
}

// DTOs a crear
// dto/pagination-query.dto.ts
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// interfaces/paginated-response.interface.ts
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// clientes.service.ts - Nuevo método
async findAllPaginated(
  query: PaginationQueryDto,
  tenantId: string
): Promise<PaginatedResponse<Cliente>> {
  const { page, limit, search, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.ClienteWhereInput = {
    tenantId,
    ...(search && {
      OR: [
        { nombre: { contains: search, mode: 'insensitive' } },
        { numDocumento: { contains: search, mode: 'insensitive' } },
        { nrc: { contains: search, mode: 'insensitive' } },
        { correo: { contains: search, mode: 'insensitive' } },
      ]
    })
  };

  // Execute queries in parallel
  const [data, total] = await Promise.all([
    this.prisma.cliente.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        // Include relations if needed
      }
    }),
    this.prisma.cliente.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}
```

**2. Frontend - Paginación en /clientes**

Ubicación: `apps/web/src/app/(dashboard)/clientes/page.tsx`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, [page, limit, search]);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });

      const response = await fetch(`/clientes?${params}`);
      const data = await response.json();

      setClientes(data.data);
      setTotal(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch (error) {
      console.error('Error fetching clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLimitChange = (newLimit: string) => {
    setLimit(parseInt(newLimit));
    setPage(1); // Reset to first page
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1>Clientes</h1>
        
        {/* Limit selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Mostrar:</span>
          <Select value={limit.toString()} onValueChange={handleLimitChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">por página</span>
        </div>
      </div>

      {/* Search bar */}
      <Input
        placeholder="Buscar por nombre, documento, correo..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {/* Table */}
      <div className="rounded-md border">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
            {/* Table content */}
          </Table>
        )}
      </div>

      {/* Pagination info */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} de {total} clientes
        </div>

        {/* Pagination controls */}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => setPage(pageNum)}
                    isActive={page === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
```

**3. Aplicar Mismo Patrón en /facturas**

- Copiar la lógica de paginación
- Adaptar para modelo Factura
- Mantener filtros existentes (estado, fecha)

**Acceptance Criteria:**
- [ ] Backend retorna respuesta paginada con meta
- [ ] Frontend muestra selector de límite (10, 20, 50, 100)
- [ ] Controles de paginación funcionales
- [ ] Búsqueda funciona con paginación
- [ ] Loading states durante fetch
- [ ] Performance: <200ms para queries paginadas
- [ ] Responsive en mobile
- [ ] Mismo patrón aplicado en /facturas

---

### **SPRINT 2: FACTURACIÓN RECURRENTE (DÍA 2-4)**

#### A. Setup de Infraestructura

**1. Instalar y Configurar Redis**
```bash
# En el servidor de producción o local
sudo apt update
sudo apt install redis-server

# Verificar
redis-cli ping
# Debe retornar: PONG

# Configurar para auto-start
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

**2. Instalar Dependencias NestJS**
```bash
cd apps/api
npm install @nestjs/bull bull @types/bull
npm install @nestjs/schedule
```

**3. Configurar en app.module.ts**
```typescript
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    // ... otros imports
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue({
      name: 'recurring-invoice-generation',
    }),
  ],
})
```

**4. Variables de Entorno**
```env
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### B. Modelos Prisma
```prisma
// prisma/schema.prisma

model RecurringInvoiceTemplate {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  // Configuración básica
  nombre          String
  descripcion     String?  @db.Text
  clienteId       String
  cliente         Cliente  @relation(fields: [clienteId], references: [id])
  
  // Scheduling
  interval        String   // 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'
  anchorDay       Int?     // Día del mes (1-31) para MONTHLY
  dayOfWeek       Int?     // 0-6 para WEEKLY (0=Domingo)
  
  // Política de generación
  mode            String   // 'AUTO_DRAFT' | 'AUTO_SEND'
  autoTransmit    Boolean  @default(false)
  
  // Contenido de la factura
  items           Json     // Array de { descripcion, cantidad, precioUnitario, ... }
  notas           String?  @db.Text
  
  // Control de estado
  status          String   @default("ACTIVE") // 'ACTIVE', 'PAUSED', 'SUSPENDED_ERROR', 'CANCELLED'
  consecutiveFailures Int  @default(0)
  lastError       String?  @db.Text
  
  // Fechas de ejecución
  nextRunDate     DateTime
  lastRunDate     DateTime?
  startDate       DateTime
  endDate         DateTime?
  
  // Historial
  history         RecurringInvoiceHistory[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([tenantId, status])
  @@index([nextRunDate])
  @@index([status, nextRunDate]) // Composite index para el cron
}

model RecurringInvoiceHistory {
  id              String   @id @default(cuid())
  templateId      String
  template        RecurringInvoiceTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  
  // Resultado
  invoiceId       String?
  invoice         Factura? @relation(fields: [invoiceId], references: [id])
  
  status          String   // 'SUCCESS', 'FAILED', 'SKIPPED'
  error           String?  @db.Text
  runDate         DateTime
  
  createdAt       DateTime @default(now())
  
  @@index([templateId])
  @@index([runDate])
}
```

**Migración:**
```bash
npx prisma migrate dev --name add-recurring-invoices
npx prisma generate
```

#### C. BullMQ Queue y Processor

**1. Crear Queue Module**
```typescript
// apps/api/src/modules/recurring-invoices/recurring-invoices.module.ts

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RecurringInvoicesService } from './recurring-invoices.service';
import { RecurringInvoicesController } from './recurring-invoices.controller';
import { RecurringInvoiceProcessor } from './processors/recurring-invoice.processor';
import { RecurringInvoiceScheduler } from './schedulers/recurring-invoice.scheduler';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'recurring-invoice-generation',
    }),
  ],
  controllers: [RecurringInvoicesController],
  providers: [
    RecurringInvoicesService,
    RecurringInvoiceProcessor,
    RecurringInvoiceScheduler,
  ],
})
export class RecurringInvoicesModule {}
```

**2. Crear Processor**
```typescript
// processors/recurring-invoice.processor.ts

import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Processor('recurring-invoice-generation')
@Injectable()
export class RecurringInvoiceProcessor {
  private readonly logger = new Logger(RecurringInvoiceProcessor.name);

  constructor(
    private prisma: PrismaService,
    private facturasService: FacturasService,
  ) {}

  @Process('generate')
  async handleGeneration(job: Job<{ templateId: string }>) {
    const { templateId } = job.data;
    
    this.logger.log(`Processing recurring invoice template: ${templateId}`);

    try {
      // 1. Obtener template
      const template = await this.prisma.recurringInvoiceTemplate.findUnique({
        where: { id: templateId },
        include: { cliente: true, tenant: true }
      });

      if (!template || template.status !== 'ACTIVE') {
        this.logger.warn(`Template ${templateId} not active or not found`);
        return;
      }

      // 2. Generar factura desde template
      const invoiceData = {
        tenantId: template.tenantId,
        clienteId: template.clienteId,
        fecha: new Date(),
        items: template.items as any[],
        notas: template.notas,
        // ... otros campos necesarios
      };

      const invoice = await this.facturasService.create(invoiceData);

      // 3. Si auto-transmit está activo, transmitir a Hacienda
      if (template.autoTransmit && template.mode === 'AUTO_SEND') {
        await this.facturasService.transmitToHacienda(invoice.id);
      }

      // 4. Calcular próxima fecha de ejecución
      const nextRunDate = this.calculateNextRunDate(template);

      // 5. Actualizar template
      await this.prisma.recurringInvoiceTemplate.update({
        where: { id: templateId },
        data: {
          lastRunDate: new Date(),
          nextRunDate,
          consecutiveFailures: 0, // Reset failures on success
        }
      });

      // 6. Registrar en historial
      await this.prisma.recurringInvoiceHistory.create({
        data: {
          templateId,
          invoiceId: invoice.id,
          status: 'SUCCESS',
          runDate: new Date(),
        }
      });

      this.logger.log(`Successfully generated invoice ${invoice.numeroControl} from template ${templateId}`);

    } catch (error) {
      this.logger.error(`Failed to generate invoice from template ${templateId}:`, error);

      // Incrementar contador de fallos
      const template = await this.prisma.recurringInvoiceTemplate.findUnique({
        where: { id: templateId },
        select: { consecutiveFailures: true }
      });

      const newFailureCount = (template?.consecutiveFailures || 0) + 1;

      // Suspender si 3 fallos consecutivos
      const shouldSuspend = newFailureCount >= 3;

      await this.prisma.recurringInvoiceTemplate.update({
        where: { id: templateId },
        data: {
          consecutiveFailures: newFailureCount,
          lastError: error.message,
          ...(shouldSuspend && { status: 'SUSPENDED_ERROR' })
        }
      });

      // Registrar fallo en historial
      await this.prisma.recurringInvoiceHistory.create({
        data: {
          templateId,
          status: 'FAILED',
          error: error.message,
          runDate: new Date(),
        }
      });

      if (shouldSuspend) {
        this.logger.warn(`Template ${templateId} suspended after 3 consecutive failures`);
        // TODO: Enviar notificación al tenant
      }

      throw error; // Re-throw para que Bull maneje el retry
    }
  }

  private calculateNextRunDate(template: RecurringInvoiceTemplate): Date {
    const now = new Date();
    const next = new Date(now);

    switch (template.interval) {
      case 'DAILY':
        next.setDate(now.getDate() + 1);
        break;

      case 'WEEKLY':
        next.setDate(now.getDate() + 7);
        break;

      case 'MONTHLY':
        next.setMonth(now.getMonth() + 1);
        // Normalizar día 31 → último del mes si es necesario
        if (template.anchorDay) {
          next.setDate(template.anchorDay);
          // Si el mes no tiene suficientes días, ajustar al último
          if (next.getMonth() !== (now.getMonth() + 1) % 12) {
            next.setDate(0); // Último día del mes anterior (el actual)
          }
        }
        break;

      case 'YEARLY':
        next.setFullYear(now.getFullYear() + 1);
        break;
    }

    return next;
  }
}
```

**3. Crear Scheduler (Cron)**
```typescript
// schedulers/recurring-invoice.scheduler.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class RecurringInvoiceScheduler {
  private readonly logger = new Logger(RecurringInvoiceScheduler.name);

  constructor(
    @InjectQueue('recurring-invoice-generation') private queue: Queue,
    private prisma: PrismaService,
  ) {}

  @Cron('1 0 * * *') // Ejecutar diariamente a las 00:01 UTC
  async checkRecurringInvoices() {
    this.logger.log('Starting daily recurring invoice check...');

    try {
      const now = new Date();

      // Buscar templates activos cuya fecha de ejecución ya pasó
      const templates = await this.prisma.recurringInvoiceTemplate.findMany({
        where: {
          status: 'ACTIVE',
          nextRunDate: { lte: now }
        },
        select: { id: true, nombre: true }
      });

      this.logger.log(`Found ${templates.length} templates to process`);

      // Agregar cada template a la cola
      for (const template of templates) {
        await this.queue.add('generate', { templateId: template.id }, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000, // 1 minuto
          },
        });

        this.logger.log(`Queued template: ${template.nombre} (${template.id})`);
      }

    } catch (error) {
      this.logger.error('Error checking recurring invoices:', error);
    }
  }

  // Opcional: Ejecutar manualmente para testing
  async triggerNow(templateId: string) {
    await this.queue.add('generate', { templateId }, { priority: 10 });
  }
}
```

#### D. Frontend - UI de Templates

**1. Lista de Templates**
```
Ruta: apps/web/src/app/(dashboard)/facturas/recurrentes/page.tsx

Layout:
- Tabs: Activas | Pausadas | Canceladas | Todas
- Tabla con:
  * Nombre del template
  * Cliente
  * Frecuencia (Mensual, Semanal, etc.)
  * Próxima ejecución
  * Estado (badge)
  * Acciones: Pausar/Reanudar, Editar, Ver historial, Eliminar

- Botón: [+ Nuevo Template]
```

**2. Formulario Crear/Editar Template**
```
Ruta: apps/web/src/app/(dashboard)/facturas/recurrentes/nuevo/page.tsx

Secciones:
1. Información Básica
   - Nombre del template
   - Descripción (opcional)
   - Cliente (autocomplete)

2. Configuración de Recurrencia
   - Frecuencia: Radio buttons (Diaria, Semanal, Mensual, Anual)
   - Si Mensual: Selector de día (1-31) con warning si >28
   - Si Semanal: Selector de día de la semana
   - Fecha inicio
   - Fecha fin (opcional, checkbox "Sin fecha de fin")

3. Modo de Generación
   - Radio: Borrador automático | Enviar automáticamente
   - Checkbox: Transmitir a Hacienda automáticamente

4. Items de la Factura
   - Mismo componente que factura normal
   - Agregar productos/servicios
   - Calculos en tiempo real

5. Notas (opcional)

Botones: [Cancelar] [Guardar Template]
```

**3. Vista de Historial**
```
Ruta: apps/web/src/app/(dashboard)/facturas/recurrentes/[id]/historial/page.tsx

Mostrar:
- Nombre del template
- Tabla de facturas generadas:
  * Fecha de generación
  * Número de factura
  * Estado (Borrador, Autorizada, Fallida)
  * Total
  * Transmitida (Sí/No)
  * Acciones: Ver factura

- Estadísticas:
  * Total generadas
  * Exitosas
  * Fallidas
  * Próxima ejecución

- Gráfico (opcional): Facturas por mes
```

**Acceptance Criteria:**
- [ ] Redis instalado y configurando
- [ ] BullMQ integrado en NestJS
- [ ] Modelos Prisma migrados
- [ ] Processor maneja generación exitosamente
- [ ] Cron job ejecuta diariamente
- [ ] Retry con backoff exponencial funciona
- [ ] Suspensión automática tras 3 fallos
- [ ] Frontend CRUD de templates funcional
- [ ] Historial visible y navegable
- [ ] Normalización día 31 → último del mes

---

### **SPRINT 3: MÓDULO CONTABLE (DÍA 5-6)**

#### A. Modelos Prisma Contables
```prisma
// prisma/schema.prisma

model AccountingAccount {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  
  // Estructura del catálogo
  code        String   // "1101" (jerárquico)
  name        String   // "Caja General"
  type        String   // 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
  subtype     String?  // 'CURRENT_ASSET', 'FIXED_ASSET', 'CURRENT_LIABILITY', etc.
  
  // Jerarquía
  parentId    String?
  parent      AccountingAccount? @relation("AccountHierarchy", fields: [parentId], references: [id], onDelete: Restrict, onUpdate: Restrict)
  children    AccountingAccount[] @relation("AccountHierarchy")
  level       Int      @default(1) // Nivel en la jerarquía (1=raíz, 2=grupo, 3=subgrupo, etc.)
  
  // Configuración
  normalBalance String // 'DEBIT' | 'CREDIT'
  allowsManualEntry Boolean @default(true)
  active      Boolean  @default(true)
  
  // Saldos
  currentBalance Decimal @default(0) @db.Decimal(15, 2)
  
  // Relaciones
  journalEntryLines JournalEntryLine[]
  debitRules    AccountMappingRule[] @relation("DebitRules")
  creditRules   AccountMappingRule[] @relation("CreditRules")
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([tenantId, code])
  @@index([tenantId, type])
  @@index([tenantId, active])
}

model JournalEntry {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  
  // Identificación
  entryNumber String   // "VTA-2026-001", "COB-2026-045", etc.
  date        DateTime
  description String   @db.Text
  
  // Origen de la partida
  sourceType  String?  // 'INVOICE', 'PAYMENT', 'CREDIT_NOTE', 'DEBIT_NOTE', 'MANUAL'
  sourceId    String?  // ID de la factura/pago/etc
  
  // Estado
  status      String   @default("DRAFT") // 'DRAFT', 'POSTED', 'VOIDED'
  postedAt    DateTime?
  postedBy    String?
  voidedAt    DateTime?
  voidedBy    String?
  voidReason  String?  @db.Text
  
  // Líneas de la partida
  lines       JournalEntryLine[]
  
  // Totales (calculados)
  totalDebit  Decimal  @default(0) @db.Decimal(15, 2)
  totalCredit Decimal  @default(0) @db.Decimal(15, 2)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([tenantId, entryNumber])
  @@index([tenantId, date])
  @@index([tenantId, status])
  @@index([sourceType, sourceId])
}

model JournalEntryLine {
  id              String   @id @default(cuid())
  entryId         String
  entry           JournalEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)
  
  accountId       String
  account         AccountingAccount @relation(fields: [accountId], references: [id])
  
  description     String   @db.Text
  debit           Decimal  @default(0) @db.Decimal(15, 2)
  credit          Decimal  @default(0) @db.Decimal(15, 2)
  
  lineNumber      Int
  
  createdAt       DateTime @default(now())
  
  @@index([entryId])
  @@index([accountId])
}

model AccountMappingRule {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  
  // Tipo de operación
  operation   String   // 'SALE_INVOICE', 'PURCHASE_INVOICE', 'PAYMENT_RECEIVED', 'PAYMENT_MADE', etc.
  description String?
  
  // Mapeo de cuentas
  debitAccountId  String
  debitAccount    AccountingAccount @relation("DebitRules", fields: [debitAccountId], references: [id])
  creditAccountId String
  creditAccount   AccountingAccount @relation("CreditRules", fields: [creditAccountId], references: [id])
  
  // Configuración adicional
  includesTax Boolean  @default(false) // Si maneja IVA separado
  taxAccountId String? // Cuenta de IVA (si aplica)
  
  // Condiciones (JSON para reglas complejas en el futuro)
  conditions  Json?
  
  active      Boolean  @default(true)
  priority    Int      @default(0) // Para múltiples reglas, usar la de mayor prioridad
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([tenantId, operation])
  @@index([tenantId, operation, active])
}
```

**Migración:**
```bash
npx prisma migrate dev --name add-accounting-module
npx prisma generate
```

#### B. Seed - Plan de Cuentas El Salvador
```typescript
// prisma/seeds/accounting-accounts.seed.ts

export const accountingAccountsSeed = {
  // 1. ACTIVO
  '1': {
    code: '1',
    name: 'ACTIVO',
    type: 'ASSET',
    normalBalance: 'DEBIT',
    level: 1,
    allowsManualEntry: false
  },
  '11': {
    code: '11',
    name: 'Activo Corriente',
    type: 'ASSET',
    subtype: 'CURRENT_ASSET',
    parent: '1',
    level: 2,
    allowsManualEntry: false
  },
  '1101': {
    code: '1101',
    name: 'Caja General',
    type: 'ASSET',
    subtype: 'CURRENT_ASSET',
    parent: '11',
    level: 3
  },
  '1102': {
    code: '1102',
    name: 'Bancos',
    type: 'ASSET',
    subtype: 'CURRENT_ASSET',
    parent: '11',
    level: 3
  },
  '1103': {
    code: '1103',
    name: 'Cuentas por Cobrar Clientes',
    type: 'ASSET',
    subtype: 'CURRENT_ASSET',
    parent: '11',
    level: 3
  },
  '1104': {
    code: '1104',
    name: 'IVA Crédito Fiscal',
    type: 'ASSET',
    subtype: 'CURRENT_ASSET',
    parent: '11',
    level: 3
  },
  '1105': {
    code: '1105',
    name: 'Inventario de Mercaderías',
    type: 'ASSET',
    subtype: 'CURRENT_ASSET',
    parent: '11',
    level: 3
  },
  '12': {
    code: '12',
    name: 'Activo No Corriente',
    type: 'ASSET',
    subtype: 'FIXED_ASSET',
    parent: '1',
    level: 2,
    allowsManualEntry: false
  },
  '1201': {
    code: '1201',
    name: 'Propiedad, Planta y Equipo',
    type: 'ASSET',
    subtype: 'FIXED_ASSET',
    parent: '12',
    level: 3
  },

  // 2. PASIVO
  '2': {
    code: '2',
    name: 'PASIVO',
    type: 'LIABILITY',
    normalBalance: 'CREDIT',
    level: 1,
    allowsManualEntry: false
  },
  '21': {
    code: '21',
    name: 'Pasivo Corriente',
    type: 'LIABILITY',
    subtype: 'CURRENT_LIABILITY',
    parent: '2',
    level: 2,
    allowsManualEntry: false
  },
  '2101': {
    code: '2101',
    name: 'Cuentas por Pagar Proveedores',
    type: 'LIABILITY',
    subtype: 'CURRENT_LIABILITY',
    parent: '21',
    level: 3
  },
  '2105': {
    code: '2105',
    name: 'IVA Débito Fiscal',
    type: 'LIABILITY',
    subtype: 'CURRENT_LIABILITY',
    parent: '21',
    level: 3
  },
  '2106': {
    code: '2106',
    name: 'Retenciones por Pagar',
    type: 'LIABILITY',
    subtype: 'CURRENT_LIABILITY',
    parent: '21',
    level: 3
  },

  // 3. PATRIMONIO
  '3': {
    code: '3',
    name: 'PATRIMONIO',
    type: 'EQUITY',
    normalBalance: 'CREDIT',
    level: 1,
    allowsManualEntry: false
  },
  '31': {
    code: '31',
    name: 'Capital Social',
    type: 'EQUITY',
    parent: '3',
    level: 2
  },
  '32': {
    code: '32',
    name: 'Reservas',
    type: 'EQUITY',
    parent: '3',
    level: 2
  },
  '33': {
    code: '33',
    name: 'Resultados Acumulados',
    type: 'EQUITY',
    parent: '3',
    level: 2
  },
  '34': {
    code: '34',
    name: 'Resultado del Ejercicio',
    type: 'EQUITY',
    parent: '3',
    level: 2
  },

  // 4. INGRESOS
  '4': {
    code: '4',
    name: 'INGRESOS',
    type: 'REVENUE',
    normalBalance: 'CREDIT',
    level: 1,
    allowsManualEntry: false
  },
  '41': {
    code: '41',
    name: 'Ingresos Operacionales',
    type: 'REVENUE',
    parent: '4',
    level: 2,
    allowsManualEntry: false
  },
  '4101': {
    code: '4101',
    name: 'Ventas de Productos',
    type: 'REVENUE',
    parent: '41',
    level: 3
  },
  '4102': {
    code: '4102',
    name: 'Ventas de Servicios',
    type: 'REVENUE',
    parent: '41',
    level: 3
  },
  '42': {
    code: '42',
    name: 'Otros Ingresos',
    type: 'REVENUE',
    parent: '4',
    level: 2,
    allowsManualEntry: false
  },
  '4201': {
    code: '4201',
    name: 'Ingresos Financieros',
    type: 'REVENUE',
    parent: '42',
    level: 3
  },

  // 5. GASTOS
  '5': {
    code: '5',
    name: 'GASTOS',
    type: 'EXPENSE',
    normalBalance: 'DEBIT',
    level: 1,
    allowsManualEntry: false
  },
  '51': {
    code: '51',
    name: 'Costo de Ventas',
    type: 'EXPENSE',
    subtype: 'COST_OF_SALES',
    parent: '5',
    level: 2,
    allowsManualEntry: false
  },
  '5101': {
    code: '5101',
    name: 'Costo de Mercaderías Vendidas',
    type: 'EXPENSE',
    subtype: 'COST_OF_SALES',
    parent: '51',
    level: 3
  },
  '52': {
    code: '52',
    name: 'Gastos de Operación',
    type: 'EXPENSE',
    subtype: 'OPERATING_EXPENSE',
    parent: '5',
    level: 2,
    allowsManualEntry: false
  },
  '5201': {
    code: '5201',
    name: 'Sueldos y Salarios',
    type: 'EXPENSE',
    subtype: 'OPERATING_EXPENSE',
    parent: '52',
    level: 3
  },
  '5202': {
    code: '5202',
    name: 'Alquileres',
    type: 'EXPENSE',
    subtype: 'OPERATING_EXPENSE',
    parent: '52',
    level: 3
  },
  '5203': {
    code: '5203',
    name: 'Servicios Públicos',
    type: 'EXPENSE',
    subtype: 'OPERATING_EXPENSE',
    parent: '52',
    level: 3
  },
  '53': {
    code: '53',
    name: 'Gastos Financieros',
    type: 'EXPENSE',
    subtype: 'FINANCIAL_EXPENSE',
    parent: '5',
    level: 2,
    allowsManualEntry: false
  },
  '5301': {
    code: '5301',
    name: 'Intereses Bancarios',
    type: 'EXPENSE',
    subtype: 'FINANCIAL_EXPENSE',
    parent: '53',
    level: 3
  },
};

// Función para crear las cuentas con jerarquía
export async function seedAccountingAccounts(prisma: PrismaService, tenantId: string) {
  const accounts = Object.entries(accountingAccountsSeed);
  
  // Ordenar por nivel (crear primero las raíces, luego los hijos)
  const sorted = accounts.sort((a, b) => a[1].level - b[1].level);
  
  for (const [code, data] of sorted) {
    const parentCode = data.parent;
    let parentId = null;
    
    if (parentCode) {
      const parent = await prisma.accountingAccount.findFirst({
        where: { tenantId, code: parentCode }
      });
      parentId = parent?.id;
    }
    
    await prisma.accountingAccount.upsert({
      where: { tenantId_code: { tenantId, code } },
      update: {},
      create: {
        tenantId,
        code: data.code,
        name: data.name,
        type: data.type,
        subtype: data.subtype,
        normalBalance: data.normalBalance,
        level: data.level,
        allowsManualEntry: data.allowsManualEntry ?? true,
        parentId,
      }
    });
  }
  
  console.log(`✅ Seeded ${sorted.length} accounting accounts for tenant ${tenantId}`);
}
```

#### C. Servicio de Contabilidad
```typescript
// apps/api/src/modules/accounting/accounting.service.ts

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generar partida contable automáticamente desde una factura
   * 
   * Reglas El Salvador:
   * - Débito: Cuentas por Cobrar (activo aumenta)
   * - Crédito: Ingresos por Ventas (ingreso aumenta)
   * - Crédito: IVA Débito Fiscal (pasivo aumenta)
   */
  async generateJournalEntryFromInvoice(invoiceId: string): Promise<JournalEntry> {
    const invoice = await this.prisma.factura.findUnique({
      where: { id: invoiceId },
      include: { cliente: true, tenant: true }
    });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    // Obtener cuentas según el catálogo
    const cxcAccount = await this.getAccountByCode(invoice.tenantId, '1103'); // CxC
    const ingresosAccount = await this.getAccountByCode(invoice.tenantId, '4101'); // Ingresos
    const ivaDebitoAccount = await this.getAccountByCode(invoice.tenantId, '2105'); // IVA Débito

    const year = new Date().getFullYear();
    const nextNumber = await this.getNextEntryNumber(invoice.tenantId, 'VTA', year);
    const entryNumber = `VTA-${year}-${nextNumber.toString().padStart(4, '0')}`;

    // Crear partida
    const entry = await this.prisma.journalEntry.create({
      data: {
        tenantId: invoice.tenantId,
        entryNumber,
        date: invoice.fecha,
        description: `Factura de venta #${invoice.numeroControl} - Cliente: ${invoice.cliente.nombre}`,
        sourceType: 'INVOICE',
        sourceId: invoice.id,
        status: 'POSTED',
        postedAt: new Date(),
        lines: {
          create: [
            // Línea 1: Débito a Cuentas por Cobrar
            {
              accountId: cxcAccount.id,
              description: `CxC - ${invoice.cliente.nombre}`,
              debit: invoice.totalPagar,
              credit: 0,
              lineNumber: 1,
            },
            // Línea 2: Crédito a Ingresos
            {
              accountId: ingresosAccount.id,
              description: 'Venta de productos/servicios',
              debit: 0,
              credit: invoice.totalGravada || 0,
              lineNumber: 2,
            },
            // Línea 3: Crédito a IVA Débito Fiscal
            {
              accountId: ivaDebitoAccount.id,
              description: 'IVA Débito Fiscal 13%',
              debit: 0,
              credit: invoice.totalIva || 0,
              lineNumber: 3,
            },
          ]
        },
        totalDebit: invoice.totalPagar,
        totalCredit: invoice.totalPagar, // Debe cuadrar
      },
      include: { lines: { include: { account: true } } }
    });

    // Validar que cuadre
    await this.validateEntryBalance(entry.id);

    // Actualizar saldos de cuentas
    await this.updateAccountBalances(entry.id);

    this.logger.log(`Generated journal entry ${entryNumber} for invoice ${invoice.numeroControl}`);

    return entry;
  }

  /**
   * Generar partida desde un pago recibido
   * 
   * Reglas:
   * - Débito: Efectivo/Banco (activo aumenta)
   * - Crédito: Cuentas por Cobrar (activo disminuye)
   */
  async generateJournalEntryFromPayment(paymentId: string): Promise<JournalEntry> {
    // Similar a la factura pero con lógica de pago
    // TODO: Implementar cuando exista módulo de pagos
  }

  /**
   * Generar partida desde una nota de crédito
   * 
   * Reglas:
   * - Reversa de la factura original
   * - Débito: Ingresos + IVA Débito
   * - Crédito: Cuentas por Cobrar
   */
  async generateJournalEntryFromCreditNote(creditNoteId: string): Promise<JournalEntry> {
    // TODO: Implementar cuando exista módulo de notas de crédito
  }

  /**
   * Validar que los débitos = créditos
   */
  private async validateEntryBalance(entryId: string): Promise<void> {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id: entryId },
      include: { lines: true }
    });

    const totalDebit = entry.lines.reduce((sum, line) => sum + Number(line.debit), 0);
    const totalCredit = entry.lines.reduce((sum, line) => sum + Number(line.credit), 0);

    const difference = Math.abs(totalDebit - totalCredit);

    if (difference > 0.01) { // Permitir diferencia mínima por redondeo
      throw new BadRequestException(
        `Entry does not balance: Debit=${totalDebit}, Credit=${totalCredit}, Difference=${difference}`
      );
    }
  }

  /**
   * Actualizar saldos de las cuentas afectadas
   */
  private async updateAccountBalances(entryId: string): Promise<void> {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id: entryId },
      include: { lines: { include: { account: true } } }
    });

    for (const line of entry.lines) {
      const account = line.account;
      const debitAmount = Number(line.debit);
      const creditAmount = Number(line.credit);

      let balanceChange = 0;

      // Cuentas de naturaleza deudora: +débito, -crédito
      if (account.normalBalance === 'DEBIT') {
        balanceChange = debitAmount - creditAmount;
      }
      // Cuentas de naturaleza acreedora: -débito, +crédito
      else {
        balanceChange = creditAmount - debitAmount;
      }

      await this.prisma.accountingAccount.update({
        where: { id: account.id },
        data: {
          currentBalance: {
            increment: balanceChange
          }
        }
      });
    }
  }

  /**
   * Obtener cuenta por código
   */
  private async getAccountByCode(tenantId: string, code: string): Promise<AccountingAccount> {
    const account = await this.prisma.accountingAccount.findUnique({
      where: { tenantId_code: { tenantId, code } }
    });

    if (!account) {
      throw new NotFoundException(`Account with code ${code} not found for tenant`);
    }

    return account;
  }

  /**
   * Obtener siguiente número de asiento
   */
  private async getNextEntryNumber(tenantId: string, prefix: string, year: number): Promise<number> {
    const lastEntry = await this.prisma.journalEntry.findFirst({
      where: {
        tenantId,
        entryNumber: { startsWith: `${prefix}-${year}-` }
      },
      orderBy: { entryNumber: 'desc' }
    });

    if (!lastEntry) return 1;

    const lastNumber = parseInt(lastEntry.entryNumber.split('-').pop() || '0');
    return lastNumber + 1;
  }
}
```

#### D. Frontend - Reportes Contables

**1. Libro Diario**
```
Ruta: apps/web/src/app/(dashboard)/contabilidad/libro-diario/page.tsx

Layout:
- Filtros:
  * Rango de fechas
  * Tipo de asiento (Venta, Cobro, Manual, etc.)
  * Búsqueda por descripción

- Tabla:
  * Fecha
  * Número de asiento
  * Código cuenta
  * Nombre cuenta
  * Descripción
  * Débito
  * Crédito

- Totales al final:
  * Total débitos
  * Total créditos
  * Diferencia (debe ser 0)

- Botones:
  * Exportar a Excel
  * Exportar a PDF
```

**2. Libro Mayor**
```
Ruta: apps/web/src/app/(dashboard)/contabilidad/libro-mayor/page.tsx

Layout:
- Selector de cuenta (dropdown jerárquico)
- Rango de fechas
- Tabla de movimientos:
  * Fecha
  * Asiento #
  * Descripción
  * Débito
  * Crédito
  * Saldo

- Saldo inicial, final
- Exportar
```

**3. Balance General**
```
Ruta: apps/web/src/app/(dashboard)/contabilidad/balance/page.tsx

Layout clásico:

ACTIVO                          PASIVO
Activo Corriente                Pasivo Corriente
  Caja            $XXX            CxP              $XXX
  Bancos          $XXX            IVA Débito       $XXX
  CxC             $XXX            Subtotal         $XXX
  Subtotal        $XXX

Activo No Corriente            Pasivo No Corriente
  ...                            ...
                                
                                PATRIMONIO
                                  Capital          $XXX
                                  Reservas         $XXX
                                  Resultado        $XXX

TOTAL ACTIVO    $XXX           TOTAL PASIVO+PAT  $XXX
```

**Acceptance Criteria:**
- [ ] Modelos Prisma migrados
- [ ] Plan de cuentas El Salvador seedeado
- [ ] Generación automática de partidas desde facturas
- [ ] Validación débitos = créditos
- [ ] Actualización de saldos correcta
- [ ] Libro Diario navegable y exportable
- [ ] Libro Mayor por cuenta
- [ ] Balance General generado correctamente
- [ ] Exportación a Excel funcional
- [ ] Performance <500ms para reportes de 1000 registros

---

### **DÍA 7: TESTING Y VALIDACIÓN**
```bash
# Tests críticos a ejecutar

1. Paginación:
   - [ ] 350 clientes se muestran paginados correctamente
   - [ ] Cambio de límite funciona
   - [ ] Búsqueda mantiene paginación
   - [ ] Performance <200ms

2. Facturación Recurrente:
   - [ ] Template mensual día 15 genera factura correctamente
   - [ ] Template mensual día 31 normaliza a último del mes
   - [ ] Retry tras fallo funciona
   - [ ] Suspensión tras 3 fallos
   - [ ] Cron job ejecuta diariamente
   - [ ] Historial se registra correctamente

3. Contabilidad:
   - [ ] Factura $100 genera partida:
         D: CxC $100
         C: Ingresos $88.50
         C: IVA $11.50
   - [ ] Débitos = Créditos siempre
   - [ ] Saldos se actualizan correctamente
   - [ ] Libro Diario muestra asientos
   - [ ] Libro Mayor calcula saldo correcto
   - [ ] Balance cuadra: Activo = Pasivo + Patrimonio
   - [ ] Exportación Excel genera archivo válido

4. Integración:
   - [ ] Build frontend: 0 errores
   - [ ] Build backend: 0 errores
   - [ ] Migraciones Prisma aplicadas
   - [ ] Seeds ejecutados
```

---

## 📝 METODOLOGÍA REPUBLICODE

**Aplicar estrictamente:**

1. **Plan First** - Analiza y planifica antes de codear cada feature
2. **Subagent Strategy** - Divide tareas complejas en subagentes
3. **Self-Improvement Loop** - Documenta en `tasks/lessons.md`
4. **Verification Before Done** - Demuestra funcionamiento con evidencia
5. **Autonomous Bug Fixing** - Corrige sin preguntar si encuentras bugs

## 🎨 DISEÑO Y UX

**Mantener consistencia:**
- Color primario: Deep Purple (#5B21B6)
- Componentes: shadcn/ui exclusivamente
- Typography: Inter
- Responsive: Mobile-first
- Loading states siempre visibles
- Error handling apropiado

## ✅ ACCEPTANCE CRITERIA GENERAL FASE 2
```
Paginación:
□ Backend paginado implementado
□ Frontend con controles de paginación
□ Selector de límite (10, 20, 50, 100)
□ Performance <200ms
□ Aplicado en /clientes y /facturas

Facturación Recurrente:
□ Redis configurado
□ BullMQ integrado
□ Modelos Prisma migrados
□ Cron job ejecutándose
□ Templates CRUD funcional
□ Generación automática OK
□ Historial visible
□ Suspensión tras fallos

Contabilidad:
□ Plan de cuentas seedeado
□ Generación automática de partidas
□ Validación débitos = créditos
□ Libro Diario funcional
□ Libro Mayor funcional
□ Balance General correcto
□ Exportación Excel

Build:
□ Frontend: 0 errores
□ Backend: 0 errores
□ Migraciones aplicadas
□ Tests passing
```

## 🚫 LO QUE NO DEBES HACER

- ❌ No uses console.log en producción (usa logger)
- ❌ No ignores errores (maneja apropiadamente)
- ❌ No uses `any` en TypeScript
- ❌ No omitas validación de datos
- ❌ No hagas cambios sin plan previo
- ❌ No deploys sin testing previo

## 📊 PRIORIDADES DE EJECUCIÓN

**Sprint 1 (Día 1):** Paginación  
**Sprint 2 (Día 2-4):** Facturación Recurrente  
**Sprint 3 (Día 5-6):** Contabilidad  
**Día 7:** Testing completo

## 🔗 ARCHIVOS DE CONTEXTO

Lee antes de empezar:
- `tasks/architecture.md`
- `tasks/prisma-schemas.md`
- `tasks/session-2026-02-08-completa.md`
- `tasks/lessons.md`
- `tasks/todo.md`

## 🎯 ENTREGABLES FINALES FASE 2

1. **Código:**
   - Branch `feature/fase-2`
   - Pull request detallado
   - Build passing

2. **Database:**
   - Migraciones aplicadas
   - Plan de cuentas seedeado

3. **Documentación:**
   - `tasks/session-fase-2.md`
   - Screenshots de features
   - Plan de cuentas documentado

4. **Testing:**
   - Suite de tests ejecutada
   - Validaciones passing

---

**¡Manos a la obra con Fase 2 completa!** 🚀

**Orden de ejecución:**
1. Paginación (Día 1)
2. Facturación Recurrente (Día 2-4)
3. Contabilidad (Día 5-6)
4. Testing (Día 7)
