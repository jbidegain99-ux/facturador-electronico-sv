# Fase 1.5a — Purchase Reception Workflow + Kardex (design spec)

**Fecha:** 2026-04-17
**Fase:** 1.5a (primera de dos sub-fases dentro de Fase 1.5)
**Depende de:** Fases 1.2 + 1.3 + 1.4a + 1.4b + 1.4c merged a main ✅
**Plan:** se genera después vía `superpowers:writing-plans`

**Propósito:** implementar `PurchaseReceptionService.receive()` que transiciona un `Purchase` de `DRAFT → RECEIVED`, generando `InventoryMovement` por línea inventariable (Kardex Art. 142-A) y actualizando `InventoryState` con promedio ponderado móvil. Closing del loop físico del módulo Compras+Inventario.

---

## 0. Decisiones locked

| # | Decisión | Elegido |
|---|---|---|
| D1 | Sub-fase decomposition de Fase 1.5 | **A:** split en 1.5a (reception + Kardex) + 1.5b (retention asiento). 1.5c (partial reception) + 1.5d (cancel/return) → post-MVP |
| D2 | Entry point service | **B:** nuevo `PurchaseReceptionService` hermano de `PurchasesService` en `purchases` module |
| D3 | Idempotency si status='RECEIVED' | Return existing silently (no throw) — matches dedupe pattern de Fase 1.4b |
| D4 | Status ≠ DRAFT | Throw `PreconditionFailedException` con status actual |
| D5 | Lines sin `catalogItemId` | Skip Kardex silently; línea igual marked COMPLETE, `qtyReceived` updated |
| D6 | Lines con `catalogItem.trackInventory = false` | Skip Kardex silently (igual D5) |
| D7 | Correlativo scope (Art. 142-A) | Per `(tenantId, catalogItemId)` via MAX + 1 en transaction. Unique constraint de schema protege de race (fail+retry en caller → post-MVP) |
| D8 | Weighted average formula | Standard moving: `newAvgCost = (oldQty*oldAvgCost + incomingQty*incomingCost) / (oldQty+incomingQty)`. Edge `oldQty <= 0` → `newAvgCost = incomingCost` |

---

## 1. Alcance (IN / OUT)

**IN Fase 1.5a:**
- `PurchaseReceptionService` en `apps/api/src/modules/purchases/services/`
- Public method `receive(tenantId, purchaseId, options): Promise<PurchaseWithReception>`
- Pure helper `computeWeightedAverage(currentQty, currentAvgCost, incomingQty, incomingCost)` exported para tests
- Atomic Prisma `$transaction`: crear InventoryMovement(s) + upsert InventoryState(s) + update PurchaseLineItem(s) + update Purchase — todo o nada
- Correlativo generation per `(tenantId, catalogItemId)` dentro del transaction
- Link `InventoryMovement.journalEntryId = Purchase.journalEntryId` — backlink al asiento generado en Fase 1.4b
- Registro del service en `PurchasesModule` providers
- Unit tests (~10 casos: 4 pure function + 6 service)

**OUT (diferido):**
- Partial reception (receive N de M unidades por línea, mantener DRAFT hasta completar) → **Fase 1.5c**
- Return / Cancel / Reverse reception — generar InventoryMovement inverso → **Fase 1.5d o post-MVP**
- Retention IVA asiento leg extension → **Fase 1.5b** (paralelizable con esto)
- Concurrent-safe correlativo generation formal (retry on unique constraint fail) → **post-MVP**
- `supplierNationality` detection desde `ParsedDTE.emisor` → **Fase 2 UI** (default 'SV' por ahora)
- Controller HTTP / frontend "Recibir" button → **Fase 2**
- Generar asiento contable adicional al recibir (ej. mover de "Mercadería en Tránsito" a "Inventario") — **NO se hace**; el asiento ya se generó en Fase 1.4b al crear el Purchase (Inventario debitado directamente, sin cuenta intermedia). Reception solo genera Kardex/state, no new asiento.

---

## 2. Módulo + archivos

```
apps/api/src/modules/purchases/
├── purchases.module.ts                       — modificar: agregar provider
├── services/
│   ├── purchases.service.ts                  (existente — Fase 1.4b, no tocar)
│   ├── purchases.service.spec.ts             (existente)
│   ├── purchase-reception.service.ts         ← NUEVO (Fase 1.5a)
│   └── purchase-reception.service.spec.ts    ← NUEVO
└── index.ts                                  — modificar: export nuevo service si external consumers
```

