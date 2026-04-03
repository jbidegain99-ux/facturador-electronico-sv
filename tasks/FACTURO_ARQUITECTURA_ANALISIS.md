# FACTURO (Facturador Electrónico SV) - ANÁLISIS DE ARQUITECTURA

**Fecha:** 2026-03-15
**Objetivo:** Documentar la arquitectura completa de Facturo para adaptación a TalentOS
**Autor:** Audit automatizado con Claude Code

---

## Resumen Ejecutivo

Facturo es una **plataforma SaaS multi-tenant de facturación electrónica** para El Salvador. Permite a empresas (tenants) emitir, firmar digitalmente y transmitir los 10 tipos de Documentos Tributarios Electrónicos (DTE) al Ministerio de Hacienda. Está construido como un monorepo con **NestJS** (backend), **Next.js 14** (frontend), **Prisma ORM** sobre **Azure SQL Server**, desplegado en **Azure App Service**.

La arquitectura implementa multi-tenancy por **row-level filtering** (columna `tenantId` en todas las tablas), autenticación **JWT** con roles (SUPER_ADMIN, ADMIN, FACTURADOR), sistema de **planes con feature gating** (Starter/Professional/Enterprise), **soporte con tickets y SLA**, **webhooks con retry**, **contabilidad automatizada**, y **audit logging** completo.

El sistema soporta un flujo completo: registro de empresa → configuración de certificado digital → emisión de DTE → firma RS256 → transmisión a Hacienda → contabilidad automática → notificación por email → webhooks a sistemas externos.

---

## 1. ESTRUCTURA DEL MONOREPO

```
facturador-electronico-sv/
├── apps/
│   ├── api/                    # Backend NestJS
│   │   ├── prisma/
│   │   │   └── schema.prisma   # 1,582 líneas, 35+ modelos
│   │   └── src/
│   │       ├── main.ts         # Bootstrap (port 3001)
│   │       ├── app.module.ts   # 30 módulos importados
│   │       ├── common/         # Decorators, DTOs, guards compartidos
│   │       └── modules/        # 30 módulos de negocio
│   │
│   └── web/                    # Frontend Next.js 14
│       ├── next.config.js      # Standalone output, next-intl
│       ├── messages/           # i18n (en.json, es.json)
│       └── src/
│           ├── app/            # App Router (route groups)
│           ├── components/     # 14 directorios de componentes
│           ├── hooks/          # useApi, useMutation, usePlanFeatures
│           ├── lib/            # api.ts, utils.ts
│           ├── store/          # Zustand store
│           ├── types/          # TypeScript interfaces
│           └── i18n/           # Configuración next-intl
│
├── packages/
│   ├── shared/                 # Tipos y schemas Zod compartidos
│   └── mh-client/              # Cliente API Ministerio de Hacienda
│
├── docker-compose.yml          # postgres:16 + redis:7 + api + web
├── turbo.json                  # Turborepo config
└── package.json                # npm workspaces, Node >= 20
```

---

## 2. STACK TECNOLÓGICO

### Frontend
| Categoría | Tecnología |
|-----------|-----------|
| **Framework** | Next.js 14.1.0 (App Router) |
| **Lenguaje** | TypeScript 5 |
| **State Management** | Zustand 4.5.0 |
| **Data Fetching** | TanStack React Query 5.17 + custom hooks (`useApi`, `useMutation`) |
| **Auth** | JWT en localStorage (NextAuth instalado pero no usado) |
| **HTTP** | `fetch()` nativo con wrapper (`createApiFetcher`) |
| **UI Components** | shadcn/ui (Radix UI primitives) |
| **Styling** | Tailwind CSS 3.3 + Framer Motion 12.33 |
| **Icons** | Lucide React 0.312 |
| **Charts** | Recharts 3.7 |
| **i18n** | next-intl 4.8.3 (ES/EN) |
| **Testing** | Playwright 1.58 |

### Backend
| Categoría | Tecnología |
|-----------|-----------|
| **Framework** | NestJS 10.3.0 |
| **Lenguaje** | TypeScript 5.4 |
| **ORM** | Prisma 5.10 |
| **Base de datos** | SQL Server (Azure SQL Database) |
| **Auth** | @nestjs/passport + @nestjs/jwt + bcryptjs |
| **Validation** | class-validator + class-transformer + Zod |
| **API Docs** | @nestjs/swagger |
| **Email** | nodemailer (SendGrid-ready) |
| **PDF** | pdfmake + qrcode |
| **Storage** | Azure Blob Storage (@azure/storage-blob) |
| **Security** | helmet + @nestjs/throttler |
| **Scheduling** | @nestjs/schedule (cron jobs) |
| **Crypto** | node-forge + jose (firma digital) |

### Infraestructura
| Categoría | Tecnología |
|-----------|-----------|
| **Hosting API** | Azure App Service |
| **Hosting Web** | Azure App Service (standalone Next.js) |
| **Database** | Azure SQL Database |
| **Storage** | Azure Blob Storage |
| **Monorepo** | Turborepo + npm workspaces |
| **Containers** | Docker (docker-compose para dev) |
| **CI/CD** | Scripts de deploy manuales |

---

## 3. AUTENTICACIÓN

### Auth Provider
- **Provider:** Custom JWT (NestJS + Passport)
- **Token type:** JWT (RS256-compatible)
- **Token location:** `localStorage` (key: `token`)
- **Token expiration:** 8 horas
- **Token refresh:** No implementado (re-login requerido)

