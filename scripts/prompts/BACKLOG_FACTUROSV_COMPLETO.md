# BACKLOG DE DESARROLLO — Facturosv.com
## Escalabilidad para 20 tenants en 3 meses

**Documento vivo**: Actualizado al 9 de marzo de 2026  
**Puntuación actual**: 68/100  
**Meta**: 92/100 en 4-6 semanas (4 sprints)  
**Metodología**: Agile + análisis de riesgo  

---

## 📊 DISTRIBUCIÓN DE TRABAJO

```
Sprint 1 (Bloqueantes):     10 días (CRÍTICO)
Sprint 2 (Performance):     10 días (IMPORTANTE)
Sprint 3 (Reliability):     12 días (IMPORTANTE)
Sprint 4 (Tech Debt):       8 días (MEJORA)
────────────────────────────────────
Total:                      40 días (~8 semanas 1-2 devs)
```

---

## 🔴 SPRINT 1: BLOQUEANTES DE SEGURIDAD (SEMANA 1-2)

**Objetivo**: Eliminar riesgos CRÍTICOS que bloquean escalamiento  
**Duración**: 10 días  
**Entregable**: Plataforma lista para 20 tenants sin vulnerabilidades de auth  

---

### TAREA 1.1 — Proteger TransmitterController con @UseGuards

**Prioridad**: 🔴 CRÍTICO  
**Puntos de historia**: 3  
**Asignado a**: Backend Senior  
**Impacto**: CRÍTICO — Previene transmisión no autorizada de DTEs  

**Descripción**:  
El endpoint POST `/transmitter/send/:dteId` no tiene autenticación. Cualquier usuario no autenticado puede transmitir DTEs de cualquier tenant a Hacienda.

**Tareas técnicas**:
- [ ] Agregar `@UseGuards(JwtAuthGuard)` a TransmitterController
- [ ] Validar que `req.user.tenantId` coincida con el DTE a transmitir
- [ ] Retornar 404 si el DTE no pertenece al tenant
- [ ] Agregar tests: auth fail, wrong tenant, success cases

**Código a cambiar**:
```typescript
// apps/api/src/modules/transmitter/transmitter.controller.ts

// ❌ ACTUAL
@Controller('transmitter')
export class TransmitterController {
  @Post('send/:dteId')
  async sendDTE(@Param('dteId') dteId: string, @Body() dto: TransmitDto) {
    return this.transmitterService.transmitSync(dteId, dto);
  }
}

// ✅ CORRECTO
@Controller('transmitter')
@UseGuards(JwtAuthGuard)
export class TransmitterController {
  constructor(
    private transmitterService: TransmitterService,
    private dteService: DteService,
  ) {}

  @Post('send/:dteId')
  async sendDTE(
    @Param('dteId') dteId: string,
    @Body() dto: TransmitDto,
    @Req() req: RequestWithUser,
  ) {
    // Verificar que el DTE pertenece al tenant
    const dte = await this.dteService.findByIdAndTenant(dteId, req.user.tenantId);
    if (!dte) throw new NotFoundException('DTE not found');
    
    return this.transmitterService.transmitSync(dteId, dto, req.user.tenantId);
  }
}
```

**Criterios de aceptación**:
- [ ] POST `/transmitter/send/:dteId` sin token retorna 401
- [ ] POST con token de otro tenant retorna 404
- [ ] POST con token válido ejecuta transmisión
- [ ] Tests cubren 3 casos
- [ ] No hay regresión en otros endpoints

**Tiempo estimado**: 2 horas  
**Bloquea**: 1.2, 1.3, testing

---

### TAREA 1.2 — Proteger SignerController con @UseGuards

**Prioridad**: 🔴 CRÍTICO  
**Puntos de historia**: 3  
**Asignado a**: Backend Senior  
**Impacto**: CRÍTICO — Previene carga de certificados no autorizados  

**Descripción**:  
El endpoint POST `/signer/load` no tiene autenticación. Cualquiera puede cargar certificados que afectarían DTEs de todos los tenants.

**Tareas técnicas**:
- [ ] Agregar `@UseGuards(JwtAuthGuard)` a SignerController
- [ ] Cambiar servicio para ser tenant-scoped (cargar certificado POR TENANT)
- [ ] Actualizar schema Prisma para `Certificate.tenantId` (si no existe)
- [ ] Retornar 404 si no autorizado
- [ ] Tests: auth fail, success per tenant

**Código a cambiar**:
```typescript
// apps/api/src/modules/signer/signer.controller.ts

// ❌ ACTUAL — Global certificate
@Controller('signer')
export class SignerController {
  @Post('load')
  async loadCertificate(@UploadedFile() file: Express.Multer.File, @Body() dto) {
    return this.signerService.loadCertificate(file, dto.password);
  }
}

// ✅ CORRECTO — Per-tenant certificate
@Controller('signer')
@UseGuards(JwtAuthGuard)
export class SignerController {
  constructor(private signerService: SignerService) {}

  @Post('load')
  async loadCertificate(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: LoadCertificateDto,
    @Req() req: RequestWithUser,
  ) {
    return this.signerService.loadForTenant(
      req.user.tenantId,
      file,
      dto.password,
    );
  }
}

// apps/api/src/modules/signer/signer.service.ts
export class SignerService {
  async loadForTenant(
    tenantId: string,
    file: Express.Multer.File,
    password: string,
  ) {
    const cert = await this.parseCertificate(file, password);
    
    // Guardar por tenant
    return this.prisma.certificate.upsert({
      where: { tenantId },
      update: { pemContent: cert.pem, expiresAt: cert.expiryDate },
      create: { tenantId, pemContent: cert.pem, expiresAt: cert.expiryDate },
    });
  }

  async getForTenant(tenantId: string) {
    return this.prisma.certificate.findUnique({
      where: { tenantId },
    });
  }
}
```

**Schema Prisma (si necesario)**:
```prisma
model Certificate {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  pemContent String  // Contenido del certificado
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  @@unique([tenantId])
  @@index([tenantId])
}
```

**Criterios de aceptación**:
- [ ] POST `/signer/load` sin token retorna 401
- [ ] POST carga certificado solo para el tenant autenticado
- [ ] GET `/signer/current` retorna certificado del tenant (crear si no existe)
- [ ] Tests: auth fail, wrong tenant, success, cert expiry
- [ ] Hacienda API usa certificado scoped al tenant

**Tiempo estimado**: 3 horas  
**Bloquea**: 1.3

---

### TAREA 1.3 — Implementar Rate Limiting

**Prioridad**: 🔴 CRÍTICO  
**Puntos de historia**: 5  
**Asignado a**: Backend Mid  
**Impacto**: CRÍTICO — Previene fuerza bruta en auth, DoS en endpoints críticos  

**Descripción**:  
Sin rate limiting, endpoints de autenticación son vulnerables a ataques de fuerza bruta. DTEs pueden ser transmitidos masivamente sin límite.

**Tareas técnicas**:
- [ ] Instalar `@nestjs/throttler` y `@nestjs/cache-manager`
- [ ] Configurar ThrottlerModule en AppModule (opción 1: memory, opción 2: Redis)
- [ ] Aplicar `@Throttle()` decorators:
  - Login: 5 requests/min per IP
  - Register: 10 requests/hour per IP
  - Transmitter: 100 requests/min per tenant
  - General API: 1000 requests/min per tenant
- [ ] Response headers con info de rate limit
- [ ] Tests: alcanzar límite, reset, diferentes endpoints

**Instalación**:
```bash
npm install @nestjs/throttler @nestjs/cache-manager cache-manager
```

**Código**:
```typescript
// apps/api/src/app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutos
    }),
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000,      // 1 minuto
        limit: 1000,     // 1000 requests
      },
      {
        name: 'auth',
        ttl: 60000,      // 1 minuto
        limit: 5,        // 5 intentos
      },
      {
        name: 'transmitter',
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

// apps/api/src/modules/auth/auth.controller.ts
@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle('auth', { limit: 5, ttl: 60000 }) // Max 5 por minuto
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    // req.ip se usa automáticamente para throttling
    return this.authService.login(dto);
  }

  @Post('register')
  @Throttle('auth', { limit: 10, ttl: 3600000 }) // Max 10 por hora
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
    // Throttle key: `transmitter:${req.user.tenantId}`
    // (requiere custom key resolver)
    return this.transmitterService.transmitSync(dteId, dto, req.user.tenantId);
  }
}
```

