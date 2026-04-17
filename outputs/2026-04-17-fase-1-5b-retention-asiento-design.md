# Fase 1.5b — Retention IVA Asiento Leg Extension (design spec)

**Fecha:** 2026-04-17
**Fase:** 1.5b (segunda y última sub-fase dentro de Fase 1.5)
**Depende de:** Fases 1.2 + 1.3 + 1.4a/b/c + 1.5a merged a main ✅
**Plan:** se genera después vía `superpowers:writing-plans`

**Propósito:** extender `DefaultMappingLine.monto` enum con `'retention'` y `'totalMinusRetention'`, agregar `retention` al `DteAmounts` interface + `resolveAmount()` switch, filtrar líneas con amount 0 en `buildMultiLines`, y actualizar las 3 mapping rules de compras (`COMPRA_CCFE/FCFE/FSEE`) para splitear el crédito a Proveedores vs IVA Retenido cuando `retentionAmount > 0`. Cierra el gap contable de retention que Fase 1.4b dejó diferido (O5 original → O2 de Fase 1.4b).

---

## 0. Decisiones locked

| # | Decisión | Elegido |
|---|---|---|
| D1 | Alcance de mapping rules a actualizar | **B:** los 3 `COMPRA_CCFE/FCFE/FSEE` con mismo template. Filtro zero-amount en `buildMultiLines` → cero breaking change cuando retentionAmount=0 (caso 99.9% FE/FSEE). |
| D2 | Enum extension approach | 2 nuevos valores: `'retention'` y `'totalMinusRetention'`. Declarativo, se lee como config, matches `subtotal + iva = totalMinusRetention + retention` balance naturalmente. |
| D3 | Account code para retention | `210205 IVA Retenido` — existente (Fase 1.2 chart audit confirmó). |
| D4 | Backfill existing Purchases | **NO.** Wellnest aún no tiene Purchases con retención en staging, prod no ha ido live. Post-MVP si aparece necesidad. |

---

## 1. Alcance (IN / OUT)

**IN Fase 1.5b:**
- Extend `DefaultMappingLine.monto` type con `'retention' | 'totalMinusRetention'` (`default-mappings.data.ts`)
- Extend `DteAmounts` interface con `retention: number` (`accounting-automation.service.ts`)
- Extend `resolveAmount()` switch con 2 nuevos cases
- Filter zero-amount lines en `buildMultiLines()` (drop lines where `debit === 0 && credit === 0`)
- Update 3 mapping rules de compras en `DEFAULT_MAPPINGS`:
  - `COMPRA_CCFE`: Proveedores `total` → `totalMinusRetention`, nueva línea IVA Retenido `retention`
  - `COMPRA_FCFE`: mismo cambio (aunque retentionAmount usualmente 0)
  - `COMPRA_FSEE`: mismo cambio (aunque retentionAmount usualmente 0)
- Update `generateFromDTE` + `generateFromPurchase` → agregar `retention` al `amounts` object pasado a `buildMultiLines`
- `AccountingAutomationService.seedOrUpdateMappings(tenantId)` — re-upsert mapping rules para el tenant (método existente si está; si no, expand seed)
- Unit tests: 4 pure (resolveAmount + filter) + 4 service (retention flow)

**OUT (diferido):**
- Backfill script para Purchases existentes con retentionAmount > 0 y asiento incompleto → **post-MVP**
- Percepción 1% IVA (account `210204 IVA Percibido`) — distinto de retención → **post-MVP** si aparece caso
- Retención de Renta (no IVA) — usa `210202 Retenciones de Renta` — distinto enum value → **post-MVP**
- UI para ver/regenerar asientos incompletos → **Fase 2**
- Retention en ventas (outgoing DTEs emitted con retención) → por ahora `generateFromDTE` pasa `retention: 0` safe default; real integration futura

---

## 2. Módulo + archivos

