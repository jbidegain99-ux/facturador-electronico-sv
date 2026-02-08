# PROMPT CLAUDE CODE - FASE 1: CATÁLOGOS E INVENTARIO

## 🎯 CONTEXTO DEL PROYECTO

Soy Jose, desarrollando "Facturador Electrónico SV" - una plataforma SaaS de facturación electrónica para El Salvador que se integra con el Ministerio de Hacienda. **Fase 0 completada exitosamente** (14/14 issues resueltos, v17 en producción).

**Stack:**
- Backend: NestJS + Prisma + Azure SQL Database
- Frontend: Next.js 14 + shadcn/ui + TailwindCSS
- Deploy: Docker en Azure App Services

**URLs Producción:**
- Frontend: https://facturador-web-sv-chayeth5a0h2abcf.eastus2-01.azurewebsites.net
- Backend: https://facturador-api-sv-gvavh8heb5c5gkc9.eastus2-01.azurewebsites.net/api/v1

## 📋 OBJETIVO FASE 1

Implementar el sistema de **Catálogos del Ministerio de Hacienda** y funcionalidades complementarias para gestión de datos.

## 🎯 FEATURES A IMPLEMENTAR

### 1. Sistema de Catálogos de Hacienda

**Backend (apps/api/):**

Crear módulo `catalogos` con endpoints para gestionar los catálogos oficiales del Ministerio de Hacienda:

**Catálogos requeridos:**
- Actividades Económicas
- Municipios
- Departamentos
- Tipos de Documento
- Tipos de Tributo
- Unidades de Medida
- Condiciones de Operación

**Estructura:**
```typescript
// apps/api/src/catalogos/catalogos.controller.ts
@Controller('catalogos')
export class CatalogosController {
  // GET /api/v1/catalogos/actividades-economicas
  @Get('actividades-economicas')
  async getActividadesEconomicas() {}
  
  // GET /api/v1/catalogos/municipios
  @Get('municipios')
  async getMunicipios() {}
  
  // GET /api/v1/catalogos/departamentos
  @Get('departamentos')
  async getDepartamentos() {}
  
  // POST /api/v1/catalogos/sync (admin only)
  @Post('sync')
  async syncCatalogos() {}
  
  // GET /api/v1/catalogos/version
  @Get('version')
  async getVersion() {}
}
```

**Schema Prisma:**
```prisma
model CatalogoActividad {
  id          String   @id @default(cuid())
  codigo      String   @unique
  descripcion String
  version     String
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model CatalogoMunicipio {
  id             String   @id @default(cuid())
  codigo         String   @unique
  nombre         String
  departamentoId String
  departamento   CatalogoDepartamento @relation(fields: [departamentoId], references: [id])
  version        String
  activo         Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model CatalogoDepartamento {
  id          String              @id @default(cuid())
  codigo      String              @unique
  nombre      String
  municipios  CatalogoMunicipio[]
  version     String
  activo      Boolean             @default(true)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}

// Similar para otros catálogos...

model CatalogoVersion {
  id          String   @id @default(cuid())
  tipo        String   // 'actividades', 'municipios', etc.
  version     String
  fechaSync   DateTime @default(now())
  registros   Int
}
```

**Frontend (apps/web/):**

Dashboard de gestión de catálogos en `/admin/catalogos`:
```typescript
// apps/web/src/app/(super-admin)/admin/catalogos/page.tsx
// Vista para:
// - Ver versión actual de cada catálogo
// - Sincronizar catálogos desde Hacienda
// - Ver historial de sincronizaciones
// - Estadísticas de uso
```

### 2. Sistema de Migración de Datos

**Backend:**

Endpoint para importar datos masivos (clientes, productos, etc.):
```typescript
// apps/api/src/migration/migration.controller.ts
@Controller('migration')
export class MigrationController {
  // POST /api/v1/migration/clientes
  @Post('clientes')
  async importClientes(@Body() data: ImportClientesDto) {}
  
  // POST /api/v1/migration/productos
  @Post('productos')
  async importProductos(@Body() data: ImportProductosDto) {}
  
  // GET /api/v1/migration/status/:jobId
  @Get('status/:jobId')
  async getStatus(@Param('jobId') jobId: string) {}
}
```

**Frontend:**

Wizard de importación en `/dashboard/configuracion/migracion`:

- Upload de archivo Excel/CSV
- Mapeo de columnas
- Preview de datos
- Validación
- Importación con progreso

### 3. Sistema de Tickets de Soporte