**Custom key resolver para tenant-scoped throttling**:
```typescript
// apps/api/src/common/throttler-key.provider.ts
import { Injectable } from '@nestjs/common';
import { ThrottlerStorageService } from '@nestjs/throttler';

@Injectable()
export class TenantThrottlerKeyGenerator {
  static getKey(context: ExecutionContext, limit: number, ttl: number): string {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;
    const ip = request.ip;
    
    // Si es autenticado, usa tenant. Si no, usa IP.
    return tenantId ? `throttler:${tenantId}:${ttl}` : `throttler:${ip}:${ttl}`;
  }
}
```

**Criterios de aceptación**:
- [ ] Login límite: 5 requests/min por IP
- [ ] Register límite: 10 requests/hora por IP
- [ ] Transmitter límite: 100 requests/min por tenant
- [ ] Response headers incluyen `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- [ ] Exceder límite retorna 429 Too Many Requests
- [ ] Tests: alcanzar límite, reset, diferentes tenants

**Tiempo estimado**: 4 horas  
**Bloquea**: Testing 1.4

---

### TAREA 1.4 — Escribir Tests de Aislamiento Cross-Tenant

**Prioridad**: 🔴 CRÍTICO  
**Puntos de historia**: 8  
**Asignado a**: QA / Backend Mid  
**Impacto**: CRÍTICO — Validar que los fixes de 1.1-1.3 funcionan  

**Descripción**:  
Cero tests validam aislamiento cross-tenant. No podemos escalar sin probar que tenantA NO puede ver datos de tenantB.

**Tareas técnicas**:
- [ ] Crear `test/multi-tenant-isolation.spec.ts`
- [ ] Setup: crear 2 tenants, 2 usuarios, datos en cada uno
- [ ] Tests para cada módulo crítico (auth, transmitter, signer, dte, clients)
- [ ] 20+ test cases cubriendo read, write, delete
- [ ] Tests de IDOR (cambiar IDs en URL)
- [ ] Documentar en `docs/testing-strategy.md`

**Suite de tests a crear**:
```typescript
// test/multi-tenant-isolation.spec.ts
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

describe('Multi-Tenant Data Isolation (E2E)', () => {
  let app: INestApplication;
  
  // Usuarios de diferentes tenants
  let tenantA: { id: string; token: string; tenantId: string };
  let tenantB: { id: string; token: string; tenantId: string };
  
  // DTEs creados en cada tenant
  let dteA: { id: string };
  let dteB: { id: string };

  beforeAll(async () => {
    // Setup app
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    // Setup tenants
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'tenant-a@test.com', password: 'password' });
    tenantA = {
      id: registerRes.body.user.id,
      token: registerRes.body.access_token,
      tenantId: registerRes.body.user.tenantId,
    };

    // Similar para tenantB
    // Create DTEs
    dteA = await createDte(app, tenantA.token, { ... });
    dteB = await createDte(app, tenantB.token, { ... });
  });

  describe('DTE Access Control', () => {
    it('should not return DTE from another tenant', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/dtes/${dteB.id}`)
        .set('Authorization', `Bearer ${tenantA.token}`);

      expect(res.status).toBe(404);
    });

    it('should not transmit DTE from another tenant', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/transmitter/send/${dteB.id}`)
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({});

      expect(res.status).toBe(404);
    });

    it('should not update DTE from another tenant', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/dtes/${dteB.id}`)
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({ status: 'ANULADO' });

      expect(res.status).toBe(404);
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

      expect(resA.body.data.length).toBeGreaterThan(0);
      expect(resB.body.data.length).toBeGreaterThan(0);
      
      // IDs de clientes no deben sobreponerse
      const idsA = resA.body.data.map((c: any) => c.id);
      const idsB = resB.body.data.map((c: any) => c.id);
      const overlap = idsA.filter((id: string) => idsB.includes(id));
      
      expect(overlap.length).toBe(0);
    });

    it('should not update client from another tenant', async () => {
      const clientB = /* get from above */ ;
      const res = await request(app.getHttpServer())
        .patch(`/api/clients/${clientB.id}`)
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(404);
    });

    it('should not delete client from another tenant', async () => {
      const clientB = /* get from above */ ;
      const res = await request(app.getHttpServer())
        .delete(`/api/clients/${clientB.id}`)
        .set('Authorization', `Bearer ${tenantA.token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Authentication & Token Handling', () => {
    it('should reject requests without token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/dtes');

      expect(res.status).toBe(401);
    });

    it('should reject expired tokens', async () => {
      // Crear token expirado
      const expiredToken = jwt.sign(
        { sub: tenantA.id, tenantId: tenantA.tenantId },
        'secret',
        { expiresIn: '-1h' }
      );

      const res = await request(app.getHttpServer())
        .get('/api/dtes')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it('should reject mismatched tenantId in token', async () => {
      const malformedToken = jwt.sign(
        { sub: tenantA.id, tenantId: 'wrong-tenant-id' },
        'secret'
      );

      const res = await request(app.getHttpServer())
        .get('/api/dtes')
        .set('Authorization', `Bearer ${malformedToken}`);

      expect(res.status).toBe(401);
    });
  });

  describe('Quote & Approval Workflow', () => {
    it('should not approve quote from another tenant', async () => {
      const quoteB = /* create in tenant B */ ;
      const token = generateApprovalToken(quoteB.id, tenantB.tenantId);

      const res = await request(app.getHttpServer())
        .post(`/api/quotes/${quoteB.id}/approve`)
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({ approvalToken: token });

      expect(res.status).toBe(404);
    });
  });

  describe('Accounting & Journal Entries', () => {
    it('should not list journal entries from another tenant', async () => {
      const resA = await request(app.getHttpServer())
        .get('/api/accounting/libro-diario')
        .set('Authorization', `Bearer ${tenantA.token}`);

      const resB = await request(app.getHttpServer())
        .get('/api/accounting/libro-diario')
        .set('Authorization', `Bearer ${tenantB.token}`);

      // Ambas deberían tener datos, pero no overlappear
      const tenantAIds = resA.body.data.map((e: any) => e.id);
      const tenantBIds = resB.body.data.map((e: any) => e.id);
      
      expect(tenantAIds.filter((id: string) => tenantBIds.includes(id)).length).toBe(0);
    });
  });
});
```

**Criterios de aceptación**:
- [ ] 20+ tests escritos y pasando
- [ ] 100% cobertura de módulos críticos (auth, DTE, clients, accounting)
- [ ] Tests en CI/CD (bloquean merge si fallan)
- [ ] Documentación en docs/testing-strategy.md
- [ ] No regresiones en tests existentes

**Tiempo estimado**: 2 días  
**Bloqueantes completados**: 1.1, 1.2, 1.3

---

### TAREA 1.5 — Validación de JWT Strategy (tenantId)

**Prioridad**: 🟠 IMPORTANTE  
**Puntos de historia**: 2  
**Asignado a**: Backend Mid  
**Impacto**: IMPORTANTE — Detectar tokens manipulados  

**Descripción**:  
JWT strategy valida que el usuario existe, pero NO valida que el `tenantId` en el token coincida con el del usuario. Un usuario podría manipular el token para cambiar su tenantId.

**Código a cambiar**:
```typescript
// apps/api/src/modules/auth/strategies/jwt.strategy.ts

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<RequestWithUser['user']> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { tenant: true },
    });

    if (!user || !user.tenant) {
      throw new UnauthorizedException('User or tenant not found');
    }

    // ✅ CRÍTICO: Validar que tenantId en token coincide con el de base de datos
    if (payload.tenantId && payload.tenantId !== user.tenantId) {
      throw new UnauthorizedException('Token tenant mismatch');
    }

    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };
  }
}
```

**Tests**:
```typescript
it('should reject token with mismatched tenantId', async () => {
  const user = await createUser('tenant-1');
  const fakeToken = jwt.sign(
    { sub: user.id, tenantId: 'tenant-2' },
    'secret'
  );

  const res = await request(app.getHttpServer())
    .get('/api/dtes')
    .set('Authorization', `Bearer ${fakeToken}`);

  expect(res.status).toBe(401);
  expect(res.body.message).toContain('mismatch');
});
```

**Criterios de aceptación**:
- [ ] Token con tenantId incorrecto es rechazado
- [ ] Token correcto funciona normalmente
- [ ] Tests pasando
- [ ] No regresiones

**Tiempo estimado**: 1 hora  
**Sprint 1 total hasta aquí**: ~12 horas

---

### TAREA 1.6 — Tests de Endpoints TransmitterController y SignerController

**Prioridad**: 🟠 IMPORTANTE  
**Puntos de historia**: 5  
**Asignado a**: QA  

**Descripción**:  
Crear tests específicos para las correcciones de 1.1 y 1.2.

**Tests a crear**:
```typescript
// test/transmitter.e2e.spec.ts
describe('TransmitterController (E2E)', () => {
  it('should reject POST /send without auth', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/transmitter/send/dte_123')
      .send({});
    expect(res.status).toBe(401);
  });

  it('should reject if DTE belongs to another tenant', async () => {
    const dteA = await createDte(tenantA.token, {...});
    const res = await request(app.getHttpServer())
      .post(`/api/transmitter/send/${dteA.id}`)
      .set('Authorization', `Bearer ${tenantB.token}`)
      .send({});
    expect(res.status).toBe(404);
  });

  it('should transmit DTE when authorized', async () => {
    const dte = await createDte(tenantA.token, {...});
    const res = await request(app.getHttpServer())
      .post(`/api/transmitter/send/${dte.id}`)
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ENVIADO');
  });
});