**Modify:**
- `apps/api/src/modules/accounting/default-mappings.data.ts` — extend enum + update 3 mapping rules
- `apps/api/src/modules/accounting/accounting-automation.service.ts` — `DteAmounts`, `resolveAmount()`, `buildMultiLines()` filter, amounts construction en 2 `generateFrom*()` methods
- `apps/api/src/modules/accounting/accounting-automation.service.spec.ts` — 4 new tests
- `apps/api/src/modules/accounting/default-mappings.purchases.spec.ts` — update expected mapping rules assertions (3 cases)

**Create:**
- None. Todas las modificaciones son sobre archivos existentes.

**No schema changes.** Todo vive a nivel código/datos.

---

## 3. Contratos extendidos

### `DefaultMappingLine.monto` type

```typescript
// default-mappings.data.ts

export interface DefaultMappingLine {
  cuenta: string;
  monto: 'total' | 'subtotal' | 'iva' | 'retention' | 'totalMinusRetention';
  descripcion: string;
}
```

### `DteAmounts` interface

```typescript
// accounting-automation.service.ts

interface DteAmounts {
  totalPagar: number;
  totalGravada: number;
  totalIva: number;
  retention: number;  // NEW — default 0 for DTEs without retention
}
```

### `resolveAmount()` switch

```typescript
private resolveAmount(montoKey: string, amounts: DteAmounts): number {
  switch (montoKey) {
    case 'total': return amounts.totalPagar;
    case 'subtotal': return amounts.totalGravada;
    case 'iva': return amounts.totalIva;
    case 'retention': return amounts.retention;  // NEW
    case 'totalMinusRetention':  // NEW
      return amounts.totalPagar - amounts.retention;
    default: return 0;
  }
}
```

### `buildMultiLines()` — zero-amount filter

Al final del método, después de construir las líneas pero antes de retornarlas:

```typescript
// Drop lines that resolve to amount=0 on BOTH debit and credit sides.
// Keeps asientos clean when retentionAmount=0 (the 99% case).
const filtered = lines.filter((l) => l.debit !== 0 || l.credit !== 0);

// Invariant preserved: sum(debit) = sum(credit) after filter,
// because zero-amount lines contribute 0 to both.
return filtered;
```

### Amounts construction en los 2 `generateFrom*()` methods

```typescript
// generateFromPurchase (existing + NEW field)
const amounts: DteAmounts = {
  totalPagar: Number(purchase.totalAmount),
  totalGravada: Number(purchase.subtotal),
  totalIva: Number(purchase.ivaAmount),
  retention: Number(purchase.retentionAmount),  // NEW — from Fase 1.4b mapper
};

// generateFromDTE (existing + NEW field, safe default 0)
const amounts: DteAmounts = {
  totalPagar: Number(dte.totalPagar),
  totalGravada: Number(dte.totalGravada),
  totalIva: Number(dte.totalIva),
  retention: 0,  // NEW — outgoing DTEs retention handling deferred
};
```

---

## 4. Mapping rules updates

### `COMPRA_CCFE` (crédito fiscal)

```typescript
{
  operation: 'COMPRA_CCFE',
  description: 'Compra con Crédito Fiscal (CCFE) — IVA separado, opcional retención 1%',
  debitCode: '110401',
  creditCode: '210101',
  mappingConfig: {
    debe: [
      { cuenta: '110401', monto: 'subtotal', descripcion: 'Inventario Mercadería' },
      { cuenta: '110303', monto: 'iva', descripcion: 'IVA Crédito Fiscal' },
    ],
    haber: [
      { cuenta: '210101', monto: 'totalMinusRetention', descripcion: 'Proveedores Locales' },  // CHANGED: was 'total'
      { cuenta: '210205', monto: 'retention', descripcion: 'IVA Retenido por Pagar' },  // NEW
    ],
  },
}
```

### `COMPRA_FCFE` (factura consumidor final)

