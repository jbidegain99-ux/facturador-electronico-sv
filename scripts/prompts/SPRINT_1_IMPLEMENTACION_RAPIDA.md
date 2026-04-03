# SPRINT 1 — GUÍA DE IMPLEMENTACIÓN RÁPIDA
## Resolver bloqueantes de seguridad en 10 días

**Objetivo**: Pasar de 6/10 (seguridad) a 9/10 sin regresiones  
**Duración**: 10 días  
**Equipos**: 2-3 developers  

---

## 🚀 INICIO RÁPIDO (Hoy)

### Paso 1: Setup del repositorio

```bash
# Asegúrate de tener rama develop limpia
cd ~/facturador-electronico-sv
git fetch origin
git checkout develop
git pull origin develop
git branch --list  # Verificar develop existe

# Crear rama feature para Sprint 1
git checkout -b feat/sprint-1-security
```

### Paso 2: Crear archivo de tracking

```bash
# En la raíz del proyecto
cat > SPRINT_1_PROGRESS.md << 'EOF'
# Sprint 1 Progress Tracker

- [ ] 1.1 TransmitterController @UseGuards (Dev 1)
- [ ] 1.2 SignerController @UseGuards (Dev 1)
- [ ] 1.3 Rate Limiting (Dev 2)
- [ ] 1.4 Tests Cross-Tenant (QA + Dev 1)
- [ ] 1.5 JWT tenantId Validation (Dev 2)
- [ ] 1.6 E2E Tests (QA)
- [ ] 1.7 Documentación (Tech Lead)

Started: [DATE]
EOF

git add SPRINT_1_PROGRESS.md
git commit -m "docs: add sprint 1 progress tracker"
```

---

## ✅ TAREA 1.1 — TransmitterController @UseGuards (2 horas)

**Dev asignado**: Developer 1 (Backend)  
**Fecha**: Día 1-2  

### Paso 1: Localizar archivos

```bash
# Encontrar TransmitterController
find apps/api/src -name "*transmitter*" -type f
# Output esperado:
# apps/api/src/modules/transmitter/transmitter.controller.ts
# apps/api/src/modules/transmitter/transmitter.service.ts

# Abrir en editor
code apps/api/src/modules/transmitter/transmitter.controller.ts
```

### Paso 2: Aplicar cambios

**ANTES**:
```typescript
// apps/api/src/modules/transmitter/transmitter.controller.ts
@Controller('transmitter')
export class TransmitterController {
  constructor(private transmitterService: TransmitterService) {}

  @Post('send/:dteId')
  async sendDTE(@Param('dteId') dteId: string, @Body() dto: TransmitDto) {
    return this.transmitterService.transmitSync(dteId, dto);
  }
}
```

**DESPUÉS**:
```typescript
// apps/api/src/modules/transmitter/transmitter.controller.ts
import { Controller, Post, Param, Body, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RequestWithUser } from '../../auth/types/request-with-user.interface';

@Controller('transmitter')
@UseGuards(JwtAuthGuard)  // ✅ AGREGAR
export class TransmitterController {
  constructor(
    private transmitterService: TransmitterService,
    private dteService: DteService,  // ✅ AGREGAR
  ) {}

  @Post('send/:dteId')
  async sendDTE(
    @Param('dteId') dteId: string,
    @Body() dto: TransmitDto,
    @Req() req: RequestWithUser,  // ✅ AGREGAR
  ) {
    // ✅ AGREGAR validación de ownership
    const dte = await this.dteService.findByIdAndTenant(
      dteId,
      req.user.tenantId
    );
    if (!dte) {
      throw new NotFoundException('DTE not found');
    }

    return this.transmitterService.transmitSync(dteId, dto, req.user.tenantId);
  }
}
```

### Paso 3: Actualizar tipo de transmitService

```typescript
// apps/api/src/modules/transmitter/transmitter.service.ts

export class TransmitterService {
  // ... métodos existentes ...

  // ✅ AGREGAR tenantId a la firma
  async transmitSync(
    dteId: string,
    dto: TransmitDto,
    tenantId: string,  // ← Agregar
  ) {
    // ... lógica existente, agregar validación:
    const dte = await this.prisma.dte.findUnique({
      where: { id: dteId, tenantId },  // ← Filtrar por tenantId
    });

    if (!dte) {
      throw new NotFoundException('DTE not found');
    }

    // ... resto de la lógica
  }
}
```