### JWT Payload
```typescript
interface JwtPayload {
  sub: string;       // userId
  email: string;
  tenantId: string;  // CRÍTICO: aislamiento multi-tenant
  rol: string;       // SUPER_ADMIN | ADMIN | FACTURADOR
}
```

### Login Flow
1. Usuario navega a `/login`
2. Envía email + password → `POST /api/v1/auth/login`
3. Backend valida credenciales con bcrypt
4. Verifica account lockout (max 5 intentos → 15 min bloqueo)
5. Genera JWT con `{ sub: userId, email, tenantId, rol }`
6. Retorna `{ access_token, user: { id, email, nombre, rol, tenant } }`
7. Frontend guarda token en `localStorage.setItem('token', access_token)`
8. Redirección: `SUPER_ADMIN` → `/admin`, otros → `/dashboard`
9. DashboardLayout valida token y carga perfil via `GET /auth/profile`

### Registration Flow
1. `POST /api/v1/auth/register` con datos empresa + admin
2. Transacción:
   - Crea `Tenant` (empresa)
   - Crea `User` (admin del tenant)
   - Asigna plan TRIAL por defecto
3. Envía email de verificación (token 24h)
4. Validación: NIT único, email empresa ≠ email admin

### Seguridad de Auth
- **Account lockout:** 5 intentos fallidos → 15 min bloqueo
- **Password reset:** Token de 1 hora
- **User enumeration protection:** Forgot password siempre retorna éxito
- **Email verification:** Requerida para activar cuenta
- **Token mismatch:** JWT Strategy valida que `payload.tenantId === user.tenantId` en DB

### Código Clave - JWT Strategy
```typescript
// apps/api/src/modules/auth/strategies/jwt.strategy.ts
async validate(payload: JwtPayload) {
  const user = await this.prisma.user.findUnique({
    where: { id: payload.sub },
    include: { tenant: true },
  });
  if (!user) throw new UnauthorizedException();

  // Previene tokens obsoletos post-reasignación de tenant
  if (payload.tenantId && payload.tenantId !== user.tenantId) {
    throw new UnauthorizedException('Token tenant mismatch');
  }

  return {
    id: user.id, email: user.email,
    tenantId: user.tenantId, rol: user.rol,
    tenant: user.tenant,
  };
}
```

### Código Clave - JWT Auth Guard (Global)
```typescript
// apps/api/src/modules/auth/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}

// Aplicado GLOBALMENTE en app.module.ts:
{ provide: APP_GUARD, useClass: JwtAuthGuard }
```

### Código Clave - Frontend API Client
```typescript
// apps/web/src/lib/api.ts
export function createApiFetcher(baseUrl: string = '') {
  return async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
    if (!response.ok) throw new Error(errorData.message || `HTTP error ${response.status}`);
    return response.json();
  };
}
```

---

## 4. MULTI-TENANCY

### Identificación del Tenant
- [x] `tenantId` en JWT payload
- [ ] Subdomain (no usado)
- [ ] URL path (no usado)

### Dónde se usa tenantId
- [x] Auth token (JWT payload)
- [x] Zustand store (frontend)
- [ ] URL
- [x] localStorage (indirectamente via JWT)
- [ ] Backend session

### Estrategia de Data Isolation
- [x] **Option C: Row-level filtering** (1 DB, 1 schema, columna `tenantId` en todas las tablas)

### Implementación
Cada tabla de negocio tiene `tenantId String` como FK a `Tenant.id`. Todos los queries filtran por `where: { tenantId }` obtenido del JWT validado.

```typescript
// Patrón en TODOS los controllers:
@Get()
findAll(@Request() req: AuthRequest) {
  return this.service.findByTenant(req.user.tenantId);
}

// Patrón en TODOS los services:
async findByTenant(tenantId: string) {
  return this.prisma.dte.findMany({
    where: { tenantId },
  });
}
```

### Constraint de Unicidad por Tenant
```prisma
model DTE {
  @@unique([tenantId, numeroControl])
}
model Cliente {
  @@unique([tenantId, numDocumento])
}
model Sucursal {
  @@unique([tenantId, codEstableMH])
}
```

### Super Admin vs Tenant User
- **Campo `rol` en tabla `User`:** `SUPER_ADMIN` | `ADMIN` | `FACTURADOR`
- Super Admin tiene `tenantId` null o especial
- Guard dedicado: `SuperAdminGuard` verifica `user.rol !== 'SUPER_ADMIN'` → 403

```typescript
// apps/api/src/modules/super-admin/guards/super-admin.guard.ts
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    if (!user || user.rol !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Se requiere rol de Super Administrador.');
    }
    return true;
  }
}
```

### Custom Decorators
```typescript
// apps/api/src/common/decorators/current-user.decorator.ts
export interface CurrentUserData {
  id: string;
  email: string;
  tenantId: string | null;
  rol: string;
  tenant?: { id: string; nombre: string } | null;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;
    return data ? user[data] : user;
  },
);
```

---

## 5. RBAC (Role-Based Access Control)

### Roles Definidos
| Rol | Scope | Permisos |
|-----|-------|----------|
| `SUPER_ADMIN` | Plataforma completa | Gestionar todos los tenants, planes, soporte, logs, backups |
| `ADMIN` | Su propio tenant | CRUD completo de DTEs, clientes, config, usuarios del tenant |
| `FACTURADOR` | Su propio tenant (limitado) | Crear/ver DTEs, clientes (rol por defecto) |