**Backend:**
```typescript
// apps/api/src/support/support.controller.ts
@Controller('support')
export class SupportController {
  // POST /api/v1/support/tickets
  @Post('tickets')
  async createTicket(@Body() data: CreateTicketDto) {}
  
  // GET /api/v1/support/tickets
  @Get('tickets')
  async getTickets(@Query() filters: TicketFiltersDto) {}
  
  // GET /api/v1/support/tickets/:id
  @Get('tickets/:id')
  async getTicket(@Param('id') id: string) {}
  
  // PATCH /api/v1/support/tickets/:id
  @Patch('tickets/:id')
  async updateTicket(@Param('id') id: string, @Body() data: UpdateTicketDto) {}
  
  // POST /api/v1/support/tickets/:id/comments
  @Post('tickets/:id/comments')
  async addComment(@Param('id') id: string, @Body() data: AddCommentDto) {}
}
```

**Schema Prisma:**
```prisma
model SupportTicket {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  titulo      String
  descripcion String   @db.Text
  categoria   String   // 'tecnico', 'facturacion', 'hacienda', 'otro'
  prioridad   String   // 'baja', 'media', 'alta', 'urgente'
  estado      String   // 'abierto', 'en_proceso', 'resuelto', 'cerrado'
  asignadoA   String?
  admin       Admin?   @relation(fields: [asignadoA], references: [id])
  comments    TicketComment[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model TicketComment {
  id        String        @id @default(cuid())
  ticketId  String
  ticket    SupportTicket @relation(fields: [ticketId], references: [id])
  autorId   String
  autorTipo String        // 'tenant' | 'admin'
  contenido String        @db.Text
  interno   Boolean       @default(false)
  createdAt DateTime      @default(now())
}
```

**Frontend:**

- Vista tenant: `/dashboard/soporte`
- Vista admin: `/admin/support` (ya existe, mejorar)

### 4. Configuración de Email Multi-Proveedor

**Backend:**
```typescript
// apps/api/src/email/email-config.controller.ts
@Controller('email-config')
export class EmailConfigController {
  // GET /api/v1/email-config
  @Get()
  async getConfig() {}
  
  // POST /api/v1/email-config
  @Post()
  async setConfig(@Body() data: EmailConfigDto) {}
  
  // POST /api/v1/email-config/test
  @Post('test')
  async testConfig(@Body() data: EmailConfigDto) {}
}
```

**Schema Prisma:**
```prisma
model EmailConfig {
  id          String   @id @default(cuid())
  tenantId    String   @unique
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  proveedor   String   // 'sendgrid', 'mailgun', 'ses', 'smtp'
  apiKey      String?  @db.Text // Encriptado
  smtpHost    String?
  smtpPort    Int?
  smtpUser    String?
  smtpPass    String?  @db.Text // Encriptado
  fromEmail   String
  fromName    String
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Frontend:**

Panel de configuración en `/dashboard/configuracion/email`:

- Selector de proveedor
- Formularios específicos por proveedor
- Test de envío
- Estado de conexión

### 5. Gestión de Límites de Planes

**Backend:**
```typescript
// apps/api/src/plans/plans.controller.ts
@Controller('plans')
export class PlansController {
  // GET /api/v1/plans
  @Get()
  async getPlans() {}
  
  // POST /api/v1/plans (admin)
  @Post()
  async createPlan(@Body() data: CreatePlanDto) {}
  
  // PATCH /api/v1/plans/:id (admin)
  @Patch(':id')
  async updatePlan(@Param('id') id: string, @Body() data: UpdatePlanDto) {}
  
