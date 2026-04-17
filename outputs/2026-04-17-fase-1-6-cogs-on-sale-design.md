# Fase 1.6 — COGS on Sale (design spec)

**Fecha:** 2026-04-17
**Fase:** 1.6 (cierre del ciclo compra→stock→venta→COGS)
**Depende de:** Fases 1.2-1.5b merged a main ✅
**Plan:** se genera después vía `superpowers:writing-plans`

**Propósito:** al aprobar un DTE de venta (tipoDte 01/03/11) con líneas de items inventariables, generar automáticamente: (1) `InventoryMovement` SALIDA_VENTA per línea, (2) decremento de `InventoryState`, (3) asiento contable `SALIDA_VENTA_COGS` con Debit 5101 Costo Mercadería Vendida / Credit 110401 Inventario Mercadería. Cierra el ciclo end-to-end del módulo Compras+Inventario.

---

## 0. Decisiones locked

| # | Decisión | Elegido |
|---|---|---|
| D1 | Link DTE line → CatalogItem | **D (hybrid):** (1) walk Quote→QuoteLineItem si DTE viene de convertToInvoice; (2) fallback parse `jsonOriginal.cuerpoDocumento[].codigo` + match CatalogItem.code; (3) skip+warn para lines sin match |
| D2 | Trigger point | ON_APPROVED — mismo hook que sales asiento. Ambos se generan juntos al aprobar DTE. |
| D3 | Stock disponible | Allow negative stock + log warning. Wellnest puede vender antes de registrar recepción; bloquear es peor UX. |
| D4 | Idempotency | Dedupe via `sourceType='DTE', sourceId=dteId` en InventoryMovement. Re-invocación retorna existing sin throw. |
| D5 | Asiento granularity | 1 asiento por DTE con totales agregados (Debit COGS total / Credit Inventario total). Kardex detalla per línea vía InventoryMovements. |
| D6 | Cancellation reversal | Sí, `reverseCogsFromDte()` paralelo a `reverseFromDTE()` existente. Genera ENTRADA_DEVOLUCION_VENTA compensating + voidea asiento COGS. |

---

## 1. Alcance (IN / OUT)

**IN Fase 1.6:**
- Nuevo `DteCogsService` en `apps/api/src/modules/dte/services/`
- 2 métodos públicos:
  - `generateCogsFromDte(dteId, tenantId, trigger)` → `CogsGenerationResult`
  - `reverseCogsFromDte(dteId, tenantId)` → `CogsReversalResult`
- Helper `matchDteLinesToCatalog(dte)` — hybrid walker (Quote → codigo fallback)
- Hook en `DteLifecycleService` — invoke `generateCogsFromDte` después de `generateFromDTE` en flujo de aprobación DTE
- Hook en flujo de anulación — invoke `reverseCogsFromDte` después de `reverseFromDTE`
- Non-blocking: si COGS generation falla, DTE approval sigue adelante (log error + continue)
- Unit tests ~10 casos
- Reuso de mapping rule existente `SALIDA_VENTA_COGS` (seeded Fase 1.2)

**OUT (diferido):**
- Mejorar preservación de catalogItemId en Quote→DTE conversion → post-MVP
- Schema change: normalizar `DTELineItem` con FK a CatalogItem → post-MVP (big)
- UI alertas de stock negativo → Fase 2
- Flow de ajuste manual de stock → Fase 2
- COGS por línea en asiento (granularity detallada en JournalEntry) → post-MVP si contador lo pide
- Integration con VENTA_CREDITO condicionOperacion=2 (crédito — asiento distinto a contado) → ya existe en `generateFromDTE` nominal; COGS mismo regardless

---

## 2. Módulo + archivos

**Create:**
- `apps/api/src/modules/dte/services/dte-cogs.service.ts` (~300 LOC estimado)
- `apps/api/src/modules/dte/services/dte-cogs.service.spec.ts` (~250 LOC)