### Protección de Endpoints

**Patrón 1: Guard Global (JwtAuthGuard)**
Todos los endpoints requieren JWT por defecto. Solo `@Public()` los exenta.

**Patrón 2: SuperAdminGuard**
```typescript
@Controller('super-admin')
@UseGuards(SuperAdminGuard)
export class SuperAdminController {
  @Get('tenants')
  getAllTenants() { /* Solo super admins */ }
}
```

**Patrón 3: PlanFeatureGuard + @RequireFeature**
```typescript
@Post('me/logo')
@UseGuards(AuthGuard('jwt'), PlanFeatureGuard)
@RequireFeature('logo_branding')  // Solo plan Professional+
async uploadLogo() { }
```

### Row-Level Security
- [x] `WHERE tenantId = current_user.tenantId` en queries (via Prisma)
- [ ] Middleware automático (no existe)
- [ ] DB-level RLS policies (no implementado)

Cada service recibe `tenantId` del controller y lo usa en el `where` de Prisma. Es responsabilidad de cada service filtrar.

---

## 6. BASE DE DATOS

### Modelos Principales (35+ en Prisma Schema)

#### Core
```prisma
model Tenant {
  id              String    @id @default(cuid())
  nombre          String
  nit             String    @unique
  nrc             String?
  correo          String
  plan            String    @default("TRIAL")
  planId          String?
  maxDtesPerMonth Int       @default(50)
  maxUsers        Int       @default(5)
  maxClientes     Int       @default(100)
  logoUrl         String?
  primaryColor    String?
  activo          Boolean   @default(true)
  demoMode        Boolean   @default(false)
  // + 40 relaciones
}

model User {
  id                         String    @id @default(cuid())
  email                      String    @unique
  password                   String
  nombre                     String
  rol                        String    @default("FACTURADOR")
  tenantId                   String?
  emailVerified              Boolean   @default(false)
  emailVerificationToken     String?
  failedLoginAttempts        Int       @default(0)
  accountLockedUntil         DateTime?
  passwordResetToken         String?
  passwordResetExpiresAt     DateTime?
}

model DTE {
  id                String    @id @default(cuid())
  tenantId          String
  tipoDte           String    // 01|03|04|05|06|07|09|11|14|34
  codigoGeneracion  String    @unique
  numeroControl     String
  estado            String    @default("PENDIENTE")
  selloRecepcion    String?
  jsonDte           String    @db.NVarChar(Max)
  totalOperacion    Decimal
  clienteId         String?
  sucursalId        String?
  ambiente          String    @default("00")
  @@unique([tenantId, numeroControl])
  @@index([tenantId, estado, createdAt])
}

model Cliente {
  id              String    @id @default(cuid())
  tenantId        String
  nombre          String
  numDocumento    String
  tipoDocumento   String
  email           String?
  telefono        String?
  @@unique([tenantId, numDocumento])
}
```

#### Planes y Subscripciones
```prisma
model Plan {
  id          String    @id @default(cuid())
  nombre      String
  codigo      String    @unique
  descripcion String?
  precio      Decimal
  activo      Boolean   @default(true)
  maxDtes     Int       @default(50)
  maxUsers    Int       @default(5)
  maxClientes Int       @default(100)
  maxStorage  Int       @default(1)
  features    PlanFeature[]
  tenants     Tenant[]
}

model PlanFeature {
  id        String  @id @default(cuid())
  planId    String
  feature   String
  enabled   Boolean @default(true)
  @@unique([planId, feature])
}

model TenantFeatureUsage {
  id        String  @id @default(cuid())
  tenantId  String
  feature   String
  used      Int     @default(0)
  limit     Int
  period    String
}
```

#### Soporte
```prisma
model SupportTicket {
  id              String    @id @default(cuid())
  tenantId        String
  ticketNumber    String    @unique  // TKT-YYYYMMDD-XXXX
  type            String    // BILLING|TECHNICAL|GENERAL|FEATURE_REQUEST
  subject         String
  description     String    @db.NVarChar(Max)
  status          String    @default("PENDING")
  priority        String    @default("MEDIUM")
  requesterId     String
  assignedToId    String?
  resolution      String?
  slaResponseHours Int?
  slaDeadline     DateTime?
  comments        TicketComment[]
  activities      TicketActivity[]
  attachments     TicketAttachment[]
}
```

#### Contabilidad
```prisma
model AccountingAccount {
  id        String  @id @default(cuid())
  tenantId  String
  codigo    String
  nombre    String
  tipo      String  // ACTIVO|PASIVO|PATRIMONIO|INGRESO|GASTO
}

model JournalEntry {
  id          String  @id @default(cuid())
  tenantId    String
  dteId       String?
  fecha       DateTime
  descripcion String
  debe        Decimal
  haber       Decimal
  cuentaId    String
}
```

#### Audit
```prisma
model AuditLog {
  id           String    @id @default(cuid())
  tenantId     String?
  userId       String?
  userEmail    String?
  action       String    // CREATE|UPDATE|DELETE|LOGIN|EXPORT|SIGN|TRANSMIT
  module       String    // DTE|USER|CLIENT|PAYMENT|INVOICE
  entityType   String?
  entityId     String?
  oldValue     String?   @db.NVarChar(Max)
  newValue     String?   @db.NVarChar(Max)
  ipAddress    String?
  userAgent    String?
  success      Boolean   @default(true)
  createdAt    DateTime  @default(now())
}
```

