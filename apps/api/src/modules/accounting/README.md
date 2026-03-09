# Modulo de Contabilidad

Sistema de contabilidad de partida doble con automatizacion DTE -> Partida Contable.

## Arquitectura

```
accounting.module.ts
  |-- accounting.controller.ts       (endpoints HTTP)
  |-- accounting.service.ts          (plan de cuentas, partidas, reportes)
  |-- accounting-automation.service.ts (automatizacion DTE -> partida)
  |-- chart-of-accounts.data.ts      (262 cuentas NIIF/PYMES SV)
  |-- default-mappings.data.ts       (6 mapeos predeterminados)
  |-- dto/
       |-- create-account.dto.ts
       |-- update-account.dto.ts
       |-- create-journal-entry.dto.ts
       |-- query-journal.dto.ts
       |-- report-query.dto.ts
       |-- simulate-invoice.dto.ts
       |-- update-accounting-config.dto.ts
       |-- upsert-mapping.dto.ts
       |-- index.ts
```

## Modelos de Datos

### AccountingAccount
Plan de cuentas jerarquico (4 niveles). 262 cuentas NIIF/PYMES de El Salvador.

### JournalEntry
Partida contable con estado: `DRAFT` -> `POSTED` -> `VOIDED`.

### JournalEntryLine
Lineas de partida (debe/haber). Inmutables una vez creadas.

### AccountMappingRule
Reglas de mapeo operacion -> cuentas. Soporta `mappingConfig` JSON para multi-linea.

## Endpoints

### Configuracion de Automatizacion

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/accounting/config` | Obtener config (autoJournalEnabled, autoJournalTrigger) |
| PATCH | `/accounting/config` | Actualizar config |

### Reglas de Mapeo

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/accounting/mappings` | Listar reglas de mapeo |
| POST | `/accounting/mappings` | Crear/actualizar regla (upsert por operacion) |
| DELETE | `/accounting/mappings/:id` | Eliminar regla |
| POST | `/accounting/mappings/seed` | Generar 6 mapeos predeterminados |

### Plan de Cuentas

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/accounting/seed` | Sembrar plan de cuentas SV |
| GET | `/accounting/accounts` | Obtener arbol de cuentas |
| GET | `/accounting/accounts/list` | Lista plana de cuentas activas |
| GET | `/accounting/accounts/postable` | Cuentas que permiten movimientos |
| POST | `/accounting/accounts` | Crear cuenta |
| PATCH | `/accounting/accounts/:id` | Actualizar cuenta |
| POST | `/accounting/accounts/:id/toggle-active` | Activar/desactivar |

### Partidas Contables

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/accounting/journal-entries` | Crear partida (DRAFT) |
| GET | `/accounting/journal-entries` | Listar (paginado, filtros) |
| GET | `/accounting/journal-entries/:id` | Detalle con lineas |
| POST | `/accounting/journal-entries/:id/post` | Contabilizar (DRAFT -> POSTED) |
| POST | `/accounting/journal-entries/:id/void` | Anular (POSTED -> VOIDED) |

### Reportes (requiere feature `advanced_reports`)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/accounting/reports/trial-balance` | Balanza de comprobacion |
| GET | `/accounting/reports/balance-sheet` | Balance general |
| GET | `/accounting/reports/income-statement` | Estado de resultados |
| GET | `/accounting/reports/general-ledger` | Libro mayor (requiere accountId) |

### Otros

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/accounting/simulate-invoice` | Simular impacto contable |
| GET | `/accounting/dashboard` | Resumen financiero |

## Automatizacion DTE -> Partida

### Flujo

```
DTE Creado/Aprobado
  |
  v
AccountingAutomationService.generateFromDTE()
  |
  |-- Verificar autoJournalEnabled = true
  |-- Verificar trigger coincide (ON_CREATED / ON_APPROVED)
  |-- Obtener DTE completo
  |-- Verificar no duplicado (sourceType='DTE', sourceDocumentId)
  |-- Determinar operacion (tipoDte + condicionOperacion)
  |-- Buscar AccountMappingRule activa
  |-- Construir lineas (mappingConfig JSON o simple)
  |-- Validar Debe = Haber
  |-- Crear JournalEntry (DRAFT)
  |-- Post JournalEntry (-> POSTED)
  v
