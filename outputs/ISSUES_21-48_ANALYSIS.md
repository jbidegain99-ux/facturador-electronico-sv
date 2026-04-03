# Analisis Issues 21-48: Root Cause, Priorizacion & Soluciones

**Fecha:** 2026-03-23
**Metodo:** Analisis estatico de codigo fuente

---

## Issue 21: Longitud campo usuario
**Prioridad:** Baja | **Estimacion:** 0.5h | **Modulo:** Tenant Config

**Hallazgo:** No existe un campo "username" en el formulario de registro. El campo del nombre de admin (`adminNombre`) tiene `maxLength={200}`.
**Root Cause:** Posible confusion en el reporte. El campo relevante ya tiene limite.
**Accion:** Aclarar con QA que campo especifico se refiere.

---

## Issue 22: Ortografia pantalla principal
**Prioridad:** Media | **Estimacion:** 0.5h | **Modulo:** UI/Traducciones

**Archivos afectados:** `apps/web/messages/es.json`
**Errores encontrados:**
- Linea 140: `"termsAndConditions": "terminos y condiciones"` -> falta tilde en "terminos"
- Linea 141: `"privacyPolicy": "politica de privacidad"` -> falta tilde en "politica"

**Solucion:** Corregir strings en es.json.

---

## Issue 23: Botones Terminos/Privacidad no funcionan
**Prioridad:** Baja | **Estado:** RESUELTO

**Hallazgo:**
- Pagina terminos: `apps/web/src/app/terminos/page.tsx` existe
- Pagina privacidad: `apps/web/src/app/privacidad/page.tsx` existe
- Landing page lineas 309-310: Links correctos con Next.js `<Link>`

---

## Issue 24: "Contactar Ventas" dirige a registro
**Prioridad:** Alta | **Estado:** RESUELTO

**Hallazgo:**
- Componente: `apps/web/src/components/contact-sales-dialog.tsx`
- Landing page lineas 269-272: Boton abre `ContactSalesDialog`
- Dialog contiene formulario propio con campos: nombre, email, empresa, telefono, mensaje
- No redirige a registro

---

## Issue 25: Longitud razon social (config inicial)
**Prioridad:** Media | **Estado:** RESUELTO

**Hallazgo:**
- Registro: `maxLength={200}` con CharCounter
- Onboarding: `maxLength={250}` con CharCounter
- Backend: `@MaxLength(200)`
**Nota:** Discrepancia 200 vs 250 entre formularios. Normalizar a 250 si es el requisito.

---

## Issue 26: Validacion fecha expiracion no marcada obligatoria
**Prioridad:** Alta | **Estado:** NO ENCONTRADO

**Hallazgo:** No se encontro campo de fecha de expiracion en los formularios de configuracion de tenant o cliente. Posiblemente se refiere a un campo de certificado o plan.
**Accion:** Solicitar clarificacion a QA sobre que pantalla/campo especifico.

---

## Issue 27: Boton crear factura deshabilitado
**Prioridad:** CRITICA | **Estimacion:** 3h | **Modulo:** Facturas

**Archivos:**
- `apps/web/src/components/layout/sidebar.tsx` linea 33
- `apps/web/src/app/(dashboard)/facturas/nueva/page.tsx` lineas 485-489, 783, 1046

**Root Cause:**
1. Sidebar enlaza a `/facturas` (lista), no a `/facturas/nueva` (crear)
2. El boton "Emitir" en nueva factura se deshabilita por `canEmit()`:
   ```typescript
   const canEmit = () => {
     if (items.length === 0) return false;
     if (REQUIRES_NRC.includes(tipoDte) && (!cliente || !cliente.nrc)) return false;
     return true;
   };
   ```
3. Posible falta de inicializacion del formulario cuando se accede desde diferente ruta

**Solucion propuesta:**
1. Verificar que la navegacion sidebar -> facturas -> nueva factura funcione correctamente
2. Si el issue es que el boton "Nueva Factura" en la lista esta deshabilitado, verificar que condicion lo controla
3. Agregar mensaje claro si configuracion incompleta impide crear facturas

---

## Issue 28: Pruebas fallidas sin detalle de error
**Prioridad:** Alta | **Estimacion:** 2h | **Modulo:** Tenant Config

**Archivo:** `apps/web/src/app/(dashboard)/configuracion/hacienda/components/TestCenter/TestExecutor.tsx`