```typescript
{
  operation: 'COMPRA_FCFE',
  description: 'Compra con Factura Consumidor Final (FCFE) — IVA capitalizado, opcional retención',
  debitCode: '110401',
  creditCode: '210101',
  mappingConfig: {
    debe: [
      { cuenta: '110401', monto: 'total', descripcion: 'Inventario (IVA capitalizado)' },
    ],
    haber: [
      { cuenta: '210101', monto: 'totalMinusRetention', descripcion: 'Proveedores Locales' },  // CHANGED: was 'total'
      { cuenta: '210205', monto: 'retention', descripcion: 'IVA Retenido por Pagar' },  // NEW (filtered when 0)
    ],
  },
}
```

**Notar el pairing desbalanceado:** debe usa `total`, haber usa `totalMinusRetention + retention`. Álgebra: `total = totalMinusRetention + retention` ✓.

### `COMPRA_FSEE` (sujeto excluido, sin IVA)

```typescript
{
  operation: 'COMPRA_FSEE',
  description: 'Compra a Sujeto Excluido (FSEE) — sin IVA, opcional retención',
  debitCode: '110401',
  creditCode: '210101',
  mappingConfig: {
    debe: [
      { cuenta: '110401', monto: 'total', descripcion: 'Inventario (sin IVA)' },
    ],
    haber: [
      { cuenta: '210101', monto: 'totalMinusRetention', descripcion: 'Proveedores Locales' },  // CHANGED
      { cuenta: '210205', monto: 'retention', descripcion: 'IVA Retenido por Pagar' },  // NEW (filtered when 0)
    ],
  },
}
```

### Balance invariant en los 3 casos

| Case | Debit | Credit |
|---|---|---|
| CCFE, retention=0 | subtotal + iva = total | (total - 0) + 0 = total |
| CCFE, retention>0 | subtotal + iva = total | (total - ret) + ret = total |
| FCFE/FSEE, retention=0 | total | (total - 0) + 0 = total |
| FCFE/FSEE, retention>0 | total | (total - ret) + ret = total |

Todas balancean. Filtro zero-amount aplica solo cuando retention=0.

---

## 5. Seed / update of mapping rules

Las mapping rules viven en `AccountMappingRule` table seeded vía `AccountingService.seedAccountMappings(tenantId)` (existing helper que hace upsert idempotente contra `DEFAULT_MAPPINGS`).

Cuando un tenant ya tiene rows seeded (caso normal en staging/prod), el re-seed debe **update** los rows existentes para que `mappingConfig` refleje el nuevo template. Opciones:

**(A) Update-on-seed automático:** `seedAccountMappings()` hace upsert que siempre sobrescribe `mappingConfig` a lo declarado en `DEFAULT_MAPPINGS`. Si algún tenant customized el mapping manually, se sobreescribe — riesgo: pérdida de customization.

**(B) Versioning field:** agregar `version` en `AccountMappingRule` + upsert solo si version cambia. Over-engineered para MVP.

**(C) Manual migration:** al deploy, correr script que hace `UPDATE AccountMappingRule SET mappingConfig = ... WHERE operation IN (...)`. Controlado, idempotente, documentable.

**Elección: A.** Razones:
- Ningún tenant customiza mapping rules hoy (UI de gestión es Fase 2+).
- `seedAccountMappings()` ya es idempotente y reusable.
- Cuando el service inicia o cualquier consumer invoca el seed, las reglas se normalizan.
- Si en el futuro Fase 2 agrega UI para custom rules, agregar `lastModifiedBy` + gate de sobreescritura.

**Cuándo se ejecuta el seed:** post-deploy automático via init script O manual via admin endpoint. Ya existe ese path en `AccountingService` o `scripts/`; el plan verifica y lo invoca en Task final.

---

## 6. Tests (~8 nuevos)

### Pure function `resolveAmount` (4)