#### Otros Modelos
- **RecurringInvoiceTemplate** - Templates para facturas recurrentes
- **CatalogItem / CatalogCategory** - Catálogo de productos/servicios
- **Quote** - Cotizaciones B2B
- **WebhookEndpoint / WebhookDelivery** - Webhooks outbound
- **DTELog** - Historial de acciones por DTE
- **Sucursal / PuntoVenta** - Sucursales y puntos de venta
- **TenantEmailConfig** - Config email multi-provider (8 providers)
- **EmailHealthCheck / EmailSendLog** - Monitoreo de email
- **TenantOnboarding** - Workflow de onboarding (13 pasos)
- **SystemNotification** - Notificaciones in-app con targeting
- **HaciendaConfig** - Config API Hacienda por tenant
- **ImportJob** - Tracking de importación de datos
- **PaymentMethod** - Métodos de pago por DTE

### Migrations
- **Herramienta:** Prisma migrations (`prisma migrate` / `prisma db push`)
- Base de datos única con aislamiento por columna `tenantId`

---

## 7. PLANES Y SUBSCRIPCIONES

### Planes Definidos
```typescript
// apps/api/src/common/plan-features.ts
STARTER:      { dtes: 300,  customers: 100, users: 3,  storage: 1GB }
PROFESSIONAL: { dtes: 2000, customers: 500, users: 10, storage: 10GB }
ENTERPRISE:   { dtes: -1,   customers: -1,  users: -1, storage: -1 } // Ilimitado
```

### Features por Plan
| Feature | Starter | Professional | Enterprise |
|---------|---------|-------------|-----------|
| invoicing | Y | Y | Y |
| accounting | Y | Y | Y |
| catalog | Y | Y | Y |
| basic_reports | Y | Y | Y |
| email_support | Y | Y | Y |
| recurring_invoices | - | Y | Y |
| quotes_b2b | - | Y | Y |
| advanced_reports | - | Y | Y |
| webhooks | - | Y | Y |
| api_full | - | Y | Y |
| logo_branding | - | Y | Y |
| priority_support | - | Y | Y |
| phone_support | - | - | Y |
| sso | - | - | Y |
| dedicated_support | - | - | Y |
| accounting_automation | - | - | Y |

### Feature Gating Implementation
```typescript
// Backend: PlanFeatureGuard + @RequireFeature decorator
@UseGuards(PlanFeatureGuard)
@RequireFeature('webhooks')
@Post('webhook-endpoints')
async createWebhook() { /* Solo Professional+ */ }

// Backend: Limit checking
async checkLimit(tenantId: string, resource: 'dte'|'user'|'cliente'): Promise<boolean> {
  const usage = await this.getTenantUsage(tenantId);
  return usage.current < usage.limit; // -1 = unlimited
}

// Frontend: usePlanFeatures() hook
const { features, limits, loading } = usePlanFeatures();
if (features.webhooks) { /* Mostrar sección webhooks */ }
```

### Tracking de Usage
- `TenantFeatureUsage` tabla rastrea uso mensual
- `PlansService.checkLimit()` previene creación cuando se excede el límite
- Notificación al 90% de uso via `NotificationsService.createPlanLimitWarning()`

---

## 8. SISTEMA DE SOPORTE

### Arquitectura
- [x] Tabla `SupportTicket` + `TicketComment` + `TicketActivity` + `TicketAttachment`
- Sistema interno completo con SLA tracking

### Flujo de Ticket
1. Tenant user navega a `/soporte`
2. Crea ticket: type, subject, description, priority
3. `POST /api/v1/support/tickets` genera `TKT-YYYYMMDD-XXXX`
4. SLA se calcula automáticamente según plan del tenant
5. Email enviado al requester (confirmación) y super admins (alerta)
6. Super admin ve ticket en `/admin/support`
7. Super admin asigna, cambia status, agrega comentarios
8. Comentarios pueden ser `isInternal: true` (solo admins ven)
9. Status: `PENDING -> ASSIGNED -> IN_PROGRESS -> WAITING_CUSTOMER -> RESOLVED -> CLOSED`
10. Cada cambio genera `TicketActivity` y notificación email

### Notificaciones de Soporte
- [x] Email (templates: ticketCreated, statusChanged, reply, newAdmin, attachment)
- [ ] In-app notification
- [ ] Webhook

---

## 9. AUDITORÍA Y LOGGING

### Audit Logs
```typescript
// apps/api/src/modules/audit-logs/audit-logs.service.ts
async log(options: {
  userId, userEmail, userName, userRole,
  tenantId, tenantNombre,
  action: 'CREATE'|'UPDATE'|'DELETE'|'LOGIN'|'EXPORT'|'SIGN'|'TRANSMIT',
  module: 'DTE'|'USER'|'CLIENT'|'PAYMENT'|'INVOICE',
  entityType, entityId,
  oldValue, newValue,
  metadata,
  ipAddress, userAgent, requestPath, requestMethod,
  success, errorMessage
})
```

### Acciones Registradas
- Login/Logout: si
- Crear DTE: si
- Firmar DTE: si
- Transmitir DTE: si
- CRUD Clientes: si
- Cambio de plan: si
- Acciones de super admin: si

### Acceso y Retención
- Solo super admin ve audit logs (vía `/admin/logs`)
- Tenant admin NO tiene acceso a audit logs en la UI
- **90 días** de retención (`cleanOldLogs(daysToKeep=90)`)
- No hay archivado automático