**Root Cause:**
- Linea 172: `toast.error(data.testRecord.errorMessage || 'La prueba fallo')` - OK
- Linea 300-302: Muestra errorMessage en UI - OK
- Linea 178: Error generico cuando exception no es instanceof Error - PROBLEMA

**Solucion:** Mejorar catch block para extraer mensaje de cualquier tipo de error, no solo `Error` instances.

---

## Issue 29: Error 500 al emitir factura
**Prioridad:** CRITICA | **Estimacion:** 4h | **Modulo:** Facturas/DTE

**Archivo:** `apps/api/src/modules/dte/dte.service.ts` lineas 799-881

**Root Cause:**
```typescript
catch (error) {
  if (error instanceof InternalServerErrorException || ...) throw error;
  const mapped = this.errorMapper.mapError({...});
  if (error instanceof MHReceptionError) {
    throw new BadRequestException({...});
  }
  throw new InternalServerErrorException({...}); // CATCH-ALL = 500
}
```
- Excepciones no clasificadas (network errors, timeouts, errores inesperados) caen al catch-all y retornan 500
- Error mapper puede no cubrir todos los escenarios
- No hay logging detallado del error original

**Solucion propuesta:**
1. Agregar clasificacion para network errors, timeout errors
2. Loguear error completo antes de mapear
3. Retornar mensajes user-friendly con codigo apropiado (502 para MH unavailable, 422 para datos invalidos)

---

## Issue 30: Correo electronico no obligatorio en clientes
**Prioridad:** Alta | **Estimacion:** 1h | **Modulo:** Clientes

**Archivo:** `apps/web/src/app/(dashboard)/clientes/page.tsx`

**Root Cause:**
- Lineas 737-748: Input email sin atributo `required`
- Label sin asterisco (*) indicador
- Lineas 166-169: Validacion retorna string vacio si no hay email (permite vaciar)

**Solucion:**
1. Agregar `required` al input
2. Agregar asterisco al label
3. Actualizar validacion backend si corresponde

---

## Issue 31: Tooltips en botones acciones clientes
**Prioridad:** Baja | **Estimacion:** 1h | **Modulo:** Clientes

**Archivo:** `apps/web/src/app/(dashboard)/clientes/page.tsx` lineas 601-617

**Root Cause:** Botones Edit/Delete no tienen componente `<Tooltip>` ni atributo `title`.

**Solucion:** Envolver botones en `<Tooltip>` de shadcn/ui con texto descriptivo ("Editar cliente", "Eliminar cliente").

---

## Issue 32: Guardar cambios clientes no funciona
**Prioridad:** Media | **Estado:** RESUELTO

**Hallazgo:**
- Submit funcional en lineas 387-445
- Endpoint edit correcto en lineas 417-418
- Loading/disabled state implementado en linea 767

---

## Issue 33: Mensajes advertencia clientes (formato)
**Prioridad:** Baja | **Estado:** RESUELTO

**Hallazgo:**
- Errores a nivel form: lineas 653-657
- Errores por campo: inline debajo de cada campo (ej. linea 701-702)
- Estilo consistente: `text-red-500` y `text-xs`

---

## Issue 34: Filtracion DTEs incompleta
**Prioridad:** Baja | **Estado:** RESUELTO

**Archivo:** `apps/web/src/app/(dashboard)/facturas/page.tsx`

**Hallazgo:**
- Filtro por tipo DTE: 10 tipos disponibles (lineas 329-344)
- Filtro por estado: 5 estados (lineas 346-358)
- Busqueda por texto (lineas 321-327)
- Paginacion con reset al cambiar filtros (lineas 133-135)

---

## Issue 35: Tipos de facturas no disponibles en dropdown
**Prioridad:** Alta | **Estimacion:** 2h | **Modulo:** Facturas

**Archivo:** `apps/web/src/app/(dashboard)/facturas/nueva/page.tsx` lineas 65-78

**Root Cause:**
```typescript
const DTE_TYPE_OPTIONS = [
  { value: '01', label: 'Factura', group: 'Facturacion' },
  { value: '03', label: 'Credito Fiscal (CCF)', group: 'Facturacion' },
  // ... 10 tipos total
];
```
- Los 10 tipos ESTAN presentes en el array
- El Select component (lineas 816-820) NO usa el campo `group` para agrupar visualmente
- Posible confusion del usuario por lista plana sin categorias