Archivo: `accounting-automation.service.spec.ts` — agregar describe block si existente o nuevo.

1. `resolveAmount('retention', amounts)` retorna `amounts.retention`
2. `resolveAmount('totalMinusRetention', amounts)` retorna `amounts.totalPagar - amounts.retention`
3. `resolveAmount('total', amounts)` (regression) retorna `amounts.totalPagar` — sin cambio
4. `resolveAmount('unknown_key', amounts)` retorna 0 (default case)

### Integration con `generateFromPurchase` (4)

5. **CCFE con retentionAmount=5**: Purchase with subtotal=100, iva=13, totalAmount=113, retentionAmount=5 → asiento tiene 4 lines:
   - debit Inventario 100
   - debit IVA CF 13
   - credit Proveedores 108 (113-5)
   - credit IVA Retenido 5
   - Balance: 113 = 113 ✓

6. **CCFE con retentionAmount=0** (regression test): Purchase with subtotal=100, iva=13, totalAmount=113, retentionAmount=0 → asiento tiene 3 lines (retention leg filtered):
   - debit Inventario 100
   - debit IVA CF 13
   - credit Proveedores 113
   - Balance: 113 = 113 ✓ (equivalent a Fase 1.4b behavior)

7. **FCFE con retentionAmount=0** (regression): asiento tiene 2 lines, comportamiento igual al anterior.

8. **`buildMultiLines` filtro zero-amount**: invocar con amounts que hacen retention=0 en un config que tiene retention line → result array tiene N-1 lines (retention excluded).

### Update de `default-mappings.purchases.spec.ts`

Los tests existentes (Fase 1.2) assertaban shape específico del mappingConfig. Actualizarlos:

9. `COMPRA_CCFE.mappingConfig.haber` tiene 2 elementos (Proveedores totalMinusRetention + IVA Retenido retention)
10. `COMPRA_FCFE.mappingConfig.haber` tiene 2 elementos (mismo pattern)
11. `COMPRA_FSEE.mappingConfig.haber` tiene 2 elementos (mismo pattern)

Los tests existentes que checkean el `monto: 'total'` en la línea Proveedores deben actualizarse a `monto: 'totalMinusRetention'`.

---

## 7. Open decisions — diferidas

| # | Item | Futuro |
|---|---|---|
| O1 | Backfill script para Purchases existentes con retentionAmount>0 y asiento incompleto | Post-MVP (si aparece volumen) |
| O2 | Percepción IVA 1% (cuenta `210204`) — nuevo enum `'perception'` | Post-MVP si aparece caso |
| O3 | Retención de Renta (no IVA) — cuenta `210202` — nuevo enum | Post-MVP |
| O4 | UI para visualizar asientos + botón "regenerar asiento" | Fase 2 |
| O5 | Retention en ventas (outgoing DTEs) — `generateFromDTE` hoy pasa `retention: 0` safe default; real integration cuando se necesite | Post-MVP |
| O6 | Custom per-tenant mapping rules con gate contra sobreescritura | Fase 2+ |

---

## 8. Checklist de aprobación

- [ ] §1 alcance — 3 mapping rules + enum + resolveAmount + filtro zero-amount; no backfill, no percepción/renta
- [ ] §2 archivos — 4 modify, 0 create, 0 schema changes
- [ ] §3 contratos — `DefaultMappingLine.monto` con 2 nuevos valores, `DteAmounts.retention`, `resolveAmount()` con 2 nuevos cases, zero-amount filter
- [ ] §4 mapping rules — los 3 COMPRA_* con `totalMinusRetention + retention` pair en haber
- [ ] §5 seed update-on-seed automático (A)
- [ ] §6 tests — 4 pure + 4 service + 3 spec updates existentes
- [ ] §7 open decisions — backfill, percepción, retención renta, UI, outgoing retention diferidos

Una vez aprobado, invoco `superpowers:writing-plans`.
