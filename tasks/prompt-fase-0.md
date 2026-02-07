# PROMPT PARA CLAUDE CODE - FASE 0: ISSUES DE QA

## Contexto del Proyecto
Estoy trabajando en "Facturador Electrónico SV", un sistema SaaS de facturación electrónica para El Salvador construido con:
- **Backend:** NestJS + Prisma ORM + Azure SQL Database
- **Frontend:** Next.js 14 (App Router) + shadcn/ui + Tailwind CSS
- **Ubicación:** `\\wsl.localhost\Ubuntu-22.04\home\jose\facturador-electronico-sv`
- **Estructura:** Monorepo con `/api` (backend) y `/web` (frontend)

## Tu Misión
Resolver **14 issues reportados por QA** siguiendo estrictamente la metodología de trabajo de Republicode. Estos issues afectan principalmente el módulo de **Registro de Empresas** y **Login** del portal de tenants.

---

## METODOLOGÍA DE TRABAJO (CRÍTICO - LEER PRIMERO)

### 1. Plan Mode Default
- **NUNCA** empieces a codear sin un plan
- Si recibo una tarea no trivial (más de 3 pasos), **DETENTE** y escribe un plan detallado primero
- El plan debe incluir:
  - Archivos que vas a modificar (rutas completas)
  - Orden de las tareas (paso 1, paso 2, etc.)
  - Criterios de aceptación por tarea
  - Comandos que vas a ejecutar
  - Tests que vas a escribir
- Si algo sale mal, **STOP** y re-planea — no sigas avanzando sin validar

### 2. Subagent Strategy
- Usa subagentes liberalmente para mantener el contexto principal limpio
- Offload research, exploraciones, y análisis en paralelo a subagentes
- Un subagente por tarea compleja (ej: "investiga cómo funciona react-hook-form con Zod")
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
- `api/src/tenant/dto/register-tenant.dto.ts` (backend)
- `web/app/(auth)/register/page.tsx` (frontend)
- `api/prisma/schema.prisma` (validar tipos de columna)

**Problema:**
Campos de texto sin límite de longitud generan error 500 (Internal Server Error) al registrar empresa cuando el usuario ingresa más de 250 caracteres. Los campos afectados son:
- Razón Social
- Nombre Comercial
- Correo de la Empresa
- Dirección Completa
- Nombre Completo (admin)
- Correo Electrónico (admin)
- Contraseña
- Confirmar Contraseña

**Tareas:**

**Backend:**
1. Busca el DTO de registro de tenant (probablemente en `api/src/tenant/dto/register-tenant.dto.ts` o similar)
2. Agrega decoradores `@MaxLength()` de `class-validator` con estos límites:
   - `razonSocial`: 200 caracteres
   - `nombreComercial`: 200 caracteres
   - `correoEmpresa`: 100 caracteres
   - `direccionCompleta`: 500 caracteres
   - `nombreCompleto`: 200 caracteres (admin user)
   - `correoAdmin`: 100 caracteres
   - `password`: 128 caracteres
   - `confirmPassword`: 128 caracteres
3. Verifica en el Prisma schema que los tipos de columna (`@db.VarChar(N)`) coincidan con estos límites
4. Si encuentras discrepancias, crea una migración para ajustar
5. Agrega mensajes de error personalizados en español para cada `@MaxLength()`

**Frontend:**
1. Localiza el componente de formulario de registro (busca por "Razón Social" o "Registrar Empresa")
2. Agrega prop `maxLength` a todos los inputs de texto según los límites definidos
3. Implementa contador de caracteres con `<FormDescription>` que muestre:
   ```tsx
   <FormDescription className="text-xs text-muted-foreground">
     {field.value?.length || 0}/200 caracteres
   </FormDescription>
   ```
4. Cambia el color del contador a rojo cuando esté cerca del límite (>90%):
   ```tsx
   className={cn(
     "text-xs",
     (field.value?.length || 0) > maxLength * 0.9
       ? "text-destructive"
       : "text-muted-foreground"
   )}
   ```
5. Los contadores deben aparecer para: Razón Social, Nombre Comercial, Dirección Completa, Nombre Completo

