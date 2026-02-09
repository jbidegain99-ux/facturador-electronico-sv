# PROMPT CLAUDE CODE - FASE 2: MEJORAS DE PRODUCTIVIDAD Y UX

## 🎯 CONTEXTO DEL PROYECTO

Fase 0 y Fase 1 completadas exitosamente (v0.3.0). Sistema en producción con:
- Frontend v22, Backend v4
- 350+ clientes gestionados
- Sistema de migración funcional
- Plan Usage Widget operativo
- Sistema de soporte completo

**URLs Producción:**
- Frontend: https://facturador-web-sv-chayeth5a0h2abcf.eastus2-01.azurewebsites.net
- Backend: https://facturador-api-sv-gvavh8heb5c5gkc9.eastus2-01.azurewebsites.net/api/v1

## 📋 OBJETIVO FASE 2

Mejorar la productividad y experiencia de usuario en las funcionalidades core del sistema.

## 🎯 FEATURES A IMPLEMENTAR

### 1. Paginación y Filtros en /clientes (ALTA PRIORIDAD - PRIMERA)

**Problema actual:**
- Todos los clientes (~350+) se cargan en una sola página
- Performance degradada con muchos registros
- Difícil navegar grandes listados

**Solución requerida:**

**Backend (apps/api/src/modules/clientes/):**
```typescript
// Actualizar ClientesController y ClientesService

// GET /api/v1/clientes
interface GetClientesQuery {
  page?: number;        // Página actual (default: 1)
  limit?: number;       // Registros por página (default: 10)
  search?: string;      // Búsqueda existente
  sortBy?: string;      // Campo para ordenar (default: 'createdAt')
  sortOrder?: 'asc' | 'desc'; // Orden (default: 'desc')
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;      // Total de registros
    page: number;       // Página actual
    limit: number;      // Registros por página
    totalPages: number; // Total de páginas
    hasNext: boolean;   // Tiene página siguiente
    hasPrev: boolean;   // Tiene página anterior
  }
}

// Implementación con Prisma
async findAll(query: GetClientesQuery, tenantId: string): Promise<PaginatedResponse<Cliente>> {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    this.prisma.cliente.findMany({
      where: { tenantId, /* search filters */ },
      skip,
      take: limit,
      orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' }
    }),
    this.prisma.cliente.count({ where: { tenantId, /* search filters */ } })
  ]);
  
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
}
```

**Frontend (apps/web/src/app/(dashboard)/clientes/page.tsx):**
```typescript
// UI Components requeridos

1. Selector de límite de registros
   - Dropdown con opciones: 10, 20, 50
   - Default: 10
   - Persistir en localStorage

2. Controles de paginación
   - Botones: Primera | Anterior | Siguiente | Última
   - Indicador: "Página X de Y"
   - Total de registros: "Mostrando X-Y de Z clientes"

3. Estado de la paginación
   const [page, setPage] = useState(1);
   const [limit, setLimit] = useState(10);
   const [total, setTotal] = useState(0);

4. Fetch con paginación
   useEffect(() => {
     fetch(`/clientes?page=${page}&limit=${limit}&search=${search}`)
       .then(res => res.json())
       .then(data => {
         setClientes(data.data);
         setTotal(data.meta.total);
         // etc
       });
   }, [page, limit, search]);

5. UI de paginación (usar shadcn/ui Pagination)
   import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination'
```