// test/signer.e2e.spec.ts
describe('SignerController (E2E)', () => {
  it('should reject POST /load without auth', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/signer/load')
      .attach('file', validP12Path)
      .field('password', 'password');
    expect(res.status).toBe(401);
  });

  it('should load certificate scoped to tenant', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/signer/load')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .attach('file', validP12Path)
      .field('password', 'password');
    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe(tenantA.tenantId);
  });

  it('should not expose certificate from another tenant', async () => {
    // Load cert in tenantA
    await request(app.getHttpServer())
      .post('/api/signer/load')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .attach('file', validP12Path)
      .field('password', 'password');

    // Try to access from tenantB
    const res = await request(app.getHttpServer())
      .get('/api/signer/current')
      .set('Authorization', `Bearer ${tenantB.token}`);

    expect(res.status).toBe(404);
  });
});
```

**Criterios de aceptación**:
- [ ] 8+ tests creados y pasando
- [ ] Cobertura de auth, cross-tenant, success cases
- [ ] En CI/CD

**Tiempo estimado**: 1 día  

---

### TAREA 1.7 — Documentación de Sprint 1

**Prioridad**: 🟠 IMPORTANTE  
**Puntos de historia**: 2  

**Documentación a crear**:
- [ ] `docs/SECURITY_FIXES_SPRINT1.md` — resumen de cambios, antes/después
- [ ] `docs/testing-strategy.md` — estrategia de multi-tenant testing
- [ ] Update `CHANGELOG.md`
- [ ] Update `docs/DEPLOYMENT.md` con pasos post-deploy

**Tiempo estimado**: 4 horas  

---

### 🏁 SPRINT 1 RESUMEN

| Tarea | Prioridad | Puntos | Tiempo | Estado |
|-------|-----------|--------|--------|--------|
| 1.1 - TransmitterController @UseGuards | 🔴 CRÍTICO | 3 | 2h | ⬜ TODO |
| 1.2 - SignerController @UseGuards | 🔴 CRÍTICO | 3 | 3h | ⬜ TODO |
| 1.3 - Rate Limiting | 🔴 CRÍTICO | 5 | 4h | ⬜ TODO |
| 1.4 - Cross-tenant Tests | 🔴 CRÍTICO | 8 | 2d | ⬜ TODO |
| 1.5 - JWT tenantId Validation | 🟠 IMPORTANTE | 2 | 1h | ⬜ TODO |
| 1.6 - E2E Tests para Controllers | 🟠 IMPORTANTE | 5 | 1d | ⬜ TODO |
| 1.7 - Documentación | 🟠 IMPORTANTE | 2 | 4h | ⬜ TODO |
| **TOTAL SPRINT 1** | | **28 puntos** | **~2 semanas** | |

**Criterios de éxito de Sprint 1**:
- [ ] Todas las tareas completadas
- [ ] Puntuación de seguridad: 9/10 (mejora de 6/10)
- [ ] 0 hallazgos CRÍTICOS pendientes
- [ ] Todos los tests pasando
- [ ] Merge a `main` aprobado por code review

---

## 🟠 SPRINT 2: PERFORMANCE Y RELIABILITY (SEMANA 3-4)

**Objetivo**: Optimizar consultas, agregar monitoreo, preparar escalamiento  
**Duración**: 10 días  
**Entregable**: Plataforma capaz de manejar 200 usuarios concurrentes  

---

### TAREA 2.1 — Fix N+1 en Accounting (Seed + Automation)

**Prioridad**: 🟠 IMPORTANTE  
**Puntos de historia**: 5  
**Asignado a**: Backend Senior  
**Impacto**: IMPORTANTE — Reduce 500 queries a 1-2 en seeding  

**Descripción**:  
`seedChartOfAccounts` ejecuta 500+ INSERT secuenciales. Con createMany, sería 1 query.  
`buildMultiLines` hace N queries por línea contable en lugar de batch fetch.

**Código a cambiar**:

```typescript
// apps/api/src/modules/accounting/accounting.service.ts:119-148

// ❌ ACTUAL — 500+ queries
async seedChartOfAccounts(tenantId: string) {
  for (const entry of CHART_OF_ACCOUNTS) {
    await this.prisma.accountingAccount.create({
      data: {
        tenantId,
        code: entry.code,
        name: entry.name,
        type: entry.type,
        // ...
      },
    });
  }
}

// ✅ CORRECTO — 1 query
async seedChartOfAccounts(tenantId: string) {
  const data = CHART_OF_ACCOUNTS.map(entry => ({
    tenantId,
    code: entry.code,
    name: entry.name,
    type: entry.type,
    // ...
  }));

  await this.prisma.accountingAccount.createMany({
    data,
    skipDuplicates: true, // Si ya existen, ignora
  });

  this.logger.log(`Created ${data.length} accounts for tenant ${tenantId}`);
}
```

```typescript
// apps/api/src/modules/accounting/accounting-automation.service.ts:251-280

// ❌ ACTUAL — N queries por línea
async buildMultiLines(config: JournalConfig, invoiceAmount: number) {
  const debLines = [];
  for (const lineConfig of config.debe) {
    const account = await this.findAccountByCode(tenantId, lineConfig.cuenta);
    if (!account) throw new Error(`Account not found: ${lineConfig.cuenta}`);
    debLines.push({ account, amount: ... });
  }
  // Misma lógica para haber (otra N queries)
}

// ✅ CORRECTO — 1 query batch
async buildMultiLines(config: JournalConfig, invoiceAmount: number) {
  // Recopilar todos los códigos necesarios
  const codesNeeded = [
    ...config.debe.map(l => l.cuenta),
    ...config.haber.map(l => l.cuenta),
  ];

  // 1 query para todos
  const accounts = await this.prisma.accountingAccount.findMany({
    where: {
      tenantId: this.currentTenantId,
      code: { in: codesNeeded },
    },
  });

  // Crear mapa para acceso O(1)
  const accountMap = new Map(accounts.map(a => [a.code, a]));

  // Construir líneas
  const debLines = config.debe.map(lineConfig => {
    const account = accountMap.get(lineConfig.cuenta);
    if (!account) throw new Error(`Account not found: ${lineConfig.cuenta}`);
    return { account, amount: ... };
  });

  const haberLines = config.haber.map(lineConfig => {
    const account = accountMap.get(lineConfig.cuenta);
    if (!account) throw new Error(`Account not found: ${lineConfig.cuenta}`);
    return { account, amount: ... };
  });

  return { debLines, haberLines };
}
```

**Tests**:
```typescript
it('should seed chart of accounts in 1 query', async () => {
  const spy = jest.spyOn(prisma.accountingAccount, 'createMany');
  
  await accountingService.seedChartOfAccounts('tenant-1');
  
  expect(spy).toHaveBeenCalledOnce();
  expect(spy).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.arrayContaining([
        expect.objectContaining({ code: '1' }), // Check first item
      ]),
    })
  );
});