**Modify:**
- `apps/api/src/modules/dte/dte.module.ts` — register `DteCogsService` provider + export (para AppModule)
- `apps/api/src/modules/dte/services/dte-lifecycle.service.ts` — hook call a `dteCogsService.generateCogsFromDte` después de existing `accountingAutomation.generateFromDTE` (2 líneas aprox) + hook reversal en anulación (2 líneas aprox)

**No schema changes.** No new models. No new enums. AccountMappingRule `SALIDA_VENTA_COGS` ya existe desde Fase 1.2 con config:
- Debit: `5101` Costo Mercadería Vendida, `monto: 'total'`
- Credit: `110401` Inventario Mercadería, `monto: 'total'`

Se reusa tal cual — el monto `'total'` en contexto COGS asiento = total cost basis (no total DTE amount).

---

## 3. Contratos públicos

```typescript
// dte-cogs.service.ts

import type { InventoryMovement, InventoryState, JournalEntry } from '@prisma/client';

export interface MatchedLine {
  jsonLineIndex: number;          // posición en jsonOriginal.cuerpoDocumento[]
  catalogItem: {
    id: string;
    code: string;
    trackInventory: boolean;
  };
  quantity: number;
  unitPriceFromDte: number;        // precio de venta (no cost basis)
  descriptionFromDte: string;
  matchSource: 'quote' | 'codigo'; // cómo se hizo match
}

export interface CogsGenerationResult {
  dteId: string;
  linesMatched: number;
  linesSkipped: number;            // lines sin match o sin trackInventory
  linesTracked: number;            // lines que generan InventoryMovement
  inventoryMovementsCreated: InventoryMovement[];
  inventoryStatesUpdated: InventoryState[];
  journalEntry: JournalEntry | null;  // null si no hay trackable items → no COGS asiento
  totalCogs: number;               // sum of qty * unitCost (in currency)
  warnings: string[];
  isDuplicate?: boolean;           // true si idempotent — return existing sin recrear
}

export interface CogsReversalResult {
  dteId: string;
  inventoryMovementsReversed: number;
  inventoryStatesRestored: number;
  journalEntryVoided: string | null;
  warnings: string[];
}

@Injectable()
export class DteCogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingService: AccountingService,
  ) {}

  async generateCogsFromDte(
    dteId: string,
    tenantId: string,
    trigger: string,
  ): Promise<CogsGenerationResult>;

  async reverseCogsFromDte(
    dteId: string,
    tenantId: string,
  ): Promise<CogsReversalResult>;
}
```

**Exceptions:**
- Nunca throw al caller del DTE lifecycle. Errores se capturan y retornan en `warnings[]`.
- Si DTE no existe: return CogsGenerationResult con warnings = ["DTE not found"] y counters en 0.
- Si no hay líneas matchables ni trackableInventory: return con counts 0 y journalEntry: null (no COGS asiento si no hay cost basis).

---

## 4. `matchDteLinesToCatalog()` — hybrid walker

