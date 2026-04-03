# Auditoría Módulo DTE + Contable — Facturador Electrónico SV

**Fecha:** 2026-03-12
**Auditor:** Claude Code
**Alcance:** Tipos de DTE soportados, módulo contable, gaps de implementación

---

## 1. Resumen Ejecutivo

El sistema actualmente soporta **2 de 10 tipos de DTE** de manera completa (01 Factura, 03 CCF). Otros 4 tipos (05, 06, 07, 14) están parcialmente definidos pero **no pueden ser creados** porque faltan validadores Zod y builders. El módulo contable es robusto y auto-triggereable, pero solo mapea 5 de las 6 operaciones definidas.

### Hallazgos Clave

| Métrica | Valor |
|---------|-------|
| Tipos DTE en Hacienda | 10 |
| Tipos en `TipoDte` union | 6 (01, 03, 05, 06, 07, 14) |
| Tipos completamente funcionales | **2** (01, 03) |
| Tipos parciales (no creables) | **4** (05, 06, 07, 14) |
| Tipos no implementados | **4** (04, 09, 11, 34) |
| Módulo contable | Existe y es auto-triggered |
| Operaciones contables mapeadas | 6 de ~10 necesarias |

---

## 2. Arquitectura del Schema (Prisma)

### 2.1 Modelo DTE
- **Tabla:** `DTE` (no "DocumentoTributario")
- **Campo tipo:** `tipoDte String` — string libre, NO enum
- **Implicación:** Acepta cualquier valor sin validación a nivel BD. La validación está en la capa de servicio.

### 2.2 Tipo DTE — Definición TypeScript
```typescript
// packages/shared/src/types/dte.types.ts
export type TipoDte = '01' | '03' | '05' | '06' | '07' | '14';
```

**Tipos AUSENTES del union:** 04, 09, 11, 34

**Inconsistencia detectada:** El tipo `'11'` aparece en:
- `pdf.service.ts` → `getTipoDteLabel()`
- `dte.service.ts` → `getStatsByType()` → `tipoDteNames`
- Email labels en `sendDteEmail()`

Pero NO está en el tipo TypeScript, lo que significa que TypeScript no detectará errores de tipo para '11'.

### 2.3 Modelo JournalEntry
- Existe con estructura completa de partida doble
- Relación con DTE via `sourceType='DTE' + sourceDocumentId` (no FK directo)
- Soporte para estados: DRAFT → POSTED → VOIDED
- Líneas con debit/credit Decimal(15,2)

### 2.4 Modelo AccountingAccount
- 262 cuentas NIIF/PYMES precargables
- Jerarquía de 4 niveles
- Soporte para cuentas personalizadas

### 2.5 Modelo AccountMappingRule
- Mapeo flexible operación → cuentas (debit/credit)
- Soporte para JSON `mappingConfig` multi-línea
- 6 reglas predefinidas en `default-mappings.data.ts`

---

## 3. Servicio DTE — Análisis Detallado

### 3.1 Pipeline de Creación

```
CreateDteDto → DteValidatorService.validate() → DteBuilderService.build()
→ normalizeJsonForHacienda() → prisma.dte.create() → triggerAccountingEntry()
→ autoSignAndTransmit() → triggerAccountingEntry(ON_APPROVED)
```

### 3.2 DteValidatorService (dte-validator.service.ts)

**Solo 2 schemas implementados:**
```typescript
private schemas: Record<string, z.ZodSchema> = {
  '01': FacturaSchema,
  '03': CCFSchema,
};
```

Para cualquier otro tipo, retorna:
```json
{ "valid": false, "errors": [{"message": "Schema not implemented for type XX"}] }
```

**BLOQUEANTE:** Ningún tipo excepto 01 y 03 puede pasar validación.

### 3.3 DteBuilderService (dte-builder.service.ts, 353 líneas)

**Solo 2 builders:**
- `buildFactura()` → tipo 01
- `buildCCF()` → tipo 03

No hay builders para 05, 06, 07, 14, ni ningún otro tipo.