**Tests:**
1. Test unitario del DTO: envía un payload con un campo de 300 caracteres y verifica que retorna error 400
2. Test E2E: intenta registrar empresa con Razón Social de 250 caracteres y verifica que se rechaza

**Criterios de Aceptación:**
- ✅ Backend rechaza valores excesivamente largos con error 400 y mensaje claro
- ✅ Frontend no permite escribir más allá del límite (hard stop)
- ✅ Contadores de caracteres visibles para campos críticos
- ✅ Contador cambia a rojo cuando está cerca del límite
- ✅ Mensaje de error específico se muestra si el usuario intenta enviar (por si deshabilita JS)

---

#### ISSUE #14: No Bloquea Cuenta Después de 5 Intentos Fallidos
**Archivo PDF:** Página 17-18  
**Módulos afectados:**
- `api/src/auth/auth.service.ts`
- `api/prisma/schema.prisma` (agregar campos)
- `web/app/(auth)/login/page.tsx`

**Problema:**
El sistema no implementa bloqueo de cuenta por intentos fallidos de login. Permite intentos ilimitados, lo cual es un riesgo de seguridad (ataques de fuerza bruta).

**Tareas Backend:**

1. **Migración de Prisma:**
   - Abre `api/prisma/schema.prisma`
   - Busca el modelo `User` (o `AdminUser`, `TenantUser` según tu estructura)
   - Agrega estos campos:
     ```prisma
     failedLoginAttempts Int       @default(0)
     accountLockedUntil  DateTime?
     lastFailedLoginAt   DateTime?
     ```
   - Ejecuta: `cd api && npx prisma migrate dev --name add-login-security`
   - Verifica que la migración se aplicó correctamente

2. **Modificar lógica de autenticación:**
   - Busca `api/src/auth/auth.service.ts` o el archivo donde validas login
   - Localiza el método que valida email/password (probablemente `validateUser` o `login`)
   
3. **Implementar lógica de bloqueo:**
   ```typescript
   // ANTES de validar contraseña:
   // 1. Verificar si la cuenta está bloqueada
   if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
     const minutesLeft = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000);
     throw new UnauthorizedException(
       `Cuenta bloqueada temporalmente por seguridad. Intente nuevamente en ${minutesLeft} minutos.`
     );
   }
   
   // 2. Validar contraseña
   const isPasswordValid = await bcrypt.compare(password, user.password);
   
   if (!isPasswordValid) {
     // Incrementar contador de fallos
     const newFailedAttempts = user.failedLoginAttempts + 1;
     
     if (newFailedAttempts >= 5) {
       // Bloquear por 15 minutos
       const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
       await this.prisma.user.update({
         where: { id: user.id },
         data: {
           failedLoginAttempts: newFailedAttempts,
           accountLockedUntil: lockUntil,
           lastFailedLoginAt: new Date(),
         },
       });
       throw new UnauthorizedException(
         'Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente en 15 minutos.'
       );
     } else {
       // Solo incrementar contador
       await this.prisma.user.update({
         where: { id: user.id },
         data: {
           failedLoginAttempts: newFailedAttempts,
           lastFailedLoginAt: new Date(),
         },
       });
       throw new UnauthorizedException('Credenciales inválidas');
     }
   }
   
   // 3. Si login exitoso, resetear contador
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
   ```

**Tareas Frontend:**

1. **Manejo de error de cuenta bloqueada:**
   - En `web/app/(auth)/login/page.tsx`, captura el error específico de cuenta bloqueada
   - Detecta el mensaje que contiene "Cuenta bloqueada" en el error
   
2. **Diseñar diálogo de bloqueo:**
   - Usa `<AlertDialog>` de shadcn/ui
   - Componentes a incluir:
     - Ícono de candado (lucide-react: `Lock` o `ShieldAlert`)
     - Título: "Cuenta bloqueada temporalmente"
     - Descripción: El mensaje del backend con los minutos restantes
     - Explicación adicional: "Por tu seguridad, bloqueamos temporalmente tu cuenta después de 5 intentos fallidos de inicio de sesión"
     - Botón primario: "Entendido" (cierra el diálogo)
     - Link secundario: "¿Olvidaste tu contraseña?" → `/forgot-password`