### Logging Framework
- Backend: NestJS built-in Logger
- Frontend: Console + custom toast notifications
- No hay Winston, Pino, Sentry, LogRocket

---

## 10. SISTEMA DE WEBHOOKS

### Arquitectura
- Cron-based delivery (cada 30 segundos via `@Cron`)
- Sin dependencia de Redis/BullMQ
- Idempotente con correlation IDs
- Exponential backoff con jitter

### Eventos Soportados
| Evento | Descripción |
|--------|-------------|
| `dte.created` | DTE creado, listo para firmar |
| `dte.signed` | DTE firmado digitalmente |
| `dte.transmitted` | Enviado a Hacienda |
| `dte.approved` | Aprobado por Hacienda |
| `dte.rejected` | Rechazado por Hacienda |
| `invoice.paid` | Pago confirmado |
| `client.created` | Nuevo cliente creado |
| `quote.approved` | Cotización aceptada |

### Delivery
- Estados: `PENDING -> SENDING -> DELIVERED | FAILED -> DEAD_LETTER`
- Retry: exponential backoff `baseDelay * 2^(attempt-1) + jitter`
- Firma: `HMAC-SHA256` del payload
- Headers: `X-Webhook-Signature-256`, `X-Webhook-Timestamp`, `X-Webhook-Delivery`
- Batch: 50 deliveries por ciclo de cron

---

## 11. FLUJOS PRINCIPALES

### 11.1 Signup de Nuevo Tenant

```
1. Usuario -> /register
2. Llena: nombre empresa, NIT, NRC, email empresa, nombre admin, email admin, password
3. POST /api/v1/auth/register
4. Backend (transaccion):
   a. Valida NIT unico
   b. Valida email empresa != email admin
   c. Hash password con bcrypt (salt: 10)
   d. Crea Tenant (plan: "TRIAL", maxDtes: 50, maxUsers: 5)
   e. Crea User (rol: "ADMIN", tenantId: tenant.id)
   f. Genera emailVerificationToken (32 bytes hex)
   g. Envia email verificacion
5. Retorna { message: "Verificar email" }
6. Usuario click link verificacion -> GET /auth/verify-email/:token
7. Backend marca emailVerified = true
8. Usuario login -> JWT generado
9. Frontend guarda JWT en localStorage
10. Redirige a /dashboard
11. DashboardLayout: GET /auth/profile + GET /tenants/me
12. Si no tiene config Hacienda -> muestra banner onboarding
```

### 11.2 Crear y Transmitir DTE (Factura)

```
1. Usuario -> /facturas/nueva
2. Selecciona tipo DTE (01-34)
3. Selecciona/crea cliente (receptor)
4. Agrega items (producto, cantidad, precio)
5. Sistema calcula: subtotal, IVA (13%), retencion, total
6. POST /api/v1/dte (JSON completo del DTE)
7. Backend:
   a. Genera codigoGeneracion (UUID v4)
   b. Obtiene siguiente numeroControl (correlativo por tenant)
   c. Detecta ambiente (00=test, 01=produccion) de HaciendaConfig
   d. Normaliza JSON segun tipo DTE
   e. Find/Create Cliente del receptor
   f. Crea registro DTE (estado: PENDIENTE)
   g. Registra DTELog
   h. Trigger webhook: dte.created
   i. AUTO-SIGN:
      - Carga certificado .p12 del tenant
      - Descifra password del certificado
      - Firma con RS256 (JWT)
      - Estado -> FIRMADO
   j. AUTO-TRANSMIT:
      - Obtiene token MH (OAuth)
      - POST a API Hacienda
      - Recibe selloRecepcion
      - Estado -> PROCESADO
      - Guarda selloRecepcion, fechaRecepcion
   k. Envia email con DTE al cliente
   l. Trigger webhook: dte.approved
   m. Trigger contabilidad:
      - Crea JournalEntry (DR: Cuentas por Cobrar, CR: Ventas + IVA)
8. Retorna DTE completo con sello de Hacienda
9. Frontend muestra confetti + redirect a detalle
```

### 11.3 Super Admin Gestiona Tenant

```
1. Super admin -> /admin/tenants
2. Lista todos los tenants con metricas
3. Click en tenant -> /admin/tenants/:id
4. Ve: info empresa, plan actual, DTEs emitidos, usuarios
5. Puede: cambiar plan, activar/desactivar, ver logs
6. PUT /api/v1/super-admin/tenants/:id { planId, activo, ... }
7. Backend actualiza tenant + AuditLog
```

---

## 12. FRONTEND - RUTAS COMPLETAS

### Rutas de Auth `(auth)`
- `/login` - Login de usuario
- `/register` - Registro de empresa
- `/forgot-password` - Solicitar reset
- `/reset-password/[token]` - Resetear password
- `/verify-email/[token]` - Verificar email

### Rutas de Dashboard `(dashboard)`
- `/dashboard` - Dashboard principal
- `/facturas` - Lista de facturas
- `/facturas/nueva` - Crear factura (wizard multi-step)
- `/facturas/[id]` - Detalle factura
- `/facturas/recurrentes` - Facturas recurrentes
- `/cotizaciones` - Cotizaciones
- `/cotizaciones/nueva` - Crear cotizacion
- `/cotizaciones/[id]` - Detalle cotizacion
- `/clientes` - Gestion de clientes
- `/catalogo` - Catalogo de productos/servicios
- `/cash-flow` - Flujo de caja
- `/reportes` - Reportes y analytics
- `/contabilidad` - Modulo contable (balance, diario, mayor, resultados)
- `/webhooks` - Configuracion webhooks (PRO)
- `/configuracion` - Settings (hacienda, email, sucursales, plan, migracion)
- `/onboarding` - Onboarding inicial
- `/perfil` - Perfil de usuario
- `/soporte` - Tickets de soporte

