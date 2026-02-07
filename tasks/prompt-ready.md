# PROMPT PARA CLAUDE CODE - FASE 0: ISSUES DE QA
**VERSIÓN ACTUALIZADA CON ESTRUCTURA REAL DEL PROYECTO**

## Contexto del Proyecto
Estoy trabajando en "Facturador Electrónico SV", un sistema SaaS de facturación electrónica para El Salvador construido con:
- **Backend:** NestJS + Prisma ORM + Azure SQL Database (SQL Server)
- **Frontend:** Next.js 14 (App Router) + shadcn/ui + Tailwind CSS
- **Ubicación:** `/home/jose/facturador-electronico-sv`
- **Estructura:** Turborepo con `/apps/api` (backend) y `/apps/web` (frontend)

## ⚠️ RUTAS CORRECTAS DEL PROYECTO

```
facturador-electronico-sv/
├── apps/
│   ├── api/                    # Backend NestJS
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # Autenticación
│   │   │   │   └── tenant/     # Gestión de tenants
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma   # ⭐ Schema de base de datos
│   │   ├── .env                # Variables locales (opcional)
│   │   └── package.json
│   └── web/                    # Frontend Next.js
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/
│       │   │   │   └── page.tsx
│       │   │   └── register/
│       │   │       └── page.tsx  # ⭐ Formulario de registro
│       │   └── (dashboard)/
│       ├── components/
│       │   └── ui/             # shadcn/ui components
│       └── package.json
└── package.json                # Root Turborepo
```

## 🗄️ INFORMACIÓN DE BASE DE DATOS

**Motor:** Azure SQL Server (Microsoft SQL Server, NO PostgreSQL)
**Provider Prisma:** `sqlserver`
**Modelo de Usuario:** `User` (ya existe en schema)