### Paso 4: Escribir tests

```typescript
// test/transmitter.e2e.spec.ts
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('TransmitterController (E2E)', () => {
  let app: INestApplication;
  let tenantA: { token: string; id: string; tenantId: string };
  let tenantB: { token: string; id: string; tenantId: string };
  let dteA: { id: string };

  beforeAll(async () => {
    // Setup app y tenants (similar a auditoría)
  });

  describe('POST /transmitter/send/:dteId', () => {
    it('should reject request without auth token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/transmitter/send/dte_123')
        .send({});

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('should reject if DTE belongs to another tenant', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/transmitter/send/${dteA.id}`)
        .set('Authorization', `Bearer ${tenantB.token}`)
        .send({});

      expect(res.status).toBe(404);
    });

    it('should transmit DTE when authorized and owned', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/transmitter/send/${dteA.id}`)
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.status).toMatch(/ENVIADO|PROCESANDO/);
    });

    it('should return 404 for non-existent DTE', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/transmitter/send/dte_nonexistent')
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({});

      expect(res.status).toBe(404);
    });
  });
});
```

### Paso 5: Validar cambios

```bash
# Compilar TypeScript
npm run build:api

# Ejecutar tests
npm run test:api -- transmitter.e2e.spec.ts

# Si no hay errores:
npm run lint:api
```

### Paso 6: Commit y push

```bash
git add apps/api/src/modules/transmitter/
git add test/transmitter.e2e.spec.ts
git commit -m "feat(security): protect transmitter with jwt auth guard

- Add @UseGuards(JwtAuthGuard) to TransmitterController
- Validate DTE ownership via tenantId
- Add 4 E2E tests for auth and cross-tenant validation
- Prevents unauthorized DTE transmission to Hacienda

Fixes: HALLAZGO #1 from security audit"

git push origin feat/sprint-1-security
```

### Paso 7: Code review

```bash
# En GitHub: abrir PR
# Descripción automática (ver commit message)
# Asignar revisor: Tech Lead
# Esperar aprobación
# Merge cuando esté aprobado
```

---

## ✅ TAREA 1.2 — SignerController @UseGuards (3 horas)

**Dev asignado**: Developer 1  
**Fecha**: Día 2-3  
**Dependencia**: 1.1 completada (para aprender el patrón)

### Paso 1: Schema update (Prisma)

```bash
# Verificar si Certificate model existe
grep -n "model Certificate" apps/api/prisma/schema.prisma

# Si NO existe, agregar:
cat >> apps/api/prisma/schema.prisma << 'EOF'

model Certificate {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  pemContent String  // Contenido PEM del certificado
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([tenantId])
  @@index([tenantId])
}
EOF

# Si SÍ existe, agregar tenantId (check actual schema)
```

### Paso 2: Migración Prisma

```bash
cd apps/api

# Crear migración
npx prisma migrate dev --name "add_per_tenant_certificates"

# Output esperado:
# ✔ Created migration: 20260309_add_per_tenant_certificates
# ✔ Database synced

# Verificar cambios en Azure SQL
# (ir a Azure Portal → Query Editor)
```

### Paso 3: Actualizar SignerController

```typescript
// apps/api/src/modules/signer/signer.controller.ts

import { Controller, Post, Get, UseGuards, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RequestWithUser } from '../../auth/types/request-with-user.interface';

@Controller('signer')
@UseGuards(JwtAuthGuard)  // ✅ AGREGAR
export class SignerController {
  constructor(private signerService: SignerService) {}

  @Post('load')
  @UseInterceptors(FileInterceptor('file'))
  async loadCertificate(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: LoadCertificateDto,
    @Req() req: RequestWithUser,  // ✅ AGREGAR
  ) {
    // ✅ NUEVO: Pass tenantId
    return this.signerService.loadForTenant(
      req.user.tenantId,
      file,
      dto.password
    );
  }

  @Get('current')
  async getCurrentCertificate(@Req() req: RequestWithUser) {
    return this.signerService.getForTenant(req.user.tenantId);
  }
}
```

### Paso 4: Actualizar SignerService

```typescript
// apps/api/src/modules/signer/signer.service.ts

@Injectable()
export class SignerService {
  constructor(private prisma: PrismaService) {}

  // ✅ NUEVO: Per-tenant loading
  async loadForTenant(
    tenantId: string,
    file: Express.Multer.File,
    password: string,
  ) {
    // Parsear certificado
    const cert = await this.parseCertificate(file.buffer, password);

    // Guardar o actualizar por tenant
    const result = await this.prisma.certificate.upsert({
      where: { tenantId },
      update: {
        pemContent: cert.pemContent,
        expiresAt: cert.expiresAt,
        updatedAt: new Date(),
      },
      create: {
        tenantId,
        pemContent: cert.pemContent,
        expiresAt: cert.expiresAt,
      },
    });

    return { tenantId: result.tenantId, expiresAt: result.expiresAt };
  }

  // ✅ NUEVO: Per-tenant retrieval
  async getForTenant(tenantId: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { tenantId },
    });

    if (!cert) {
      throw new NotFoundException('No certificate loaded for this tenant');
    }

    return { tenantId: cert.tenantId, expiresAt: cert.expiresAt };
  }

  private async parseCertificate(
    buffer: Buffer,
    password: string,
  ): Promise<{ pemContent: string; expiresAt: Date }> {
    // Lógica existente para parsear P12
    // ... return { pemContent, expiresAt }
  }
}
```

### Paso 5: Tests

```typescript
// test/signer.e2e.spec.ts

describe('SignerController (E2E)', () => {
  let app: INestApplication;
  let tenantA: { token: string; tenantId: string };
  let tenantB: { token: string; tenantId: string };
  const validP12Path = 'test/fixtures/cert.p12';

  beforeAll(async () => {
    // Setup
  });

  describe('POST /signer/load', () => {
    it('should reject without auth', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/signer/load')
        .attach('file', validP12Path)
        .field('password', 'password');

      expect(res.status).toBe(401);
    });

    it('should load certificate for authenticated tenant', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/signer/load')
        .set('Authorization', `Bearer ${tenantA.token}`)
        .attach('file', validP12Path)
        .field('password', 'password');

      expect(res.status).toBe(200);
      expect(res.body.tenantId).toBe(tenantA.tenantId);
    });

    it('should not expose certificate from another tenant', async () => {
      // Load en tenantA
      await request(app.getHttpServer())
        .post('/api/signer/load')
        .set('Authorization', `Bearer ${tenantA.token}`)
        .attach('file', validP12Path)
        .field('password', 'password');

      // Try access from tenantB
      const res = await request(app.getHttpServer())
        .get('/api/signer/current')
        .set('Authorization', `Bearer ${tenantB.token}`);

      expect(res.status).toBe(404);
    });
  });
});
```

### Paso 6: Commit

```bash
git add apps/api/prisma/schema.prisma
git add apps/api/prisma/migrations/
git add apps/api/src/modules/signer/
git add test/signer.e2e.spec.ts
git commit -m "feat(security): protect signer with jwt auth guard

- Add @UseGuards(JwtAuthGuard) to SignerController
- Implement per-tenant certificate management
- Add Prisma Certificate model with tenantId
- Prevent cross-tenant certificate access
- Add 3 E2E tests

Fixes: HALLAZGO #2 from security audit"
```

---

## ✅ TAREA 1.3 — Rate Limiting (4 horas)

**Dev asignado**: Developer 2  
**Fecha**: Día 3-5

### Paso 1: Instalación

```bash
cd apps/api
npm install @nestjs/throttler @nestjs/cache-manager cache-manager

# Verificar instalación
npm list @nestjs/throttler
```

### Paso 2: Configurar AppModule

```typescript
// apps/api/src/app.module.ts

import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutos
    }),
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000,     // 1 minuto
        limit: 1000,    // 1000 requests
      },
      {
        name: 'auth',
        ttl: 60000,     // 1 minuto
        limit: 5,       // 5 intentos
      },
      {
        name: 'transmitter',
        ttl: 60000,
        limit: 100,     // 100 transmissions/min
      },
    ]),
    // ... otros imports
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### Paso 3: Aplicar decorators

```typescript
// apps/api/src/modules/auth/auth.controller.ts
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle('auth', { limit: 5, ttl: 60000 })  // Max 5/min
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @Throttle('auth', { limit: 10, ttl: 3600000 })  // Max 10/hour
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}