it('should build journal lines with batch fetch', async () => {
  const spy = jest.spyOn(prisma.accountingAccount, 'findMany');
  
  await service.buildMultiLines(config, 1000);
  
  // Should be called only once for batch fetch
  expect(spy).toHaveBeenCalledOnce();
});
```

**Criterios de aceptación**:
- [ ] `seedChartOfAccounts` ejecuta 1 query (verified con spy)
- [ ] `buildMultiLines` ejecuta 1 batch query (verified con spy)
- [ ] Tests pasando
- [ ] No regresiones en funcionalidad
- [ ] Documentar mejora de performance (antes: 500 queries, después: 1-2)

**Tiempo estimado**: 1 día  

---

### TAREA 2.2 — Agregar Índices Compuestos en Base de Datos

**Prioridad**: 🟠 IMPORTANTE  
**Puntos de historia**: 3  
**Asignado a**: Backend Mid / DBA  
**Impacto**: IMPORTANTE — Acelera queries en 10-100x  

**Descripción**:  
DTEs, Clientes y otras tablas grandes carecen de índices para paginación y filtrado.

**Schema Prisma a actualizar**:
```prisma
// apps/api/prisma/schema.prisma

model Dte {
  // ... campos existentes ...
  
  // Índices actuales:
  @@unique([codigoGeneracion, tenantId])
  @@index([tenantId])
  @@index([clienteId])
  
  // ✅ Agregar:
  @@index([tenantId, estado])              // Dashboard filtering
  @@index([tenantId, createdAt])           // Cursor-based pagination
  @@index([tenantId, estado, createdAt])   // Complex queries
}

model Cliente {
  // ... campos existentes ...
  
  // Actual:
  @@index([tenantId])
  
  // ✅ Agregar:
  @@index([tenantId, createdAt])     // Pagination
  @@index([tenantId, estado])        // Active clients filter
  @@index([tenantId, nombre])        // Search
}

model AuditLog {
  // Actual: bien indexado (6 índices) ✅
}

model Quote {
  // Actual: bien indexado (5 índices) ✅
}
```

**Migración Prisma**:
```bash
cd apps/api

# Ver cambios
npx prisma db pull

# Crear migración
npx prisma migrate dev --name "add_composite_indexes"

# Validar cambios
npx prisma db push

# Verificar índices en Azure SQL
# SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.Dte');
```

**Validación en Azure SQL**:
```sql
-- Ejecutar en Azure SQL Query Editor
SELECT 
  OBJECT_NAME(i.object_id) AS TableName,
  i.name AS IndexName,
  STRING_AGG(c.name, ', ') AS Columns
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE OBJECT_NAME(i.object_id) IN ('Dte', 'Cliente', 'Quote')
GROUP BY OBJECT_NAME(i.object_id), i.name
ORDER BY TableName, IndexName;
```

**Tests de performance**:
```typescript
it('should query DTEs by status efficiently', async () => {
  // Insert 10,000 DTEs
  const startTime = performance.now();
  
  const result = await prisma.dte.findMany({
    where: { tenantId: 'tenant-1', estado: 'ENVIADO' },
    take: 100,
    skip: 0,
  });
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Should be < 50ms with index (vs 500ms+ without)
  expect(duration).toBeLessThan(50);
  expect(result).toHaveLength(100);
});
```

**Criterios de aceptación**:
- [ ] Migración Prisma creada y aplicada
- [ ] Índices verificados en Azure SQL
- [ ] Queries < 50ms en datasets de 10k+ filas
- [ ] No regresiones en writes
- [ ] Documentar índices en `docs/database-schema.md`

**Tiempo estimado**: 2 horas  

---

### TAREA 2.3 — Configurar Connection Pooling de Base de Datos

**Prioridad**: 🟠 IMPORTANTE  
**Puntos de historia**: 2  
**Asignado a**: DevOps / Backend Mid  
**Impacto**: IMPORTANTE — Evita "too many connections" bajo carga  

**Descripción**:  
Prisma usa default de ~5 conexiones. Con 200 usuarios y picos de carga, necesita 30-50.

**Configuración**:

```bash
# apps/api/.env
# Actual (incompleto)
DATABASE_URL="sqlserver://server:1433;database=db;username=user;password=pass;encrypt=true"

# ✅ Actualizar con pool settings
DATABASE_URL="sqlserver://server:1433;database=db;username=user;password=pass;encrypt=true;Connection Timeout=30;Pooling=true;Max Pool Size=50;Min Pool Size=10"
```

O via Prisma client extensions:

```typescript
// apps/api/src/common/database.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}