```typescript
private async matchDteLinesToCatalog(
  dte: DTE,
  tenantId: string,
): Promise<{ matched: MatchedLine[]; warnings: string[] }> {
  const warnings: string[] = [];

  // Parse jsonOriginal
  let json: { cuerpoDocumento?: Array<Record<string, unknown>> };
  try {
    json = JSON.parse(dte.jsonOriginal);
  } catch {
    warnings.push(`DTE ${dte.id} has invalid jsonOriginal — cannot match lines`);
    return { matched: [], warnings };
  }
  const cuerpo = json.cuerpoDocumento ?? [];

  // Step 1: try Quote walk-back
  const quote = await this.prisma.quote.findFirst({
    where: { tenantId, dteId: dte.id },  // Quote has dteId FK after convertToInvoice
    include: { lineItems: true },
  });

  const matched: MatchedLine[] = [];
  
  if (quote && quote.lineItems.length > 0) {
    // Match by quote line order to DTE body order (convertToInvoice preserves order)
    for (let i = 0; i < cuerpo.length; i++) {
      const dteLine = cuerpo[i];
      const quoteLine = quote.lineItems[i];
      if (quoteLine?.catalogItemId) {
        const catItem = await this.prisma.catalogItem.findUnique({
          where: { id: quoteLine.catalogItemId },
        });
        if (catItem) {
          matched.push({
            jsonLineIndex: i,
            catalogItem: {
              id: catItem.id,
              code: catItem.code,
              trackInventory: catItem.trackInventory,
            },
            quantity: Number(dteLine.cantidad ?? 0),
            unitPriceFromDte: Number(dteLine.precioUni ?? 0),
            descriptionFromDte: String(dteLine.descripcion ?? ''),
            matchSource: 'quote',
          });
          continue;
        }
      }
      // Quote exists but this line has no catalogItemId → fallback to codigo
      const byCodigo = await this.matchByCodigo(dteLine, tenantId, i);
      if (byCodigo) matched.push(byCodigo);
      else warnings.push(`Line ${i + 1}: no catalog match via quote nor codigo`);
    }
  } else {
    // Step 2: no quote — fallback all to codigo match
    for (let i = 0; i < cuerpo.length; i++) {
      const dteLine = cuerpo[i];
      const byCodigo = await this.matchByCodigo(dteLine, tenantId, i);
      if (byCodigo) matched.push(byCodigo);
      else warnings.push(`Line ${i + 1}: no catalog match via codigo (and no quote linked)`);
    }
  }

  return { matched, warnings };
}

private async matchByCodigo(
  dteLine: Record<string, unknown>,
  tenantId: string,
  jsonLineIndex: number,
): Promise<MatchedLine | null> {
  const codigo = dteLine.codigo ? String(dteLine.codigo) : null;
  if (!codigo) return null;
  const catItem = await this.prisma.catalogItem.findUnique({
    where: { tenantId_code: { tenantId, code: codigo } },
  });
  if (!catItem) return null;
  return {
    jsonLineIndex,
    catalogItem: {
      id: catItem.id,
      code: catItem.code,
      trackInventory: catItem.trackInventory,
    },
    quantity: Number(dteLine.cantidad ?? 0),
    unitPriceFromDte: Number(dteLine.precioUni ?? 0),
    descriptionFromDte: String(dteLine.descripcion ?? ''),
    matchSource: 'codigo',
  };
}
```

**Assumption verified during implementation:** Quote model has `dteId` field (set by convertToInvoice) or equivalent link. Plan Task 1 verifies this — if field name differs, adjust query.

---

## 5. `generateCogsFromDte()` flow