3. **Implementación de ejemplo:**
   ```tsx
   // Dentro del componente Login
   const [isBlocked, setIsBlocked] = useState(false);
   const [blockMessage, setBlockMessage] = useState("");
   
   const onSubmit = async (data) => {
     try {
       await loginMutation.mutateAsync(data);
     } catch (error) {
       if (error.message.includes("Cuenta bloqueada")) {
         setBlockMessage(error.message);
         setIsBlocked(true);
       } else {
         // Otro tipo de error
         toast.error(error.message);
       }
     }
   };
   
   return (
     <>
       {/* Formulario de login */}
       
       <AlertDialog open={isBlocked} onOpenChange={setIsBlocked}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <div className="flex items-center gap-2">
               <Lock className="h-5 w-5 text-destructive" />
               <AlertDialogTitle>Cuenta bloqueada temporalmente</AlertDialogTitle>
             </div>
             <AlertDialogDescription className="space-y-2">
               <p>{blockMessage}</p>
               <p className="text-sm text-muted-foreground">
                 Por tu seguridad, bloqueamos temporalmente tu cuenta después de 5 intentos fallidos.
               </p>
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter className="flex-col sm:flex-row gap-2">
             <Link href="/forgot-password">
               <Button variant="outline" className="w-full">
                 ¿Olvidaste tu contraseña?
               </Button>
             </Link>
             <AlertDialogAction className="w-full">
               Entendido
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </>
   );
   ```

**Tests:**
1. Test de bloqueo: simula 5 intentos fallidos consecutivos y verifica que el 5to bloquea la cuenta
2. Test de desbloqueo: verifica que después de 15 minutos la cuenta se desbloquea automáticamente
3. Test de reset: verifica que un login exitoso resetea el contador a 0

**Criterios de Aceptación:**
- ✅ Cuenta se bloquea automáticamente después de exactamente 5 intentos fallidos
- ✅ Bloqueo dura precisamente 15 minutos
- ✅ Mensaje claro muestra cuántos minutos faltan para desbloqueo
- ✅ Usuario tiene opción clara de recuperar contraseña
- ✅ Login exitoso resetea el contador a 0
- ✅ Bloqueo se levanta automáticamente después de 15 minutos

---

#### ISSUE #9: Correo Electrónico de Empresa Igual a de Admin User
**Archivo PDF:** Página 12  
**Módulos afectados:**
- `api/src/tenant/dto/register-tenant.dto.ts`
- `web/app/(auth)/register/page.tsx` (validación Zod)

**Problema:**
El sistema permite registrar una empresa donde el correo de la empresa (`correoEmpresa`) es idéntico al correo del usuario administrador (`correoAdmin`). Esto genera confusión y problemas en notificaciones.

**Tareas Backend:**

1. **Crear validador custom en NestJS:**
   ```typescript
   // api/src/common/validators/emails-distinct.validator.ts
   import {
     ValidatorConstraint,
     ValidatorConstraintInterface,
     ValidationArguments,
   } from 'class-validator';
   
   @ValidatorConstraint({ name: 'EmailsCannotMatch', async: false })
   export class EmailsCannotMatchConstraint implements ValidatorConstraintInterface {
     validate(correoAdmin: string, args: ValidationArguments) {
       const object = args.object as any;
       return correoAdmin !== object.correoEmpresa;
     }
   
     defaultMessage(args: ValidationArguments) {
       return 'El correo del administrador debe ser diferente al correo de la empresa';
     }
   }
   ```

2. **Aplicar validador en DTO:**
   ```typescript
   // api/src/tenant/dto/register-tenant.dto.ts
   import { Validate } from 'class-validator';
   import { EmailsCannotMatchConstraint } from '../../common/validators/emails-distinct.validator';
   
   export class RegisterTenantDto {
     @IsEmail({}, { message: 'Correo de empresa inválido' })
     correoEmpresa: string;
     
     @IsEmail({}, { message: 'Correo de administrador inválido' })
     @Validate(EmailsCannotMatchConstraint)
     correoAdmin: string;
     
     // ... resto de campos
   }
   ```