### 3.4 normalizeJsonForHacienda() (dte.service.ts:1074-1241)

**Solo 2 ramas:**
```typescript
if (tipoDte === '03') {
  // Normalization específica para CCF
  // - Convierte receptor (NIT requerido)
  // - Remueve ivaItem, agrega codTributo
  // - Reemplaza totalIva con ivaPerci1/ivaRete1
  // - Recalcula IVA al 13%
} else {
  // Fallback genérico para TODO lo demás
  // - Solo agrega emisor y campos null
}
```

**Problema:** IVA hardcodeado al 13% (línea 1179). No aplica para:
- Tipo 11 (Exportación) = 0% IVA
- Tipo 14 (Sujeto Excluido) = sin IVA
- Tipo 07 (Retención) = estructura diferente

### 3.5 autoSignAndTransmit() (dte.service.ts:329-482)

**Genérico para todos los tipos** — no tiene lógica específica por tipo. Esto es correcto ya que la firma y transmisión a Hacienda usa el mismo endpoint para todos los DTEs.

---

## 4. Módulo Contable — Análisis Detallado

### 4.1 Estructura
```
apps/api/src/modules/accounting/
├── accounting.service.ts (1,091 líneas) — CRUD, reportes, balance
├── accounting-automation.service.ts (350 líneas) — auto-trigger desde DTE
├── accounting.controller.ts (449 líneas) — 15+ endpoints
├── accounting.module.ts
├── chart-of-accounts.data.ts — 262 cuentas NIIF/PYMES
├── default-mappings.data.ts — 6 mappings predefinidos
├── dto/ (8 archivos)
└── *.spec.ts (2 archivos de tests)
```

### 4.2 Automatización DTE → Asiento Contable

**Flujo:**
1. DTE se crea/aprueba → `triggerAccountingEntry(dteId, tenantId, trigger)`
2. `AccountingAutomationService.generateFromDTE()` verifica:
   - `autoJournalEnabled = true` en tenant config
   - Trigger coincide con `autoJournalTrigger` del tenant
   - No existe asiento duplicado para el mismo DTE
3. Determina operación según tipoDte + condicionOperacion
4. Busca `AccountMappingRule` activa para esa operación
5. Genera líneas (multi-línea desde JSON o 2-línea simple)
6. Valida balance (débito = crédito ± 0.01)
7. Crea JournalEntry DRAFT → inmediatamente POSTED

**Patrón fire-and-forget:** Errores se loguean pero NUNCA bloquean el procesamiento del DTE.

### 4.3 Operaciones Contables Mapeadas

| Operación | TipoDte | Condición | Débito | Crédito |
|-----------|---------|-----------|--------|---------|
| VENTA_CONTADO | 01 | condicionOp=1 | Caja General | Ventas + IVA Débito |
| VENTA_CREDITO | 01 | condicionOp=2 | Clientes Locales | Ventas + IVA Débito |
| CREDITO_FISCAL | 03 | — | Clientes Locales | Ventas + IVA Débito |
| NOTA_CREDITO | 05 | — | Ventas + IVA | Clientes Locales |
| NOTA_DEBITO | 06 | — | Clientes Locales | Ventas + IVA |
| SUJETO_EXCLUIDO | 14 | — | Caja General | Ventas (sin IVA) |

**Operaciones FALTANTES:**
- Tipo 07 (Retención) — sin mapping
- Tipo 11 (Exportación) — sin mapping
- Tipo 04 (Nota de Remisión) — posiblemente no requiere asiento
- Tipo 09 (Liquidación) — sin mapping
- Tipo 34 (Donación) — sin mapping

### 4.4 Reversal (Anulación)

Funciona correctamente:
1. DTE anulado → `triggerAccountingReversal(dteId, tenantId)`
2. Busca JournalEntry con sourceType='DTE' + sourceDocumentId + status='POSTED'
3. Void entry → revierte balances de cuentas
4. Registra voidReason='Anulación de DTE'

### 4.5 Reportes Disponibles