```
INPUT: dteId, tenantId, trigger

1. Load DTE
   if not found → return { warnings: ["DTE not found"], counts: 0 }

2. Idempotency check
   existing = prisma.inventoryMovement.findMany({
     where: { tenantId, sourceType: 'DTE', sourceId: dteId }
   })
   if (existing.length > 0) {
     existingEntry = prisma.journalEntry.findFirst({
       where: { tenantId, sourceType: 'DTE_COGS', sourceDocumentId: dteId }
     });
     return { isDuplicate: true, inventoryMovementsCreated: existing, journalEntry: existingEntry, ... };
   }

3. Match lines to catalog
   { matched, warnings } = await matchDteLinesToCatalog(dte, tenantId)
   
   // Filter to trackable
   trackable = matched.filter(m => m.catalogItem.trackInventory === true)
   
   for each matched but NOT trackable:
     warnings.push("Line X: catalog matched but trackInventory=false — skipping Kardex")
   
   if (trackable.length === 0) {
     return { linesMatched: matched.length, linesTracked: 0, journalEntry: null, warnings, totalCogs: 0 }
   }

4. Group trackable lines by catalogItemId

5. Prisma.$transaction:
   totalCogs = 0
   createdMovements = []
   updatedStates = []
   
   for each [catalogItemId, groupLines]:
     currentState = await tx.inventoryState.findUnique({ where: { catalogItemId } })
     runningQty = Number(currentState?.currentQty ?? 0)
     runningAvgCost = Number(currentState?.currentAvgCost ?? 0)
     
     maxCorr = await tx.inventoryMovement.aggregate({
       where: { tenantId, catalogItemId },
       _max: { correlativo: true }
     })
     nextCorrelativo = (maxCorr._max.correlativo ?? 0) + 1
     
     for each line in groupLines:
       // Cost basis = current moving average at time of sale
       const unitCost = runningAvgCost
       const totalCostLine = line.quantity * unitCost
       const newQty = runningQty - line.quantity
       const newValue = newQty * runningAvgCost
       
       if (newQty < 0) {
         warnings.push(`Stock negative on ${line.catalogItem.code}: was ${runningQty}, sold ${line.quantity}, new balance ${newQty}`)
       }
       
       const movement = await tx.inventoryMovement.create({
         data: {
           tenantId,
           catalogItemId: line.catalogItem.id,
           movementDate: new Date(),
           correlativo: nextCorrelativo++,
           movementType: 'SALIDA_VENTA',
           qtyIn: '0.0000',
           qtyOut: line.quantity.toFixed(4),
           unitCost: unitCost.toFixed(4),
           totalCost: totalCostLine.toFixed(2),
           balanceQty: newQty.toFixed(4),
           balanceAvgCost: runningAvgCost.toFixed(4),  // UNCHANGED on sale
           balanceValue: newValue.toFixed(2),
           documentType: dte.tipoDte,
           documentNumber: dte.numeroControl,
           supplierId: null,   // no supplier on sale
           sourceType: 'DTE',
           sourceId: dte.id,
           notes: `Matched via ${line.matchSource}`,
           createdBy: 'system-cogs',
           journalEntryId: null,  // set after asiento created
         }
       })
       createdMovements.push(movement)
       
       totalCogs += totalCostLine
       runningQty = newQty
     
     // Upsert InventoryState — avgCost unchanged on sale
     const finalState = await tx.inventoryState.upsert({
       where: { catalogItemId: groupLines[0].catalogItem.id },
       create: {
         tenantId,
         catalogItemId: groupLines[0].catalogItem.id,
         currentQty: runningQty.toFixed(4),
         currentAvgCost: runningAvgCost.toFixed(4),
         totalValue: (runningQty * runningAvgCost).toFixed(2),
         lastMovementAt: new Date(),
       },
       update: {
         currentQty: runningQty.toFixed(4),
         totalValue: (runningQty * runningAvgCost).toFixed(2),
         lastMovementAt: new Date(),
         // currentAvgCost NOT updated — moving avg rule: sales don't change avgCost
       },
     })
     updatedStates.push(finalState)

6. Create asiento COGS (outside txn to simplify):
   if totalCogs <= 0:
     return { journalEntry: null, ... }  // nothing to asiento
   
   // Build 2-line entry
   const cogsAccount = await findAccount(tenantId, '5101')
   const inventoryAccount = await findAccount(tenantId, '110401')
   
   if !cogsAccount || !inventoryAccount:
     warnings.push("Missing accounting accounts 5101/110401 — cannot create COGS asiento")
     return { journalEntry: null, ...otherCountsPopulated }
   
   const entry = await accountingService.createJournalEntry(tenantId, {
     entryDate: new Date().toISOString(),
     description: `COGS - DTE ${dte.tipoDte} ${dte.numeroControl}`,
     entryType: 'AUTOMATIC',
     sourceType: 'DTE_COGS',   // distinguishes from sales asiento (sourceType='DTE')
     sourceDocumentId: dteId,
     lines: [
       { accountId: cogsAccount.id, description: `COGS ${dte.numeroControl}`, debit: totalCogs, credit: 0 },
       { accountId: inventoryAccount.id, description: `Inventario ${dte.numeroControl}`, debit: 0, credit: totalCogs },
     ]
   })
   const posted = await accountingService.postJournalEntry(tenantId, entry.id, 'system')

7. Link InventoryMovements back to the created entry
   await prisma.inventoryMovement.updateMany({
     where: { sourceId: dteId, tenantId, journalEntryId: null },
     data: { journalEntryId: posted.id }
   })

8. Return full CogsGenerationResult
```