3. **Test unitario:**
   - Crea test en `api/src/tenant/tenant.controller.spec.ts`
   - Verifica que el DTO rechaza cuando ambos correos son iguales
   - Verifica que acepta cuando son diferentes

**Tareas Frontend:**

1. **Agregar validación en schema Zod:**
   ```typescript
   // Dentro del schema de validación del formulario
   const registerSchema = z.object({
     correoEmpresa: z.string().email("Formato de correo inválido"),
     correoAdmin: z.string().email("Formato de correo inválido"),
     // ... otros campos
   }).refine(
     (data) => data.correoEmpresa.toLowerCase() !== data.correoAdmin.toLowerCase(),
     {
       message: "El correo del administrador no puede ser el mismo que el correo de la empresa",
       path: ["correoAdmin"], // Muestra el error en el campo correoAdmin
     }
   );
   ```

2. **Asegurar que el mensaje se muestra:**
   - El error debe aparecer debajo del campo "Correo Electrónico" (admin)
   - Debe ser visible en color rojo
   - La validación debe ocurrir en `onBlur` o al intentar enviar

**Criterios de Aceptación:**
- ✅ Backend retorna error 400 si los correos coinciden (case-insensitive)
- ✅ Frontend valida antes de enviar y muestra error claro
- ✅ Usuario entiende que debe usar correos diferentes
- ✅ Error aparece específicamente debajo del campo "Correo Electrónico" del admin

---

#### ISSUE #4: Máscaras en Campos NIT, NRC y Teléfono
**Archivo PDF:** Página 4  
**Módulos afectados:**
- `web/app/(auth)/register/page.tsx`
- Componentes de input (crear o modificar)

**Problema:**
Los campos NIT, NRC y Teléfono muestran un placeholder con formato de máscara (ej: "0000-000000-000-0"), pero al escribir, la máscara no se aplica y el usuario puede ingresar cualquier cantidad de dígitos.

**Tareas Frontend:**

1. **Instalar librería de máscaras:**
   ```bash
   cd web
   npm install react-input-mask
   npm install -D @types/react-input-mask
   ```

2. **Crear componente de Input con Máscara:**
   ```tsx
   // web/components/ui/masked-input.tsx
   import React from 'react';
   import InputMask from 'react-input-mask';
   import { Input } from './input';
   import { cn } from '@/lib/utils';
   
   interface MaskedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
     mask: string;
     maskChar?: string;
   }
   
   const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
     ({ mask, maskChar = '_', className, ...props }, ref) => {
       return (
         <InputMask mask={mask} maskChar={maskChar} {...props}>
           {(inputProps: any) => (
             <Input
               {...inputProps}
               ref={ref}
               className={className}
             />
           )}
         </InputMask>
       );
     }
   );
   
   MaskedInput.displayName = 'MaskedInput';
   
   export { MaskedInput };
   ```

3. **Aplicar máscaras en el formulario de registro:**
   ```tsx
   // En el formulario:
   import { MaskedInput } from '@/components/ui/masked-input';
   
   // Campo NIT
   <FormField
     control={form.control}
     name="nit"
     render={({ field }) => (
       <FormItem>
         <FormLabel>NIT *</FormLabel>
         <FormControl>
           <MaskedInput
             mask="9999-999999-999-9"
             placeholder="0000-000000-000-0"
             {...field}
           />
         </FormControl>
         <FormMessage />
       </FormItem>
     )}
   />
   
   // Campo NRC
   <FormField
     control={form.control}
     name="nrc"
     render={({ field }) => (
       <FormItem>
         <FormLabel>NRC *</FormLabel>
         <FormControl>
           <MaskedInput
             mask="999999-9"
             placeholder="000000-0"
             {...field}
           />
         </FormControl>
         <FormMessage />
       </FormItem>
     )}
   />
   
   // Campo Teléfono
   <FormField
     control={form.control}
     name="telefono"
     render={({ field }) => (
       <FormItem>
         <FormLabel>Teléfono *</FormLabel>
         <FormControl>
           <MaskedInput
             mask="9999-9999"
             placeholder="0000-0000"
             {...field}
           />
         </FormControl>
         <FormMessage />
       </FormItem>
     )}
   />
   ```