**No cambios de schema Prisma.** Enum-like strings `status='RECEIVED'`, `receiptStatus='COMPLETE'`, `movementType='ENTRADA_COMPRA'` ya aceptados (schema usa `String` no Prisma enum).

---

## 3. API contract

```typescript
// apps/api/src/modules/purchases/services/purchase-reception.service.ts

import type {
  Purchase,
  PurchaseLineItem,
  InventoryMovement,
  InventoryState,
} from '@prisma/client';

export interface ReceiveOptions {
  receivedBy: string;         // userId — audit trail
  receiptDate?: Date;         // default now()
}

export type PurchaseWithReception = Purchase & {
  lineItems: PurchaseLineItem[];
  inventoryMovementsCreated: InventoryMovement[];  // empty si todas líneas sin catalog match o !trackInventory
  inventoryStatesUpdated: InventoryState[];
};

/** Pure function exported for unit tests + any future consumer */
export function computeWeightedAverage(
  currentQty: number,
  currentAvgCost: number,
  incomingQty: number,
  incomingUnitCost: number,
): { newQty: number; newAvgCost: number; newValue: number };

@Injectable()
export class PurchaseReceptionService {
  async receive(
    tenantId: string,
    purchaseId: string,
    options: ReceiveOptions,
  ): Promise<PurchaseWithReception>;
}
```

**Exceptions:**
- `NotFoundException` — Purchase no existe o `tenantId` mismatch
- `PreconditionFailedException` — status ∈ {CANCELLED, INVOICED_BY_SUPPLIER, otros} con mensaje "Cannot receive Purchase in status X"
- Idempotent return (NO throw) si `status === 'RECEIVED'`

---

## 4. Flow del `receive()`