// apps/api/src/common/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient {
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
      ],
    });

    this.$on('query', (e) => {
      console.log('Query: ' + e.query);
      console.log('Params: ' + JSON.stringify(e.params));
      console.log('Duration: ' + e.duration + 'ms');
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Validación en Azure SQL**:
```sql
-- Ver número de conexiones activas
SELECT COUNT(*) AS ActiveConnections
FROM sys.dm_exec_sessions
WHERE database_id = DB_ID();

-- Ver pool stats (en Prisma logs)
-- Buscar "Pool: X connections" en logs
```

**Criterios de aceptación**:
- [ ] Pool size configurado a 50
- [ ] Min pool size = 10
- [ ] Connection timeout = 30s
- [ ] Validado en Azure SQL (SELECT COUNT)
- [ ] Tests bajo carga (simular 100 requests concurrentes)
- [ ] Documentar en docs/database-tuning.md

**Tiempo estimado**: 2 horas  

---

### TAREA 2.4 — Implementar Structured Logging (Pino + Application Insights)

**Prioridad**: 🟠 IMPORTANTE  
**Puntos de historia**: 5  
**Asignado a**: Backend Mid / DevOps  
**Impacto**: IMPORTANTE — Permite debugging en producción, análisis de performance  

**Descripción**:  
Logging actual es básico (console). Necesita logs estructurados con correlationId, tenantId, timestamps.

**Instalación**:
```bash
npm install pino pino-http nestjs-pino @microsoft/applicationinsights-web
```

**Configuración**:
```typescript
// apps/api/src/app.module.ts
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'SYS:standard',
                },
              }
            : undefined,
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
        serializers: {
          req(request) {
            return {
              method: request.method,
              url: request.url,
              headers: request.headers,
              remoteAddress: request.socket.remoteAddress,
              remotePort: request.socket.remotePort,
            };
          },
          res(reply) {
            return {
              statusCode: reply.statusCode,
            };
          },
        },
        customProps: (req: any) => ({
          tenantId: req.user?.tenantId,
          userId: req.user?.id,
          correlationId: req.id,
        }),
      },
      useExisting: PrismaService,
    }),
  ],
})
export class AppModule {}

// apps/api/src/common/logger.service.ts
import { Injectable, Logger as NestLogger } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class LoggerService {
  constructor(private readonly pinoLogger: PinoLogger) {}

  log(message: string, meta?: any) {
    this.pinoLogger.info({ msg: message, ...meta });
  }

  error(message: string, error?: Error, meta?: any) {
    this.pinoLogger.error({ msg: message, error: error?.message, stack: error?.stack, ...meta });
  }

  debug(message: string, meta?: any) {
    this.pinoLogger.debug({ msg: message, ...meta });
  }

  // Helper para DTE transmission
  dteTransmission(dteId: string, status: string, tenantId: string, duration: number) {
    this.pinoLogger.info({
      msg: 'DTE transmission',
      dteId,
      status,
      tenantId,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  }
}
```

**Uso en servicios**:
```typescript
@Injectable()
export class TransmitterService {
  constructor(
    private logger: LoggerService,
    private prisma: PrismaService,
  ) {}

  async transmitSync(dteId: string, dto: TransmitDto, tenantId: string) {
    const startTime = performance.now();

    try {
      const dte = await this.prisma.dte.findUnique({ where: { id: dteId } });
      
      // Llamar a Hacienda
      const response = await this.haciendaApi.transmit(dte.json, dte.firma);
      
      const duration = performance.now() - startTime;
      
      this.logger.dteTransmission(dteId, 'SUCCESS', tenantId, duration);
      
      return { status: 'ENVIADO', selloRecepcion: response.sello };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.logger.error('DTE transmission failed', error, {
        dteId,
        tenantId,
        durationMs: duration,
        errorCode: error.code,
      });
      
      throw error;
    }
  }
}
```

**Criterios de aceptación**:
- [ ] Pino configurado en AppModule
- [ ] Logs incluyen: tenantId, userId, correlationId, timestamp
- [ ] Application Insights recibe logs (si en Azure)
- [ ] Tests: verificar que logs se escriben con estructura correcta
- [ ] Documentar en docs/logging.md

**Tiempo estimado**: 1 día  

---

### TAREA 2.5 — Implementar Dependency Scanning en CI

**Prioridad**: 🟠 IMPORTANTE  
**Puntos de historia**: 2  
**Asignado a**: DevOps  
**Impacto**: IMPORTANTE — Detecta vulnerabilidades de dependencias  

**Descripción**:  
No hay scanning de `npm audit` en CI. Vulnerabilidades pasarían a producción.

**Configuración GitHub Actions**:
```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  pull_request:
    branches: [main, staging]
  schedule:
    - cron: '0 0 * * 0' # Weekly

jobs:
  npm-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci --workspaces
      
      - name: Run npm audit
        run: |
          npm audit --audit-level=moderate
        continue-on-error: true
      
      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
```

**Criterios de aceptación**:
- [ ] GitHub Actions workflow creado
- [ ] npm audit se ejecuta en PRs
- [ ] High/Critical vulnerabilities bloquean merge
- [ ] Snyk token configurado (opcional)
- [ ] Documentar en docs/security-scanning.md

**Tiempo estimado**: 2 horas  

---

### TAREA 2.6 — Tests para Auth, Signer, Transmitter Services

**Prioridad**: 🟠 IMPORTANTE  
**Puntos de historia**: 8  
**Asignado a**: QA / Backend  
**Impacto**: IMPORTANTE — Cobertura de servicios críticos (actualmente 22% -> 60%+)  

**Descripción**:  
3 servicios críticos sin tests: auth, signer, transmitter. Riesgo de regresiones.

**Archivos a crear**:
- `test/auth.service.spec.ts` — 15+ tests
- `test/signer.service.spec.ts` — 10+ tests
- `test/transmitter.service.spec.ts` — 12+ tests

**Ejemplo: auth.service.spec.ts**:
```typescript
describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    // Setup
  });

  describe('register', () => {
    it('should create user and tenant', async () => {
      const result = await service.register({
        email: 'new@test.com',
        password: 'password',
        companyName: 'Company',
      });

      expect(result.user).toBeDefined();
      expect(result.user.tenantId).toBeDefined();
      expect(result.access_token).toBeDefined();
    });

    it('should hash password', async () => {
      const result = await service.register({
        email: 'new@test.com',
        password: 'password',
        companyName: 'Company',
      });

      const user = await prisma.user.findUnique({
        where: { id: result.user.id },
      });

      expect(user.password).not.toBe('password');
      expect(user.password).toMatch(/^\$2[aby]$/); // bcrypt format
    });

    it('should reject duplicate email', async () => {
      const email = 'exists@test.com';
      await service.register({
        email,
        password: 'password',
        companyName: 'Company',
      });

      await expect(
        service.register({
          email,
          password: 'password',
          companyName: 'Company 2',
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    let user: any;

    beforeEach(async () => {
      user = await service.register({
        email: 'test@test.com',
        password: 'password',
        companyName: 'Company',
      });
    });

    it('should return access token on valid credentials', async () => {
      const result = await service.login({
        email: 'test@test.com',
        password: 'password',
      });

      expect(result.access_token).toBeDefined();
      expect(result.user.email).toBe('test@test.com');
    });

    it('should reject invalid password', async () => {
      await expect(
        service.login({
          email: 'test@test.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      await expect(
        service.login({
          email: 'nonexistent@test.com',
          password: 'password',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('validateToken', () => {
    let token: string;

    beforeEach(async () => {
      const result = await service.register({
        email: 'test@test.com',
        password: 'password',
        companyName: 'Company',
      });
      token = result.access_token;
    });

    it('should validate valid token', async () => {
      const decoded = service.validateToken(token);
      expect(decoded.sub).toBeDefined();
      expect(decoded.tenantId).toBeDefined();
    });

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign({}, 'secret', { expiresIn: '-1h' });
      expect(() => service.validateToken(expiredToken)).toThrow();
    });

    it('should reject malformed token', async () => {
      expect(() => service.validateToken('invalid')).toThrow();
    });
  });
});
```

**Criterios de aceptación**:
- [ ] 37+ tests creados (15+10+12)
- [ ] Cobertura >= 80% por servicio
- [ ] Tests en CI/CD
- [ ] No regresiones

**Tiempo estimado**: 2 días  

---

### 🏁 SPRINT 2 RESUMEN

| Tarea | Prioridad | Puntos | Tiempo | Estado |
|-------|-----------|--------|--------|--------|
| 2.1 - Fix N+1 Accounting | 🟠 IMPORTANTE | 5 | 1d | ⬜ TODO |
| 2.2 - Índices Compuestos | 🟠 IMPORTANTE | 3 | 2h | ⬜ TODO |
| 2.3 - Connection Pooling | 🟠 IMPORTANTE | 2 | 2h | ⬜ TODO |
| 2.4 - Structured Logging | 🟠 IMPORTANTE | 5 | 1d | ⬜ TODO |
| 2.5 - Dependency Scanning | 🟠 IMPORTANTE | 2 | 2h | ⬜ TODO |
| 2.6 - Service Tests | 🟠 IMPORTANTE | 8 | 2d | ⬜ TODO |
| **TOTAL SPRINT 2** | | **25 puntos** | **~2 semanas** | |

---

## 🟡 SPRINT 3: RELIABILITY Y ASYNC (SEMANA 5-6)

**Objetivo**: Implementar async processing, RLS, mejorar resiliencia  
**Duración**: 12 días  

### TAREA 3.1 — Hacer DTE Transmission Asíncrona

**Prioridad**: 🟠 IMPORTANTE  
**Puntos de historia**: 8  
**Asignado a**: Backend Senior  
**Impacto**: CRÍTICO — Previene timeouts en transmisión a Hacienda  

Transmisión síncrona bloquea HTTP response (500ms-5s). Con 200 usuarios en cierre de mes = timeouts.

**Implementación**:
```typescript
// apps/api/src/modules/dte/dte.controller.ts

@Post(':dteId/finalize')
@UseGuards(JwtAuthGuard)
async finalizeDte(
  @Param('dteId') dteId: string,
  @Req() req: RequestWithUser,
) {
  const dte = await this.dteService.findByIdAndTenant(dteId, req.user.tenantId);
  if (!dte) throw new NotFoundException();

  // 🔴 ACTUAL — Síncrono (bloquea)
  // const result = await this.transmitterService.transmitSync(dteId, {});

  // ✅ NUEVO — Asíncrono (retorna inmediatamente)
  await this.eventBus.emit(new DteFinalizedEvent(dteId, req.user.tenantId));

  return {
    status: 'processing',
    message: 'DTE will be transmitted in the background',
    dteId,
  };
}

// apps/api/src/modules/dte/events/dte-finalized.event.ts
export class DteFinalizedEvent {
  constructor(public dteId: string, public tenantId: string) {}
}

// apps/api/src/modules/dte/listeners/dte-finalized.listener.ts
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DteFinalizedEvent } from '../events/dte-finalized.event';

@EventsHandler(DteFinalizedEvent)
export class DteFinalizedListener implements IEventHandler<DteFinalizedEvent> {
  constructor(
    private transmitterService: TransmitterService,
    private logger: LoggerService,
  ) {}

  async handle(event: DteFinalizedEvent) {
    const { dteId, tenantId } = event;
    const startTime = performance.now();

    try {
      // Transmitir con retry logic
      const result = await this.transmitterService.transmitWithRetry(dteId, tenantId);
      const duration = performance.now() - startTime;

      this.logger.dteTransmission(dteId, 'SUCCESS', tenantId, duration);
    } catch (error) {
      const duration = performance.now() - startTime;

      this.logger.error('DTE transmission failed', error, {
        dteId,
        tenantId,
        durationMs: duration,
      });

      // Encolar para retry asíncrono (BullMQ)
      await this.dteQueue.add('transmit-retry', { dteId, tenantId }, {
        delay: 5000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
    }
  }
}

// apps/api/src/modules/dte/dte.queue.ts
import { Processor, Process, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Queue, Job } from 'bull';

@Processor('dte-transmission')
export class DteTransmissionProcessor {
  constructor(
    private transmitterService: TransmitterService,
    private logger: LoggerService,
  ) {}

  @Process('transmit-retry')
  async handleDteTransmission(job: Job<{ dteId: string; tenantId: string }>) {
    const { dteId, tenantId } = job.data;
    const startTime = performance.now();

    try {
      const result = await this.transmitterService.transmitSync(dteId, {}, tenantId);
      
      const duration = performance.now() - startTime;
      this.logger.dteTransmission(dteId, 'SUCCESS_RETRY', tenantId, duration);

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logger.error('DTE retry failed', error, {
        dteId,
        tenantId,
        attempt: job.attemptsMade,
        durationMs: duration,
      });

      throw error; // Bull reintentará
    }
  }

  @OnQueueCompleted()
  onComplete(job: Job<{ dteId: string; tenantId: string }>, result: any) {
    this.logger.log('DTE transmission completed', {
      dteId: job.data.dteId,
      result,
    });
  }

  @OnQueueFailed()
  onFailed(job: Job<{ dteId: string; tenantId: string }>, error: Error) {
    this.logger.error('DTE transmission exhausted retries', error, {
      dteId: job.data.dteId,
      attempts: job.attemptsMade,
    });
  }
}
```

**Instalar BullMQ**:
```bash
npm install @nestjs/bull bull bullmq
```

**Tests**:
```typescript
it('should queue DTE transmission and return immediately', async () => {
  const spy = jest.spyOn(eventBus, 'emit');

  const result = await controller.finalizeDte(dteId, req);

  expect(result.status).toBe('processing');
  expect(spy).toHaveBeenCalledWith(expect.any(DteFinalizedEvent));
  expect(result.durationMs).toBeLessThan(100); // No bloquea
});

it('should retry transmission with exponential backoff', async () => {
  // Mock transmitter fail once, then succeed
  mockTransmitter
    .mockRejectedValueOnce(new Error('Hacienda unavailable'))
    .mockResolvedValueOnce({ status: 'ENVIADO' });

  await processor.handleDteTransmission(job);

  // Verificar que se intentó y reintentó
  expect(mockTransmitter).toHaveBeenCalledTimes(2);
});
```

**Criterios de aceptación**:
- [ ] POST `/dtes/:id/finalize` retorna en < 100ms
- [ ] DTE se transmite en background
- [ ] Retry con exponential backoff (3 intentos)
- [ ] Logs de transmisión incluyen timestamp, duration
- [ ] Tests: async transmission, retries, failure handling
- [ ] Documentar en docs/async-processing.md

**Tiempo estimado**: 3 días  

---

### TAREA 3.2 — Implementar Row-Level Security en Azure SQL

**Prioridad**: 🟡 MEJORA (segunda línea de defensa)  
**Puntos de historia**: 5  
**Asignado a**: Backend Senior / DBA  
**Impacto**: IMPORTANTE — Si una query olvida filtro tenantId, RLS lo fuerza  

**Implementación SQL**:
```sql
-- Crear rol de aplicación
CREATE ROLE [app_user] WITHOUT LOGIN;

-- Crear función de predicado
CREATE FUNCTION Security.fn_tenantAccessPredicate(@TenantId NVARCHAR(1000))
  RETURNS TABLE
  WITH SCHEMABINDING
AS
RETURN SELECT 1 AS fn_accessResult
  WHERE @TenantId = CAST(SESSION_CONTEXT(N'TenantId') AS NVARCHAR(1000));

-- Crear política
CREATE SECURITY POLICY Security.tenantAccessPolicy
  ADD FILTER PREDICATE Security.fn_tenantAccessPredicate(TenantId) ON dbo.Dte,
  ADD FILTER PREDICATE Security.fn_tenantAccessPredicate(TenantId) ON dbo.Cliente,
  ADD FILTER PREDICATE Security.fn_tenantAccessPredicate(TenantId) ON dbo.Quote,
  ADD FILTER PREDICATE Security.fn_tenantAccessPredicate(TenantId) ON dbo.Invoice,
  ADD BLOCK PREDICATE Security.fn_tenantAccessPredicate(TenantId) ON dbo.Dte,
  ADD BLOCK PREDICATE Security.fn_tenantAccessPredicate(TenantId) ON dbo.Cliente;

-- Otorgar permisos al rol de app
GRANT SELECT, INSERT, UPDATE ON dbo.Dte TO [app_user];
GRANT SELECT, INSERT, UPDATE ON dbo.Cliente TO [app_user];
GRANT SELECT, INSERT, UPDATE ON dbo.Quote TO [app_user];
```

**Implementación en NestJS**:
```typescript
// apps/api/src/modules/database/rls.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RlsInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      throw new Error('TenantId not found in request');
    }

    // Ejecutar SET SESSION_CONTEXT ANTES de cualquier query
    await this.prisma.$executeRawUnsafe(
      `EXEC sp_set_session_context @key = N'TenantId', @value = @tenantId`,
      { '@tenantId': tenantId }
    );

    return next.handle();
  }
}

// Registrar interceptor en AppModule
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RlsInterceptor,
    },
  ],
})
export class AppModule {}
```

**Tests**:
```typescript
it('should enforce RLS even if query forgets tenantId filter', async () => {
  // Crear datos en tenantA y tenantB
  const dteA = await createDte(tenantA.id, {...});
  const dteB = await createDte(tenantB.id, {...});

  // Intentar query sin filtro (RLS lo aplicará automáticamente)
  const result = await prisma.dte.findMany(
    // Nota: Sin WHERE { tenantId }
  );

  // RLS asegura que solo ve tenantA's DTEs
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe(dteA.id);
});

it('should block inserts that violate RLS', async () => {
  // Intentar insertar como tenantA pero con tenantId de tenantB
  await expect(
    prisma.dte.create({
      data: {
        tenantId: 'tenant-b', // RLS bloqueará esto
        ...dteData,
      },
    })
  ).rejects.toThrow();
});
```

**Criterios de aceptación**:
- [ ] RLS políticas creadas en Azure SQL
- [ ] Predicados aplicados a todas las tablas críticas
- [ ] SESSION_CONTEXT configurado en cada request
- [ ] Tests: RLS bloquea queries incorrectas
- [ ] Performance: < 5% overhead
- [ ] Documentar en docs/row-level-security.md

**Tiempo estimado**: 2 días  

---

### TAREA 3.3 — Token en httpOnly Cookies (XSS mitigation)

**Prioridad**: 🟡 MEJORA  
**Puntos de historia**: 5  
**Asignado a**: Full-stack Senior  
**Impacto**: IMPORTANTE — localStorage es vulnerable a XSS  

**Backend (NestJS)**:
```typescript
// apps/api/src/modules/auth/auth.controller.ts

@Post('login')
@HttpCode(200)
async login(
  @Body() dto: LoginDto,
  @Res({ passthrough: true }) res: Response,
) {
  const result = await this.authService.login(dto);

  // Establecer token en httpOnly cookie
  res.cookie('access_token', result.access_token, {
    httpOnly: true,        // No accesible desde JS
    secure: true,          // Solo HTTPS
    sameSite: 'strict',    // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    path: '/',
  });

  // NO retornar token en JSON (era vulnerable)
  return {
    user: result.user,
    // access_token OMITIDO
  };
}

@Post('logout')
async logout(@Res({ passthrough: true }) res: Response) {
  res.clearCookie('access_token');
  return { status: 'logged out' };
}
```

**Frontend (Next.js)**:
```typescript
// apps/web/src/hooks/use-api.ts

export function useApi() {
  const [token, setToken] = useState<string | null>(null);

  const api = async (url: string, options?: RequestInit) => {
    // Cookie se envía automáticamente (httpOnly)
    const res = await fetch(url, {
      ...options,
      credentials: 'include', // Enviar cookies
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (res.status === 401) {
      // Token expiró, logout
      setToken(null);
      window.location.href = '/login';
    }

    return res;
  };

  return { api };
}
```

**Validación**:
```typescript
// Test verificar que token no aparece en respuesta JSON
it('should not return token in login response', async () => {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'test@test.com', password: 'password' });

  expect(res.body).not.toHaveProperty('access_token');
  expect(res.headers['set-cookie']).toBeDefined();
  expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
});
```

**Criterios de aceptación**:
- [ ] Token en httpOnly cookie (no en localStorage)
- [ ] Cookie secure, sameSite=strict
- [ ] Token NO aparece en respuesta JSON
- [ ] Frontend envia `credentials: 'include'`
- [ ] Tests: verificar cookie headers
- [ ] No regresiones en login/logout

**Tiempo estimado**: 2 días  

---

### TAREA 3.4 — Crear Dockerfile con Non-Root User (API)

**Prioridad**: 🟡 MEJORA  
**Puntos de historia**: 2  
**Asignado a**: DevOps  
**Impacto**: IMPORTANTE — Seguridad: reducir surface attack si container es comprometido  

**Actualizar Dockerfile**:
```dockerfile
# Dockerfile - apps/api

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN npm ci --workspaces
RUN npm run build:api

FROM node:18-alpine
WORKDIR /app

# ✅ Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar built app
COPY --from=builder --chown=nodejs:nodejs /app/dist /app/dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json /app/package.json

# Cambiar a usuario no-root
USER nodejs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/main"]
```

**Criterios de aceptación**:
- [ ] Dockerfile actualizado con non-root user
- [ ] User ID: 1001 (no 0 root)
- [ ] HEALTHCHECK configurado
- [ ] Tests: container arranca sin error
- [ ] Logs muestran UID 1001 (verificar con `docker exec`)

**Tiempo estimado**: 1 hora  

---

### TAREA 3.5 — Refactorizar Servicios >1000 líneas

**Prioridad**: 🟡 MEJORA  
**Puntos de historia**: 8  
**Asignado a**: Backend Senior  
**Impacto**: IMPORTANTE — Mantenibilidad, testabilidad  

**Servicios a refactorizar**:
1. `quotes.service.ts` (~1200 líneas)
2. `hacienda.service.ts` (~1100 líneas)
3. `dte.service.ts` (~1050 líneas)

**Estrategia**:
- Extraer métodos grandes en sub-servicios
- Aplicar SRP (Single Responsibility Principle)
- Crear clases privadas para lógica compleja

**Ejemplo: quotes.service.ts**:
```typescript
// ❌ ACTUAL — 1200 líneas, múltiples responsabilidades
@Injectable()
export class QuotesService {
  // 50+ métodos aquí
  async createQuote(...) { ... } // Validación, estado, cálculos
  async calculateTotals(...) { ... }
  async applyDiscounts(...) { ... }
  async sendApprovalEmail(...) { ... }
  async generatePdf(...) { ... }
  // ...
}

// ✅ REFACTOREADO — Dividido en responsabilidades
@Injectable()
export class QuotesService {
  constructor(
    private quoteValidator: QuoteValidatorService,
    private quotePricingService: QuotePricingService,
    private quoteNotificationService: QuoteNotificationService,
    private quotePdfService: QuotePdfService,
    private prisma: PrismaService,
  ) {}

  async createQuote(tenantId: string, dto: CreateQuoteDto) {
    // Validar
    await this.quoteValidator.validate(tenantId, dto);

    // Crear
    const quote = await this.prisma.quote.create({
      data: { tenantId, ...dto },
    });

    // Calcular precios
    quote.total = await this.quotePricingService.calculate(quote);

    // Notificar
    await this.quoteNotificationService.sendCreationNotification(quote);

    return quote;
  }
}

// Nueva clase: QuoteValidatorService
@Injectable()
export class QuoteValidatorService {
  async validate(tenantId: string, dto: CreateQuoteDto) {
    if (!dto.clientId) throw new BadRequestException('clientId required');
    // ... más validaciones ...
  }
}

// Nueva clase: QuotePricingService
@Injectable()
export class QuotePricingService {
  async calculate(quote: Quote) {
    let total = 0;
    for (const line of quote.lineItems) {
      total += line.quantity * line.price;
    }
    const iva = total * 0.13;
    return total + iva;
  }
}

// Etc.
```

**Criterios de aceptación**:
- [ ] 3 servicios refactorizados
- [ ] Cada sub-servicio < 400 líneas
- [ ] Tests para nuevos servicios
- [ ] Funcionalidad idéntica (no cambios de comportamiento)
- [ ] Cyclomatic complexity reducido

**Tiempo estimado**: 3 días  

---

### 🏁 SPRINT 3 RESUMEN

| Tarea | Prioridad | Puntos | Tiempo | Estado |
|-------|-----------|--------|--------|--------|
| 3.1 - DTE Async + BullMQ | 🟠 IMPORTANTE | 8 | 3d | ⬜ TODO |
| 3.2 - Row-Level Security | 🟡 MEJORA | 5 | 2d | ⬜ TODO |
| 3.3 - httpOnly Cookies | 🟡 MEJORA | 5 | 2d | ⬜ TODO |
| 3.4 - Non-root Docker | 🟡 MEJORA | 2 | 1h | ⬜ TODO |
| 3.5 - Refactor Services | 🟡 MEJORA | 8 | 3d | ⬜ TODO |
| **TOTAL SPRINT 3** | | **28 puntos** | **~2.5 semanas** | |

---

## 🟡 SPRINT 4: TECH DEBT Y POLISH (SEMANA 7-8)

**Objetivo**: Eliminar deuda técnica, mejorar testing, documentación  
**Duración**: 8 días  

### TAREA 4.1 — ESLint Configuración Exhaustiva

**Prioridad**: 🟡 MEJORA  
**Puntos de historia**: 3  
**Asignado a**: Backend Mid  
**Impacto**: MEJORA — Consistencia de código, detección temprana de bugs  

**Instalación y setup**:
```bash
npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-nestjs-typed
```

**`.eslintrc.json`**:
```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint", "nestjs-typed"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:nestjs-typed/recommended"
  ],
  "rules": {
    "no-any": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-types": ["error", { "allowExpressions": true }],
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "nestjs-typed/provided-in-root-required": "error",
    "nestjs-typed/injectable-should-be-provided": "warn"
  }
}
```

**Criterios de aceptación**:
- [ ] ESLint configurado
- [ ] 0 errors en `npm run lint`
- [ ] Pre-commit hook (husky) ejecuta lint
- [ ] CI bloquea merge si hay errors
- [ ] Documentar en docs/code-style.md

**Tiempo estimado**: 4 horas  

---

### TAREA 4.2 — Eliminar Todos los 'any' (37 → 0)

**Prioridad**: 🟡 MEJORA  
**Puntos de historia**: 5  
**Asignado a**: Backend Mid  
**Impacto**: MEJORA — Type safety, menos bugs  

**Estrategia**:
- Definir tipos explícitos para requests, responses
- Usar genéricos en lugar de any
- Mantener tipos compartidos en packages/shared

**Ejemplo**:
```typescript
// ❌ ANTES
@Post('login')
async login(@Body() dto: any) {
  const result = await this.service.login(dto);
  return result;
}

// ✅ DESPUÉS
@Post('login')
async login(@Body() dto: LoginDto): Promise<LoginResponse> {
  const result = await this.service.login(dto);
  return result;
}
```

**Criterios de aceptación**:
- [ ] Grep `any` retorna 0 resultados en src/
- [ ] Todos los DTOs tipados
- [ ] Request/Response types definidos
- [ ] Tests sin 'any'

**Tiempo estimado**: 2 días  

---

### TAREA 4.3 — Aumentar Test Coverage a 80%+ Global

**Prioridad**: 🟡 MEJORA  
**Puntos de historia**: 5  
**Asignado a**: QA / Backend  
**Impacto**: MEJORA — Confianza en refactors, menos regresiones  

**Métricas actuales**:
- Coverage: ~35%
- Meta: 80%+ global, 90%+ en módulos críticos

**Archivos a testear**:
- Accounting services (0% → 80%+)
- Validadores
- Helpers
- Exceptions

**Instalación**:
```bash
npm install --save-dev jest @types/jest ts-jest
```

**`jest.config.js`**:
```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
  },
};
```

**Script en package.json**:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:cov:report": "jest --coverage && open coverage/index.html"
  }
}
```

**CI gate**:
```yaml
# .github/workflows/test-api.yml
- name: Check coverage
  run: |
    npm run test:cov
    # Fail if coverage < 80%
    npx istanbul check-coverage --lines 80 --functions 80 --branches 75