### Rutas de Super Admin `(super-admin)`
- `/admin` - Dashboard admin
- `/admin/tenants` - Gestionar empresas
- `/admin/tenants/[id]` - Detalle empresa
- `/admin/support` - Tickets de soporte (todos)
- `/admin/admins` - Gestionar admins
- `/admin/planes` - Gestionar planes
- `/admin/catalogos` - Catalogos globales
- `/admin/logs` - Audit logs
- `/admin/notificaciones` - Notificaciones sistema
- `/admin/webhooks` - Webhooks globales
- `/admin/backups` - Backups

### Rutas Publicas
- `/` - Landing page
- `/approve/[token]` - Aprobacion por email
- `/terminos` - Terminos y condiciones
- `/privacidad` - Politica de privacidad

---

## 13. MODULOS API (30 modulos)

| # | Modulo | Proposito |
|---|--------|-----------|
| 1 | `auth` | Login, register, JWT, password reset, email verification |
| 2 | `tenants` | CRUD de tenants, perfil, branding |
| 3 | `dte` | Core: 10 tipos DTE, lifecycle completo |
| 4 | `signer` | Firma digital RS256 con certificados |
| 5 | `transmitter` | Transmision a API Hacienda |
| 6 | `hacienda` | Config de integracion MH |
| 7 | `mh-auth` | Tokens OAuth de Hacienda |
| 8 | `clientes` | Gestion de clientes por tenant |
| 9 | `catalog` | Catalogo de productos/servicios |
| 10 | `catalog-items` | Items individuales del catalogo |
| 11 | `catalogos-admin` | Catalogos globales (actividades, paises) |
| 12 | `quotes` | Cotizaciones B2B |
| 13 | `recurring-invoices` | Facturas recurrentes programadas |
| 14 | `accounting` | Contabilidad: cuentas, diario, automatizacion |
| 15 | `reports` | Reportes: por tipo, periodo, retenciones, CSV |
| 16 | `cash-flow` | Flujo de caja: resumen, alertas, forecast |
| 17 | `payments` | Metodos de pago con mapeo contable |
| 18 | `dashboard` | Metricas y estadisticas del dashboard |
| 19 | `plans` | Planes SaaS, feature gating, limites |
| 20 | `super-admin` | Operaciones de super admin |
| 21 | `support` | Tickets con SLA, comentarios, attachments |
| 22 | `email-config` | Config SMTP/API por tenant (8 providers) |
| 23 | `notifications` | Notificaciones in-app con targeting |
| 24 | `onboarding` | Workflow de onboarding (13 pasos) |
| 25 | `migration` | Migracion de datos legacy |
| 26 | `audit-logs` | Audit trail completo |
| 27 | `backups` | Gestion de backups |
| 28 | `webhooks` | Webhooks outbound con retry |
| 29 | `sucursales` | Sucursales y puntos de venta |
| 30 | `health` | Health check endpoint |

---

## 14. RATE LIMITING

```typescript
// Global (app.module.ts)
ThrottlerModule.forRoot([
  { name: 'short',  ttl: 1000,    limit: 20 },    // 20 req/seg
  { name: 'medium', ttl: 60000,   limit: 300 },   // 300 req/min
  { name: 'long',   ttl: 3600000, limit: 5000 },  // 5000 req/hora
])

// Login endpoint (mas restrictivo)
@Throttle({
  short:  { limit: 5,  ttl: 1000 },
  medium: { limit: 10, ttl: 60000 },
  long:   { limit: 50, ttl: 3600000 }
})
```

---

## 15. SISTEMA DE NOTIFICACIONES

### Notificaciones In-App
- Modelo `SystemNotification` con targeting:
  - `ALL_USERS`, `ALL_TENANTS`, `SPECIFIC_TENANT`, `SPECIFIC_USER`, `BY_PLAN`
- Tipos: `GENERAL`, `PLAN_LIMIT_WARNING`, `MAINTENANCE`, `FEATURE_ANNOUNCEMENT`
- Prioridad: `LOW`, `MEDIUM`, `HIGH`
- Dismissable, showOnce, expiresAt, actionUrl
- Frontend: polling cada 60 segundos desde header

### Email Templates
- DTE enviado al cliente
- Verificacion de email
- Password reset
- Ticket creado/actualizado/comentado
- Welcome post-verificacion
- Plan limit warning

---

## 16. PACKAGES COMPARTIDOS

### @facturador/shared
- **Proposito:** Tipos y schemas Zod compartidos entre frontend y backend
- **Contenido:** Tipos DTE, enums, constantes, schemas de validacion

### @facturador/mh-client
- **Proposito:** Cliente HTTP para API del Ministerio de Hacienda
- **Contenido:** Auth, recepcion de DTEs, tipos, config (TEST/PRODUCTION)

---

## 17. DTE - CORE DEL NEGOCIO