**Solucion:**
1. Implementar `SelectGroup` con `SelectLabel` para agrupar por categoria
2. Filtrar tipos disponibles segun configuracion del tenant (DTEs habilitados)

---

## Issue 36: Ortografia en pantalla facturas
**Prioridad:** Media | **Estimacion:** 0.5h | **Modulo:** UI

**Archivos:**
- `apps/web/src/components/facturas/totales-card.tsx` linea 109: `"Condicion de pago:"` -> falta tilde
- `apps/web/messages/es.json` linea 252: `"conditionLabel": "Condicion:"` -> falta tilde

**Solucion:** Corregir a "Condicion" en ambos archivos.

---

## Issue 37: Ortografia en PDF
**Prioridad:** Media | **Estimacion:** 1h | **Modulo:** PDF

**Archivo:** `apps/api/src/modules/dte/pdf.service.ts`

**Errores encontrados:**
- Linea 76: `'Comprobante de Credito Fiscal'` -> falta tilde en "Credito"
- Linea 289: `'Descripcion'` -> falta tilde
- Linea 373: `'Direccion: ...'` -> falta tilde
- Linea 374: `'Telefono: ...'` -> falta tilde

**Solucion:** Corregir strings en pdf.service.ts.

---

## Issue 38: Direccion empresa no aparece en PDF
**Prioridad:** Alta | **Estimacion:** 2h | **Modulo:** PDF

**Archivo:** `apps/api/src/modules/dte/pdf.service.ts` lineas 135-146, 329

**Root Cause:**
- `parseTenantDireccion()` intenta parsear JSON string de direccion
- Si direccion es null/undefined o JSON invalido, retorna string vacio
- Si falta `complemento` o `departamento`, retorna 'N/A'

**Solucion:**
1. Agregar fallbacks mas robustos en `parseTenantDireccion()`
2. Usar municipio si departamento falta
3. Validar que tenant siempre tenga direccion al completar setup

---

## Issue 39: Valor IVA no aparece en PDF
**Prioridad:** Alta | **Estimacion:** 1.5h | **Modulo:** PDF

**Archivo:** `apps/api/src/modules/dte/pdf.service.ts` lineas 151-182, 413

**Root Cause:**
- `getIvaAmount()` tiene multiples fallbacks: totalIva, tributos[code='20'], ivaRete1, calculo desde totalGravada
- Si ninguno matchea la estructura del DTE, retorna 0
- Diferentes tipos de DTE pueden tener estructura diferente

**Solucion:**
1. Debuggear estructura real de DTEs procesados para identificar path correcto
2. Agregar mas fallbacks o normalizar estructura antes de generar PDF

---

## Issue 40: Reestructurar PDF (QR, layout)
**Prioridad:** Media | **Estimacion:** 4h | **Modulo:** PDF

**Archivo:** `apps/api/src/modules/dte/pdf.service.ts` lineas 442-455

**Estado actual:** QR code posicionado al final del documento en columns layout.
**Sugerencia:** Mover QR a posicion mas prominente (header o esquina superior derecha).

---

## Issue 41: Correo empresa en 2 cuentas diferentes
**Prioridad:** CRITICA | **Estimacion:** 2h | **Modulo:** Tenant/Auth

**Archivos:**
- `apps/api/prisma/schema.prisma`: `Tenant.correo` NO tiene constraint `@unique`
- `apps/api/src/modules/auth/auth.service.ts` lineas 200-207: Solo valida unicidad de `User.email`, no `Tenant.correo`

**Root Cause:**
```prisma
model Tenant {
  correo   String  // SIN @unique - permite duplicados
}
model User {
  email String @unique  // SI tiene constraint
}
```

**Solucion:**
1. Agregar `@unique` a `Tenant.correo` en schema.prisma
2. Ejecutar `prisma db push` para aplicar migration
3. Agregar validacion en `auth.service.ts` registro:
   ```typescript
   const existingTenant = await this.prisma.tenant.findFirst({
     where: { correo: tenant.correo.toLowerCase().trim() }
   });
   if (existingTenant) throw new ConflictException('...');
   ```
4. Verificar datos existentes en BD por duplicados antes de aplicar constraint

---

## Issue 42: Modal webhooks mensaje fuera del modal
**Prioridad:** Baja | **Estimacion:** 0.5h | **Modulo:** Webhooks

**Archivo:** `apps/web/src/app/(dashboard)/webhooks/page.tsx` lineas 619-690