```

**Criterios de aceptación**:
- [ ] Coverage global >= 80%
- [ ] Coverage crítico (auth, DTE, accounting) >= 90%
- [ ] CI rechaza PRs con coverage < 80%
- [ ] Todas las funciones tienen tests

**Tiempo estimado**: 2-3 días  

---

### TAREA 4.4 — Documentación Completa

**Prioridad**: 🟡 MEJORA  
**Puntos de historia**: 3  
**Asignado a**: Tech Lead  
**Impacto**: MEJORA — Onboarding, mantenimiento  

**Documentos a crear/actualizar**:
- [ ] `docs/ARCHITECTURE.md` — overview de módulos
- [ ] `docs/SECURITY_FIXES.md` — cambios de seguridad
- [ ] `docs/TESTING_STRATEGY.md` — cómo testear
- [ ] `docs/DEPLOYMENT.md` — pasos post-deploy
- [ ] `docs/SCALABILITY.md` — para 20+ tenants
- [ ] `docs/API_DESIGN.md` — patrones de API
- [ ] `CHANGELOG.md` — todas las características, fixes

**Estructura mínima por documento**:
```markdown
# [Título]

## Overview
- 1-2 párrafos de qué es y por qué

## Implementation
- Arquitectura
- Código relevante
- Configuración