- Libro Diario (journal entries con filtros)
- Libro Mayor (general ledger por cuenta con saldo corriente)
- Balanza de Comprobación (trial balance)
- Balance General (balance sheet)
- Estado de Resultados (income statement)
- Dashboard (resumen ejecutivo)

### 4.6 Observación sobre CREDITO_FISCAL

El mapping de CREDITO_FISCAL (tipo 03/CCF) usa las mismas cuentas que VENTA_CREDITO:
- Débito: Clientes Locales
- Crédito: Ventas + IVA Débito Fiscal

Esto puede ser correcto para **ventas** con CCF, pero si el CCF se usa para **compras** (IVA Crédito Fiscal), el mapping debería ser diferente (Compras/IVA Crédito Fiscal). Revisar con el equipo contable.

---

## 5. Cobertura de Tests

### 5.1 Tests DTE
| Archivo | Líneas | Tipos Testeados | Cobertura |
|---------|--------|-----------------|-----------|
| dte.service.spec.ts | 138 | 01 (filtro) | Baja — solo findByTenant |
| dte.controller.spec.ts | 130 | N/A | Solo controller wiring |

**Gaps críticos:**
- No hay tests para createDte()
- No hay tests para normalizeJsonForHacienda()
- No hay tests para autoSignAndTransmit()
- No hay tests parametrizados por tipo de DTE

### 5.2 Tests Accounting
| Archivo | Tests | Cobertura |
|---------|-------|-----------|
| accounting.service.spec.ts | ~43 | Buena — CRUD, reportes, balance |
| accounting-automation.service.spec.ts | 12 | Buena — flujo completo DTE→asiento |

**Tipos testeados en automation:** 01, 03, 05, 06, 14

### 5.3 Tests E2E
- Solo UI (Playwright): paginación, filtros
- No hay E2E del flujo completo DTE → Hacienda → Accounting

---

## 6. Riesgos Identificados

### ALTO
1. **Tipos 05, 06, 07, 14 no creables** — La validación los rechaza con "Schema not implemented". Si un tenant intenta crear una Nota de Crédito, obtendrá un error.
2. **IVA hardcodeado al 13%** — Incorrecto para exportaciones (0%) y sujeto excluido (sin IVA).
3. **Tipo 11 referenciado pero no implementado** — El PDF y analytics muestran labels para '11' pero no se puede crear. Genera confusión.

### MEDIO
4. **normalizeJsonForHacienda() solo diferencia '03' vs 'todo lo demás'** — Los tipos 05, 06, 07, 14 necesitan normalización específica según especificación de Hacienda.
5. **Sin accounting mapping para tipo 07 (Retención)** — Si se implementa el tipo, no generará asiento contable.
6. **CREDITO_FISCAL mapping posiblemente incorrecto** para compras (usa cuentas de venta).

### BAJO
7. **Sin tests para createDte/normalization** — Riesgo de regresiones al agregar nuevos tipos.
8. **Tipos 04, 09, 34 completamente ausentes** — Baja prioridad pero gap de cobertura.

---

## 7. Recomendaciones

### Inmediatas (Sprint actual)
1. **Implementar schemas Zod para tipos 05, 06, 14** — Desbloquea creación de estos DTEs
2. **Agregar builders correspondientes** — Uno por tipo, con campos específicos
3. **Agregar ramas de normalización** — Al menos para 05, 06, 14
4. **Extraer tasa IVA** — No hardcodear 13%, usar catálogo de tributos

### Corto plazo (2-3 sprints)
5. **Implementar tipo 11 (Exportación)** — Agregar al union, schema, builder, normalizer, accounting
6. **Implementar tipo 07 (Retención)** — Con accounting mapping específico
7. **Resolver inconsistencia de tipo '11'** en código existente
8. **Agregar tests parametrizados** para todos los tipos de DTE

### Mediano plazo
9. **Implementar tipos 04, 09, 34** según demanda
10. **Revisar mapping CREDITO_FISCAL** con equipo contable
11. **Tests E2E del flujo completo** DTE → Hacienda → Accounting
