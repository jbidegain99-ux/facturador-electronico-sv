# PROMPT: Resolver Issues Pendientes del Reporte QA

## CONTEXTO DEL PROYECTO
Estás trabajando en el "Facturador Electrónico SV", un sistema SaaS de facturación electrónica para El Salvador. El proyecto usa:
- **Backend:** NestJS + Prisma + Azure SQL
- **Frontend:** Next.js 14 + shadcn/ui + Tailwind
- **Deploy:** Docker en Azure App Services

## ESTADO ACTUAL
Hemos completado exitosamente 8 de 14 issues del reporte QA mediante testing automatizado con Playwright. Los tests están en `apps/web/tests/qa-report/`.

### ✅ Issues Completados (8):
- Issue #1: Link "Ya tienes cuenta" visible
- Issue #2: Placeholder NIT correcto
- Issue #4: Máscaras automáticas (NIT, NRC, Teléfono)
- Issue #6: Límites de longitud + contadores
- Issue #7: Color dropdown municipio
- Issue #8: Diseño botones consistente
- Issue #9: Validación emails distintos
- Issue #11: Texto del botón correcto

## ISSUES A RESOLVER EN ESTA SESIÓN

### 🐛 CRÍTICO - Issue #14: Bug API Route Duplicada
**Problema:** 
La ruta de login tiene `/api/v1` duplicado causando: `Cannot POST /api/v1/api/v1/auth/login`