## Testing
- Cómo testear
- Edge cases

## Troubleshooting
- Problemas comunes
- Soluciones
```

**Criterios de aceptación**:
- [ ] 7+ documentos creados
- [ ] Cada documento >= 500 palabras
- [ ] Incluir ejemplos de código
- [ ] Incluir diagramas ASCII si aplica

**Tiempo estimado**: 2 días  

---

### TAREA 4.5 — Performance Testing con k6

**Prioridad**: 🟡 MEJORA  
**Puntos de historia**: 5  
**Asignado a**: Backend Mid / DevOps  
**Impacto**: MEJORA — Validar que soporta 20 tenants × 10 clientes = 200 users  

**Instalación**:
```bash
brew install k6  # macOS
# O descargar desde https://k6.io/docs/getting-started/installation/
```

**Script k6 básico**:
```javascript
// test/load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp-up
    { duration: '1m30s', target: 100 }, // Stay at load
    { duration: '20s', target: 0 },     // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms
    http_req_failed: ['rate<0.1'],                   // Error rate < 0.1%
  },
};

export default function () {
  let params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
  };

  // Test 1: List DTEs
  let res1 = http.get('http://localhost:3000/api/dtes?limit=10', params);
  check(res1, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Test 2: Create DTE
  let payload = JSON.stringify({
    clientId: 'client-1',
    montoTotal: 1000,
    // ...
  });
  let res2 = http.post('http://localhost:3000/api/dtes', payload, params);
  check(res2, {
    'status is 201': (r) => r.status === 201,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  // Test 3: Get DTE
  let dteId = res2.json('id');
  let res3 = http.get(`http://localhost:3000/api/dtes/${dteId}`, params);
  check(res3, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

**Ejecutar test**:
```bash
k6 run test/load.js

# Output esperado:
# ✓ status is 200: 95% of checks passed
# ✓ response time < 500ms: 98% of checks passed
# p95 (Duration): 487ms
# p99 (Duration): 892ms
```

**Criterios de aceptación**:
- [ ] Script k6 cubre 5+ endpoints críticos
- [ ] p95 latency < 500ms (reads)
- [ ] p95 latency < 1000ms (writes)
- [ ] Error rate < 0.1%
- [ ] Soporta 100+ usuarios concurrentes
- [ ] Documentar en docs/performance-testing.md

**Tiempo estimado**: 1 día  

---

### 🏁 SPRINT 4 RESUMEN

| Tarea | Prioridad | Puntos | Tiempo | Estado |
|-------|-----------|--------|--------|--------|
| 4.1 - ESLint | 🟡 MEJORA | 3 | 4h | ⬜ TODO |
| 4.2 - Eliminar 'any' | 🟡 MEJORA | 5 | 2d | ⬜ TODO |
| 4.3 - Coverage 80%+ | 🟡 MEJORA | 5 | 2-3d | ⬜ TODO |
| 4.4 - Documentación | 🟡 MEJORA | 3 | 2d | ⬜ TODO |
| 4.5 - k6 Load Testing | 🟡 MEJORA | 5 | 1d | ⬜ TODO |
| **TOTAL SPRINT 4** | | **21 puntos** | **~2 semanas** | |

---

## 📊 RESUMEN EJECUTIVO

### Timeline Total

```
Sprint 1 (Semana 1-2):      10 días  — BLOQUEANTES DE SEGURIDAD
Sprint 2 (Semana 3-4):      10 días  — PERFORMANCE & RELIABILITY
Sprint 3 (Semana 5-6):      12 días  — ASYNC & RLS
Sprint 4 (Semana 7-8):      8 días   — TECH DEBT & TESTING
───────────────────────────────────────────
Total:                      ~8 semanas (40 días)
Equipos recomendados:       2-3 developers
```

### Cambio en Puntuación

```
Inicio:      68/100  (ALTO riesgo)
Post-Sprint 1: 82/100  (MEDIO-BAJO riesgo)  ← Bloqueantes resueltos
Post-Sprint 2: 86/100  (MEDIO-BAJO)         ← Performance ok
Post-Sprint 3: 90/100  (BAJO riesgo)        ← RLS + Async ok
Post-Sprint 4: 95/100  (BAJO riesgo)        ← Tech debt + testing
```

### Distribución de Trabajo

```
Seguridad:           35 puntos (30%)  ✅ CRÍTICO
Performance:         25 puntos (21%)  ✅ IMPORTANTE
Testing:             30 puntos (25%)  ✅ CRÍTICO
Infraestructura:     10 puntos (8%)   ✅ IMPORTANTE
Tech Debt:           21 puntos (18%)  ✅ MEJORA
───────────────────────────────
Total:              121 puntos
```

### Gates de Calidad

```
✅ Post-Sprint 1: 0 CRÍTICOs, rate limiting, tests multi-tenant
✅ Post-Sprint 2: N+1 fixed, índices ok, logging estructurado
✅ Post-Sprint 3: Async processing, RLS, non-root Docker
✅ Post-Sprint 4: ESLint, coverage 80%+, docs completas
✅ Pre-launch: Load test con 100+ users, SLOs validados
```

### Recursos Necesarios

```
👨‍💻 Equipo backend:   2 developers senior/mid
👨‍💻 QA:              1 QA engineer
👨‍💻 DevOps:          0.5 FTE (part-time)
⏱️  Total:            ~3.5 FTE × 8 semanas = 280 horas

💰 Presupuesto estimado:
   Con devs locales El Salvador: $15K-20K
   Con devs outsourced: $20K-30K
```

---

## 🎯 NEXT STEPS

1. **Ahora**: Priorizar Sprint 1 — **EMPEZAR INMEDIATAMENTE**
2. **Semana 2**: Review de resultados, ajustar Sprint 2 si es necesario
3. **Semana 4**: Validar performance con k6, ajustar Sprint 3
4. **Semana 8**: QA final, documentation review, launch readiness

---

**Documento creado**: 9 de marzo de 2026  
**Status**: LISTO PARA IMPLEMENTACIÓN  
**Siguiente revisión**: Post-Sprint 1 (2 semanas)  