// apps/api/src/modules/transmitter/transmitter.controller.ts
@Controller('transmitter')
@UseGuards(JwtAuthGuard)
export class TransmitterController {
  @Post('send/:dteId')
  @Throttle('transmitter', { limit: 100, ttl: 60000 })
  async sendDTE(
    @Param('dteId') dteId: string,
    @Body() dto: TransmitDto,
    @Req() req: RequestWithUser,
  ) {
    // ...
  }
}
```

### Paso 4: Tests

```typescript
// test/rate-limiting.spec.ts

describe('Rate Limiting', () => {
  it('should block login after 5 attempts in 1 minute', async () => {
    // Intentar 6 veces
    for (let i = 0; i < 6; i++) {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'wrong' });

      if (i < 5) {
        expect([401, 403]).toContain(res.status); // Auth error ok
      } else {
        expect(res.status).toBe(429); // Too Many Requests
      }
    }
  });

  it('should include rate limit headers', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/dtes')
      .set('Authorization', `Bearer ${token}`);

    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    expect(res.headers['x-ratelimit-reset']).toBeDefined();
  });
});
```

### Paso 5: Verificar en Azure

```bash
# Probar en local primero
npm run start:api

# En otra terminal:
for i in {1..10}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo ""
  sleep 0.5
done