4. **Limpiar valores al enviar:**
   - Antes de enviar al backend, limpia los guiones de los valores:
   ```typescript
   const onSubmit = (data) => {
     const cleanedData = {
       ...data,
       nit: data.nit.replace(/-/g, ''),
       nrc: data.nrc.replace(/-/g, ''),
       telefono: data.telefono.replace(/-/g, ''),
     };
     // Enviar cleanedData al backend
   };
   ```

**Criterios de Aceptación:**
- ✅ Máscaras se aplican visualmente mientras el usuario escribe
- ✅ No se pueden ingresar más dígitos de los permitidos
- ✅ Formato se mantiene automáticamente (ej: al escribir 4 dígitos, aparece el guion)
- ✅ El valor enviado al backend está limpio (sin guiones)
- ✅ Máscaras funcionan en modo light y dark

---

#### ISSUE #7: Color de Letras del Listado del Campo Municipio
**Archivo PDF:** Página 9-10  
**Módulos afectados:**
- `web/app/globals.css` o tema de shadcn
- Componente Select de shadcn/ui

**Problema:**
Al abrir el dropdown de "Municipio", las opciones no son visibles hasta que el cursor pasa sobre ellas (hover). El texto tiene el mismo color que el fondo, haciéndolo invisible.

**Tareas Frontend:**

1. **Localizar el componente Select:**
   - Busca en `web/components/ui/select.tsx`
   - Identifica las clases CSS aplicadas a `SelectItem` y `SelectContent`

2. **Inspeccionar CSS en navegador:**
   - Abre el formulario en Chrome DevTools
   - Inspecciona el dropdown de Municipio
   - Identifica qué clase CSS está causando `color: transparent` o color no visible

3. **Corregir en globals.css o en el componente:**
   ```css
   /* web/app/globals.css */
   
   /* Asegurar que los items del Select sean visibles */
   [data-radix-select-item] {
     color: hsl(var(--foreground)) !important;
   }
   
   /* O más específicamente: */
   .select-item {
     color: hsl(var(--foreground));
   }
   
   /* Asegurar contraste en hover */
   [data-radix-select-item][data-highlighted] {
     background-color: hsl(var(--accent));
     color: hsl(var(--accent-foreground));
   }
   ```

4. **Verificar en ambos modos:**
   - Probar en light mode
   - Probar en dark mode
   - Asegurar que el contraste es adecuado en ambos

5. **Aplicar mismo fix a Departamento:**
   - Si el dropdown de Departamento tiene el mismo problema, aplicar la misma solución

**Criterios de Aceptación:**
- ✅ Todas las opciones del dropdown son visibles sin necesidad de hover
- ✅ Contraste adecuado en light mode (WCAG AA: contraste ≥4.5:1)
- ✅ Contraste adecuado en dark mode
- ✅ Hover state sigue siendo claramente distinguible

---

### 🟡 SPRINT 2: Issues Medios

#### ISSUE #5: Mensajes de Campos Obligatorios
**Archivo PDF:** Página 5-6  
**Problema:** Solo muestra tooltip nativo del navegador para el primer campo obligatorio. Necesitamos validación completa con `react-hook-form` y mensajes en rojo debajo de cada campo.

*(Tareas detalladas en archivo TODO principal)*

#### ISSUE #8: Mensajes de Advertencia de Contraseñas
**Archivo PDF:** Página 11  
**Problema:** Error de "Las contraseñas no coinciden" aparece arriba del formulario, forzando scroll.

#### ISSUE #13: Opción de Reset de Contraseña en Inicio de Sesión
**Archivo PDF:** Página 16  
**Problema:** No existe flujo de recuperación de contraseña ("Forgot Password").

#### ISSUE #3: Ortografía en Formularios
**Archivo PDF:** Página 3  
**Problema:** Múltiples campos sin tildes (Razon → Razón, Telefono → Teléfono, etc.)

