# Lecciones Aprendidas - Facturador Electrónico SV

**Fecha de inicio:** 7 de febrero de 2026  
**Propósito:** Este archivo registra patrones de error y sus soluciones para prevenir repetición

---

## 🎓 Reglas Fundamentales

### 1. Siempre Planificar Antes de Codear
**Regla:** Para cualquier tarea con más de 3 pasos, DETENTE y escribe un plan primero  
**Por qué:** Evita retrabajos y mantiene el enfoque claro  
**Ejemplo de plan adecuado:**
```
PLAN: Agregar máscaras a inputs NIT, NRC, Teléfono
1. Instalar react-input-mask (web/package.json)
2. Crear componente MaskedInput (web/components/ui/masked-input.tsx)
3. Reemplazar Input por MaskedInput en formulario de registro
4. Limpiar valores antes de enviar al backend
5. Probar con datos de prueba
```

### 2. Verificar Antes de Marcar Como Completado
**Regla:** Nunca marcar tarea completa sin evidencia de que funciona  
**Checklist mínimo:**
- [ ] Código compila sin errores
- [ ] Tests relevantes pasan (si aplica)
- [ ] Probé manualmente en navegador (para UI)
- [ ] No introduje regresiones

### 3. Contexto es Rey
**Regla:** Antes de empezar, entender completamente el contexto actual  
**Acciones obligatorias:**
- Leer schema Prisma completo
- Entender estructura de carpetas del proyecto
- Localizar archivos existentes relacionados a la tarea
- Verificar convenciones de código actuales

---

## 📝 Lecciones Específicas del Proyecto

### Lección #001: Prisma Migrations Requieren Confirmación
**Fecha:** [Por registrar]  
**Contexto:** Al crear migraciones de Prisma  
**Problema:** [Registrar cuando ocurra]  
**Solución:** Siempre ejecutar `npx prisma migrate dev --name [nombre-descriptivo]` y verificar que se aplicó correctamente  
**Prevención:** Antes de push, verificar que existe archivo de migración en `api/prisma/migrations/`

---

### Lección #002: Azure SQL vs PostgreSQL
**Fecha:** [Por registrar]  
**Contexto:** Base de datos es Azure SQL (Microsoft SQL Server)  
**Problema potencial:** Sintaxis y tipos difieren de PostgreSQL  
**Solución:** 
- Usar `@db.VarChar(N)` en lugar de `@db.Text`
- Validar que decoradores `@MaxLength()` coincidan con tipos de columna
- Considerar que Azure SQL no tiene arrays nativos como Postgres
**Prevención:** Consultar docs de Prisma para SQL Server antes de crear modelos complejos

---

### Lección #003: shadcn/ui Components Path
**Fecha:** [Por registrar]  
**Contexto:** Componentes de shadcn/ui están en `web/components/ui/`  
**Problema potencial:** Importar de rutas incorrectas  
**Solución:** Siempre importar desde `@/components/ui/[component]`  
**Prevención:** Antes de crear componente custom, verificar si shadcn ya lo provee

---

### Lección #004: Validación Dual (Frontend + Backend)
**Fecha:** [Por registrar]  
**Contexto:** Sistema debe validar en ambos lados  
**Regla de oro:**
- **Frontend (Zod):** Validación de UX, feedback inmediato
- **Backend (class-validator):** Validación de seguridad, nunca confiar en el cliente
**Patrón recomendado:**
```typescript
// Frontend: Zod schema
const schema = z.object({
  email: z.string().email().max(100)
});

// Backend: DTO con decoradores
export class CreateUserDto {
  @IsEmail()
  @MaxLength(100)
  email: string;
}
```

---

### Lección #005: Máscaras de Input Necesitan Limpieza
**Fecha:** [Por registrar]  
**Contexto:** Máscaras como "0000-000000-000-0" se almacenan con guiones  
**Problema:** Backend espera solo dígitos, pero recibe "1234-567890-123-4"  
**Solución:** Limpiar valores antes de enviar:
```typescript
const cleanedData = {
  ...data,
  nit: data.nit.replace(/-/g, ''),
};
```
**Prevención:** Siempre que uses máscaras, agregar paso de limpieza en `onSubmit`

---

### Lección #006: Mensajes de Error en Español
**Fecha:** [Por registrar]  
**Contexto:** Aplicación es para mercado salvadoreño  
**Regla:** TODOS los mensajes visibles al usuario deben estar en español  
**Incluye:**
- Mensajes de validación
- Errores de API
- Toasts y alertas
- Labels de formularios
**Prevención:** Antes de commit, buscar cualquier mensaje en inglés en archivos modificados

---

## 🔧 Patrones de Código Aprobados