  // GET /api/v1/plans/usage (tenant)
  @Get('usage')
  async getUsage() {}
}
```

**Schema Prisma:**
```prisma
model Plan {
  id                  String   @id @default(cuid())
  nombre              String   @unique
  descripcion         String?
  precio              Decimal  @db.Decimal(10, 2)
  limiteFacturas      Int      // Facturas por mes
  limiteUsuarios      Int
  limiteClientes      Int
  soportePrioritario  Boolean  @default(false)
  apiAccess           Boolean  @default(false)
  activo              Boolean  @default(true)
  features            Json?    // Features adicionales
  tenants             Tenant[]
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model PlanUsage {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  mes             Int
  anio            Int
  facturasUsadas  Int      @default(0)
  usuariosActivos Int      @default(0)
  clientesActivos Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([tenantId, mes, anio])
}
```

**Frontend:**

- Admin: `/admin/planes` (ya existe, completar funcionalidad)
- Tenant: Dashboard con widget de uso de plan

## 📝 METODOLOGÍA REPUBLICODE

**Debes seguir estrictamente:**

1. **Plan First:** Antes de codear, genera un plan detallado con:
   - Análisis de archivos a modificar
   - Orden de implementación
   - Dependencias
   - Verificación de consistencia

2. **Subagent Strategy:** Divide tareas complejas en subagentes:
   - Backend implementation
   - Frontend implementation
   - Database migrations
   - Testing

3. **Self-Improvement Loop:** 
   - Después de cada corrección, actualiza `tasks/lessons.md`
   - Documenta patrones y anti-patrones

4. **Verification Before Done:**
   - Nunca marcar completo sin evidencia
   - Diff de cambios
   - Tests ejecutados
   - Build exitoso

5. **Autonomous Bug Fixing:**
   - Si encuentras un bug, arréglalo sin preguntar
   - Documenta en lessons.md

## 🎨 DISEÑO Y UX

**Brand Republicode:**
- Color primario: Deep Purple (#5B21B6)
- Efectos: Glassmorphism, gradientes suaves
- Typography: Inter
- Spacing: Generoso, aire respirable

**Componentes:**
- Usa shadcn/ui exclusivamente
- Mantén consistencia con componentes existentes
- Mobile-first approach

## ✅ ACCEPTANCE CRITERIA

Para marcar Fase 1 como completada:

**Backend:**
- [ ] Todos los endpoints implementados y funcionando
- [ ] Schemas Prisma aplicados con migraciones
- [ ] Tests unitarios básicos (opcional pero recomendado)
- [ ] Swagger documentation actualizada

**Frontend:**
- [ ] Todas las vistas implementadas y accesibles
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Validación de formularios
- [ ] Loading states y error handling

**Integración:**
- [ ] Backend y frontend conectados
- [ ] Flujos end-to-end funcionales
- [ ] Build exitoso sin errores
- [ ] Deploy a staging/producción

**Documentación:**
- [ ] README actualizado con nuevas features
- [ ] API docs actualizadas
- [ ] Lessons aprendidas documentadas

## 🚫 LO QUE NO DEBES HACER

- ❌ No uses console.log en producción (usa logger)
- ❌ No hardcodees URLs (usa env vars)
- ❌ No ignores errores (manéjalos apropiadamente)
- ❌ No uses `any` en TypeScript
- ❌ No omitas validación de datos
- ❌ No hagas commits sin mensaje descriptivo

## 📊 PRIORIDADES

**Alta:**
1. Sistema de Catálogos (crítico para facturación)
2. Gestión de límites de planes (necesario para monetización)

**Media:**
3. Sistema de tickets de soporte
4. Configuración de email

**Baja:**
5. Sistema de migración de datos (nice to have)

## 🔗 ARCHIVOS DE CONTEXTO

Lee estos archivos antes de empezar:
- `tasks/architecture.md` - Arquitectura del sistema
- `tasks/prisma-schemas.md` - Schemas actuales
- `tasks/todo.md` - TODO master actualizado
- `tasks/session-2026-02-08.md` - Resumen Fase 0
- `tasks/lessons.md` - Lecciones aprendidas

## 🎯 ENTREGABLES ESPERADOS

Al final de Fase 1, espero:

1. **Código:**
   - Branch `feature/fase-1` con todos los cambios
   - Pull request detallado
   - Build passing

2. **Database:**
   - Migraciones aplicadas
   - Seeders para catálogos iniciales

3. **Documentación:**
   - `tasks/session-fase-1.md` con resumen
   - `tasks/lessons.md` actualizado
   - API docs actualizadas

4. **Demo:**
   - Video/screenshots de features funcionando
   - Instrucciones de testing

## 🚀 PARA EMPEZAR

1. Lee todos los archivos de contexto
2. Genera un plan detallado de implementación
3. Presenta el plan para revisión
4. Comienza por los catálogos (prioridad alta)
5. Commits frecuentes con mensajes descriptivos

## ❓ SI TIENES DUDAS

- Consulta `tasks/architecture.md` para decisiones de arquitectura
- Revisa código existente para mantener consistencia
- Pregunta antes de hacer cambios que afecten múltiples módulos
- Documenta cualquier decisión importante

---

**¡Manos a la obra! Fase 0 fue un éxito, hagamos de Fase 1 otro hito importante.** 🚀