**Archivos afectados:**
```typescript
// apps/web/src/app/(auth)/login/page.tsx
// INCORRECTO (línea ~XX):
const res = await fetch`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {

// CORRECTO debe ser:
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
```

**Archivos a revisar y corregir:**
1. `apps/web/src/app/(auth)/login/page.tsx` - Login de usuario
2. `apps/web/src/app/(admin-auth)/admin/login/page.tsx` - Login de admin
3. `apps/web/src/components/admin/tenant-plan-manager.tsx` - Fetches con backticks incorrectos

**Criterios de éxito:**
- Cambiar `fetch\`` por `fetch(`
- Remover `/api/v1` duplicado (ya está en NEXT_PUBLIC_API_URL)
- El test automatizado de bloqueo de cuenta debe pasar

---

### ⏳ Issue #3: Términos y Condiciones
**Descripción:** No hay checkbox ni link de términos y condiciones en el registro.

**Implementación requerida:**
1. Agregar checkbox en `apps/web/src/app/(auth)/register/page.tsx`:
```tsx
   <div className="flex items-start gap-2">
     <input
       type="checkbox"
       id="acceptTerms"
       checked={acceptTerms}
       onChange={(e) => setAcceptTerms(e.target.checked)}
       className="mt-1"
       required
     />
     <label htmlFor="acceptTerms" className="text-sm text-gray-600">
       Acepto los{' '}
       <a href="/terminos" target="_blank" className="text-purple-600 hover:underline">
         términos y condiciones
       </a>
       {' '}y la{' '}
       <a href="/privacidad" target="_blank" className="text-purple-600 hover:underline">
         política de privacidad
       </a>
     </label>
   </div>
```

2. Crear páginas estáticas:
   - `apps/web/src/app/terminos/page.tsx` - Términos y condiciones
   - `apps/web/src/app/privacidad/page.tsx` - Política de privacidad

**Contenido sugerido:** Términos estándar de SaaS adaptados a El Salvador.

---

### ⏳ Issue #5: Hint de Actividad Económica
**Descripción:** El campo "Actividad Económica" no tiene tooltip explicativo.

**Implementación:**
1. Instalar componente Tooltip si no existe:
```bash
   npx shadcn-ui@latest add tooltip
```

2. Agregar tooltip en `apps/web/src/app/(auth)/register/page.tsx`:
```tsx
   import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
   
   <div className="flex items-center gap-2">
     <label>Actividad Económica *</label>
     <TooltipProvider>
       <Tooltip>
         <TooltipTrigger>
           <HelpCircle className="h-4 w-4 text-gray-400" />
         </TooltipTrigger>
         <TooltipContent>
           <p className="max-w-xs">
             Seleccione la actividad económica principal de su empresa según 
             la clasificación del Ministerio de Hacienda de El Salvador.
           </p>
         </TooltipContent>
       </Tooltip>
     </TooltipProvider>
   </div>
```

---

### ⏳ Issue #10: Ortografía Inconsistente (Tildes)
**Descripción:** Algunos textos tienen tildes correctas, otros no.

**Textos a corregir en `apps/web/src/app/(auth)/register/page.tsx`:**
- ~~"Razon Social"~~ → **"Razón Social"** ✅ (ya corregido)
- ~~"Direccion"~~ → **"Dirección"**
- ~~"Direccion Completa"~~ → **"Dirección Completa"**
- ~~"Telefono"~~ → **"Teléfono"**
- ~~"Actividad Economica"~~ → **"Actividad Económica"**
- ~~"Correo Electronico"~~ → **"Correo Electrónico"**
- ~~"Contrasena"~~ → **"Contraseña"**
- ~~"Iniciar Sesion"~~ → **"Iniciar Sesión"**

**Archivos a revisar:**
- `apps/web/src/app/(auth)/register/page.tsx`
- `apps/web/src/app/(auth)/login/page.tsx`
- Cualquier otro archivo con labels de formulario

---

### ⏳ Issue #12: Título Cortado en Mobile
**Descripción:** El título "Registrar Empresa" se corta en viewport mobile (375px).

**Fix en `apps/web/src/app/(auth)/register/page.tsx`:**
```tsx
// ANTES:
<h2 className="text-2xl font-bold">Registrar Empresa</h2>

// DESPUÉS:
<h2 className="text-xl sm:text-2xl font-bold text-center sm:text-left">
  Registrar Empresa
</h2>

// Y el subtítulo:
<p className="text-sm sm:text-base text-gray-600 text-center sm:text-left">
  Complete los datos de su empresa para comenzar a facturar
</p>
```

**Verificar con:**
- DevTools → Responsive mode → iPhone SE (375x667)
- Ningún texto debe tener overflow o estar cortado

---

### ⏳ Issue #13: Reset de Contraseña
**Descripción:** No existe funcionalidad de "Olvidé mi contraseña".

**Implementación completa:**

**1. Frontend - Crear páginas:**

`apps/web/src/app/(auth)/forgot-password/page.tsx`:
```tsx
'use client';
import { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (res.ok) {
        setSent(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <h2>Correo Enviado</h2>
        <p>Revisa tu email para restablecer tu contraseña</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Recuperar Contraseña</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
  );
}
```

`apps/web/src/app/(auth)/reset-password/[token]/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResetPassword({ params }: { params: { token: string } }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: params.token, password }),
    });

    if (res.ok) {
      alert('Contraseña cambiada exitosamente');
      router.push('/login');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Nueva Contraseña</h2>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Nueva contraseña"
        required
      />
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirmar contraseña"
        required
      />
      <button type="submit">Cambiar Contraseña</button>
    </form>
  );
}
```

**2. Agregar link en login:**
En `apps/web/src/app/(auth)/login/page.tsx`:
```tsx
<a href="/forgot-password" className="text-sm text-purple-600 hover:underline">
  ¿Olvidaste tu contraseña?
</a>
```

**3. Backend - Endpoints necesarios:**
Si no existen, crear en `apps/api/src/modules/auth/`:
- `POST /api/v1/auth/forgot-password` - Genera token y envía email
- `POST /api/v1/auth/reset-password` - Valida token y cambia contraseña

---

## METODOLOGÍA REPUBLICODE

Sigue estos pasos:

### 1. PLAN MODE (Análisis)
- Analiza los 5 issues listados arriba
- Identifica todos los archivos que necesitan modificación
- Crea un plan de implementación secuencial

### 2. IMPLEMENTACIÓN
- Resuelve PRIMERO el bug crítico (#14)
- Luego implementa los issues pendientes (#3, #5, #10, #12, #13)
- Usa la estructura de archivos existente
- Mantén el estilo de código actual (shadcn/ui, Tailwind)

### 3. SELF-REVIEW
- Verifica que todos los cambios compilan
- Ejecuta `npm run build` en apps/web
- No rompas funcionalidad existente

### 4. TESTING
- Los tests automatizados están en `apps/web/tests/qa-report/`
- Después de tus cambios, el usuario ejecutará:
```bash
  npx playwright test tests/qa-report/ --reporter=html
```

### 5. EVIDENCE
- Lista todos los archivos modificados
- Muestra snippets de los cambios clave
- Confirma que cada issue está resuelto

## ARCHIVOS CLAVE DEL PROYECTO
```
apps/
├── web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx          # Issue #14 - Bug API
│   │   │   │   ├── register/page.tsx        # Issues #3, #5, #10, #12
│   │   │   │   ├── forgot-password/page.tsx # Issue #13 (crear)
│   │   │   │   └── reset-password/[token]/page.tsx # Issue #13 (crear)
│   │   │   ├── terminos/page.tsx           # Issue #3 (crear)
│   │   │   └── privacidad/page.tsx         # Issue #3 (crear)
│   │   └── components/ui/                  # shadcn components
│   └── tests/qa-report/                    # Tests automatizados
└── api/
    └── src/modules/auth/                   # Backend (si Issue #13 necesita endpoints)
```

## CRITERIOS DE ÉXITO

Al finalizar, TODOS estos checks deben estar ✅:

**Issue #14 (Crítico):**
- [ ] Bug de API duplicada corregido en login/page.tsx
- [ ] Bug corregido en admin/login/page.tsx
- [ ] Fetches con backticks incorrectos arreglados
- [ ] Login funciona correctamente

**Issue #3:**
- [ ] Checkbox de T&C en registro
- [ ] Links a /terminos y /privacidad
- [ ] Páginas de términos creadas con contenido

**Issue #5:**
- [ ] Tooltip instalado (shadcn)
- [ ] Icono de ayuda junto a "Actividad Económica"
- [ ] Tooltip muestra texto explicativo

**Issue #10:**
- [ ] Todos los textos con tildes correctas
- [ ] No hay "Razon", "Direccion", "Telefono" sin tilde

**Issue #12:**
- [ ] Título responsive (text-xl sm:text-2xl)
- [ ] Sin overflow en mobile (375px)
- [ ] text-center en mobile, text-left en desktop

**Issue #13:**
- [ ] Link "¿Olvidaste tu contraseña?" en login
- [ ] Página forgot-password funcional
- [ ] Página reset-password/[token] funcional
- [ ] (Opcional) Endpoints de backend si no existen

## NOTAS IMPORTANTES

1. **NEXT_PUBLIC_API_URL** ya incluye `/api/v1`, no duplicar
2. Usa **shadcn/ui** para componentes (Tooltip, etc.)
3. Mantén el estilo **purple** (#7c3bed o similar) de Republicode
4. Todos los textos en **español**
5. Estilos con **Tailwind CSS**
6. NO modifiques los tests en `apps/web/tests/qa-report/`

## OUTPUT ESPERADO

Al terminar, proporciona:

1. **Lista de archivos modificados/creados**
2. **Snippet de cada cambio importante**
3. **Confirmación de que compila:** `npm run build` exitoso
4. **Checklist marcado** con todos los ✅

---

¡Adelante! Resuelve estos 5 issues siguiendo la metodología Republicode.