### Pattern #1: Estructura de Formularios con react-hook-form
```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  email: z.string().email("Correo inválido").max(100, "Máximo 100 caracteres"),
});

export function MyForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onBlur", // Validar al salir del campo
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // Lógica de envío
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico *</FormLabel>
              <FormControl>
                <Input {...field} maxLength={100} />
              </FormControl>
              <FormMessage /> {/* Error aparece aquí */}
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

### Pattern #2: Validación Custom en NestJS
```typescript
// Crear validador
import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'CustomValidator', async: false })
export class CustomValidatorConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    // Lógica de validación
    return true; // o false
  }

  defaultMessage(args: ValidationArguments) {
    return 'Mensaje de error en español';
  }
}

// Usar en DTO
export class MyDto {
  @Validate(CustomValidatorConstraint)
  field: string;
}
```

### Pattern #3: Manejo de Errores en Frontend
```typescript
try {
  await apiCall();
  toast.success("Operación exitosa");
} catch (error) {
  if (error.response?.status === 400) {
    // Error de validación
    toast.error(error.response.data.message);
  } else if (error.response?.status === 401) {
    // No autenticado
    router.push("/login");
  } else {
    // Error genérico
    toast.error("Ocurrió un error. Por favor intenta nuevamente.");
  }
}
```

---

## 🚫 Anti-Patrones (Evitar)

### ❌ Anti-Pattern #1: Hardcodear Valores
**Malo:**
```typescript
if (userRole === 'admin') { ... }
```
**Bueno:**
```typescript
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}
if (userRole === UserRole.ADMIN) { ... }
```

### ❌ Anti-Pattern #2: Ignorar Null Safety
**Malo:**
```typescript
const email = user.email.toLowerCase(); // Puede crashear si user.email es null
```
**Bueno:**
```typescript
const email = user.email?.toLowerCase() ?? '';
```

### ❌ Anti-Pattern #3: Validación Solo en Frontend
**Malo:** Solo validar con Zod en el cliente  
**Bueno:** Validar en frontend (UX) Y backend (seguridad)

### ❌ Anti-Pattern #4: Commits Sin Mensaje Descriptivo
**Malo:** `git commit -m "fix"`  
**Bueno:** `git commit -m "fix(auth): resolver bloqueo de cuenta después de 5 intentos fallidos"`

---

## 📊 Métricas de Calidad

### Checklist Pre-Commit
Antes de cada commit, verificar:
- [ ] Código compila sin warnings
- [ ] Tests relevantes agregados/actualizados
- [ ] No hay console.logs olvidados
- [ ] Mensajes en español
- [ ] Imports organizados (unused removidos)
- [ ] Commit message sigue convención

### Checklist Pre-Deploy
Antes de merge a main:
- [ ] Todos los tests E2E pasan
- [ ] Build de producción exitoso
- [ ] Revisión de código completada
- [ ] Actualizada documentación si aplica

---

## 🔄 Proceso de Actualización de Este Archivo

**Cuándo agregar lecciones:**
- Después de cualquier error significativo
- Cuando descubres un patrón mejor
- Cuando recibes feedback correctivo de un senior
- Al finalizar cada sprint (retrospectiva)

**Formato de lección:**
```markdown
### Lección #XXX: Título Descriptivo
**Fecha:** DD/MM/YYYY  
**Contexto:** Breve explicación del contexto  
**Problema:** Qué salió mal o qué se descubrió  
**Solución:** Cómo se resolvió correctamente  
**Prevención:** Qué hacer para evitarlo en el futuro
```

---

**Última actualización:** 9 de febrero de 2026
**Próxima revisión:** Después de completar FASE 1 (Catálogo de Inventarios)

## 🧪 Testing Suite - Sprint 1 & 2 (Febrero 2026)

### ✅ Logros
- **88 backend tests** implementados (Jest + mocks)
- **25 E2E tests** (Playwright con Page Objects)
- **Coverage**: 84% clientes, 77% recurring-invoices, 96% processors
- **Velocidad**: 18.6s backend (9.6x mas rapido que objetivo)
- **CI/CD**: GitHub Actions workflows configurados

### 🎓 Lecciones Tecnicas Criticas

#### 1. Monorepo tsconfig Resolution
**Problema**: NestJS DI fallaba con errores TS18048 al ejecutar tests desde root.
**Causa**: `jest.config.ts` usaba root `tsconfig.json` que no tiene `emitDecoratorMetadata: true`
**Solucion**:
```typescript
// apps/api/jest.config.ts
import { join } from 'path';
export default {
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: join(__dirname, 'tsconfig.json'), // ← Usar tsconfig local
    }],
  },
};
```
**Leccion**: En monorepos, tests deben usar tsconfig de la app especifica.

#### 2. Multi-tenancy en Tests
**Pattern**: SIEMPRE incluir `tenantId` en mocks y validar filtrado.
```typescript
// ✅ Correcto
mockUser = { id: 'user-1', tenantId: 'tenant-1' };
await service.findAll('tenant-1', query);