---

### 🟢 SPRINT 3: Issues Menores (Si hay tiempo)

#### ISSUE #1: Botón para Mostrar Contraseña
**Archivo PDF:** Página 1  
**Problema:** Falta toggle de visibilidad (ícono de ojo) en campos password

#### ISSUE #2: Título de Registro No Muy Visible
**Archivo PDF:** Página 2  
**Problema:** Título con bajo contraste visual

#### ISSUE #10: Opción de Configuración de Usuario
**Archivo PDF:** Página 13  
**Problema:** Botón "Configuración" no hace nada útil

#### ISSUE #11: Mensajes en Campo de Correo Electrónico
**Archivo PDF:** Página 14  
**Problema:** Mensajes de error genéricos para validación de email

#### ISSUE #12: Ortografía en Inicio de Sesión
**Archivo PDF:** Página 15  
**Problema:** Mismo problema de tildes en pantalla de login

---

## INSTRUCCIONES DE EJECUCIÓN

### Paso 1: Análisis Inicial
1. Navega a `\\wsl.localhost\Ubuntu-22.04\home\jose\facturador-electronico-sv`
2. Ejecuta `git status` para verificar el estado del repo
3. Lee completamente `api/prisma/schema.prisma` para entender la estructura actual
4. Identifica dónde están los archivos de registro de empresa (busca por "Razón Social" en `/web`)
5. Localiza el servicio de autenticación en `/api/src/auth`

### Paso 2: Crear Rama de Trabajo
```bash
git checkout main
git pull origin main
git checkout -b fix/qa-issues-sprint-1
```

### Paso 3: Resolver Issues en Orden
**Día 1:**
- Issue #6 (Longitud campos) - Backend primero, luego frontend
- Issue #14 (Bloqueo cuenta) - Migración Prisma, luego lógica backend, luego UI

**Día 2:**
- Issue #9 (Emails distintos)
- Issue #4 (Máscaras)
- Issue #7 (Color dropdown)

### Paso 4: Testing
Después de cada issue:
```bash
# Backend
cd api
npm run test -- --watch [archivo-de-test]

# Frontend
cd web
npm run dev
# Probar manualmente en http://localhost:3000/register
```

### Paso 5: Commit y Push
```bash
git add .
git commit -m "fix(auth): resolver issues #6, #14 - validación longitud y bloqueo cuenta"
git push origin fix/qa-issues-sprint-1
```

---

## RECURSOS ÚTILES

**Documentos de referencia:**
- PDF de Issues: `RC001-Issues_Reportados_-_Facturador_SV.pdf`
- TODO completo: `tasks-todo.md`
- Investigación de features: Artefacto de 6 módulos generado

**Comandos frecuentes:**
```bash
# Prisma
cd api
npx prisma migrate dev --name [nombre-migration]
npx prisma studio  # Para ver la BD visualmente
npx prisma generate

# Testing
npm run test:watch
npm run test:e2e

# Linting
npm run lint
npm run format
```

**Convenciones de commit:**
- `fix(auth):` - Para bugs de autenticación
- `fix(validation):` - Para validaciones
- `feat(ui):` - Para nuevas features de UI
- `style(ui):` - Para cambios de diseño sin lógica
- `refactor:` - Para refactorización

---

## CRITERIOS DE ACEPTACIÓN GENERALES

Antes de marcar cualquier issue como resuelto, verifica:
- [ ] El código compila sin errores (`npm run build`)
- [ ] Tests relevantes pasan
- [ ] Probaste manualmente en el navegador
- [ ] La funcionalidad funciona en light y dark mode
- [ ] Los mensajes de error están en español
- [ ] No introdujiste regresiones en otras partes

---

## ¿DUDAS O BLOQUEADORES?

Si encuentras algo confuso o bloqueado:
1. **NO ADIVINES** - Pregúntame directamente
2. Documenta lo que encontraste
3. Propón 2-3 soluciones posibles
4. Pregunta cuál prefieres que implemente

Recuerda: Es mejor preguntar que hacer suposiciones incorrectas.

---

¡Manos a la obra! 🚀