```
INPUT: tenantId, purchaseId, { receivedBy, receiptDate? }

1. Load Purchase con relaciones:
   findFirst({
     where: { id: purchaseId, tenantId },
     include: {
       lineItems: {
         include: { catalogItem: true }  // para trackInventory check
       },
       supplier: true,
     },
   })
   └─ Not found → NotFoundException

2. Status check:
   ├─ status === 'RECEIVED' → return Purchase con relations (idempotente, early exit)
   │   (load additionally inventoryMovementsCreated from existing movements where sourceId=purchaseId)
   ├─ status !== 'DRAFT' → PreconditionFailedException('Cannot receive Purchase in status {X}')
   └─ status === 'DRAFT' → continue

3. Normalize receiptDate = options.receiptDate ?? new Date()

4. Classify lines into buckets:
   - trackableLines: lines where catalogItem && catalogItem.trackInventory === true (→ Kardex + state update)
   - skippedLines: lines where catalogItemId null OR catalogItem.trackInventory === false (→ just mark COMPLETE)

5. Group trackableLines by catalogItemId (in case multiple lines of same item):
   lineGroupsByItem: Map<catalogItemId, PurchaseLineItem[]>

6. Prisma.$transaction(async (tx) => {
   
   const createdMovements: InventoryMovement[] = [];
   const updatedStates: InventoryState[] = [];
   
   6a. For each catalogItemId in lineGroupsByItem:
       - Load current InventoryState (if exists):
         const currentState = await tx.inventoryState.findUnique({ where: { catalogItemId } });
         let runningQty = Number(currentState?.currentQty ?? 0);
         let runningAvgCost = Number(currentState?.currentAvgCost ?? 0);
       
       - Get next correlativo for this item:
         const maxResult = await tx.inventoryMovement.aggregate({
           where: { tenantId, catalogItemId },
           _max: { correlativo: true },
         });
         let nextCorrelativo = (maxResult._max.correlativo ?? 0) + 1;
       
       - For each line in this group (sequential, not parallel — need running avg):
         const incomingQty = Number(line.quantity);
         const incomingUnitCost = Number(line.unitCostPosted);
         
         const wa = computeWeightedAverage(runningQty, runningAvgCost, incomingQty, incomingUnitCost);
         const totalCost = incomingQty * incomingUnitCost;
         
         // Create InventoryMovement
         const movement = await tx.inventoryMovement.create({
           data: {
             tenantId,
             catalogItemId,
             movementDate: receiptDate,
             correlativo: nextCorrelativo++,
             movementType: 'ENTRADA_COMPRA',
             qtyIn: incomingQty.toFixed(4),
             qtyOut: '0.0000',
             unitCost: incomingUnitCost.toFixed(4),
             totalCost: totalCost.toFixed(2),
             balanceQty: wa.newQty.toFixed(4),
             balanceAvgCost: wa.newAvgCost.toFixed(4),
             balanceValue: wa.newValue.toFixed(2),
             documentType: purchase.documentType,
             documentNumber: purchase.documentNumber,
             supplierId: purchase.supplierId,
             supplierNationality: 'SV',  // default; §G O4 to enhance from emisor data
             sourceType: 'PURCHASE',
             sourceId: purchase.id,
             purchaseLineItemId: line.id,
             notes: null,
             createdBy: options.receivedBy,
             journalEntryId: purchase.journalEntryId,  // backlink to Purchase's asiento
           },
         });
         createdMovements.push(movement);
         
         // Update running for next line in same group
         runningQty = wa.newQty;
         runningAvgCost = wa.newAvgCost;
       
       // After processing all lines for this item, upsert final state
       const finalState = await tx.inventoryState.upsert({
         where: { catalogItemId },
         create: {
           tenantId,
           catalogItemId,
           currentQty: runningQty.toFixed(4),
           currentAvgCost: runningAvgCost.toFixed(4),
           totalValue: (runningQty * runningAvgCost).toFixed(2),
           lastMovementAt: receiptDate,
         },
         update: {
           currentQty: runningQty.toFixed(4),
           currentAvgCost: runningAvgCost.toFixed(4),
           totalValue: (runningQty * runningAvgCost).toFixed(2),
           lastMovementAt: receiptDate,
         },
       });
       updatedStates.push(finalState);
   
   6b. Update ALL line items (trackable + skipped) → qtyReceived + receiptStatus:
       for (const line of purchase.lineItems) {
         await tx.purchaseLineItem.update({
           where: { id: line.id },
           data: {
             qtyReceived: line.quantity,  // full reception
             receiptStatus: 'COMPLETE',
           },
         });
       }
   
   6c. Update Purchase:
       const updatedPurchase = await tx.purchase.update({
         where: { id: purchaseId },
         data: {
           status: 'RECEIVED',
           receiptDate,
           receivedBy: options.receivedBy,
         },
         include: { lineItems: true, supplier: true },
       });
   
   return { purchase: updatedPurchase, createdMovements, updatedStates };
});

7. Return:
   {
     ...purchase (with updated status + lineItems),
     inventoryMovementsCreated: createdMovements,
     inventoryStatesUpdated: updatedStates,
   }
```

**Concurrency note:** Prisma default isolation en SQL Server es READ_COMMITTED. Si 2 recepciones paralelas del mismo `catalogItemId` ocurrieran simultáneamente, ambas podrían leer el mismo MAX(correlativo). El unique constraint `@@unique([tenantId, catalogItemId, correlativo])` detectará el conflict en el INSERT del segundo → Prisma P2002 error → transaction rollback completo → caller ve error, puede retry. Formal retry wrapper → post-MVP (§G O3).

---

## 5. `computeWeightedAverage()` helper (pure)

```typescript
export function computeWeightedAverage(
  currentQty: number,
  currentAvgCost: number,
  incomingQty: number,
  incomingUnitCost: number,
): { newQty: number; newAvgCost: number; newValue: number } {
  const newQty = currentQty + incomingQty;

  // First movement OR qty was zero/negative — new avg = incoming unit cost
  if (currentQty <= 0) {
    const newAvgCost = incomingUnitCost;
    const newValue = newQty * newAvgCost;
    return { newQty, newAvgCost, newValue };
  }

  // Standard moving weighted average:
  // newAvgCost = (currentQty * currentAvgCost + incomingQty * incomingUnitCost) / newQty
  const totalValueBefore = currentQty * currentAvgCost;
  const totalValueIncoming = incomingQty * incomingUnitCost;
  const newAvgCost = (totalValueBefore + totalValueIncoming) / newQty;
  const newValue = newQty * newAvgCost;

  return { newQty, newAvgCost, newValue };
}
```