---

## 6. `reverseCogsFromDte()` flow

```
INPUT: dteId, tenantId

1. Find existing COGS asiento
   entry = prisma.journalEntry.findFirst({
     where: { tenantId, sourceType: 'DTE_COGS', sourceDocumentId: dteId, status: 'POSTED' }
   })
   if !entry → return { journalEntryVoided: null, ...counts: 0 }

2. Find SALIDA_VENTA movements for this DTE
   movements = prisma.inventoryMovement.findMany({
     where: { tenantId, sourceType: 'DTE', sourceId: dteId, movementType: 'SALIDA_VENTA' }
   })

3. Prisma.$transaction:
   reversedCount = 0
   restoredStates = new Set<string>()  // track catalogItemIds to restore state
   
   for each movement in movements (grouped by catalogItemId):
     // Create compensating movement
     state = await tx.inventoryState.findUnique({ where: { catalogItemId } })
     runningQty = Number(state.currentQty) + Number(movement.qtyOut)  // restore
     
     maxCorr = await tx.inventoryMovement.aggregate({
       where: { tenantId, catalogItemId: movement.catalogItemId },
       _max: { correlativo: true }
     })
     
     await tx.inventoryMovement.create({
       data: {
         tenantId,
         catalogItemId: movement.catalogItemId,
         movementDate: new Date(),
         correlativo: (maxCorr._max.correlativo ?? 0) + 1,
         movementType: 'ENTRADA_DEVOLUCION_VENTA',
         qtyIn: movement.qtyOut,         // restore
         qtyOut: '0.0000',
         unitCost: movement.unitCost,
         totalCost: movement.totalCost,
         balanceQty: runningQty.toFixed(4),
         balanceAvgCost: movement.balanceAvgCost,  // unchanged on reversal
         balanceValue: (runningQty * Number(movement.balanceAvgCost)).toFixed(2),
         documentType: movement.documentType,
         documentNumber: movement.documentNumber,
         sourceType: 'DTE',
         sourceId: dteId,
         notes: `Reversal of movement ${movement.id}`,
         createdBy: 'system-cogs-reversal',
         journalEntryId: null,  // will be set to voided entry below
       }
     })
     reversedCount++
     restoredStates.add(movement.catalogItemId)
   
   // Update InventoryStates to restore
   for each catalogItemId in restoredStates:
     sumRestored = sum of movements for this item with qtyOut field
     await tx.inventoryState.update({
       where: { catalogItemId },
       data: { currentQty: { increment: sumRestored }, totalValue: ..., lastMovementAt: new Date() }
     })
   
   // Void the COGS asiento
   const voided = await accountingService.voidJournalEntry(tenantId, entry.id, 'system', 'DTE anulado')

4. Return CogsReversalResult
```

---

## 7. Hook en DTE lifecycle

Modificar `apps/api/src/modules/dte/services/dte-lifecycle.service.ts` en el flujo de aprobación/transmisión (donde actualmente se invoca `generateFromDTE`):