**Root Cause:** Dialog usa Radix Portal. Posible issue de CSS z-index o overflow en contenedor padre.
**Solucion:** Investigar CSS overrides en `[data-radix-dialog-content]` y asegurar containment.

---

## Issue 43: Ortografia webhooks
**Prioridad:** Media | **Estimacion:** 0.5h | **Modulo:** Webhooks

**Archivo:** `apps/web/messages/es.json`
**Errores:**
- Linea 1215: `"Ultimos 7 dias"` -> "dias" falta tilde
- Linea 1216: `"tasa de exito"` -> "exito" falta tilde
- Linea 1218: `"Requieren atencion"` -> "atencion" falta tilde
- Linea 1250: `"Mi integracion"` -> "integracion" falta tilde
- Linea 1255: `"No se mostrara de nuevo."` -> "mostrara" falta tilde

---

## Issue 44: Ortografia cotizaciones
**Prioridad:** Media | **Estimacion:** 0.5h | **Modulo:** Cotizaciones

**Archivo:** `apps/web/messages/es.json`
**Errores:**
- `"Nueva Cotizacion"` -> falta tilde (multiples lineas)
- `"Editar Cotizacion"` -> falta tilde
- `"Pendiente Aprobacion"` -> falta tilde en "Aprobacion"
- `"Eliminar Cotizacion"` -> falta tilde

---

## Issue 45: Cliente consumidor final fantasma
**Prioridad:** Media | **Estimacion:** 1.5h | **Modulo:** Cotizaciones

**Archivo:** `apps/web/src/components/facturas/cliente-search.tsx` lineas 11-18, 163-170

**Root Cause:**
```typescript
const CONSUMIDOR_FINAL: Cliente = {
  id: 'consumidor-final',
  tipoDocumento: '13',
  numDocumento: '00000000-0',
  nombre: 'Consumidor Final',
};
```
- Se muestra automaticamente cuando `tipoDte === '01'` (Factura)
- Aparece tambien en cotizaciones donde NO deberia estar (cotizaciones requieren cliente real)

**Solucion:** Agregar prop para controlar si mostrar CONSUMIDOR_FINAL, o excluirlo cuando el componente se usa en cotizaciones.

---

## Issue 46: Nombre columna "Impuesto" -> "IVA (13%)"
**Prioridad:** Alta | **Estimacion:** 0.5h | **Modulo:** Facturas/PDF

**Archivos afectados:**
- `apps/web/src/components/facturas/items-table.tsx` linea 93: `<TableHead>IVA</TableHead>` -> `IVA (13%)`
- `apps/web/src/components/forms/items-table.tsx` linea 93: mismo cambio
- `apps/api/src/modules/dte/pdf.service.ts` linea 292: `'IVA'` -> `'IVA (13%)'`
- `apps/web/messages/es.json` linea 60: `"tax": "Impuesto"` -> actualizar si se usa

**Solucion:** Cambiar header a "IVA (13%)" en los 3 archivos.

---

## Issue 47: Ortografia catalogos
**Prioridad:** Media | **Estimacion:** 0.5h | **Modulo:** Catalogos

**Archivo:** `apps/web/messages/es.json`
**Errores:**
- Linea 541: `"catalogo"` -> falta tilde ("catalogo")
- Linea 542: `"catalogo"` -> falta tilde
- Linea 674: `"catalogo de cuentas"` -> falta tilde

---

## Issue 48: Entrada incompleta
**Estado:** N/A - Error de documento, no es un issue real.

---

## Dependencias Detectadas

```
Issue 27 <-> Issue 29  (ambos afectan flujo de facturacion)
Issues 38 + 39 + 40    (todos son cambios en pdf.service.ts)
Issues 22 + 36 + 37 + 43 + 44 + 47  (batch de ortografia)
Issue 41 -> requiere verificar datos existentes antes de migration
```

## Resumen de Esfuerzo

| Categoria | Issues | Horas Est. |
|-----------|--------|-----------|
| Criticos | 27, 29, 41 | 9h |
| Altos | 28, 30, 35, 38, 39, 46 | 9h |
| Medios (ortografia batch) | 22, 36, 37, 43, 44, 47 | 3.5h |
| Medios (funcionalidad) | 40, 42, 45 | 6h |
| Bajos | 31 | 1h |
| Ya resueltos | 23, 24, 25, 32, 33, 34 | 0h |
| N/A | 21, 26, 48 | 0h |
| **TOTAL** | | **~28.5h** |