**Diseño visual:**
```
┌─────────────────────────────────────────────────────────┐
│ Clientes                           [10▼] por página     │
│ [Buscar...________________]        [+ Nuevo Cliente]    │
├─────────────────────────────────────────────────────────┤
│ Cliente     │ Documento    │ NRC    │ Contacto          │
├─────────────────────────────────────────────────────────┤
│ Empresa 1   │ NIT 123...   │ 123-4  │ email@ejemplo.com │
│ Empresa 2   │ NIT 456...   │ 456-7  │ email2@ejemplo.com│
│ ...         │ ...          │ ...    │ ...               │
│ Empresa 10  │ NIT 789...   │ 789-0  │ email10@ejemplo.com
├─────────────────────────────────────────────────────────┤
│ Mostrando 1-10 de 350 clientes                          │
│                                                          │
│ [Primera] [< Anterior]  Página 1 de 35  [Siguiente >] [Última] │
└─────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Backend retorna respuesta paginada con meta
- [ ] Frontend muestra selector de límite (10, 20, 50)
- [ ] Controles de paginación funcionales
- [ ] Búsqueda funciona con paginación
- [ ] Estado persiste al cambiar de página
- [ ] Loading state durante fetch
- [ ] Performance: <200ms para queries paginadas
- [ ] Responsive en mobile

---

### 2. Paginación en /facturas (ALTA PRIORIDAD)

Aplicar el mismo patrón de paginación a la vista de facturas.

**Ubicación:** `/facturas`  
**Similar a clientes** pero con columnas:
- Número DTE
- Cliente
- Fecha
- Total
- Estado
- Acciones

---

### 3. Single-Page Invoice Creation (MEDIA PRIORIDAD)

**Problema actual:**
- Wizard multi-step (3-4 pasos)
- Tiempo promedio: 3 minutos por factura
- Muchos clicks necesarios

**Solución:**

Crear vista single-page en `/facturas/nueva`:
```
┌─────────────────────────────────────────────────────────┐
│ Nueva Factura                                    [Guardar] │
├─────────────────────────────────────────────────────────┤
│ CLIENTE                                                  │
│ [Buscar cliente...____________] [+ Nuevo]               │
│ Seleccionado: Empresa ABC, S.A. de C.V.                │
│   NIT: 0614-123456-789-0    NRC: 12345-6               │
├─────────────────────────────────────────────────────────┤
│ ITEMS                                                    │
│ [Buscar producto...] [+ Agregar desde catálogo]        │
│                                                          │
│ # │ Descripción    │ Cant │ Precio │ IVA  │ Total      │
│ 1 │ Producto X     │  5   │ $10.00 │ $1.30│ $51.30     │
│ 2 │ Servicio Y     │  1   │ $50.00 │ $6.50│ $56.50     │
│   │                │      │        │      │ [Agregar+] │
├─────────────────────────────────────────────────────────┤
│ TOTALES                                                  │
│                               Subtotal: $60.00          │
│                               IVA 13%:   $7.80          │
│                               Total:    $67.80          │
├─────────────────────────────────────────────────────────┤
│ OPCIONES                                                 │
│ □ Guardar como borrador                                 │
│ □ Enviar al cliente por email                          │
│ □ Generar y transmitir a Hacienda inmediatamente       │
└─────────────────────────────────────────────────────────┘
```

**Features clave:**
- Búsqueda de clientes con autocomplete
- Agregar items on-the-fly
- Cálculos en tiempo real
- Keyboard shortcuts:
  - `Ctrl+S`: Guardar
  - `Ctrl+Enter`: Guardar y transmitir
  - `Esc`: Cancelar
  - `Ctrl+K`: Buscar cliente
  - `Tab`: Siguiente campo

---

### 4. Templates de Facturas (MEDIA PRIORIDAD)

**Backend:**
```prisma
model InvoiceTemplate {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  nombre      String
  descripcion String?
  items       Json     // Array de items predefinidos
  notas       String?
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Frontend:**
- Botón "Usar template" en `/facturas/nueva`
- Gestión de templates en `/configuracion/templates`
- Quick actions: "Crear desde último DTE"

---

### 5. Dashboard Analytics (BAJA PRIORIDAD)

Mejorar dashboard con:
- Gráfico de ingresos mensuales
- Top 10 clientes
- DTEs por estado (gráfico pie)
- Proyección de ingresos
- Exportar reportes a Excel/PDF

---

### 6. Mejoras PWA (BAJA PRIORIDAD)

- Service worker para cache
- Manifest.json completo (ya existe básico)
- Offline mode básico
- Push notifications (opcional)

---

## 📝 METODOLOGÍA REPUBLICODE

**Aplicar estrictamente:**

1. **Plan First** - Analiza y planifica antes de codear
2. **Subagent Strategy** - Divide tareas complejas
3. **Self-Improvement Loop** - Documenta en lessons.md
4. **Verification Before Done** - Demuestra funcionamiento
5. **Autonomous Bug Fixing** - Corrige sin preguntar

## 🎨 DISEÑO Y UX

**Mantener consistencia:**
- Color primario: Deep Purple (#5B21B6)
- Componentes: shadcn/ui exclusivamente
- Typography: Inter
- Responsive: Mobile-first
- Loading states siempre visibles
- Error handling apropiado

## ✅ ACCEPTANCE CRITERIA GENERAL

**Backend:**
- [ ] Todos los endpoints implementados
- [ ] Paginación funcionando correctamente
- [ ] Performance: queries <200ms
- [ ] Validaciones completas
- [ ] Tests básicos (opcional)

**Frontend:**
- [ ] Todas las vistas responsive
- [ ] Paginación en clientes y facturas
- [ ] Single-page invoice creation funcional
- [ ] Loading states implementados
- [ ] Error handling apropiado
- [ ] Keyboard shortcuts funcionando

**Integración:**
- [ ] Backend + Frontend conectados
- [ ] Flujos end-to-end funcionales
- [ ] Build: 0 errores
- [ ] Ready para deploy

## 🚫 LO QUE NO DEBES HACER

- ❌ No uses console.log en producción
- ❌ No ignores errores
- ❌ No uses `any` en TypeScript
- ❌ No omitas validación
- ❌ No hagas cambios sin plan previo

## 📊 PRIORIDADES DE EJECUCIÓN

**Sprint 1 (Alta Prioridad):**
1. Paginación en /clientes
2. Paginación en /facturas

**Sprint 2 (Media Prioridad):**
3. Single-page invoice creation
4. Templates de facturas

**Sprint 3 (Baja Prioridad):**
5. Dashboard analytics
6. PWA improvements

## 🔗 ARCHIVOS DE CONTEXTO

Lee antes de empezar:
- `tasks/architecture.md`
- `tasks/prisma-schemas.md`
- `tasks/session-2026-02-08-completa.md`
- `tasks/lessons.md`
- `tasks/todo.md`

## 🎯 ENTREGABLES ESPERADOS

Al finalizar Fase 2:

1. **Código:**
   - Branch `feature/fase-2` 
   - Pull request detallado
   - Build passing

2. **Database:**
   - Migraciones aplicadas (si aplica)
   - Seeders para templates (opcional)

3. **Documentación:**
   - `tasks/session-fase-2.md`
   - `tasks/lessons.md` actualizado
   - Screenshots de features

4. **Demo:**
   - Paginación funcionando
   - Single-page invoice demo
   - Performance metrics

## 🚀 PARA EMPEZAR

1. Lee todos los archivos de contexto
2. Genera plan detallado de Sprint 1 (paginación)
3. Presenta plan para revisión
4. Comienza por `/clientes` paginación
5. Commits frecuentes

## ❓ SI TIENES DUDAS

- Revisa código existente para mantener consistencia
- Pregunta antes de cambios que afecten múltiples módulos
- Documenta decisiones importantes

---

**¡Manos a la obra con Fase 2!** 🚀

Prioridad #1: Paginación en /clientes