```typescript
// Existing:
await this.accountingAutomation.generateFromDTE(dteId, tenantId, 'ON_APPROVED');

// NEW: non-blocking COGS generation after sales asiento
try {
  const cogsResult = await this.dteCogsService.generateCogsFromDte(dteId, tenantId, 'ON_APPROVED');
  if (cogsResult.warnings.length > 0) {
    this.logger.warn(`COGS warnings for DTE ${dteId}: ${cogsResult.warnings.join('; ')}`);
  }
} catch (err) {
  this.logger.error(`COGS generation failed for DTE ${dteId}: ${err instanceof Error ? err.message : 'unknown'} — DTE approval continues`);
  // Don't rethrow — DTE lifecycle should not block on COGS
}
```

Mismo pattern en flujo de anulación:

```typescript
// Existing:
await this.accountingAutomation.reverseFromDTE(dteId, tenantId);

// NEW:
try {
  await this.dteCogsService.reverseCogsFromDte(dteId, tenantId);
} catch (err) {
  this.logger.error(`COGS reversal failed for DTE ${dteId}: ${err.message}`);
}
```

---

## 8. Tests (~10 casos)

**Matcher tests (3):**
1. DTE with quote having catalogItemIds → matched via `quote` source
2. DTE without quote, codes in jsonOriginal → matched via `codigo` source
3. DTE without quote and no codes matchable → warnings populated, matched empty

**generateCogsFromDte (5):**
4. Happy CCFE 1 line → InventoryMovement SALIDA_VENTA + state decrement + asiento 2-line (5101/110401)
5. Multi-line same catalogItem → 2 movements consecutive correlativos + running stock correct
6. Stock negative → warning in result, movement created anyway, balanceQty < 0
7. Idempotency — second call returns `isDuplicate: true` with existing refs
8. Line with catalog trackInventory=false → skipped Kardex silently, warning logged

**reverseCogsFromDte (2):**
9. Happy — reverses 1 SALIDA_VENTA movement + voids asiento + restores state
10. No COGS entry exists → returns empty result, no throw

**Mocks:** same PrismaMock pattern as Fase 1.5a, mock AccountingService (createJournalEntry, postJournalEntry, voidJournalEntry).

---

## 9. Open decisions — diferidas

| # | Item | Futuro |
|---|---|---|
| O1 | Normalizar `DTELineItem` con FK a CatalogItem (schema change) | Post-MVP — big refactor |
| O2 | UI alert sobre stock negativo en Fase 2 dashboard | Fase 2 |
| O3 | COGS granular per línea en JournalEntry (N líneas Debit 5101 + N líneas Credit 110401) | Post-MVP si contador lo pide |
| O4 | `generateCogsFromDte` integration con `VENTA_CREDITO` vs `VENTA_CONTADO` distinction | Ambos triggers trigger COGS igual — no cambio necesario |
| O5 | Historical backfill para DTEs emitidos antes de Fase 1.6 merge | Post-MVP si necesidad real |
| O6 | Preservation de catalogItemId en Quote→DTE conversion si falta hoy | Post-MVP si tests revelan gaps |

---

## 10. Checklist de aprobación

- [ ] §1 alcance — service nuevo + helper matcher + 2 hooks en DteLifecycleService, sin schema changes
- [ ] §2 archivos — 2 create, 2 modify, 0 schema
- [ ] §3 contratos — `generateCogsFromDte` + `reverseCogsFromDte`, result types con warnings[]
- [ ] §4 matcher hybrid — quote primero, codigo fallback, skip+warn para unmatched
- [ ] §5 generate flow — atomic txn, moving avg unchanged on sale, negative stock tolerant, 2-line COGS asiento
- [ ] §6 reversal flow — ENTRADA_DEVOLUCION_VENTA compensating + void asiento + state restore
- [ ] §7 hooks lifecycle — non-blocking (DTE approval no falla si COGS falla)
- [ ] §8 tests — 10 casos (3 matcher + 5 generate + 2 reverse)
- [ ] §9 open decisions — schema normalization diferida, UI alerts en Fase 2

Una vez aprobado, invoco `superpowers:writing-plans`.