### 10 Tipos de DTE Soportados
| Codigo | Nombre | Descripcion |
|--------|--------|-------------|
| 01 | Factura | Factura de consumidor final |
| 03 | Credito Fiscal | Comprobante de credito fiscal |
| 04 | Nota de Remision | Documento de envio |
| 05 | Nota de Credito | Ajuste a favor del cliente |
| 06 | Nota de Debito | Ajuste a favor del emisor |
| 07 | Comprobante de Retencion | Certificado de retencion |
| 09 | Documento Contable de Liquidacion | Documento de liquidacion |
| 11 | Factura de Exportacion | Factura para exportaciones (0% IVA) |
| 14 | Sujeto Excluido | Factura a sujeto excluido |
| 34 | Retencion CRS | Retencion Common Reporting Standard |

### Lifecycle de un DTE
```
PENDIENTE -> FIRMADO -> ENVIADO -> PROCESADO (aprobado por MH)
                                 -> RECHAZADO (rechazado por MH)
                                 -> ANULADO (anulado post-aprobacion)
                                 -> ERROR
```

### Demo Mode
- Cuando `DEMO_MODE=true` o plan es TRIAL/DEMO
- Simula respuesta de Hacienda sin llamar API real
- Auto-firma sin certificado real
- Genera selloRecibido demo
- Marca DTEs como PROCESADO sin transmision

### Calculos Especiales por Tipo
- **Tipo 07 (Retencion):** usa `totalSujetoRetencion` / `totalIVAretenido`
- **Tipo 34 (CRS):** usa `totalRetenido`
- **Tipo 09 (Liquidacion):** usa `liquidoApagar`
- **Tipo 11 (Exportacion):** 0% IVA
- **Tipo 14 (Sujeto Excluido):** manejo especial sin IVA

---

## 18. CONTABILIDAD AUTOMATIZADA

### Triggers
- `ON_CREATED` - Entrada inmediata al crear DTE
- `ON_APPROVED` - Despues de aprobacion MH
- `ON_PAID` - Despues de confirmacion de pago

### Mapeo Contable por Metodo de Pago
| Metodo | Cuenta Contable |
|--------|----------------|
| EFECTIVO | 1001 (Caja) |
| TRANSFERENCIA | 1105 (Bancos) |
| CHEQUE | 1106 (Cheques por Cobrar) |
| TARJETA | 1201 (CxC Tarjeta) |
| OTRA | 1102 (Otros) |

### Journal Entry Generado
```
DR: Cuentas por Cobrar (segun metodo de pago)
CR: Ventas (ingreso)
CR: IVA por Pagar (si aplica)
CR: Retencion por Pagar (si aplica)
```

---

## 19. CASH FLOW Y REPORTES

### Cash Flow
- `getSummary(tenantId, days=30)` - Agregacion por tipo de pago + fecha
- Alertas automaticas:
  - `CHEQUE_VENCIENDO` (>7 dias pendiente)
  - `TRANSFERENCIA_EN_TRANSITO` (>3 dias pendiente)
  - `PAGO_PENDIENTE` (>30 dias pendiente)
- Severidad: CRITICAL / WARNING / INFO

### Reportes
- Por tipo de DTE (cantidad, total, promedio)
- Por periodo (mensual, trimestral, anual)
- Retenciones (por tipo impuesto, por tasa)
- Top clientes (por monto, por cantidad)
- Exportaciones (por pais)
- Export CSV con UTF-8 BOM

---

## 20. GAPS Y PREGUNTAS ABIERTAS

- [ ] **No hay refresh token:** JWT expira en 8h, requiere re-login
- [ ] **No hay middleware automatico de tenant:** Cada service debe filtrar manualmente
- [ ] **NextAuth instalado pero no usado:** Frontend usa JWT en localStorage directamente
- [ ] **No hay RLS a nivel de BD:** Isolation solo a nivel aplicacion (Prisma queries)
- [ ] **No hay SSO implementado:** Listado como feature Enterprise pero sin codigo
- [ ] **Tenant admin no ve audit logs:** Solo super admin tiene acceso
- [ ] **No hay 2FA/MFA**
- [ ] **No hay archivado de audit logs:** Solo borrado despues de 90 dias
- [ ] **Redis en docker-compose pero no usado en codigo:** No hay caching ni queue activo
- [ ] **Tests unitarios minimos:** Directorio `test/` con cobertura minima

---

## 21. DIAGRAMA DE ARQUITECTURA

```
+-------------------------------------------------------------------+
|                        INTERNET                                    |
+-----------+-------------------------------+-----------------------+
            |                               |
  +---------v---------+          +----------v----------+
  |   Next.js 14      |          |   Ministerio de     |
  |   (Frontend)      |          |   Hacienda API      |
  |   Azure App Svc   |          |   (El Salvador)     |
  |                   |          +----------^----------+
  |  - App Router     |                     |
  |  - Zustand store  |                     | DTE Transmission
  |  - shadcn/ui      |                     | (firma + envio)
  |  - next-intl      |                     |
  +---------+---------+                     |
            | fetch + JWT                   |
            | (Bearer token)                |
  +---------v-------------------------------+----------+
  |              NestJS 10 (Backend API)               |
  |              Azure App Service                     |
  |              Port 3001, /api/v1                    |
  |                                                    |
  |  Guards: JwtAuthGuard (global) + ThrottlerGuard    |
  |                                                    |
  |  +--------------------------------------------+   |
  |  |  30 Modules:                                |   |
  |  |  auth, dte, signer, transmitter,            |   |
  |  |  clientes, plans, support, webhooks,        |   |
  |  |  accounting, reports, cash-flow,            |   |
  |  |  notifications, audit-logs, ...             |   |
  |  +---------------------+----------------------+   |
  |                         |                          |
  +-------------------------+--------------------------+
                            | Prisma ORM
                            | tenantId filtering
                +-----------v-----------+
                |   Azure SQL Server    |
                |   (1 Database)        |
                |                       |
                |  Row-level isolation  |
                |  via tenantId column  |
                |                       |
                |  35+ tables:          |
                |  Tenant, User, DTE,   |
                |  Cliente, Plan,       |
                |  SupportTicket,       |
                |  AuditLog, ...        |
                +-----------------------+

    +-------------------+    +-------------------+
    |  Azure Blob       |    |  SMTP/SendGrid    |
    |  Storage          |    |  (Email)          |
    |  (certificates,   |    |                   |
    |   logos, uploads)  |    |  Templates:       |
    |                   |    |  DTE, tickets,    |
    +-------------------+    |  verificacion     |
                             +-------------------+
```