// ❌ Incorrecto (security issue)
await service.findAll({});  // Retornaria datos de todos los tenants
```

#### 3. Redis Condicional (BullMQ)
**Pattern**: Scheduler/processor solo se activan si existe `REDIS_URL`.
```typescript
// recurring-invoices.module.ts
@Module({
  imports: [
    ...(process.env.REDIS_URL ? [BullModule.registerQueue(...)] : []),
  ]
})
```
**Beneficio**: API funciona sin Redis en desarrollo, scheduler solo en produccion.

#### 4. Playwright Setup Project Pattern
**Pattern**: Autenticar una vez, reusar sesion en todos los tests.
```typescript
// tests/fixtures/auth.fixture.ts
test('authenticate', async ({ page }) => {
  await page.goto('/login');
  // ... login
  await page.context().storageState({ path: '.auth/user.json' });
});

// playwright.config.ts - projects: setup -> chromium (con storageState)
```
**Beneficio**: 25 tests E2E sin re-autenticar → ahorro de ~2min.

#### 5. Mock Strategy por Capa
- **Services**: Mockear `PrismaService`
- **Controllers**: Mockear `Services`
- **Processors**: Mockear `DTEService` y `MHService`
- **Nunca**: Mockear dependencias internas del modulo testeado

### 🐛 Problemas Resueltos

1. **TS18048 "possibly undefined"**
   - Error: `Record<string, jest.Mock>` con `noUncheckedIndexedAccess` del root tsconfig
   - Fix: Usar `join(__dirname, 'tsconfig.json')` en jest.config.ts

2. **NestJS DI injection failure**
   - Error: `this.prisma.cliente` era `undefined` en tests
   - Causa: Root tsconfig sin `emitDecoratorMetadata` → NestJS no resuelve constructor params
   - Fix: Mismo fix de tsconfig path

3. **Coverage inconsistente**
   - Error: `jest --coverage` no incluia todos los archivos
   - Fix: `collectCoverageFrom` en jest.config con paths correctos

### 📈 Metricas Finales

| Metrica | Objetivo | Logrado | Status |
|---------|----------|---------|--------|
| Tests backend | 34 | 88 | ✅ 2.6x |
| Tests E2E | 21 | 25 | ✅ 1.2x |
| Coverage Sprint 1 | >70% | 84% | ✅ |
| Coverage Sprint 2 | >70% | 77% | ✅ |
| Velocidad backend | <3min | ~4s | ✅ |
| Velocidad E2E | <5min | ~2min | ✅ |

### 🔮 Mejoras Futuras
- [ ] Agregar mutation testing (Stryker)
- [ ] E2E tests con diferentes roles (admin, usuario, contador)
- [ ] Performance tests con Artillery
- [ ] Visual regression tests con Percy
- [ ] Contract testing con Pact (API ↔ Frontend)

---

## Session 2026-02-09 — Production Stabilization

### Lesson 6: React useCallback + Toast = Infinite Loop
**Problem**: Including `toast` from useToast() in useCallback dependency arrays creates infinite loops when toast changes context state.
**Solution**: Use toastRef pattern — `const toastRef = useRef(toast); toastRef.current = toast;`
**Files affected**: Any component using useToast() + useCallback/useEffect

### Lesson 7: Always Handle 404 as "Endpoint Not Available"
**Problem**: SaaS apps evolve — not all API versions have all endpoints. Unhandled 404s crash the entire app.
**Solution**: Every fetch must handle 404 gracefully with empty/error state. Use `.json().catch(() => ({}))` for safe parsing.

### Lesson 8: Defensive API Response Parsing
**Problem**: `data.data.length` crashes if API response shape is unexpected.
**Solution**: `const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];`

### Lesson 9: Query Params Are Strings
**Problem**: URL params arrive as strings to NestJS services, causing Prisma take/skip to malfunction.
**Solution**: Always `Number()` convert with `Math.max/Math.min` clamping before passing to ORM.

### Lesson 10: Audit Shared Components When Fixing Crashes
**Problem**: A crash in layout.tsx breaks ALL pages, not just the one visibly broken.
**Solution**: When debugging crashes, check every fetch in layout, sidebar, header, and providers — not just the page component.

### Lesson 11: Deploy API Before Web
**Problem**: Web v22-v23 deployed before API had the endpoints they needed, causing cascading failures.
**Solution**: Always deploy API first, verify endpoints with curl, then deploy web.

### Lesson 12: Don't Commit Coverage/Temp Files
**Problem**: `git add -A` committed coverage/, .md prompts, and .zip files to repo (71,542 lines of junk).
**Solution**: Update .gitignore BEFORE committing. Use `git add -p` or explicit paths for commits.