**Schema actual del modelo User:**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  nombre    String
  rol       String   @default("FACTURADOR")
  tenantId  String?
  tenant    Tenant?  @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
  
  // Campos de seguridad que DEBES AGREGAR para Issue #14:
  // failedLoginAttempts Int       @default(0)
  // accountLockedUntil  DateTime?
  // lastFailedLoginAt   DateTime?
}
```

## 🔐 VARIABLES DE ENTORNO

Las variables están configuradas en **Azure App Service**. No hay archivo `.env` en producción.
Para desarrollo local, puedes crear `apps/api/.env` con:
- `DATABASE_URL` - Connection string de Azure SQL
- `JWT_SECRET` - Secret para JWT
- `MH_API_ENV` - "TEST" o "PRODUCTION"
- `ENCRYPTION_KEY` - Para encriptar datos sensibles

Ver archivo `.env.example` en la raíz del proyecto para referencia completa.

---

## Tu Misión
Resolver **14 issues reportados por QA** siguiendo la metodología de trabajo de Republicode. Estos issues afectan principalmente el módulo de **Registro de Empresas** (`apps/web/app/(auth)/register/page.tsx`) y **Login** (`apps/web/app/(auth)/login/page.tsx`).

---

## METODOLOGÍA DE TRABAJO (CRÍTICO - LEER PRIMERO)

### 1. Plan Mode Default
- **NUNCA** empieces a codear sin un plan
- Si recibo una tarea no trivial (más de 3 pasos), **DETENTE** y escribe un plan detallado primero
- El plan debe incluir:
  - Archivos que vas a modificar (rutas completas desde `/apps`)
  - Orden de las tareas (paso 1, paso 2, etc.)
  - Criterios de aceptación por tarea
  - Comandos que vas a ejecutar
  - Tests que vas a escribir
- Si algo sale mal, **STOP** y re-planea — no sigas avanzando sin validar

### 2. Subagent Strategy
- Usa subagentes liberalmente para mantener el contexto principal limpio
- Offload research, exploraciones, y análisis en paralelo a subagentes
- Un subagent por tarea compleja (ej: "investiga cómo funciona react-hook-form con Zod")
- Una tarea por subagente para ejecución enfocada

### 3. Self-Improvement Loop
- Después de CUALQUIER corrección mía: actualiza `tasks/lessons.md` con el patrón
- Escribe reglas para ti mismo para prevenir el mismo error
- Revisa `lessons.md` al inicio de cada sesión
- Itera sin piedad en estas lecciones

### 4. Verification Before Done
- Nunca marques una tarea completa sin probar que funciona
- Difféalo del comportamiento main y MUESTRA tus cambios cuando sean relevantes
- Pregúntate: "¿Aprobaría un staff engineer esto?"
- Ejecuta tests, revisa logs, demuestra correctitud

### 5. Demand Elegance (Balanced)
- Para cambios no triviales, pausa y pregunta: "¿Hay una forma más elegante?"
- Si un fix se siente hacky: "Con todo lo que sé ahora, implementa la solución elegante"
- **SKIP** esto para fixes simples y obvios — no over-engineerizar
- Desafía tu propio trabajo antes de presentarlo

### 6. Autonomous Bug Fixing
- Cuando te doy un reporte de bug: simplemente arréglalo. No pidas hand-holding
- Señala logs, errores, tests que fallan — luego resuélvelos
- Zero context switching requerido del usuario
- Ve a arreglar CI tests que fallan sin que te lo pidan
- Si algo no funciona, usa el método científico: hipótesis, prueba, itera

---

## ISSUES A RESOLVER (ORDEN DE PRIORIDAD)

### 🔴 SPRINT 1: Issues Críticos (ALTA Prioridad)

#### ISSUE #6: Longitud de Campo Razón Social (Internal Server Error)
**Archivo PDF:** Página 7  
**Módulos afectados:** 
- `apps/api/src/modules/tenant/dto/register-tenant.dto.ts` (backend)
- `apps/web/app/(auth)/register/page.tsx` (frontend)
- `apps/api/prisma/schema.prisma` (validar tipos de columna)

**Problema:**
Campos de texto sin límite de longitud generan error 500 (Internal Server Error) al registrar empresa cuando el usuario ingresa más de 250 caracteres.

**Tareas Backend:**
1. Localiza el DTO de registro de tenant en `apps/api/src/modules/tenant/dto/`
2. Agrega decoradores `@MaxLength()` de `class-validator` con estos límites:
   - `razonSocial` o `nombre`: 200 caracteres
   - `nombreComercial`: 200 caracteres
   - `correo`: 100 caracteres
   - `direccion`: 500 caracteres
   - Para el usuario admin:
     - `nombre` (admin): 200 caracteres
     - `email` (admin): 100 caracteres
     - `password`: 128 caracteres
3. Verifica en `apps/api/prisma/schema.prisma` modelo `Tenant` que los tipos SQL coincidan:
   - Campos de texto normales: `@db.NVarChar(200)` o similar
   - Direccion y campos largos: `@db.NVarChar(Max)`
4. Si encuentras discrepancias, crea migración: `cd apps/api && npx prisma migrate dev --name fix-field-lengths`

**Tareas Frontend:**
1. Localiza `apps/web/app/(auth)/register/page.tsx`
2. Agrega prop `maxLength` a todos los inputs según límites definidos
3. Implementa contador de caracteres para campos críticos (Razón Social, Dirección)
4. Estilo del contador: rojo cuando >90% del límite

**Criterios de Aceptación:**
- ✅ Backend rechaza valores largos con error 400 descriptivo
- ✅ Frontend bloquea entrada más allá del límite
- ✅ Contadores visibles y funcionales
- ✅ No se genera error 500 con ningún input

---

#### ISSUE #14: No Bloquea Cuenta Después de 5 Intentos Fallidos
**Archivo PDF:** Página 17-18  
**Módulos afectados:**
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/prisma/schema.prisma` (agregar campos a modelo `User`)
- `apps/web/app/(auth)/login/page.tsx`