Partida contabilizada automaticamente
```

### Reversa (al anular DTE)

```
DTE Anulado
  |
  v
AccountingAutomationService.reverseFromDTE()
  |
  |-- Buscar JournalEntry con sourceDocumentId = dteId
  |-- Si existe y POSTED -> voidJournalEntry()
  v
Partida anulada (VOIDED, razon: "Anulacion de DTE")
```

### Tipos de Operacion

| tipoDte | condicionOperacion | Operacion |
|---------|-------------------|-----------|
| 01 | 1 (Contado) | VENTA_CONTADO |
| 01 | 2 (Credito) | VENTA_CREDITO |
| 03 | cualquiera | CREDITO_FISCAL |
| 05 | - | NOTA_CREDITO |
| 06 | - | NOTA_DEBITO |
| 14 | - | SUJETO_EXCLUIDO |

### Mapeos Predeterminados

```
VENTA_CONTADO:
  DEBE: 110101 Caja General (total)
  HABER: 4101 Ventas (subtotal), 210201 IVA Debito Fiscal (iva)

VENTA_CREDITO:
  DEBE: 110301 Clientes Locales (total)
  HABER: 4101 Ventas (subtotal), 210201 IVA Debito Fiscal (iva)

CREDITO_FISCAL:
  DEBE: 110301 Clientes Locales (total)
  HABER: 4101 Ventas (subtotal), 210201 IVA Debito Fiscal (iva)

NOTA_CREDITO:
  DEBE: 4101 Ventas (subtotal), 210201 IVA Debito Fiscal (iva)
  HABER: 110301 Clientes Locales (total)

NOTA_DEBITO:
  DEBE: 110301 Clientes Locales (total)
  HABER: 4101 Ventas (subtotal), 210201 IVA Debito Fiscal (iva)

SUJETO_EXCLUIDO:
  DEBE: 110101 Caja General (total)
  HABER: 4101 Ventas (total)
```

## Manejo de Errores

- La automatizacion es **fire-and-forget**: errores se loguean pero nunca bloquean el DTE
- Si falta una cuenta referenciada en mappingConfig, se omite esa linea (con warning)
- Si el resultado no cuadra (debe != haber), no se crea partida
- Duplicados se detectan por sourceType + sourceDocumentId

## Feature Gating

- Todos los endpoints requieren `@RequireFeature('accounting')`
- Reportes avanzados requieren `@RequireFeature('advanced_reports')`
- Guard: `PlanFeatureGuard` verifica el plan del tenant

## Tests

```bash
# Solo tests de automatizacion
npx jest --config apps/api/jest.config.ts --testPathPattern="accounting-automation"

# Todos los tests de contabilidad
npx jest --config apps/api/jest.config.ts --testPathPattern="accounting"
```

12 tests de automatizacion cubriendo:
- Generacion correcta (3 lineas y 2 lineas)
- Condiciones de no-generacion (disabled, trigger mismatch, duplicados, sin regla)
- Determinacion de operacion por tipoDte
- Reversa al anular DTE

## Troubleshooting

### Partida no se genera automaticamente

1. Verificar `autoJournalEnabled = true` en tenant
2. Verificar trigger coincide (`ON_APPROVED` para transmisiones, `ON_CREATED` para creacion)
3. Verificar que existe mapeo para la operacion (GET /accounting/mappings)
4. Verificar que las cuentas del mapeo existen y estan activas
5. Revisar logs: `grep "Accounting" api.log`

### Partida no cuadra

1. Verificar montos del DTE: totalPagar = totalGravada + totalIva
2. Verificar mappingConfig: la suma de montos "debe" debe igualar la suma de "haber"
3. Para sujeto excluido: totalIva = 0, usar "total" en ambos lados

### Cuenta no encontrada

Las cuentas en mappingConfig se buscan por **codigo** (no por ID):
```sql
SELECT id, code, name, isActive, allowsPosting
FROM accounting_accounts
WHERE tenantId = '<tenant>' AND code = '<codigo>';
```

Verificar que la cuenta existe, esta activa y permite postings.