# Verás: 429 Too Many Requests después de 5 intentos
```

### Paso 6: Commit

```bash
git add apps/api/src/app.module.ts
git add apps/api/src/modules/auth/
git add apps/api/src/modules/transmitter/
git add test/rate-limiting.spec.ts
git commit -m "feat(security): implement rate limiting

- Add @nestjs/throttler module
- Config: 5 login attempts/min, 10 register/hour
- Protect transmitter: 100 requests/min per tenant
- Add response headers (X-RateLimit-*)
- Add rate limiting tests

Fixes: HALLAZGO #3 from security audit"
```

---

## ✅ TAREA 1.4 — Tests Cross-Tenant (2 días)

**Asignado**: QA + Dev 1  
**Fecha**: Día 6-8

### Estructura del test

```bash
# Crear archivo principal
touch test/multi-tenant-isolation.e2e.spec.ts
```

### Código (esquema)

```typescript
describe('Multi-Tenant Data Isolation (E2E)', () => {
  let app: INestApplication;
  
  // Usuarios y tenants
  let tenantA: { token: string; tenantId: string; userId: string };
  let tenantB: { token: string; tenantId: string; userId: string };
  
  // Datos
  let dteA: { id: string };
  let clientB: { id: string };
  let quoteB: { id: string };

  beforeAll(async () => {
    // Setup app
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Registrar tenantA
    const resA = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'tenant-a@test.com',
        password: 'password123',
        companyName: 'Company A',
      });

    tenantA = {
      token: resA.body.access_token,
      tenantId: resA.body.user.tenantId,
      userId: resA.body.user.id,
    };

    // Registrar tenantB (similar)
    // ...

    // Crear datos en tenantA
    const dtRes = await request(app.getHttpServer())
      .post('/api/dtes')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({ /* DTE data */ });

    dteA = { id: dtRes.body.id };

    // Crear datos en tenantB
    // ...
  });

  describe('DTE Access Control', () => {
    it('should return 404 when tenant tries to access another tenant DTE', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/dtes/${dteA.id}`)
        .set('Authorization', `Bearer ${tenantB.token}`);

      expect(res.status).toBe(404);
    });

    it('should return 404 when trying to transmit another tenant DTE', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/transmitter/send/${dteA.id}`)
        .set('Authorization', `Bearer ${tenantB.token}`)
        .send({});

      expect(res.status).toBe(404);
    });

    it('should allow accessing own DTE', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/dtes/${dteA.id}`)
        .set('Authorization', `Bearer ${tenantA.token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(dteA.id);
    });
  });

  describe('Client Access Control', () => {
    it('should not list clients from another tenant', async () => {
      const resA = await request(app.getHttpServer())
        .get('/api/clients')
        .set('Authorization', `Bearer ${tenantA.token}`);

      const resB = await request(app.getHttpServer())
        .get('/api/clients')
        .set('Authorization', `Bearer ${tenantB.token}`);

      const idsA = resA.body.data.map((c: any) => c.id);
      const idsB = resB.body.data.map((c: any) => c.id);

      // Sin overlap
      const overlap = idsA.filter((id: string) => idsB.includes(id));
      expect(overlap).toHaveLength(0);
    });

    it('should return 404 when updating client from another tenant', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/clients/${clientB.id}`)
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(404);
    });

    it('should return 404 when deleting client from another tenant', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/clients/${clientB.id}`)
        .set('Authorization', `Bearer ${tenantA.token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Quote & Approval Workflow', () => {
    it('should reject approval of quote from another tenant', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/quotes/${quoteB.id}/approve`)
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({ approvalToken: 'sometoken' });

      expect(res.status).toBe(404);
    });
  });

  describe('Accounting & Journal Entries', () => {
    it('should not leak journal entries across tenants', async () => {
      const resA = await request(app.getHttpServer())
        .get('/api/accounting/libro-diario')
        .set('Authorization', `Bearer ${tenantA.token}`);

      const resB = await request(app.getHttpServer())
        .get('/api/accounting/libro-diario')
        .set('Authorization', `Bearer ${tenantB.token}`);

      const idsA = resA.body.data.map((e: any) => e.id);
      const idsB = resB.body.data.map((e: any) => e.id);

      expect(idsA.filter((id: string) => idsB.includes(id))).toHaveLength(0);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### Ejecutar

```bash
npm run test:api -- multi-tenant-isolation.e2e.spec.ts

# Expected output:
# ✓ Multi-Tenant Data Isolation (E2E)
#   ✓ DTE Access Control (3 tests)
#   ✓ Client Access Control (3 tests)
#   ✓ Quote Workflow (1 test)
#   ✓ Accounting (1 test)
# ... 20 tests should pass
```

### Commit

```bash
git add test/multi-tenant-isolation.e2e.spec.ts
git commit -m "test: add comprehensive multi-tenant isolation tests

- 20+ E2E tests covering DTE, Client, Quote, Accounting
- Validate that tenantA cannot access tenantB data
- Verify 404 on cross-tenant access attempts
- Security validation for authorization

Related: HALLAZGO #4 from security audit"
```

---

## 📋 CHECKLIST DIARIO

### Día 1
- [ ] Setup repos y branches
- [ ] Dev 1: 1.1 iniciado
- [ ] Dev 2: 1.3 iniciado
- [ ] Daily standup: confirmar progreso

### Día 2
- [ ] 1.1 completado y testeado
- [ ] 1.2 iniciado
- [ ] Code reviews de 1.1
- [ ] 1.3 50% progreso

### Días 3-5
- [ ] 1.2 + 1.3 completados
- [ ] All tests passing
- [ ] Code reviews finalizados
- [ ] Ready para merge

### Días 6-8
- [ ] 1.4 (tests) completado (20+ tests)
- [ ] 1.5 (JWT validation) completado
- [ ] 1.6 (E2E) completado

### Días 9-10
- [ ] 1.7 (docs) completado
- [ ] Todos los tests pasando
- [ ] Code review final
- [ ] **MERGE A MAIN**

---

## 🎯 SUCCESS CRITERIA

Al final de Sprint 1:
- ✅ 0 endpoints sin autenticación
- ✅ Rate limiting funcional (5 login attempts/min)
- ✅ 20+ tests multi-tenant pasando
- ✅ Cero regresiones (todos los tests existentes aún pasan)
- ✅ Merged a main branch

---

**Documento creado**: 9 de marzo 2026  
**Próxima revisión**: Día 10 (cuando termina Sprint 1)