**Problema:**
El sistema no implementa bloqueo de cuenta por intentos fallidos de login. Permite intentos ilimitados (riesgo de seguridad).

**Tareas Backend:**

1. **Migración de Prisma:**
   ```bash
   cd apps/api
   ```
   
   Edita `prisma/schema.prisma`, modelo `User`, agrega:
   ```prisma
   model User {
     // ... campos existentes ...
     
     // Campos de seguridad
     failedLoginAttempts Int       @default(0)
     accountLockedUntil  DateTime?
     lastFailedLoginAt   DateTime?
     
     // ... relaciones existentes ...
   }
   ```
   
   Ejecuta migración:
   ```bash
   npx prisma migrate dev --name add-login-security
   ```

2. **Modificar lógica de autenticación:**
   - Localiza `apps/api/src/modules/auth/auth.service.ts`
   - Busca el método que valida login (probablemente `validateUser` o `login`)
   
3. **Implementar lógica de bloqueo:**
   ```typescript
   // PSEUDOCÓDIGO - adapta al código existente
   
   async validateUser(email: string, password: string) {
     const user = await this.prisma.user.findUnique({ where: { email } });
     
     // 1. Verificar si cuenta está bloqueada
     if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
       const minutesLeft = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000);
       throw new UnauthorizedException(
         `Cuenta bloqueada temporalmente por seguridad. Intente nuevamente en ${minutesLeft} minutos.`
       );
     }
     
     // 2. Validar contraseña
     const isValid = await bcrypt.compare(password, user.password);
     
     if (!isValid) {
       // Incrementar contador
       const newAttempts = user.failedLoginAttempts + 1;
       
       if (newAttempts >= 5) {
         // Bloquear por 15 minutos
         const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
         await this.prisma.user.update({
           where: { id: user.id },
           data: {
             failedLoginAttempts: newAttempts,
             accountLockedUntil: lockUntil,
             lastFailedLoginAt: new Date(),
           },
         });
         throw new UnauthorizedException(
           'Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente en 15 minutos.'
         );
       }
       
       // Solo incrementar
       await this.prisma.user.update({
         where: { id: user.id },
         data: {
           failedLoginAttempts: newAttempts,
           lastFailedLoginAt: new Date(),
         },
       });
       throw new UnauthorizedException('Credenciales inválidas');
     }
     
     // 3. Login exitoso - resetear contador
     if (user.failedLoginAttempts > 0) {
       await this.prisma.user.update({
         where: { id: user.id },
         data: {
           failedLoginAttempts: 0,
           accountLockedUntil: null,
           lastFailedLoginAt: null,
         },
       });
     }
     
     return user;
   }
   ```

**Tareas Frontend:**
1. En `apps/web/app/(auth)/login/page.tsx`, captura error de cuenta bloqueada
2. Muestra `<AlertDialog>` de shadcn/ui con:
   - Ícono de candado
   - Mensaje claro con minutos restantes
   - Botón "Entendido"
   - Link "¿Olvidaste tu contraseña?"

**Criterios de Aceptación:**
- ✅ Cuenta se bloquea después de exactamente 5 intentos fallidos
- ✅ Bloqueo dura 15 minutos
- ✅ Login exitoso resetea contador
- ✅ Mensaje claro en frontend
- ✅ Después de 15 minutos, cuenta se desbloquea automáticamente

---

#### ISSUE #9: Correo Electrónico de Empresa Igual a de Admin User
**Archivo PDF:** Página 12  
**Módulos afectados:**
- `apps/api/src/modules/tenant/dto/register-tenant.dto.ts`
- `apps/web/app/(auth)/register/page.tsx` (validación Zod)

**Problema:**
El sistema permite registrar empresa con el mismo email para empresa y admin.