### Request Flow (Authenticated)
```
Client -> Bearer JWT -> JwtAuthGuard -> ThrottlerGuard
  -> Controller (@CurrentUser) -> Service (tenantId filter)
  -> Prisma (WHERE tenantId = ?) -> SQL Server -> Response
```

### Module Dependency Graph
```
DteService
  +-- SignerService (firma digital)
  +-- MhAuthService (tokens Hacienda)
  +-- DefaultEmailService (envio email)
  +-- PdfService (generacion PDF)
  +-- WebhooksService (eventos)
  +-- AccountingAutomationService (asientos contables)
  +-- SucursalesService (info sucursal)
  +-- CertificateService (certificados digitales)
  +-- EncryptionService (descifrado passwords)

PlansService
  +-- getPlanFeatures() (feature flags)
  +-- getTenantUsage() (enforcement de limites)
  +-- checkLimit() (gate de recursos)

SupportService
  +-- DefaultEmailService (notificaciones)
  +-- PlanSupportService (calculo SLA)

WebhooksService
  +-- Cron scheduler (30-second intervals)
  +-- HMAC-SHA256 signing
  +-- Exponential backoff retry
```

---

## 22. MATRIZ DE ADAPTACION A TALENTOS

| Facturo (Facturacion) | TalentOS (Nomina/RRHH) |
|------------------------|------------------------|
| **Tenant** = empresa que factura | **Tenant** = empresa que procesa nomina |
| **DTE** = documento tributario electronico | **Payroll** = planilla de nomina |
| **10 tipos DTE** (01-34) | **Tipos de planilla** (quincenal, mensual, aguinaldo, vacaciones) |
| **Cliente** = receptor de factura | **Employee** = empleado de la empresa |
| **Firma digital** (RS256 + certificado) | **Firma de planilla** (aprobacion jerarquica) |
| **Hacienda API** (transmision DTE) | **ISSS/AFP API** (cotizaciones, reportes) |
| **Item factura** (producto + precio) | **Concepto nomina** (salario base, horas extra, deducciones) |
| **IVA 13%** | **ISR** (tabla progresiva) + **ISSS** + **AFP** |
| **Numero de control** (correlativo) | **Numero de planilla** (correlativo) |
| **Catalogo productos** | **Catalogo puestos/departamentos** |
| **Cotizaciones** | **Contratos laborales** |
| **Facturas recurrentes** | **Nomina recurrente** (cron mensual) |
| **Cash flow** | **Costo laboral por departamento** |
| **Contabilidad automatica** | **Provisiones laborales** (aguinaldo, vacaciones) |
| **Reportes por tipo/periodo** | **Reportes ISSS, AFP, ISR, boletas de pago** |
| **Webhooks** (dte.approved) | **Webhooks** (payroll.processed, employee.onboarded) |
| **Soporte con SLA** | **Soporte con SLA** (reutilizable) |
| **Audit logs** | **Audit logs** (reutilizable) |
| **Plans/Feature gating** | **Plans/Feature gating** (reutilizable) |
| **Email config multi-provider** | **Email config multi-provider** (reutilizable) |
| **Onboarding 13 pasos** | **Onboarding empresa** (config ISSS, AFP, ISR) |
| **Demo mode** | **Demo mode** (datos de ejemplo) |

### Componentes 100% Reutilizables
1. Auth system (JWT, guards, RBAC, lockout, verification)
2. Multi-tenancy (row-level, tenantId en JWT)
3. Plans y feature gating (PlanFeatureGuard, limits, usage tracking)
4. Support ticketing (SLA, comments, attachments, activities)
5. Audit logging (acciones, modulos, old/new values)
6. Webhooks (cron delivery, retry, HMAC signing)
7. Notifications (targeting, dismissal, priorities)
8. Email config (8 providers, encryption, health checks)
9. Rate limiting (throttler tiers)
10. Frontend shell (sidebar, header, theme, i18n, Zustand)

### Componentes que Requieren Adaptacion
1. DTE module -> Payroll module (logica de negocio diferente)
2. Signer/Transmitter -> ISSS/AFP integration (APIs diferentes)
3. Accounting automation -> Provisiones laborales (reglas diferentes)
4. Reports -> Reportes laborales (ISSS, AFP, ISR, boletas)
5. Cash flow -> Costo laboral (metricas diferentes)
6. Clientes -> Employees (modelo de datos diferente)
7. Catalog -> Puestos/Departamentos (estructura diferente)

---

*Documento generado el 2026-03-15 mediante audit automatizado del codebase de Facturo.*