Pure, no state, trabajan en numbers precision máxima. Callers redondean al persistir:
- Qty: `toFixed(4)` (Decimal 15,4 en schema)
- Unit cost: `toFixed(4)` (Decimal 15,4)
- Total value: `toFixed(2)` (Decimal 15,2)

**Invariants:**
- Si `oldQty = 0 && incomingQty = 10 && incomingCost = 15.50` → `newQty=10, newAvgCost=15.50, newValue=155`
- Si `oldQty = 10 @ 20 && incomingQty = 5 @ 20` → `newAvgCost=20` (sin cambio)
- Si `oldQty = 10 @ 20 && incomingQty = 5 @ 30` → `newAvgCost = (200+150)/15 = 23.333...`
- Si `oldQty = -5` (should not happen) → trata como primera entrada

---

## 6. Tests (~10 casos)

### Pure function `computeWeightedAverage` (4)

1. Empty state (qty=0) → `{newQty:10, newAvgCost:15.50, newValue:155}`
2. Same unit cost (no change) → `{newQty:15, newAvgCost:20, newValue:300}`
3. Different unit cost (classic) → `newAvgCost = (200+150)/15 ≈ 23.3333`
4. Negative qty edge → treated as `<= 0` path

### Service `receive()` with mocks (6)

5. **Happy CCFE path** — DRAFT Purchase with 1 line (catalogItemId + trackInventory=true):
   - InventoryMovement created with correct balanceQty/balanceAvgCost/balanceValue
   - InventoryState upserted with same values
   - Line receiptStatus='COMPLETE', qtyReceived=quantity
   - Purchase status='RECEIVED', receiptDate + receivedBy set
   - Return contains all 3 arrays populated

6. **Idempotency** — status='RECEIVED' on entry → returns Purchase without new movements, no update calls

7. **Wrong status** — status='CANCELLED' → PreconditionFailedException

8. **Line no catalogItemId** — Purchase con 1 línea sin match → line COMPLETE but NO inventoryMovement created. Purchase.status='RECEIVED'.

9. **Line catalogItem.trackInventory=false** — same as #8 (skipped Kardex but line COMPLETE)

10. **Multi-line same catalogItem** — Purchase con 2 líneas del mismo catalogItem:
    - 2 InventoryMovements created con correlativos consecutivos (N, N+1)
    - Running weighted avg correct across 2 lines
    - InventoryState final state matches second movement's balance values

**Mocks:** manual Prisma mock shape with `receivedDTE`, `purchase`, `purchaseLineItem`, `inventoryMovement`, `inventoryState`, `$transaction` (pass-through). `catalogItem` via `findUnique` in mock `purchase.lineItems[].catalogItem` include.

---

## 7. Open decisions — diferidas

| # | Item | Futuro |
|---|---|---|
| O1 | Partial reception (receive N de M units por línea) | Fase 1.5c |
| O2 | Return / Cancel / Reverse reception (generar movement inverso + restaurar state) | Fase 1.5d o post-MVP |
| O3 | Concurrency-safe correlativo generation (retry on P2002 unique violation) | Post-MVP |
| O4 | `supplierNationality` detection desde `ParsedDTE.emisor` en lugar de hardcoded 'SV' | Fase 2 UI + parser enhancement |
| O5 | Generar asiento COGS on Sale (usa `InventoryState.currentAvgCost` como cost basis) | Fase 1.6 o post-MVP cuando Ventas integre Kardex |
| O6 | Backlink `journalEntryId` cuando Purchase se creó sin asiento (journalEntryId=null) — trigger asiento on reception? | Post-MVP (edge case) |

---

## 8. Checklist de aprobación

- [ ] §1 alcance — solo full reception + Kardex + state; no partial, no retention (1.5b), no controller
- [ ] §2 módulo + archivos — service nuevo en purchases module, no schema changes
- [ ] §3 API `receive(tenantId, purchaseId, { receivedBy, receiptDate? })` + `computeWeightedAverage` export
- [ ] §4 flow — idempotent si RECEIVED, throw si ≠ DRAFT, atomic transaction
- [ ] §5 weighted average formula — standard moving, edge qty<=0
- [ ] §6 tests — 10 casos (4 pure + 6 service)
- [ ] §7 open decisions — partial/cancel/retry diferidos, supplierNationality hardcoded

Una vez aprobado, invoco `superpowers:writing-plans`.