**Tareas Backend:**
1. Crear validador custom:
   ```typescript
   // apps/api/src/common/validators/emails-distinct.validator.ts
   import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
   
   @ValidatorConstraint({ name: 'EmailsCannotMatch', async: false })
   export class EmailsCannotMatchConstraint implements ValidatorConstraintInterface {
     validate(correoAdmin: string, args: ValidationArguments) {
       const dto = args.object as any;
       return correoAdmin !== dto.correo; // correo de la empresa
     }
   
     defaultMessage() {
       return 'El correo del administrador debe ser diferente al correo de la empresa';
     }
   }
   ```

2. Aplicar en DTO:
   ```typescript
   export class RegisterTenantDto {
     @IsEmail({}, { message: 'Correo de empresa inválido' })
     correo: string; // Email de la empresa
     
     @IsEmail({}, { message: 'Correo de administrador inválido' })
     @Validate(EmailsCannotMatchConstraint)
     email: string; // Email del admin
   }
   ```

**Tareas Frontend:**
1. En schema Zod del formulario, agregar:
   ```typescript
   .refine(
     (data) => data.correoEmpresa.toLowerCase() !== data.emailAdmin.toLowerCase(),
     {
       message: "El correo del administrador no puede ser el mismo que el de la empresa",
       path: ["emailAdmin"],
     }
   )
   ```

**Criterios de Aceptación:**
- ✅ Backend rechaza si emails coinciden (case-insensitive)
- ✅ Frontend valida antes de enviar
- ✅ Error aparece debajo del campo correcto

---

#### ISSUE #4: Máscaras en Campos NIT, NRC y Teléfono
**Archivo PDF:** Página 4  
**Módulos afectados:**
- `apps/web/app/(auth)/register/page.tsx`
- Componentes de input en `apps/web/components/ui/`

**Problema:**
Los placeholders muestran formato de máscara pero no se aplica al escribir.

**Tareas:**

1. Instalar librería:
   ```bash
   cd apps/web
   npm install react-input-mask
   npm install -D @types/react-input-mask
   ```

2. Crear componente:
   ```typescript
   // apps/web/components/ui/masked-input.tsx
   import React from 'react';
   import InputMask from 'react-input-mask';
   import { Input } from './input';
   
   interface MaskedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
     mask: string;
     maskChar?: string;
   }
   
   export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
     ({ mask, maskChar = '_', ...props }, ref) => {
       return (
         <InputMask mask={mask} maskChar={maskChar} {...props}>
           {(inputProps: any) => <Input {...inputProps} ref={ref} />}
         </InputMask>
       );
     }
   );
   ```

3. Aplicar en formulario:
   ```tsx
   // NIT: formato 0000-000000-000-0
   <MaskedInput mask="9999-999999-999-9" placeholder="0000-000000-000-0" {...field} />
   
   // NRC: formato 000000-0
   <MaskedInput mask="999999-9" placeholder="000000-0" {...field} />
   
   // Teléfono: formato 0000-0000
   <MaskedInput mask="9999-9999" placeholder="0000-0000" {...field} />
   ```

4. Limpiar valores antes de enviar:
   ```typescript
   const onSubmit = (data) => {
     const cleaned = {
       ...data,
       nit: data.nit.replace(/-/g, ''),
       nrc: data.nrc.replace(/-/g, ''),
       telefono: data.telefono.replace(/-/g, ''),
     };
     // Enviar cleaned
   };
   ```

**Criterios de Aceptación:**
- ✅ Máscaras se aplican al escribir
- ✅ No se permiten más caracteres del formato
- ✅ Valores enviados están limpios (sin guiones)

---

#### ISSUE #7: Color de Letras del Listado del Campo Municipio
**Archivo PDF:** Página 9-10  
**Módulos afectados:**
- `apps/web/app/globals.css`
- `apps/web/components/ui/select.tsx`

**Problema:**
Opciones del dropdown de Municipio son invisibles hasta hover.

**Tareas:**
1. Abrir `apps/web/app/globals.css`
2. Agregar o modificar:
   ```css
   /* Asegurar visibilidad de items en Select */
   [data-radix-select-item] {
     color: hsl(var(--foreground)) !important;
   }
   
   [data-radix-select-item][data-highlighted] {
     background-color: hsl(var(--accent));
     color: hsl(var(--accent-foreground));
   }
   ```
3. Probar en light y dark mode
4. Aplicar mismo fix a dropdown Departamento si tiene el mismo problema

**Criterios de Aceptación:**
- ✅ Opciones visibles sin hover
- ✅ Contraste adecuado en ambos modos
- ✅ Hover sigue siendo distinguible

---

### 🟡 SPRINT 2: Issues Medios (Resolver después de ALTA)

*(Los demás issues se incluyen en el archivo `tasks-todo.md` principal)*

---

## INSTRUCCIONES DE EJECUCIÓN

### Paso 1: Análisis Inicial
```bash
cd /home/jose/facturador-electronico-sv

# Verificar estado
git status

# Ver schema actual
cat apps/api/prisma/schema.prisma | grep -A 20 "model User"

# Ver estructura de auth
ls -la apps/api/src/modules/auth/

# Ver formulario de registro
ls -la apps/web/app/\(auth\)/register/
```

### Paso 2: Crear Rama de Trabajo
```bash
git checkout main
git pull origin main
git checkout -b fix/qa-issues-sprint-1
```

### Paso 3: Resolver Issues en Orden
**Día 1:**
- Issue #6 (Longitud campos)
- Issue #14 (Bloqueo cuenta)

**Día 2:**
- Issue #9 (Emails distintos)
- Issue #4 (Máscaras)
- Issue #7 (Color dropdown)

### Paso 4: Testing
```bash
# Backend
cd apps/api
npm run test

# Prisma
npx prisma migrate dev
npx prisma generate

# Frontend
cd apps/web
npm run dev
# Probar en http://localhost:3000
```

### Paso 5: Commit y Push
```bash
git add .
git commit -m "fix(auth): resolver issues #4, #6, #7, #9, #14 - seguridad y validación"
git push origin fix/qa-issues-sprint-1
```

---

## RECURSOS ÚTILES

**Archivos de referencia:**
- Schema Prisma: `apps/api/prisma/schema.prisma`
- Auth Service: `apps/api/src/modules/auth/auth.service.ts`
- Registro Frontend: `apps/web/app/(auth)/register/page.tsx`
- Login Frontend: `apps/web/app/(auth)/login/page.tsx`

**Comandos Prisma:**
```bash
cd apps/api
npx prisma migrate dev --name [nombre]
npx prisma studio  # Ver BD visualmente
npx prisma generate
```

**Convenciones de commit:**
- `fix(auth):` - Bugs de autenticación
- `fix(validation):` - Validaciones
- `feat(ui):` - Nuevas features UI
- `style(ui):` - Cambios de diseño

---

## CRITERIOS DE ACEPTACIÓN GENERALES

Antes de marcar issue como resuelto:
- [ ] Código compila sin errores (`npm run build` en `apps/api` y `apps/web`)
- [ ] Tests relevantes pasan
- [ ] Probado manualmente en navegador
- [ ] Funciona en light y dark mode
- [ ] Mensajes en español
- [ ] No hay regresiones

---

## 🎯 RECORDATORIOS CRÍTICOS

1. **Rutas correctas:** Siempre usar `apps/api/` y `apps/web/`, NO `api/` ni `web/`
2. **Base de datos:** SQL Server, NO PostgreSQL
3. **Modelo User:** Ya existe, solo agregar campos de seguridad
4. **Variables:** Están en Azure, no necesitas `.env` local (pero puedes crearlo)
5. **Prisma:** Después de cambios en schema, SIEMPRE ejecutar `npx prisma generate`

---

¡Manos a la obra! 🚀
